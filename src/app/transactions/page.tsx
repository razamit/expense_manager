"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionFiltersBar } from "@/components/transactions/TransactionFiltersBar";
import { CategoryAssignDialog } from "@/components/transactions/CategoryAssignDialog";
import { useTransactionsViewModel } from "@/viewmodels/useTransactionsViewModel";
import type { TransactionDTO } from "@/types";

export default function TransactionsPage() {
  const vm = useTransactionsViewModel();
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDTO | null>(null);

  const totalPages = Math.ceil(vm.total / vm.pageSize);
  const selectedSource = vm.filters.accountId ?? "all";
  const showSourceTabs = vm.accounts.length > 1;

  function renderSourceLabel(label: string, count: number) {
    return `${label} (${count})`;
  }

  async function handleCategorize(transaction: TransactionDTO) {
    setSelectedTransaction(transaction);
    await vm.refreshBankCategoryMappings();
  }

  const transactionsCard = (
    <Card>
      <CardContent className="p-4">
        {vm.isLoading ? (
          <p className="py-4 text-muted-foreground">Loading...</p>
        ) : (
          <TransactionTable
            transactions={vm.transactions}
            onCategorize={handleCategorize}
            onToggleExcluded={vm.toggleExcluded}
          />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

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
            <TabsList className="h-auto min-w-max justify-start gap-1 rounded-xl bg-muted/60 p-1">
              <TabsTrigger value="all" className="min-h-11 rounded-lg px-4">
                {renderSourceLabel("All sources", vm.allSourcesTotal)}
              </TabsTrigger>
              {vm.accounts.map((account) => (
                <TabsTrigger
                  key={account.id}
                  value={account.id}
                  className="min-h-11 rounded-lg px-4"
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
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={vm.page <= 1}
              onClick={() => vm.goToPage(vm.page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center text-sm">
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
