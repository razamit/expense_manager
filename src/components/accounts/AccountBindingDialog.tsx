"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAmount } from "@/lib/amount-utils";
import type { ScrapeProgress } from "@/types";

interface AccountBindingDialogProps {
  bindingRequest: ScrapeProgress | null;
  onClose: () => void;
  onConfirm: (accountId: string, accountNumber: string) => Promise<void>;
}

export function AccountBindingDialog({
  bindingRequest,
  onClose,
  onConfirm,
}: AccountBindingDialogProps) {
  const [selectedAccountNumber, setSelectedAccountNumber] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedAccountNumber(
      bindingRequest?.availableBindings?.[0]?.accountNumber ?? ""
    );
    setSubmitError(null);
    setIsSubmitting(false);
  }, [bindingRequest]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!bindingRequest || !selectedAccountNumber) {
      setSubmitError("Select a returned card/account number first.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onConfirm(bindingRequest.accountId, selectedAccountNumber);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to bind account"
      );
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={Boolean(bindingRequest)}
      onOpenChange={(isOpen) => !isOpen && !isSubmitting && onClose()}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose Matching Card</DialogTitle>
          <DialogDescription>
            {bindingRequest
              ? `${bindingRequest.accountName} needs a one-time card binding before transactions can be imported.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {bindingRequest && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              <p>
                Returned from shared login:
                <span className="ml-1 font-medium text-foreground">
                  {bindingRequest.credentialOwnerName ?? "Stored login"}
                </span>
              </p>
              <p className="mt-2 text-xs">
                Pick the exact returned card/account number for this local account. The selection is stored once and future scrapes will use it automatically.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Returned Card / Account Number</Label>
              <Select
                value={selectedAccountNumber || undefined}
                onValueChange={setSelectedAccountNumber}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a returned number..." />
                </SelectTrigger>
                <SelectContent>
                  {(bindingRequest.availableBindings ?? []).map((binding) => (
                    <SelectItem
                      key={binding.accountNumber}
                      value={binding.accountNumber}
                    >
                      {binding.accountNumber} • {binding.transactionCount} txns
                      {binding.balance != null
                        ? ` • ${formatAmount(binding.balance)}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Button type="submit" disabled={isSubmitting || !selectedAccountNumber}>
                {isSubmitting ? "Binding..." : "Bind and Retry Scrape"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}