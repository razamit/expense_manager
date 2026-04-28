"use client";

import { useState, useEffect, useCallback } from "react";
import { getCategoryDisplayName } from "@/lib/category-hierarchy";
import type {
  AccountDTO,
  CategoryDTO,
  TransactionDTO,
  TransactionFilters,
} from "@/types";

interface TransactionsState {
  accounts: AccountDTO[];
  transactions: TransactionDTO[];
  categories: CategoryDTO[];
  sourceCounts: Record<string, number>;
  allSourcesTotal: number;
  total: number;
  page: number;
  pageSize: number;
  filters: TransactionFilters;
  isLoading: boolean;
}

interface TransactionsResponse {
  transactions: TransactionDTO[];
  total: number;
  page: number;
  pageSize: number;
  sourceCounts: Record<string, number>;
  allSourcesTotal: number;
}

export function useTransactionsViewModel() {
  const [state, setState] = useState<TransactionsState>({
    accounts: [],
    transactions: [],
    categories: [],
    sourceCounts: {},
    allSourcesTotal: 0,
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
      setState((prev) => ({
        ...prev,
        filters,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? prev.pageSize,
        isLoading: true,
      }));

      const params = buildSearchParams(filters);
      const response = await fetch(`/api/transactions?${params}`);
      const data = (await response.json()) as TransactionsResponse;

      setState((prev) => ({
        ...prev,
        transactions: data.transactions,
        sourceCounts: data.sourceCounts,
        allSourcesTotal: data.allSourcesTotal,
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
    const data = (await response.json()) as TransactionsResponse;

    setState((prev) => ({
      ...prev,
      transactions: data.transactions,
      sourceCounts: data.sourceCounts,
      allSourcesTotal: data.allSourcesTotal,
      total: data.total,
    }));
  }

  const fetchCategories = useCallback(async () => {
    const response = await fetch("/api/categories");
    const categories = await response.json();
    setState((prev) => ({ ...prev, categories }));
  }, []);

  const fetchAccounts = useCallback(async () => {
    const response = await fetch("/api/accounts");
    const accounts = await response.json();
    setState((prev) => ({ ...prev, accounts }));
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchAccounts();
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
