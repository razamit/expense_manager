"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatAmount } from "@/lib/amount-utils";
import type { SpendingByCategory } from "@/types";

interface TopCategoriesCardProps {
  categories: SpendingByCategory[];
}

export function TopCategoriesCard({ categories }: TopCategoriesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No spending data yet.</p>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.categoryId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat.categoryName}</span>
                  <span className="text-muted-foreground">
                    {formatAmount(cat.totalAmount)}
                  </span>
                </div>
                <Progress
                  value={cat.percentOfTotal}
                  className="h-2"
                  style={
                    {
                      "--progress-color": cat.categoryColor,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
