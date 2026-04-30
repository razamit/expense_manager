"use client";

import { useCallback, useEffect, useState } from "react";
import { getLeafCategories } from "@/lib/category-hierarchy";
import type {
  CategoryDTO,
  CategoryYearlyTrend,
  SpendingByCategory,
  AnomalyAlert,
  StatisticsViewMode,
  StatisticsYearlyOverview,
} from "@/types";

const EMPTY_YEARLY_OVERVIEW = {
  year: new Date().getFullYear(),
  spending: [],
  income: [],
  trend: [],
} satisfies StatisticsYearlyOverview;

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    return fallback;
  }

  return (await response.json()) as T;
}

function resolveInitialYearlyCategoryId(
  currentCategoryIds: string[],
  selectableCategoryIds: string[],
  categoryTrends: CategoryYearlyTrend[],
  preserveEmptySelection: boolean
): string[] {
  const validIds = currentCategoryIds.filter((categoryId) =>
    selectableCategoryIds.includes(categoryId)
  );

  if (validIds.length > 0) {
    return validIds;
  }

  if (preserveEmptySelection && currentCategoryIds.length === 0) {
    return [];
  }

  const activeIds = categoryTrends
    .filter((trend) => trend.transactionCount > 0)
    .map((trend) => trend.categoryId);

  return activeIds.length > 0 ? activeIds : selectableCategoryIds;
}

export function useStatisticsViewModel() {
  const now = new Date();

  const [view, setView] = useState<StatisticsViewMode>("monthly");
  const [monthlySpending, setMonthlySpending] = useState<SpendingByCategory[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<SpendingByCategory[]>([]);
  const [monthlyAnomalies, setMonthlyAnomalies] = useState<AnomalyAlert[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedMonthYear, setSelectedMonthYear] = useState(now.getFullYear());
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(true);

  const [yearlySpending, setYearlySpending] = useState<SpendingByCategory[]>([]);
  const [yearlyIncome, setYearlyIncome] = useState<SpendingByCategory[]>([]);
  const [yearlyTrend, setYearlyTrend] = useState<StatisticsYearlyOverview["trend"]>([]);
  const [yearlyCategoryTrends, setYearlyCategoryTrends] = useState<CategoryYearlyTrend[]>([]);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [isYearlyLoading, setIsYearlyLoading] = useState(false);
  const [hasLoadedYearly, setHasLoadedYearly] = useState(false);

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [yearlyCategorySearchQuery, setYearlyCategorySearchQuery] = useState("");
  const [selectedYearlyCategoryIds, setSelectedYearlyCategoryIds] = useState<string[]>([]);

  const fetchCategories = useCallback(async (): Promise<CategoryDTO[]> => {
    try {
      const nextCategories = await fetchJson<CategoryDTO[]>("/api/categories", []);
      setCategories(nextCategories);
      return nextCategories;
    } catch {
      setCategories([]);
      return [];
    }
  }, []);

  const fetchMonthlyData = useCallback(async (year: number, month: number) => {
    setIsMonthlyLoading(true);

    try {
      const [spendingRes, incomeRes, anomalyRes] = await Promise.all([
        fetchJson<SpendingByCategory[]>(
          `/api/statistics/spending?year=${year}&month=${month}`,
          []
        ),
        fetchJson<SpendingByCategory[]>(
          `/api/statistics/income?year=${year}&month=${month}`,
          []
        ),
        fetchJson<AnomalyAlert[]>(
          `/api/statistics/anomalies?year=${year}&month=${month}`,
          []
        ),
      ]);

      setMonthlySpending(spendingRes);
      setMonthlyIncome(incomeRes);
      setMonthlyAnomalies(anomalyRes);
      setSelectedMonth(month);
      setSelectedMonthYear(year);
    } catch {
      setMonthlySpending([]);
      setMonthlyIncome([]);
      setMonthlyAnomalies([]);
    } finally {
      setIsMonthlyLoading(false);
    }
  }, []);

  const fetchYearlyData = useCallback(
    async (year: number) => {
      setIsYearlyLoading(true);

      try {
        const [overview, categoryTrends, loadedCategories] = await Promise.all([
          fetchJson<StatisticsYearlyOverview>(
            `/api/statistics/yearly-overview?year=${year}`,
            { ...EMPTY_YEARLY_OVERVIEW, year }
          ),
          fetchJson<CategoryYearlyTrend[]>(
            `/api/statistics/category-trends?year=${year}`,
            []
          ),
          categories.length > 0 ? Promise.resolve(categories) : fetchCategories(),
        ]);

        setYearlySpending(overview.spending);
        setYearlyIncome(overview.income);
        setYearlyTrend(overview.trend);
        setYearlyCategoryTrends(categoryTrends);
        setSelectedYear(year);
        setHasLoadedYearly(true);

        const selectableCategoryIds = getLeafCategories(loadedCategories).map(
          (category) => category.id
        );
        const nextSelectedIds = resolveInitialYearlyCategoryId(
          selectedYearlyCategoryIds,
          selectableCategoryIds,
          categoryTrends,
          hasLoadedYearly
        );

        setSelectedYearlyCategoryIds(nextSelectedIds);
      } catch {
        setYearlySpending([]);
        setYearlyIncome([]);
        setYearlyTrend([]);
        setYearlyCategoryTrends([]);
      } finally {
        setIsYearlyLoading(false);
      }
    },
    [categories, fetchCategories, hasLoadedYearly, selectedYearlyCategoryIds]
  );

  useEffect(() => {
    void fetchMonthlyData(selectedMonthYear, selectedMonth);
    void fetchCategories();
  }, [fetchCategories, fetchMonthlyData, selectedMonth, selectedMonthYear]);

  function changeMonth(month: number, year: number) {
    void fetchMonthlyData(year, month);
  }

  function changeView(nextView: StatisticsViewMode) {
    setView(nextView);

    if (nextView === "yearly" && !hasLoadedYearly) {
      void fetchYearlyData(selectedYear);
    }
  }

  function changeYear(year: number) {
    void fetchYearlyData(year);
  }

  function openMonthlyView(month: number, year: number) {
    setView("monthly");
    setSelectedMonth(month);
    setSelectedMonthYear(year);
  }

  const selectableYearlyCategories = getLeafCategories(categories);
  const selectableYearlyCategoryIds = selectableYearlyCategories.map(
    (category) => category.id
  );

  function updateSelectedYearlyCategoryIds(nextIds: string[]) {
    const validIds = nextIds.filter((categoryId) =>
      selectableYearlyCategoryIds.includes(categoryId)
    );

    setSelectedYearlyCategoryIds(
      selectableYearlyCategoryIds.filter((categoryId) => validIds.includes(categoryId))
    );
  }

  function toggleYearlyCategory(categoryId: string) {
    setSelectedYearlyCategoryIds((currentIds) => {
      const nextIds = currentIds.includes(categoryId)
        ? currentIds.filter((id) => id !== categoryId)
        : [...currentIds, categoryId];

      return selectableYearlyCategoryIds.filter((id) => nextIds.includes(id));
    });
  }

  function toggleYearlyCategoryGroup(categoryId: string) {
    const childCategoryIds = categories
      .filter((category) => category.parentId === categoryId)
      .map((category) => category.id);
    const targetIds = childCategoryIds.length > 0 ? childCategoryIds : [categoryId];

    setSelectedYearlyCategoryIds((currentIds) => {
      const isEveryTargetSelected = targetIds.every((id) => currentIds.includes(id));

      if (isEveryTargetSelected) {
        return currentIds.filter((id) => !targetIds.includes(id));
      }

      return selectableYearlyCategoryIds.filter((id) =>
        new Set([...currentIds, ...targetIds]).has(id)
      );
    });
  }

  function selectAllYearlyCategories() {
    updateSelectedYearlyCategoryIds(selectableYearlyCategoryIds);
  }

  function deselectAllYearlyCategories() {
    setSelectedYearlyCategoryIds([]);
  }

  const selectedYearlyCategoryTrendMap = new Map(
    yearlyCategoryTrends.map((trend) => [trend.categoryId, trend])
  );

  const selectedYearlyCategoryTrends = selectedYearlyCategoryIds
    .map((categoryId) => selectedYearlyCategoryTrendMap.get(categoryId))
    .filter((trend): trend is CategoryYearlyTrend => trend !== undefined);

  const selectedYearlyAggregateTrend = buildSelectedYearlyAggregateTrend(
    selectedYearlyCategoryTrends,
    selectedYear
  );

  function refresh() {
    if (view === "yearly") {
      return fetchYearlyData(selectedYear);
    }

    return fetchMonthlyData(selectedMonthYear, selectedMonth);
  }

  return {
    view,
    changeView,
    isLoading: view === "monthly" ? isMonthlyLoading : isYearlyLoading,
    refresh,

    monthlySpending,
    monthlyIncome,
    monthlyAnomalies,
    selectedMonth,
    selectedMonthYear,
    isMonthlyLoading,
    changeMonth,
    openMonthlyView,

    yearlySpending,
    yearlyIncome,
    yearlyTrend,
    yearlyCategoryTrends,
    selectedYear,
    isYearlyLoading,
    hasLoadedYearly,
    changeYear,

    categories,
    selectableYearlyCategories,
    selectableYearlyCategoryIds,
    yearlyCategorySearchQuery,
    setYearlyCategorySearchQuery,
    selectedYearlyCategoryIds,
    selectedYearlyCategoryTrends,
    selectedYearlyAggregateTrend,
    toggleYearlyCategory,
    toggleYearlyCategoryGroup,
    selectAllYearlyCategories,
    deselectAllYearlyCategories,
  };
}

function buildSelectedYearlyAggregateTrend(
  categoryTrends: CategoryYearlyTrend[],
  year: number
): CategoryYearlyTrend | null {
  if (categoryTrends.length === 0) {
    return null;
  }

  if (categoryTrends.length === 1) {
    return categoryTrends[0];
  }

  const months = categoryTrends[0].months.map((month, index) => {
    const aggregateMonth = categoryTrends.reduce(
      (summary, trend) => {
        const sourceMonth = trend.months[index];
        summary.income += sourceMonth.income;
        summary.expense += sourceMonth.expense;
        summary.transactionCount += sourceMonth.transactionCount;
        return summary;
      },
      {
        month: month.month,
        label: month.label,
        income: 0,
        expense: 0,
        net: 0,
        transactionCount: 0,
      }
    );

    aggregateMonth.net = aggregateMonth.income - aggregateMonth.expense;
    return aggregateMonth;
  });

  const totalIncome = months.reduce((sum, month) => sum + month.income, 0);
  const totalExpense = months.reduce((sum, month) => sum + month.expense, 0);

  return {
    year,
    categoryId: "__selected__",
    categoryName: `${categoryTrends.length} selected categories`,
    categoryColor: "#737373",
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    transactionCount: months.reduce(
      (sum, month) => sum + month.transactionCount,
      0
    ),
    months,
    childCategories: [],
  };
}
