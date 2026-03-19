"use client";

import { useState } from "react";
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
import {
  COMPANY_METADATA,
  type CompanyMetadata,
} from "@/constants/company-metadata";

interface AccountFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    displayName: string;
    companyType: string;
    accountNumber: string;
    credentials: Record<string, string>;
  }) => void;
}

export function AccountFormDialog({
  open,
  onClose,
  onSubmit,
}: AccountFormDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedCompany, setSelectedCompany] =
    useState<CompanyMetadata | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  function handleCompanyChange(companyId: string) {
    const company = COMPANY_METADATA.find((c) => c.id === companyId);
    setSelectedCompany(company ?? null);
    setCredentials({});
    if (company && !displayName) {
      setDisplayName(company.name);
    }
  }

  const isCreditCard = selectedCompany?.type === "credit";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCompany || !displayName || (!isCreditCard && !accountNumber))
      return;

    onSubmit({
      displayName,
      companyType: selectedCompany.id,
      accountNumber: isCreditCard ? "" : accountNumber,
      credentials,
    });

    setDisplayName("");
    setAccountNumber("");
    setSelectedCompany(null);
    setCredentials({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            Each bank login can have multiple accounts. Add one entry per account number.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Bank / Card Provider</Label>
            <Select onValueChange={handleCompanyChange}>
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

          {!isCreditCard && (
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

          {selectedCompany?.credentialFields.map((field) => (
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedCompany || !displayName || (!isCreditCard && !accountNumber)}
            >
              Add Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
