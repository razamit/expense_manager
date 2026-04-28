"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <TransactionFiltersBar
        filters={vm.filters}
        categories={vm.categories}
        onChange={vm.updateFilters}
        onExport={vm.exportCSV}
      />

      <Card>
        <CardContent className="p-4">
          {vm.isLoading ? (
            <p className="text-muted-foreground py-4">Loading...</p>
          ) : (
            <TransactionTable
              transactions={vm.transactions}
              onCategorize={setSelectedTransaction}
              onToggleExcluded={vm.toggleExcluded}
            />
          )}
        </CardContent>
      </Card>

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
        onClose={() => setSelectedTransaction(null)}
        onAssign={vm.assignCategory}
        onCreateCategory={vm.createCategory}
      />
    </div>
  );
}
