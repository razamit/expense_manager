"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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

export interface CategoryAmountBarItem {
  id: string;
  label: string;
  color: string;
  amount: number;
  transactionCount?: number;
}

interface CategoryAmountBarChartProps {
  title: string;
  description?: string;
  items: CategoryAmountBarItem[];
  emptyMessage?: string;
}

export function CategoryAmountBarChart({
  title,
  description,
  items,
  emptyMessage = "No data available.",
}: CategoryAmountBarChartProps) {
  const sortedItems = [...items]
    .filter((item) => item.amount > 0)
    .sort((left, right) => right.amount - left.amount);

  if (sortedItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = sortedItems.map((item) => ({
    ...item,
    amount: Math.round(item.amount),
  }));
  const chartHeight = Math.max(280, chartData.length * 44);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 96, left: 12, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => formatCompactAmount(Number(value))}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={124}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => formatAmount(Number(value))}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
            />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
              <LabelList
                dataKey="amount"
                position="right"
                offset={8}
                formatter={(value) => formatCompactAmount(Number(value ?? 0))}
                className="fill-foreground text-xs font-medium"
              />
              {chartData.map((item) => (
                <Cell key={item.id} fill={item.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function formatCompactAmount(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}