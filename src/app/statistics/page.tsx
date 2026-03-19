"use client";

import { MonthPicker } from "@/components/shared/MonthPicker";
import { SpendingByCategoryChart } from "@/components/statistics/SpendingByCategoryChart";
import { IncomeExpenseTrendChart } from "@/components/statistics/IncomeExpenseTrendChart";
import { CategoryBreakdownList } from "@/components/statistics/CategoryBreakdownList";
import { AnomalyAlertsList } from "@/components/dashboard/AnomalyAlertsList";
import { useStatisticsViewModel } from "@/viewmodels/useStatisticsViewModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/amount-utils";

export default function StatisticsPage() {
  const vm = useStatisticsViewModel();

  if (vm.isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading statistics...</p>
      </div>
    );
  }

  const totalSpending = vm.spending.reduce((s, c) => s + c.totalAmount, 0);
  const totalIncome = vm.income.reduce((s, c) => s + c.totalAmount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Statistics</h1>
        <MonthPicker
          month={vm.selectedMonth}
          year={vm.selectedYear}
          onChange={vm.changeMonth}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Spending</p>
              <p className="text-xl font-bold text-red-600">
                {formatAmount(totalSpending)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-xl font-bold text-green-600">
                {formatAmount(totalIncome)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net</p>
              <p
                className={`text-xl font-bold ${
                  totalIncome - totalSpending >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatAmount(totalIncome - totalSpending)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-xl font-bold">
                {vm.spending.reduce((s, c) => s + c.transactionCount, 0) +
                  vm.income.reduce((s, c) => s + c.transactionCount, 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <SpendingByCategoryChart data={vm.spending} />
        <IncomeExpenseTrendChart data={vm.trend} />
      </div>

      <AnomalyAlertsList anomalies={vm.anomalies} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownList
              categories={vm.spending}
              year={vm.selectedYear}
              month={vm.selectedMonth}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Income Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownList
              categories={vm.income}
              year={vm.selectedYear}
              month={vm.selectedMonth}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
