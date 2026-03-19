"use client";

import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel";
import { SpendingSummaryCard } from "@/components/dashboard/SpendingSummaryCard";
import { RecentTransactionsList } from "@/components/dashboard/RecentTransactionsList";
import { TopCategoriesCard } from "@/components/dashboard/TopCategoriesCard";
import { AnomalyAlertsList } from "@/components/dashboard/AnomalyAlertsList";

export default function DashboardPage() {
  const vm = useDashboardViewModel();

  if (vm.isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <SpendingSummaryCard
        totalExpense={vm.totalExpense}
        totalIncome={vm.totalIncome}
        net={vm.net}
      />

      {vm.uncategorizedCount > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            {vm.uncategorizedCount} uncategorized transaction
            {vm.uncategorizedCount > 1 ? "s" : ""} need attention.
          </p>
        </div>
      )}

      <AnomalyAlertsList anomalies={vm.anomalies} />

      <div className="grid gap-6 md:grid-cols-2">
        <TopCategoriesCard categories={vm.topCategories} />
        <RecentTransactionsList transactions={vm.recentTransactions} />
      </div>
    </div>
  );
}
