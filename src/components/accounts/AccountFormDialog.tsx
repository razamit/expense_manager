"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  COMPANY_METADATA,
  type CompanyMetadata,
} from "@/constants/company-metadata";
import type { AccountDTO } from "@/types";
import type { SaveAccountInput } from "@/viewmodels/useAccountsViewModel";

type CredentialMode = "own" | "shared";

interface AccountFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SaveAccountInput) => Promise<void>;
  accounts: AccountDTO[];
  account?: AccountDTO | null;
}

export function AccountFormDialog({
  open,
  onClose,
  onSubmit,
  accounts,
  account,
}: AccountFormDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyMetadata | null>(null);
  const [credentialMode, setCredentialMode] =
    useState<CredentialMode>("own");
  const [credentialSourceAccountId, setCredentialSourceAccountId] =
    useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const company = account
      ? COMPANY_METADATA.find((candidate) => candidate.id === account.companyType) ??
        null
      : null;

    setDisplayName(account?.displayName ?? "");
    setAccountNumber(account?.accountNumber ?? "");
    setSelectedCompany(company);
    setCredentialMode(account?.credentialSourceAccountId ? "shared" : "own");
    setCredentialSourceAccountId(account?.credentialSourceAccountId ?? "");
    setCredentials({});
    setIsActive(account?.isActive ?? true);
    setSubmitError(null);
    setIsSubmitting(false);
  }, [account, open]);

  function handleCompanyChange(companyId: string) {
    const company = COMPANY_METADATA.find((c) => c.id === companyId);
    setSelectedCompany(company ?? null);
    setCredentialMode("own");
    setCredentialSourceAccountId("");
    setCredentials({});
    setAccountNumber("");
    setSubmitError(null);
    if (company && !displayName) {
      setDisplayName(company.name);
    }
  }

  const eligibleCredentialSources = selectedCompany
    ? accounts.filter(
        (candidateAccount) =>
          candidateAccount.companyType === selectedCompany.id &&
          candidateAccount.id !== account?.id &&
          !candidateAccount.credentialSourceAccountId
      )
    : [];
  const isCreditCard = selectedCompany?.type === "credit";
  const shouldShowSharedLoginOption =
    isCreditCard && eligibleCredentialSources.length > 0;

  const credentialFields = selectedCompany?.credentialFields ?? [];
  const hasAnyCredentialInput = credentialFields.some(
    (field) => (credentials[field.key] ?? "").trim().length > 0
  );
  const hasCompleteCredentials = credentialFields.every(
    (field) => (credentials[field.key] ?? "").trim().length > 0
  );

  function normalizeCredentials() {
    return Object.fromEntries(
      credentialFields
        .map((field) => [field.key, (credentials[field.key] ?? "").trim()] as const)
        .filter((entry) => entry[1].length > 0)
    );
  }

  function resetForm() {
    setDisplayName("");
    setAccountNumber("");
    setSelectedCompany(null);
    setCredentialMode("own");
    setCredentialSourceAccountId("");
    setCredentials({});
    setIsActive(true);
    setSubmitError(null);
    setIsSubmitting(false);
  }

  function renderCredentialFields() {
    if (!selectedCompany) {
      return null;
    }

    return (
      <div className="space-y-3">
        {selectedCompany.credentialFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Input
              type={field.type === "password" ? "password" : "text"}
              value={credentials[field.key] ?? ""}
              onChange={(e) =>
                setCredentials((prev) => ({
                  ...prev,
                  [field.key]: e.target.value,
                }))
              }
              placeholder={field.placeholder}
            />
          </div>
        ))}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedCompany || !displayName.trim()) {
      setSubmitError("Display name and provider are required.");
      return;
    }

    if (!isCreditCard && !accountNumber.trim()) {
      setSubmitError("Account number is required for bank accounts.");
      return;
    }

    if (isCreditCard && credentialMode === "shared" && !credentialSourceAccountId) {
      setSubmitError("Select an existing sibling account to reuse its login.");
      return;
    }

    const requiresDirectCredentials = !isCreditCard || credentialMode === "own";
    const isSwitchingFromSharedLogin =
      Boolean(account?.credentialSourceAccountId) && credentialMode === "own";

    if (requiresDirectCredentials) {
      if (!account && !hasCompleteCredentials) {
        setSubmitError("Enter every credential field before saving the account.");
        return;
      }

      if (account && hasAnyCredentialInput && !hasCompleteCredentials) {
        setSubmitError(
          "Complete every credential field or leave them all blank to keep the current login."
        );
        return;
      }

      if (account && isSwitchingFromSharedLogin && !hasCompleteCredentials) {
        setSubmitError(
          "Enter a full credential set before switching this account away from a shared login."
        );
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        ...(account && { id: account.id }),
        displayName: displayName.trim(),
        companyType: selectedCompany.id,
        ...(selectedCompany.type === "bank" && {
          accountNumber: accountNumber.trim(),
        }),
        credentialSourceAccountId:
          isCreditCard && credentialMode === "shared"
            ? credentialSourceAccountId
            : null,
        ...(requiresDirectCredentials && hasCompleteCredentials && {
          credentials: normalizeCredentials(),
        }),
        ...(account && { isActive }),
      });

      resetForm();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to save account"
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{account ? "Edit Account" : "Add Account"}</DialogTitle>
          <DialogDescription>
            {account
              ? "Update display details, login ownership, and account activity for this account."
              : "Each bank login can expose multiple bank accounts or cards. Add one local account for each one you want to track."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Bank / Card Provider</Label>
            <Select
              value={selectedCompany?.id}
              onValueChange={handleCompanyChange}
              disabled={Boolean(account)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select provider..." />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_METADATA.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} ({company.hebrewName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isCreditCard && selectedCompany && (
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 12345678"
              />
              <p className="text-xs text-muted-foreground">
                The specific account number at this bank. One login can have multiple accounts.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="My Bank Account"
            />
          </div>

          {isCreditCard && selectedCompany && (
            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
              <div className="space-y-1">
                <Label>Login Access</Label>
                <p className="text-xs text-muted-foreground">
                  Use a dedicated login for this card or reuse a sibling card account that already stores the shared login.
                </p>
              </div>

              {shouldShowSharedLoginOption ? (
                <Tabs
                  value={credentialMode}
                  onValueChange={(value) => {
                    setCredentialMode(value as CredentialMode);
                    setSubmitError(null);
                  }}
                  className="space-y-4"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="own">New Credentials</TabsTrigger>
                    <TabsTrigger value="shared">Shared Login</TabsTrigger>
                  </TabsList>

                  <TabsContent value="own" className="space-y-3">
                    {renderCredentialFields()}
                    <p className="text-xs text-muted-foreground">
                      {account
                        ? "Leave these blank to keep the current login, or fill every field to replace it."
                        : "Enter the login once here. Additional sibling cards can reuse it later."}
                    </p>
                  </TabsContent>

                  <TabsContent value="shared" className="space-y-3">
                    <div className="space-y-2">
                      <Label>Credential Source</Label>
                      <Select
                        value={credentialSourceAccountId || undefined}
                        onValueChange={setCredentialSourceAccountId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sibling account..." />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleCredentialSources.map((candidateAccount) => (
                            <SelectItem
                              key={candidateAccount.id}
                              value={candidateAccount.id}
                            >
                              {candidateAccount.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This card will reuse the selected account&apos;s saved login. Card binding still happens from the first scrape result.
                    </p>
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  {renderCredentialFields()}
                  <p className="text-xs text-muted-foreground">
                    Save the card login here. Once one sibling card has saved credentials, new sibling cards can reuse that login instead of storing secrets again.
                  </p>
                </>
              )}
            </div>
          )}

          {!isCreditCard && selectedCompany && (
            <div className="space-y-3">
              {renderCredentialFields()}
              <p className="text-xs text-muted-foreground">
                {account
                  ? "Leave these blank to keep the current login, or fill every field to replace it."
                  : "This bank account stores its own login details."}
              </p>
            </div>
          )}

          {isCreditCard && account?.accountNumber && (
            <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Bound card/account number: <span className="font-medium text-foreground">{account.accountNumber}</span>. Use a scrape if you need to choose a different card later.
            </div>
          )}

          {account && (
            <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-3">
              <div className="space-y-1">
                <Label htmlFor="account-active">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive accounts stay in the UI but are skipped during scraping.
                </p>
              </div>
              <Switch
                id="account-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedCompany ||
                !displayName.trim() ||
                (!isCreditCard && !accountNumber.trim()) ||
                (isCreditCard && credentialMode === "shared" && !credentialSourceAccountId)
              }
            >
              {isSubmitting
                ? account
                  ? "Saving..."
                  : "Adding..."
                : account
                  ? "Save Changes"
                  : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
