"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmountDisplay } from "@/components/shared/AmountDisplay";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import type { TransactionDTO } from "@/types";

interface RecentTransactionsListProps {
  transactions: TransactionDTO[];
}

export function RecentTransactionsList({
  transactions,
}: RecentTransactionsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {txn.description}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(txn.date)}
                    </span>
                    {txn.categoryName ? (
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: txn.categoryColor
                            ? `${txn.categoryColor}20`
                            : undefined,
                          color: txn.categoryColor ?? undefined,
                        }}
                      >
                        {txn.categoryName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Uncategorized
                      </Badge>
                    )}
                  </div>
                </div>
                <AmountDisplay
                  amount={txn.chargedAmount}
                  direction={txn.direction}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
