"use client";

import { Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CategoryDTO } from "@/types";

interface CategoryListProps {
  categories: CategoryDTO[];
  onEdit: (category: CategoryDTO) => void;
  onDelete: (id: string) => void;
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
}: CategoryListProps) {
  return (
    <div className="space-y-2">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: cat.color ?? "#737373" }}
            />
            <span className="font-medium text-sm">{cat.name}</span>
            {cat.isSystem && (
              <Badge variant="secondary" className="text-xs">
                System
              </Badge>
            )}
            {cat.transactionCount !== undefined && cat.transactionCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {cat.transactionCount} txns
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(cat)}>
              <Edit className="h-3 w-3" />
            </Button>
            {!cat.isSystem && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => onDelete(cat.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
