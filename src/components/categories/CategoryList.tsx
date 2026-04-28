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
  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">No categories yet.</p>;
  }

  const rootCategories = categories.filter((category) => category.parentId === null);
  const childrenByParent = categories.reduce<Map<string, CategoryDTO[]>>((map, category) => {
    if (!category.parentId) {
      return map;
    }

    const siblings = map.get(category.parentId) ?? [];
    siblings.push(category);
    map.set(category.parentId, siblings);
    return map;
  }, new Map());

  return (
    <div className="space-y-3">
      {rootCategories.map((category) => {
        const subcategories = (childrenByParent.get(category.id) ?? []).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        return (
          <div key={category.id} className="overflow-hidden rounded-lg border">
            <CategoryRow
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
            />
            {subcategories.length > 0 && (
              <div className="space-y-2 border-t bg-muted/20 px-4 py-3">
                {subcategories.map((subcategory) => (
                  <CategoryRow
                    key={subcategory.id}
                    category={subcategory}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isChild
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CategoryRow({
  category,
  onEdit,
  onDelete,
  isChild = false,
}: {
  category: CategoryDTO;
  onEdit: (category: CategoryDTO) => void;
  onDelete: (id: string) => void;
  isChild?: boolean;
}) {
  return (
    <div
      className={isChild
        ? "flex items-center justify-between rounded-md border bg-background px-3 py-2"
        : "flex items-center justify-between p-3"}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: category.color ?? "#737373" }}
        />
        <span className="font-medium text-sm">{category.name}</span>
        {isChild && <Badge variant="outline">Subcategory</Badge>}
        {category.isSystem && (
          <Badge variant="secondary" className="text-xs">
            System
          </Badge>
        )}
        {!isChild && (category.childCount ?? 0) > 0 && (
          <span className="text-xs text-muted-foreground">
            {category.childCount} subcategories
          </span>
        )}
        {category.transactionCount !== undefined && category.transactionCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {category.transactionCount} linked transaction
            {category.transactionCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
          <Edit className="h-3 w-3" />
        </Button>
        {!category.isSystem && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => onDelete(category.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
