"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  SpendingByCategory,
  IncomeExpenseTrend,
  AnomalyAlert,
} from "@/types";

interface StatisticsState {
  spending: SpendingByCategory[];
  income: SpendingByCategory[];
  trend: IncomeExpenseTrend[];
  anomalies: AnomalyAlert[];
  selectedMonth: number;
  selectedYear: number;
  isLoading: boolean;
}

export function useStatisticsViewModel() {
  const now = new Date();

  const [state, setState] = useState<StatisticsState>({
    spending: [],
    income: [],
    trend: [],
    anomalies: [],
    selectedMonth: now.getMonth(),
    selectedYear: now.getFullYear(),
    isLoading: true,
  });

  const fetchData = useCallback(
    async (year: number, month: number) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      const [spendingRes, incomeRes, trendRes, anomalyRes] = await Promise.all([
        fetch(`/api/statistics/spending?year=${year}&month=${month}`),
        fetch(`/api/statistics/income?year=${year}&month=${month}`),
        fetch("/api/statistics/income-vs-expense?months=6"),
        fetch(`/api/statistics/anomalies?year=${year}&month=${month}`),
      ]);

      const spending = await spendingRes.json();
      const income = await incomeRes.json();
      const trend = await trendRes.json();
      const anomalies = await anomalyRes.json();

      setState({
        spending,
        income,
        trend,
        anomalies,
        selectedMonth: month,
        selectedYear: year,
        isLoading: false,
      });
    },
    []
  );

  useEffect(() => {
    fetchData(state.selectedYear, state.selectedMonth);
  }, []);

  function changeMonth(month: number, year: number) {
    fetchData(year, month);
  }

  return { ...state, changeMonth, refresh: () => fetchData(state.selectedYear, state.selectedMonth) };
}
