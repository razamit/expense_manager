"use client";

import { MonthPicker } from "@/components/shared/MonthPicker";
import { YearPicker } from "@/components/shared/YearPicker";
import { CategoryAmountBarChart } from "@/components/statistics/CategoryAmountBarChart";
import { MonthlyCategoryChartsPanel } from "@/components/statistics/MonthlyCategoryChartsPanel";
import { CategoryBreakdownList } from "@/components/statistics/CategoryBreakdownList";
import { YearlyCategoryTrendChart } from "@/components/statistics/YearlyCategoryTrendChart";
import { YearlyCategorySelectionPanel } from "@/components/statistics/YearlyCategorySelectionPanel";
import { AnomalyAlertsList } from "@/components/dashboard/AnomalyAlertsList";
import { useStatisticsViewModel } from "@/viewmodels/useStatisticsViewModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAmount } from "@/lib/amount-utils";
import { getCategoryDisplayName } from "@/lib/category-hierarchy";
import { formatMonth } from "@/lib/date-utils";

export default function StatisticsPage() {
  const vm = useStatisticsViewModel();
  const monthlyLabel = formatMonth(new Date(vm.selectedMonthYear, vm.selectedMonth, 1));
  const totalMonthlySpending = vm.monthlySpending.reduce(
    (sum, category) => sum + category.totalAmount,
    0
  );
  const totalMonthlyIncome = vm.monthlyIncome.reduce(
    (sum, category) => sum + category.totalAmount,
    0
  );
  const monthlyTransactionCount =
    vm.monthlySpending.reduce((sum, category) => sum + category.transactionCount, 0) +
    vm.monthlyIncome.reduce((sum, category) => sum + category.transactionCount, 0);

  const totalYearlySpending = vm.yearlySpending.reduce(
    (sum, category) => sum + category.totalAmount,
    0
  );
  const totalYearlyIncome = vm.yearlyIncome.reduce(
    (sum, category) => sum + category.totalAmount,
    0
  );
  const selectedYearlySpending = vm.selectedYearlyAggregateTrend?.totalExpense ?? 0;
  const selectedYearlyIncome = vm.selectedYearlyAggregateTrend?.totalIncome ?? 0;
  const categoryLookup = new Map(vm.categories.map((category) => [category.id, category]));
  const selectedYearlySpendingItems = vm.selectedYearlyCategoryTrends
    .filter((trend) => trend.totalExpense > 0)
    .map((trend) => ({
      id: trend.categoryId,
      label: categoryLookup.has(trend.categoryId)
        ? getCategoryDisplayName(categoryLookup.get(trend.categoryId)!)
        : trend.categoryName,
      color: trend.categoryColor,
      amount: trend.totalExpense,
      transactionCount: trend.transactionCount,
    }));
  const selectedYearlyIncomeItems = vm.selectedYearlyCategoryTrends
    .filter((trend) => trend.totalIncome > 0)
    .map((trend) => ({
      id: trend.categoryId,
      label: categoryLookup.has(trend.categoryId)
        ? getCategoryDisplayName(categoryLookup.get(trend.categoryId)!)
        : trend.categoryName,
      color: trend.categoryColor,
      amount: trend.totalIncome,
      transactionCount: trend.transactionCount,
    }));
  const yearlySelectionDescription =
    vm.selectedYearlyCategoryIds.length === 0
      ? `No categories selected for ${vm.selectedYear}`
      : vm.selectedYearlyCategoryIds.length === vm.selectableYearlyCategoryIds.length
        ? `All selectable categories in ${vm.selectedYear}`
        : `${vm.selectedYearlyCategoryIds.length} selected categor${vm.selectedYearlyCategoryIds.length === 1 ? "y" : "ies"} in ${vm.selectedYear}`;

  return (
    <div className="app-page-shell">
      <Tabs
        value={vm.view}
        onValueChange={(value) => vm.changeView(value as typeof vm.view)}
        className="space-y-6"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <p className="app-eyebrow-label">Reporting</p>
            <div className="space-y-2">
              <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">
                Statistics
              </h1>
              <p className="text-sm text-muted-foreground">
              Monthly bars for the selected month and yearly exploration across categories.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <TabsList className="grid h-auto grid-cols-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
              <TabsTrigger value="monthly" className="min-h-10 rounded-md px-4">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="yearly" className="min-h-10 rounded-md px-4">
                Yearly
              </TabsTrigger>
            </TabsList>

            {vm.view === "monthly" ? (
              <MonthPicker
                month={vm.selectedMonth}
                year={vm.selectedMonthYear}
                onChange={vm.changeMonth}
              />
            ) : (
              <YearPicker year={vm.selectedYear} onChange={vm.changeYear} />
            )}
          </div>
        </div>

        <TabsContent value="monthly" className="mt-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly Summary</CardTitle>
              <CardDescription>{monthlyLabel}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <SummaryMetric label="Total Spending" value={formatAmount(totalMonthlySpending)} tone="text-red-600" />
                <SummaryMetric label="Total Income" value={formatAmount(totalMonthlyIncome)} tone="text-green-600" />
                <SummaryMetric
                  label="Net"
                  value={formatAmount(totalMonthlyIncome - totalMonthlySpending)}
                  tone={
                    totalMonthlyIncome - totalMonthlySpending >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                />
                <SummaryMetric
                  label="Transactions"
                  value={monthlyTransactionCount.toLocaleString()}
                  tone="text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {vm.isMonthlyLoading ? (
            <LoadingCard message="Loading monthly statistics..." />
          ) : (
            <>
              <MonthlyCategoryChartsPanel
                monthLabel={monthlyLabel}
                spendingCategories={vm.monthlySpending}
                incomeCategories={vm.monthlyIncome}
              />

              <AnomalyAlertsList anomalies={vm.monthlyAnomalies} />

              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Spending Breakdown</CardTitle>
                    <CardDescription>
                      Drill into the transactions behind this month&apos;s spending.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CategoryBreakdownList
                      categories={vm.monthlySpending}
                      year={vm.selectedMonthYear}
                      month={vm.selectedMonth}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Income Breakdown</CardTitle>
                    <CardDescription>
                      Inspect the categories contributing income this month.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CategoryBreakdownList
                      categories={vm.monthlyIncome}
                      year={vm.selectedMonthYear}
                      month={vm.selectedMonth}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="yearly" className="mt-0 space-y-6">
          {vm.isYearlyLoading && vm.hasLoadedYearly ? (
            <p className="text-sm text-muted-foreground">
              Refreshing yearly statistics for {vm.selectedYear}...
            </p>
          ) : null}

          {vm.isYearlyLoading && !vm.hasLoadedYearly ? (
            <LoadingCard message="Loading yearly statistics..." />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_420px] 2xl:grid-cols-[minmax(0,1.35fr)_480px]">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Selected Yearly Summary</CardTitle>
                    <CardDescription>{yearlySelectionDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <SummaryMetric label="Total Spending" value={formatAmount(selectedYearlySpending)} tone="text-red-600" />
                      <SummaryMetric label="Total Income" value={formatAmount(selectedYearlyIncome)} tone="text-green-600" />
                      <SummaryMetric
                        label="Net"
                        value={formatAmount(selectedYearlyIncome - selectedYearlySpending)}
                        tone={
                          selectedYearlyIncome - selectedYearlySpending >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <YearlyCategoryTrendChart
                  trend={vm.selectedYearlyAggregateTrend}
                  onMonthSelect={vm.openMonthlyView}
                />

                <div className="grid gap-6 xl:grid-cols-2">
                  <CategoryAmountBarChart
                    title="Yearly Spending Categories"
                    description="Only the currently selected categories are shown here."
                    items={selectedYearlySpendingItems}
                    emptyMessage="No spending categories in the current selection."
                  />
                  <CategoryAmountBarChart
                    title="Yearly Income Categories"
                    description="Only the currently selected categories are shown here."
                    items={selectedYearlyIncomeItems}
                    emptyMessage="No income categories in the current selection."
                  />
                </div>
              </div>

              <YearlyCategorySelectionPanel
                categories={vm.categories}
                searchQuery={vm.yearlyCategorySearchQuery}
                selectedCategoryIds={vm.selectedYearlyCategoryIds}
                onSearchQueryChange={vm.setYearlyCategorySearchQuery}
                onToggleCategory={vm.toggleYearlyCategory}
                onToggleCategoryGroup={vm.toggleYearlyCategoryGroup}
                onSelectAll={vm.selectAllYearlyCategories}
                onDeselectAll={vm.deselectAllYearlyCategories}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div>
      <p className="app-eyebrow-label">{label}</p>
      <p className={`app-tabular-data mt-2 text-2xl font-semibold tracking-[-0.01em] ${tone}`}>
        {value}
      </p>
    </div>
  );
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-6">
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
