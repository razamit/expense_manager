"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { IncomeExpenseTrend } from "@/types";

interface IncomeExpenseTrendChartProps {
  data: IncomeExpenseTrend[];
  title?: string;
  description?: string;
}

export function IncomeExpenseTrendChart({
  data,
  title = "Income vs Expense Trend",
  description,
}: IncomeExpenseTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    month: formatTrendMonth(item.month),
    fullMonth: item.month,
    Income: Math.round(item.income),
    Expense: Math.round(item.expense),
    Net: Math.round(item.net),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullMonth ?? ""}
              formatter={(value) => `${Number(value).toLocaleString()} ILS`}
            />
            <Legend />
            <Bar dataKey="Income" fill="#22c55e" />
            <Bar dataKey="Expense" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function formatTrendMonth(month: string): string {
  const [yearValue, monthValue] = month.split("-").map(Number);
  if (!yearValue || !monthValue) {
    return month;
  }

  return new Date(yearValue, monthValue - 1, 1).toLocaleDateString("en-IL", {
    month: "short",
  });
}
