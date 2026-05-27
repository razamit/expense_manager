"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/accounts/AccountCard";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountBindingDialog } from "@/components/accounts/AccountBindingDialog";
import { useAccountsViewModel } from "@/viewmodels/useAccountsViewModel";
import type { AccountDTO } from "@/types";

export default function AccountsPage() {
  const vm = useAccountsViewModel();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountDTO | null>(null);

  function handleEdit(account: AccountDTO) {
    setEditingAccount(account);
  }

  function handleUpdatePassword(account: AccountDTO) {
    // Credentials live on the credential owner; for shared logins that is the
    // source account, so open the owner's edit dialog to replace the password.
    const owner = account.credentialSourceAccountId
      ? vm.accounts.find(
          (candidate) => candidate.id === account.credentialSourceAccountId
        ) ?? account
      : account;
    setEditingAccount(owner);
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this account?")) {
      vm.removeAccount(id);
    }
  }

  if (vm.isLoading) {
    return (
      <div className="app-page-shell">
        <p className="text-sm text-muted-foreground">Loading accounts...</p>
      </div>
    );
  }

  return (
    <div className="app-page-shell">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="app-eyebrow-label">Connected Institutions</p>
          <div className="space-y-2">
            <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">
              Accounts
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage bank connections, shared credentials, and manual scrape runs.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
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
        <div className="app-surface-card flex min-h-[220px] items-center justify-center p-6 text-center">
          <p className="text-muted-foreground">
            No accounts configured yet. Add your first bank or credit card
            account.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {vm.accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              credentialSourceName={
                account.credentialSourceAccountId
                  ? vm.accounts.find(
                      (candidateAccount) =>
                        candidateAccount.id === account.credentialSourceAccountId
                    )?.displayName
                  : undefined
              }
              onScrape={vm.scrapeAccount}
              onEdit={handleEdit}
              onUpdatePassword={handleUpdatePassword}
              onDelete={handleDelete}
              isScraping={vm.isScraping}
            />
          ))}
        </div>
      )}

      <AccountFormDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        accounts={vm.accounts}
        onSubmit={vm.addAccount}
      />

      <AccountFormDialog
        open={Boolean(editingAccount)}
        onClose={() => setEditingAccount(null)}
        onSubmit={vm.updateAccount}
        accounts={vm.accounts}
        account={editingAccount}
      />

      <AccountBindingDialog
        bindingRequest={vm.pendingBinding}
        onClose={vm.clearPendingBinding}
        onConfirm={vm.bindAccountNumber}
      />
    </div>
  );
}
