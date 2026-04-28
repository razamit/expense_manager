"use client";

import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCategoryDisplayName,
  sortCategoriesByDisplayName,
} from "@/lib/category-hierarchy";
import type { TransactionFilters, CategoryDTO, AccountDTO } from "@/types";

interface TransactionFiltersBarProps {
  filters: TransactionFilters;
  categories: CategoryDTO[];
  accounts?: AccountDTO[];
  onChange: (filters: Partial<TransactionFilters>) => void;
  onExport: () => void;
}

export function TransactionFiltersBar({
  filters,
  categories,
  onChange,
  onExport,
}: TransactionFiltersBarProps) {
  const sortedCategories = sortCategoriesByDisplayName(categories);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          className="pl-9"
          value={filters.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value || undefined })}
        />
      </div>

      <Select
        value={filters.direction ?? "all"}
        onValueChange={(v) =>
          onChange({ direction: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="expense">Expenses</SelectItem>
          <SelectItem value="income">Income</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.categoryId ?? "all"}
        onValueChange={(v) =>
          onChange({ categoryId: v === "all" ? undefined : v })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {sortedCategories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {getCategoryDisplayName(cat)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={filters.uncategorizedOnly ? "default" : "outline"}
        size="sm"
        onClick={() =>
          onChange({ uncategorizedOnly: !filters.uncategorizedOnly })
        }
      >
        Uncategorized
      </Button>

      <Button variant="outline" size="sm" onClick={onExport}>
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
}
