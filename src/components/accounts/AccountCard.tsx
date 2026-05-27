"use client";

import { CreditCard, KeyRound, RefreshCw, Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import { formatAmount } from "@/lib/amount-utils";
import { getCompanyMetadata } from "@/constants/company-metadata";
import { isPasswordChangeError } from "@/lib/scrape-logging/scrape-error-messages";
import type { AccountDTO } from "@/types";

interface AccountCardProps {
  account: AccountDTO;
  credentialSourceName?: string;
  onScrape: (id: string) => void;
  onEdit: (account: AccountDTO) => void;
  onUpdatePassword: (account: AccountDTO) => void;
  onDelete: (id: string) => void;
  isScraping: boolean;
}

export function AccountCard({
  account,
  credentialSourceName,
  onScrape,
  onEdit,
  onUpdatePassword,
  onDelete,
  isScraping,
}: AccountCardProps) {
  const metadata = getCompanyMetadata(account.companyType);
  const isCreditCard = metadata?.type === "credit";
  const bindingLabel = account.accountNumber ? "Bound" : "Needs binding";
  const needsPasswordChange = isPasswordChangeError(account.lastScrapeErrorType);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{account.displayName}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {needsPasswordChange && (
            <Badge variant="destructive">Action required</Badge>
          )}
          {isCreditCard && (
            <Badge variant={account.accountNumber ? "outline" : "destructive"}>
              {bindingLabel}
            </Badge>
          )}
          <Badge variant={account.isActive ? "default" : "secondary"}>
            {account.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{metadata?.name ?? account.companyType}</p>
          {credentialSourceName && (
            <p>Shared login: {credentialSourceName}</p>
          )}
          {account.accountNumber && (
            <p>{isCreditCard ? "Bound card" : "Account"}: {account.accountNumber}</p>
          )}
          {isCreditCard && !account.accountNumber && (
            <p className="text-destructive">
              Transactions cannot be imported until this card is bound to one returned card/account number.
            </p>
          )}
          {account.lastBalance != null && (
            <p className="text-foreground font-medium">
              Balance: {formatAmount(account.lastBalance)}
            </p>
          )}
          {account.lastScrapedAt && (
            <p>Last updated: {formatDate(account.lastScrapedAt)}</p>
          )}
        </div>
        {needsPasswordChange && (
          <div className="mt-4 space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
              Password change required
            </p>
            <p className="text-xs text-foreground">
              {account.lastScrapeErrorMessage ??
                "The provider requires a new password. Set one on their website, then update the saved login here."}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdatePassword(account)}
            >
              <KeyRound className="h-3 w-3" />
              Update password
            </Button>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onScrape(account.id)}
            disabled={isScraping || !account.isActive}
          >
            <RefreshCw className={`h-3 w-3 ${isScraping ? "animate-spin" : ""}`} />
            Scrape
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(account)}
          >
            <Settings className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => onDelete(account.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
