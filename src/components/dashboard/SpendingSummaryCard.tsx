"use client";

import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmountDisplay } from "@/components/shared/AmountDisplay";

interface SpendingSummaryCardProps {
  totalExpense: number;
  totalIncome: number;
  net: number;
}

export function SpendingSummaryCard({
  totalExpense,
  totalIncome,
  net,
}: SpendingSummaryCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <AmountDisplay amount={totalIncome} direction="income" className="text-2xl font-bold" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <AmountDisplay amount={totalExpense} direction="expense" className="text-2xl font-bold" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Net</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <AmountDisplay
            amount={net}
            direction={net >= 0 ? "income" : "expense"}
            className="text-2xl font-bold"
          />
        </CardContent>
      </Card>
    </div>
  );
}
