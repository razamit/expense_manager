"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, EyeOff, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AmountDisplay } from "@/components/shared/AmountDisplay";
import { formatDate } from "@/lib/date-utils";
import type { TransactionDTO } from "@/types";

interface TransactionTableProps {
  transactions: TransactionDTO[];
  onCategorize: (transaction: TransactionDTO) => void;
  onToggleExcluded: (transactionId: string) => void;
}

function hasExtraDetails(txn: TransactionDTO): boolean {
  return !!(txn.memo || txn.bankCategory || txn.externalId || txn.rawTransaction);
}

function TransactionRow({
  txn,
  onCategorize,
  onToggleExcluded,
}: {
  txn: TransactionDTO;
  onCategorize: (txn: TransactionDTO) => void;
  onToggleExcluded: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const expandable = hasExtraDetails(txn);

  return (
    <>
      <tr className={`border-b hover:bg-muted/50 ${txn.isExcluded ? "opacity-50" : ""}`}>
        <td className="py-3 pr-4 whitespace-nowrap">
          {formatDate(txn.date)}
        </td>
        <td className="py-3 pr-4">
          <div className="flex items-start gap-1">
            {expandable && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            )}
            <div>
              <span className={`font-medium ${txn.isExcluded ? "line-through" : ""}`} dir="auto">
                {txn.description}
              </span>
              {txn.installmentNumber && txn.installmentTotal && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({txn.installmentNumber}/{txn.installmentTotal})
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="py-3 pr-4 text-muted-foreground">
          {txn.accountName}
        </td>
        <td className="py-3 pr-4">
          {txn.categoryName ? (
            <Badge
              variant="secondary"
              className="max-w-[18rem] cursor-pointer whitespace-normal text-left leading-snug"
              onClick={() => onCategorize(txn)}
              title={txn.categoryName}
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
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => onCategorize(txn)}
            >
              Categorize
            </Button>
          )}
        </td>
        <td className="py-3 text-right">
          <AmountDisplay
            amount={txn.chargedAmount}
            direction={txn.direction}
          />
        </td>
        <td className="py-3 pl-2">
          <button
            onClick={() => onToggleExcluded(txn.id)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title={txn.isExcluded ? "Include in calculations" : "Exclude from calculations"}
          >
            {txn.isExcluded ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b bg-muted/30">
          <td colSpan={6} className="px-4 py-3">
            <TransactionDetails txn={txn} />
          </td>
        </tr>
      )}
    </>
  );
}

function TransactionDetails({ txn }: { txn: TransactionDTO }) {
  const rawData = txn.rawTransaction;

  return (
    <div className="space-y-2 text-xs text-muted-foreground ml-5">
      {txn.externalId && (
        <div>
          <span className="font-medium text-foreground">Reference (Asmachta):</span>{" "}
          {txn.externalId}
        </div>
      )}
      {txn.memo && (
        <div dir="auto">
          <span className="font-medium text-foreground">Memo:</span> {txn.memo}
        </div>
      )}
      {txn.bankCategory && (
        <div>
          <span className="font-medium text-foreground">Bank Category:</span>{" "}
          {txn.bankCategory}
        </div>
      )}
      {txn.processedDate && txn.processedDate !== txn.date && (
        <div>
          <span className="font-medium text-foreground">Processed:</span>{" "}
          {formatDate(txn.processedDate)}
        </div>
      )}
      {txn.chargedCurrency !== txn.originalCurrency && (
        <div>
          <span className="font-medium text-foreground">Original:</span>{" "}
          {txn.originalAmount} {txn.originalCurrency}
        </div>
      )}
      {rawData && typeof rawData === "object" && (
        <div>
          <span className="font-medium text-foreground">Raw Details:</span>
          <div className="mt-1 rounded bg-muted p-2 font-mono text-xs overflow-x-auto" dir="auto">
            {renderRawData(rawData)}
          </div>
        </div>
      )}
    </div>
  );
}

function renderRawData(data: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(data).filter(
    ([, v]) => v != null && v !== "" && v !== 0
  );

  if (entries.length === 0) return <span>No additional data</span>;

  return (
    <div className="space-y-0.5">
      {entries.map(([key, value]) => (
        <div key={key}>
          <span className="text-muted-foreground">{key}:</span>{" "}
          <span className="text-foreground">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TransactionTable({
  transactions,
  onCategorize,
  onToggleExcluded,
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Date</th>
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium">Account</th>
            <th className="pb-2 font-medium">Category</th>
            <th className="pb-2 font-medium text-right">Amount</th>
            <th className="pb-2 font-medium w-8"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn) => (
            <TransactionRow
              key={txn.id}
              txn={txn}
              onCategorize={onCategorize}
              onToggleExcluded={onToggleExcluded}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
