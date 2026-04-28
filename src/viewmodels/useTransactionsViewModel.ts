"use client";

import { useState, useEffect, useCallback } from "react";
import { getCategoryDisplayName } from "@/lib/category-hierarchy";
import type { TransactionDTO, TransactionFilters, CategoryDTO } from "@/types";

interface TransactionsState {
  transactions: TransactionDTO[];
  categories: CategoryDTO[];
  total: number;
  page: number;
  pageSize: number;
  filters: TransactionFilters;
  isLoading: boolean;
}

export function useTransactionsViewModel() {
  const [state, setState] = useState<TransactionsState>({
    transactions: [],
    categories: [],
    total: 0,
    page: 1,
    pageSize: 50,
    filters: {},
    isLoading: true,
  });

  function buildSearchParams(filters: TransactionFilters): URLSearchParams {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.accountId) params.set("accountId", filters.accountId);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.direction) params.set("direction", filters.direction);
    if (filters.search) params.set("search", filters.search);
    if (filters.uncategorizedOnly) params.set("uncategorizedOnly", "true");
    params.set("page", String(filters.page ?? 1));
    params.set("pageSize", String(filters.pageSize ?? 50));
    return params;
  }

  const fetchTransactions = useCallback(
    async (filters: TransactionFilters = state.filters) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const params = buildSearchParams(filters);
      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      setState((prev) => ({
        ...prev,
        transactions: data.transactions,
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        filters,
        isLoading: false,
      }));
    },
    [state.filters]
  );

  async function refreshSilently() {
    const params = buildSearchParams(state.filters);
    const response = await fetch(`/api/transactions?${params}`);
    const data = await response.json();

    setState((prev) => ({
      ...prev,
      transactions: data.transactions,
      total: data.total,
    }));
  }

  const fetchCategories = useCallback(async () => {
    const response = await fetch("/api/categories");
    const categories = await response.json();
    setState((prev) => ({ ...prev, categories }));
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  function updateFilters(newFilters: Partial<TransactionFilters>) {
    const merged = { ...state.filters, ...newFilters, page: 1 };
    fetchTransactions(merged);
  }

  function goToPage(page: number) {
    fetchTransactions({ ...state.filters, page });
  }

  async function assignCategory(
    transactionId: string,
    categoryId: string | null,
    createRule?: boolean,
    rulePattern?: string,
    category?: CategoryDTO
  ) {
    const previousTransaction = state.transactions.find((txn) => txn.id === transactionId);
    const matchedCategory = category ?? state.categories.find((c) => c.id === categoryId);

    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((txn) =>
        txn.id === transactionId
          ? {
              ...txn,
              categoryId,
              categoryName: matchedCategory
                ? getCategoryDisplayName(matchedCategory)
                : undefined,
              categoryColor: matchedCategory?.color ?? undefined,
              isCategorizedByRule: !!createRule,
            }
          : txn
      ),
    }));

    const response = await fetch("/api/transactions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: transactionId,
        categoryId,
        createRule,
        rulePattern,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (previousTransaction) {
        setState((prev) => ({
          ...prev,
          transactions: prev.transactions.map((txn) =>
            txn.id === transactionId ? previousTransaction : txn
          ),
        }));
      }

      throw new Error(data?.error ?? "Failed to update transaction category");
    }

    if (createRule) {
      const data = await response.json();
      if (data.autoCategorized > 0) {
        await refreshSilently();
      }
    }
  }

  async function createCategory(data: {
    name: string;
    parentId?: string | null;
    color?: string;
  }): Promise<CategoryDTO> {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const createdCategory = (await response.json().catch(() => null)) as
      | CategoryDTO
      | { error?: string }
      | null;

    if (!response.ok) {
      const errorMessage =
        createdCategory && "error" in createdCategory
          ? createdCategory.error
          : undefined;

      throw new Error(
        errorMessage ?? "Failed to create category"
      );
    }

    const category = createdCategory as CategoryDTO;

    setState((prev) => ({
      ...prev,
      categories: [
        ...prev.categories.filter((existing) => existing.id !== category.id),
        category,
      ],
    }));

    return category;
  }

  async function toggleExcluded(transactionId: string) {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((txn) =>
        txn.id === transactionId ? { ...txn, isExcluded: !txn.isExcluded } : txn
      ),
    }));

    await fetch("/api/transactions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: transactionId, action: "toggle-excluded" }),
    });
  }

  async function exportCSV() {
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export", filters: state.filters }),
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    ...state,
    updateFilters,
    goToPage,
    assignCategory,
    createCategory,
    toggleExcluded,
    exportCSV,
    refresh: () => fetchTransactions(),
  };
}
