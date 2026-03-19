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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IncomeExpenseTrend } from "@/types";

interface IncomeExpenseTrendChartProps {
  data: IncomeExpenseTrend[];
}

export function IncomeExpenseTrendChart({
  data,
}: IncomeExpenseTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expense Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data available.</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    month: item.month,
    Income: Math.round(item.income),
    Expense: Math.round(item.expense),
    Net: Math.round(item.net),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expense Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
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
