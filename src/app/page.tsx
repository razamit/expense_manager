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
      <div className="app-page-shell">
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="app-page-shell">
      <div className="space-y-2">
        <p className="app-eyebrow-label">Overview</p>
        <div className="space-y-2">
          <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Track balances, recent activity, uncategorized spending, and anomalies.
          </p>
        </div>
      </div>

      <SpendingSummaryCard
        totalExpense={vm.totalExpense}
        totalIncome={vm.totalIncome}
        net={vm.net}
      />

      {vm.uncategorizedCount > 0 && (
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
          <p className="app-eyebrow-label text-warning">Action Required</p>
          <p className="mt-2 text-sm font-medium text-foreground">
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
