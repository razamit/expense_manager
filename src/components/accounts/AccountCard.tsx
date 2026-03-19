"use client";

import { CreditCard, RefreshCw, Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import { formatAmount } from "@/lib/amount-utils";
import { getCompanyMetadata } from "@/constants/company-metadata";
import type { AccountDTO } from "@/types";

interface AccountCardProps {
  account: AccountDTO;
  onScrape: (id: string) => void;
  onEdit: (account: AccountDTO) => void;
  onDelete: (id: string) => void;
  isScraping: boolean;
}

export function AccountCard({
  account,
  onScrape,
  onEdit,
  onDelete,
  isScraping,
}: AccountCardProps) {
  const metadata = getCompanyMetadata(account.companyType);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{account.displayName}</CardTitle>
        </div>
        <Badge variant={account.isActive ? "default" : "secondary"}>
          {account.isActive ? "Active" : "Inactive"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{metadata?.name ?? account.companyType}</p>
          {account.accountNumber && (
            <p>Account: {account.accountNumber}</p>
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
