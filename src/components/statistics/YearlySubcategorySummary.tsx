"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAmount } from "@/lib/amount-utils";
import type { CategoryYearlySummary } from "@/types";

interface YearlySubcategorySummaryProps {
  categoryName: string;
  childCategories: CategoryYearlySummary[];
  selectedCategoryId?: string | null;
  onSelectCategory?: (categoryId: string) => void;
}

export function YearlySubcategorySummary({
  categoryName,
  childCategories,
  selectedCategoryId = null,
  onSelectCategory,
}: YearlySubcategorySummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subcategories in {categoryName}</CardTitle>
        <CardDescription>
          Click a subcategory to open its Jan-Dec trend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {childCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active subcategories for this category in the selected year.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_96px_96px_96px] gap-3 px-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Subcategory</span>
              <span className="text-right">Income</span>
              <span className="text-right">Expense</span>
              <span className="text-right">Net</span>
            </div>
            {childCategories.map((category) => (
              <button
                key={category.categoryId}
                type="button"
                onClick={() => onSelectCategory?.(category.categoryId)}
                className={`grid w-full grid-cols-[minmax(0,1fr)_96px_96px_96px] gap-3 rounded-xl border bg-background px-3 py-3 text-left transition-colors hover:bg-muted/40 ${
                  selectedCategoryId === category.categoryId
                    ? "border-primary/30 bg-primary/10"
                    : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: category.categoryColor }}
                  />
                  <span className="truncate font-medium" dir="auto">
                    {category.categoryName}
                  </span>
                </div>
                <span className="text-right text-sm text-green-600">
                  {formatAmount(category.totalIncome)}
                </span>
                <span className="text-right text-sm text-red-600">
                  {formatAmount(category.totalExpense)}
                </span>
                <span
                  className={`text-right text-sm ${
                    category.net >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatAmount(category.net)}
                </span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}