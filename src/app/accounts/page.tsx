"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { useAccountsViewModel } from "@/viewmodels/useAccountsViewModel";
import type { AccountDTO } from "@/types";

export default function AccountsPage() {
  const vm = useAccountsViewModel();
  const [showAddDialog, setShowAddDialog] = useState(false);

  function handleEdit(_account: AccountDTO) {
    // Future: open edit dialog
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this account?")) {
      vm.removeAccount(id);
    }
  }

  if (vm.isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <div className="flex gap-2">
          {vm.accounts.length > 0 && (
            <Button
              variant="outline"
              onClick={vm.scrapeAllAccounts}
              disabled={vm.isScraping}
            >
              <RefreshCw
                className={`h-4 w-4 ${vm.isScraping ? "animate-spin" : ""}`}
              />
              {vm.isScraping ? "Scraping..." : "Scrape All"}
            </Button>
          )}
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>
      </div>

      {vm.accounts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No accounts configured yet. Add your first bank or credit card
            account.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vm.accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onScrape={vm.scrapeAccount}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isScraping={vm.isScraping}
            />
          ))}
        </div>
      )}

      <AccountFormDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={vm.addAccount}
      />
    </div>
  );
}
