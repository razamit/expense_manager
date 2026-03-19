"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatAmount } from "@/lib/amount-utils";
import { formatDate } from "@/lib/date-utils";
import type { SpendingByCategory, TransactionDTO } from "@/types";

interface CategoryBreakdownListProps {
  categories: SpendingByCategory[];
  year: number;
  month: number;
}

interface ExpandedRowState {
  transactions: TransactionDTO[];
  isLoading: boolean;
}

export function CategoryBreakdownList({
  categories,
  year,
  month,
}: CategoryBreakdownListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rowState, setRowState] = useState<ExpandedRowState>({
    transactions: [],
    isLoading: false,
  });

  async function toggleExpand(categoryId: string) {
    if (expandedId === categoryId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(categoryId);
    setRowState({ transactions: [], isLoading: true });

    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const response = await fetch(
      `/api/transactions?categoryId=${categoryId}&startDate=${startDate}&endDate=${endDate}&pageSize=200`
    );
    const data = await response.json();

    setRowState({
      transactions: data.transactions,
      isLoading: false,
    });
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No data for this period.</p>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map((cat) => (
        <CategoryRow
          key={cat.categoryId}
          category={cat}
          isExpanded={expandedId === cat.categoryId}
          rowState={expandedId === cat.categoryId ? rowState : null}
          onToggle={() => toggleExpand(cat.categoryId)}
        />
      ))}
    </div>
  );
}

function CategoryRow({
  category,
  isExpanded,
  rowState,
  onToggle,
}: {
  category: SpendingByCategory;
  isExpanded: boolean;
  rowState: ExpandedRowState | null;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: category.categoryColor }}
          />
          <span>{category.categoryName}</span>
          <span className="text-muted-foreground">
            ({category.transactionCount})
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono">{formatAmount(category.totalAmount)}</span>
          <span className="text-muted-foreground w-12 text-right">
            {category.percentOfTotal.toFixed(1)}%
          </span>
        </div>
      </button>

      {isExpanded && rowState && (
        <TransactionList
          transactions={rowState.transactions}
          isLoading={rowState.isLoading}
        />
      )}
    </div>
  );
}

function TransactionList({
  transactions,
  isLoading,
}: {
  transactions: TransactionDTO[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="ml-9 py-2 text-xs text-muted-foreground">Loading...</div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="ml-9 py-2 text-xs text-muted-foreground">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="ml-9 mb-2 border-l-2 border-muted pl-3 space-y-1">
      {transactions.map((txn) => (
        <div
          key={txn.id}
          className="flex items-center justify-between text-xs py-1"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground shrink-0">
              {formatDate(txn.date)}
            </span>
            <span className="truncate" dir="auto">
              {txn.description}
            </span>
          </div>
          <span className="font-mono shrink-0 ml-2">
            {formatAmount(Math.abs(txn.chargedAmount))}
          </span>
        </div>
      ))}
    </div>
  );
}
