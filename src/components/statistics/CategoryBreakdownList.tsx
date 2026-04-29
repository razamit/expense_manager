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
  const [expandedMainId, setExpandedMainId] = useState<string | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(
    null
  );
  const [rowState, setRowState] = useState<ExpandedRowState>({
    transactions: [],
    isLoading: false,
  });

  function resetTransactions() {
    setExpandedTransactionId(null);
    setRowState({ transactions: [], isLoading: false });
  }

  async function expandTransactions(categoryId: string) {
    setExpandedTransactionId(categoryId);
    setRowState({ transactions: [], isLoading: true });

    const startDate = new Date(year, month, 1).toISOString();
    const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    try {
      const response = await fetch(
        `/api/transactions?categoryId=${categoryId}&startDate=${startDate}&endDate=${endDate}&pageSize=200`
      );
      const data = response.ok ? await response.json() : { transactions: [] };

      setRowState({
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        isLoading: false,
      });
    } catch {
      setRowState({ transactions: [], isLoading: false });
    }
  }

  async function toggleMainExpand(category: SpendingByCategory) {
    if (expandedMainId === category.categoryId) {
      setExpandedMainId(null);
      resetTransactions();
      return;
    }

    setExpandedMainId(category.categoryId);
    resetTransactions();

    if (category.childCategories.length === 0) {
      await expandTransactions(category.categoryId);
    }
  }

  async function toggleTransactionExpand(categoryId: string) {
    if (expandedTransactionId === categoryId) {
      resetTransactions();
      return;
    }

    await expandTransactions(categoryId);
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No data for this period.</p>
    );
  }

  return (
    <div className="space-y-1">
      {categories.map((cat) => (
        <MainCategoryRow
          key={cat.categoryId}
          category={cat}
          isExpanded={expandedMainId === cat.categoryId}
          isTransactionExpanded={expandedTransactionId === cat.categoryId}
          rowState={expandedTransactionId === cat.categoryId ? rowState : null}
          expandedTransactionId={expandedTransactionId}
          transactionRowState={rowState}
          onToggle={() => toggleMainExpand(cat)}
          onSubcategoryToggle={toggleTransactionExpand}
        />
      ))}
    </div>
  );
}

function MainCategoryRow({
  category,
  isExpanded,
  isTransactionExpanded,
  rowState,
  expandedTransactionId,
  transactionRowState,
  onToggle,
  onSubcategoryToggle,
}: {
  category: SpendingByCategory;
  isExpanded: boolean;
  isTransactionExpanded: boolean;
  rowState: ExpandedRowState | null;
  expandedTransactionId: string | null;
  transactionRowState: ExpandedRowState;
  onToggle: () => void;
  onSubcategoryToggle: (categoryId: string) => void | Promise<void>;
}) {
  const hasChildren = category.childCategories.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
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

      {isExpanded && hasChildren && (
        <div className="ml-9 mb-2 border-l-2 border-muted pl-3 space-y-1">
          {category.childCategories.map((childCategory) => (
            <SubcategoryRow
              key={childCategory.categoryId}
              category={childCategory}
              isExpanded={expandedTransactionId === childCategory.categoryId}
              rowState={
                expandedTransactionId === childCategory.categoryId
                  ? transactionRowState
                  : null
              }
              onToggle={() => onSubcategoryToggle(childCategory.categoryId)}
            />
          ))}
        </div>
      )}

      {isExpanded && !hasChildren && isTransactionExpanded && rowState && (
        <TransactionList
          transactions={rowState.transactions}
          isLoading={rowState.isLoading}
        />
      )}
    </div>
  );
}

function SubcategoryRow({
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
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors"
        aria-expanded={isExpanded}
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
        <span className="font-mono">{formatAmount(category.totalAmount)}</span>
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
