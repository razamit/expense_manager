"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAmount } from "@/lib/amount-utils";
import type { CategoryYearlyTrend, CategoryYearlyTrendPoint } from "@/types";

interface MonthlyStatCardData {
  label: string;
  income?: string;
  expense?: string;
}

interface YearlyCategoryTrendChartProps {
  trend: CategoryYearlyTrend | null;
  isLoading?: boolean;
  onMonthSelect?: (month: number, year: number) => void;
}

export function YearlyCategoryTrendChart({
  trend,
  isLoading = false,
  onMonthSelect,
}: YearlyCategoryTrendChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Across the Year</CardTitle>
          <CardDescription>Loading category trend...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!trend) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Across the Year</CardTitle>
          <CardDescription>Select one or more categories to inspect their monthly shape.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = trend.months.map((month) => ({
    month: month.label,
    Income: Math.round(month.income),
    Expense: Math.round(month.expense),
    IncomeLabel: month.income > 0 ? Math.round(month.income) : null,
    ExpenseLabel: month.expense > 0 ? Math.round(month.expense) : null,
  }));
  const showIncome = trend.totalIncome > 0;
  const showExpense = trend.totalExpense > 0;
  const isSelectionAggregate = trend.categoryId === "__selected__";
  const monthlyStats = buildMonthlyStats(trend);
  const chartTitle =
    isSelectionAggregate
      ? `${trend.categoryName} in ${trend.year}`
      : showExpense && !showIncome
      ? `Expense on ${trend.categoryName} in ${trend.year}`
      : showIncome && !showExpense
        ? `Income from ${trend.categoryName} in ${trend.year}`
        : `${trend.categoryName} Across ${trend.year}`;
  const chartDescription =
    isSelectionAggregate
      ? "See how the currently selected categories move across the selected year."
      : showExpense && !showIncome
      ? "See what you spent on this category each month across the selected year."
      : showIncome && !showExpense
        ? "See what this category contributed each month across the selected year."
        : "Explore how this category moves across the full year.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <CardDescription>{chartDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryValue label="Expense" value={trend.totalExpense} accent="text-red-600" />
          <SummaryValue label="Income" value={trend.totalIncome} accent="text-green-600" />
          <SummaryValue
            label="Net"
            value={trend.net}
            accent={trend.net >= 0 ? "text-green-600" : "text-red-600"}
          />
          <SummaryValue label="Transactions" value={trend.transactionCount} accent="text-foreground" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {monthlyStats.map((stat) => (
            <MonthlyStatCard
              key={stat.label}
              label={stat.label}
              income={stat.income}
              expense={stat.expense}
            />
          ))}
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 28, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatAmount(Number(value))} />
            <Legend />
            {showIncome ? (
              <Bar
                dataKey="Income"
                fill="#22c55e"
                radius={[6, 6, 0, 0]}
                cursor={onMonthSelect ? "pointer" : undefined}
                onClick={(_, index) => {
                  if (onMonthSelect && typeof index === "number") {
                    onMonthSelect(index, trend.year);
                  }
                }}
              >
                <LabelList
                  dataKey="IncomeLabel"
                  position="top"
                  offset={8}
                  formatter={(value) => formatCompactAmount(Number(value ?? 0))}
                  className="fill-foreground text-[11px] font-medium"
                />
              </Bar>
            ) : null}
            {showExpense ? (
              <Bar
                dataKey="Expense"
                fill="#ef4444"
                radius={[6, 6, 0, 0]}
                cursor={onMonthSelect ? "pointer" : undefined}
                onClick={(_, index) => {
                  if (onMonthSelect && typeof index === "number") {
                    onMonthSelect(index, trend.year);
                  }
                }}
              >
                <LabelList
                  dataKey="ExpenseLabel"
                  position="top"
                  offset={8}
                  formatter={(value) => formatCompactAmount(Number(value ?? 0))}
                  className="fill-foreground text-[11px] font-medium"
                />
              </Bar>
            ) : null}
          </BarChart>
        </ResponsiveContainer>

        {onMonthSelect ? (
          <p className="text-sm text-muted-foreground">
            Click a month in the chart to open the monthly view for that month.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SummaryValue({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${accent}`}>
        {label === "Transactions" ? value.toLocaleString() : formatAmount(value)}
      </p>
    </div>
  );
}

function MonthlyStatCard({
  label,
  income,
  expense,
}: MonthlyStatCardData) {
  return (
    <div className="rounded-xl border bg-muted/20 px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-3 space-y-2">
        {income ? (
          <p className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Income</span>
            <span className="font-medium text-green-600">{income}</span>
          </p>
        ) : null}
        {expense ? (
          <p className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Expense</span>
            <span className="font-medium text-red-600">{expense}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function buildMonthlyStats(trend: CategoryYearlyTrend): MonthlyStatCardData[] {
  if (trend.months.length === 0) {
    return [];
  }

  const averageIncome = trend.totalIncome / trend.months.length;
  const averageExpense = trend.totalExpense / trend.months.length;
  const highestIncomeMonth = getExtremeMonth(trend.months, "income", "max");
  const lowestIncomeMonth = getExtremeMonth(trend.months, "income", "min");
  const highestExpenseMonth = getExtremeMonth(trend.months, "expense", "max");
  const lowestExpenseMonth = getExtremeMonth(trend.months, "expense", "min");

  return [
    {
      label: "Average / Month",
      income: trend.totalIncome > 0 ? formatAmount(averageIncome) : undefined,
      expense: trend.totalExpense > 0 ? formatAmount(averageExpense) : undefined,
    },
    {
      label: "Highest Month",
      income:
        trend.totalIncome > 0
          ? formatMonthlyPoint(highestIncomeMonth, highestIncomeMonth.income)
          : undefined,
      expense:
        trend.totalExpense > 0
          ? formatMonthlyPoint(highestExpenseMonth, highestExpenseMonth.expense)
          : undefined,
    },
    {
      label: "Lowest Month",
      income:
        trend.totalIncome > 0
          ? formatMonthlyPoint(lowestIncomeMonth, lowestIncomeMonth.income)
          : undefined,
      expense:
        trend.totalExpense > 0
          ? formatMonthlyPoint(lowestExpenseMonth, lowestExpenseMonth.expense)
          : undefined,
    },
  ];
}

function getExtremeMonth(
  months: CategoryYearlyTrendPoint[],
  metric: "income" | "expense",
  mode: "max" | "min"
): CategoryYearlyTrendPoint {
  return months.slice(1).reduce((selectedMonth, currentMonth) => {
    if (mode === "max") {
      return currentMonth[metric] > selectedMonth[metric]
        ? currentMonth
        : selectedMonth;
    }

    return currentMonth[metric] < selectedMonth[metric]
      ? currentMonth
      : selectedMonth;
  }, months[0]);
}

function formatMonthlyPoint(
  point: CategoryYearlyTrendPoint,
  amount: number
): string {
  return `${point.label} ${formatAmount(amount)}`;
}

function formatCompactAmount(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}