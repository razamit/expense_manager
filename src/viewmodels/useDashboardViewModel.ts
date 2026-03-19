"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  TransactionDTO,
  SpendingByCategory,
  AnomalyAlert,
  BudgetDTO,
} from "@/types";

interface DashboardState {
  totalExpense: number;
  totalIncome: number;
  net: number;
  uncategorizedCount: number;
  topCategories: SpendingByCategory[];
  recentTransactions: TransactionDTO[];
  anomalies: AnomalyAlert[];
  budgets: BudgetDTO[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboardViewModel() {
  const [state, setState] = useState<DashboardState>({
    totalExpense: 0,
    totalIncome: 0,
    net: 0,
    uncategorizedCount: 0,
    topCategories: [],
    recentTransactions: [],
    anomalies: [],
    budgets: [],
    isLoading: true,
    error: null,
  });

  const fetchDashboardData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const [spendingRes, transactionsRes, anomaliesRes, totalsRes] =
        await Promise.all([
          fetch(`/api/statistics/spending?year=${year}&month=${month}`),
          fetch(
            `/api/transactions?startDate=${startDate}&endDate=${endDate}&pageSize=10`
          ),
          fetch(`/api/statistics/anomalies?year=${year}&month=${month}`),
          fetch(`/api/statistics/totals?year=${year}&month=${month}`),
        ]);

      const spending: SpendingByCategory[] = await spendingRes.json();
      const txnData = await transactionsRes.json();
      const anomalies: AnomalyAlert[] = await anomaliesRes.json();
      const totals: { totalIncome: number; totalExpense: number; net: number } =
        await totalsRes.json();

      const uncategorized = (txnData.transactions as TransactionDTO[])
        .filter((t) => !t.categoryId && t.chargedAmount < 0).length;

      setState({
        totalExpense: totals.totalExpense,
        totalIncome: totals.totalIncome,
        net: totals.net,
        uncategorizedCount: uncategorized,
        topCategories: spending.slice(0, 5),
        recentTransactions: txnData.transactions.slice(0, 10),
        anomalies,
        budgets: [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load",
      }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { ...state, refresh: fetchDashboardData };
}
