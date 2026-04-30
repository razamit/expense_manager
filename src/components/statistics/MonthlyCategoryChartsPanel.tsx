"use client";

import {
  CategoryAmountBarChart,
  type CategoryAmountBarItem,
} from "@/components/statistics/CategoryAmountBarChart";
import type { SpendingByCategory } from "@/types";

interface MonthlyCategoryChartsPanelProps {
  monthLabel: string;
  spendingCategories: SpendingByCategory[];
  incomeCategories: SpendingByCategory[];
}

export function MonthlyCategoryChartsPanel({
  monthLabel,
  spendingCategories,
  incomeCategories,
}: MonthlyCategoryChartsPanelProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <CategoryAmountBarChart
        title="Spending Categories"
        description={`All spending categories in ${monthLabel}`}
        items={mapCategoriesToBarItems(spendingCategories)}
        emptyMessage="No spending categories in this month."
      />
      <CategoryAmountBarChart
        title="Income Categories"
        description={`All income categories in ${monthLabel}`}
        items={mapCategoriesToBarItems(incomeCategories)}
        emptyMessage="No income categories in this month."
      />
    </div>
  );
}

function mapCategoriesToBarItems(
  categories: SpendingByCategory[]
): CategoryAmountBarItem[] {
  return categories.map((category) => ({
    id: category.categoryId,
    label: category.categoryName,
    color: category.categoryColor,
    amount: category.totalAmount,
    transactionCount: category.transactionCount,
  }));
}