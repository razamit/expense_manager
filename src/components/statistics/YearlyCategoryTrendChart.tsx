"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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
import type { CategoryYearlyTrend } from "@/types";

interface YearlyCategoryTrendChartProps {
  trend: CategoryYearlyTrend | null;
  isLoading?: boolean;
}

export function YearlyCategoryTrendChart({
  trend,
  isLoading = false,
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
    Net: Math.round(month.net),
  }));
  const showIncome = trend.totalIncome > 0;
  const showExpense = trend.totalExpense > 0;
  const isSelectionAggregate = trend.categoryId === "__selected__";
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

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatAmount(Number(value))} />
            <Legend />
            {showIncome ? (
              <Bar dataKey="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
            ) : null}
            {showExpense ? (
              <Bar dataKey="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
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