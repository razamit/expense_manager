"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFiltersBar } from "@/components/transactions/TransactionFiltersBar";
import { CategoryAssignDialog } from "@/components/transactions/CategoryAssignDialog";
import { getBankCategorySuggestion } from "@/lib/bank-category-suggestions";
import { getLeafCategories } from "@/lib/category-hierarchy";
import { useTransactionsViewModel } from "@/viewmodels/useTransactionsViewModel";
import type { BankCategorySuggestionDTO, TransactionDTO } from "@/types";

export default function TransactionsPage() {
  const vm = useTransactionsViewModel();
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDTO | null>(null);

  const totalPages = Math.ceil(vm.total / vm.pageSize);
  const selectedSource = vm.filters.accountId ?? "all";
  const showSourceTabs = vm.accounts.length > 1;
  const leafCategories = getLeafCategories(vm.categories);
  const suggestionsByTransactionId = buildSuggestionLookup(
    vm.transactions,
    leafCategories,
    vm.bankCategoryMappings
  );

  function renderSourceLabel(label: string, count: number) {
    return `${label} (${count})`;
  }

  async function handleCategorize(transaction: TransactionDTO) {
    setSelectedTransaction(transaction);
    await vm.refreshBankCategoryMappings();
  }

  async function handleApplySuggestion(
    transaction: TransactionDTO,
    createRule: boolean
  ) {
    const suggestion = suggestionsByTransactionId[transaction.id];
    if (!suggestion) {
      throw new Error("Suggestion is no longer available");
    }

    const category = leafCategories.find(
      (candidate) => candidate.id === suggestion.categoryId
    );

    if (!category) {
      throw new Error("Suggested category could not be found");
    }

    await vm.assignCategory(
      transaction.id,
      category.id,
      createRule,
      createRule ? transaction.description : undefined,
      category
    );
  }

  const transactionsCard = (
    <Card>
      <CardContent className="p-4">
        {vm.isLoading ? (
          <p className="py-8 text-sm text-muted-foreground">Loading transactions...</p>
        ) : (
          <TransactionTable
            transactions={vm.transactions}
            suggestionsByTransactionId={suggestionsByTransactionId}
            onCategorize={handleCategorize}
            onApplySuggestion={handleApplySuggestion}
            onToggleExcluded={vm.toggleExcluded}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="app-page-shell">
      <div className="space-y-2">
        <p className="app-eyebrow-label">Review And Classify</p>
        <div className="space-y-2">
          <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            Filter activity, apply category suggestions, and manage exclusions across your imported data.
          </p>
        </div>
      </div>

      <TransactionFiltersBar
        filters={vm.filters}
        categories={vm.categories}
        accounts={vm.accounts}
        onChange={vm.updateFilters}
        onExport={vm.exportCSV}
      />

      {showSourceTabs ? (
        <Tabs
          value={selectedSource}
          onValueChange={(value) =>
            vm.updateFilters({ accountId: value === "all" ? undefined : value })
          }
          className="space-y-4"
        >
          <div className="-mx-1 overflow-x-auto px-1 pb-1">
            <TabsList className="h-auto min-w-max justify-start gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
              <TabsTrigger value="all" className="min-h-10 rounded-md px-4">
                {renderSourceLabel("All sources", vm.allSourcesTotal)}
              </TabsTrigger>
              {vm.accounts.map((account) => (
                <TabsTrigger
                  key={account.id}
                  value={account.id}
                  className="min-h-10 rounded-md px-4"
                >
                  {renderSourceLabel(
                    account.displayName,
                    vm.sourceCounts[account.id] ?? 0
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={selectedSource} className="mt-0">
            {transactionsCard}
          </TabsContent>
        </Tabs>
      ) : (
        transactionsCard
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {vm.total} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={vm.page <= 1}
              onClick={() => vm.goToPage(vm.page - 1)}
            >
              Previous
            </Button>
            <span className="app-tabular-data flex items-center text-sm text-muted-foreground">
              Page {vm.page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={vm.page >= totalPages}
              onClick={() => vm.goToPage(vm.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CategoryAssignDialog
        open={selectedTransaction !== null}
        transaction={selectedTransaction}
        categories={vm.categories}
        bankCategoryMappings={vm.bankCategoryMappings}
        onClose={() => setSelectedTransaction(null)}
        onAssign={vm.assignCategory}
        onCreateCategory={vm.createCategory}
      />
    </div>
  );
}

function buildSuggestionLookup(
  transactions: TransactionDTO[],
  leafCategories: ReturnType<typeof getLeafCategories>,
  bankCategoryMappings: ReturnType<typeof useTransactionsViewModel>["bankCategoryMappings"]
): Record<string, BankCategorySuggestionDTO | null> {
  return transactions.reduce<Record<string, BankCategorySuggestionDTO | null>>(
    (lookup, transaction) => {
      lookup[transaction.id] = getBankCategorySuggestion({
        bankCategory: transaction.bankCategory,
        selectableCategories: leafCategories,
        mappings: bankCategoryMappings,
      });
      return lookup;
    },
    {}
  );
}
