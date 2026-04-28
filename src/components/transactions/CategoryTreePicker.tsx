"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoryDisplayName } from "@/lib/category-hierarchy";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types";

interface CategoryTreePickerProps {
  categories: CategoryDTO[];
  searchQuery: string;
  disabled?: boolean;
  onSelect: (category: CategoryDTO) => void;
}

type CategoryBranch = {
  root: CategoryDTO;
  children: CategoryDTO[];
};

export function CategoryTreePicker({
  categories,
  searchQuery,
  disabled = false,
  onSelect,
}: CategoryTreePickerProps) {
  const branches = buildCategoryBranches(categories);
  const [expandedRootIds, setExpandedRootIds] = useState<string[]>(() =>
    branches.map(({ root }) => root.id)
  );

  useEffect(() => {
    setExpandedRootIds((currentIds) =>
      syncExpandedRootIds(currentIds, branches, searchQuery)
    );
  }, [branches, searchQuery]);

  if (branches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
        No categories available yet.
      </p>
    );
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleBranches = branches
    .map((branch) => filterBranch(branch, normalizedQuery))
    .filter((branch): branch is CategoryBranch => branch !== null);
  const expandableRootIds = visibleBranches
    .filter(({ children }) => children.length > 0)
    .map(({ root }) => root.id);
  const areAllVisibleExpanded =
    expandableRootIds.length > 0 &&
    expandableRootIds.every((id) => expandedRootIds.includes(id));

  if (visibleBranches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
        No categories match your search.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {expandableRootIds.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5">
          <p className="text-xs text-muted-foreground">
            {expandableRootIds.length} main categor{expandableRootIds.length === 1 ? "y" : "ies"} with subcategories
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-10"
            onClick={() => {
              const visibleExpandableIds = new Set(expandableRootIds);

              setExpandedRootIds((currentIds) => {
                if (areAllVisibleExpanded) {
                  return currentIds.filter((id) => !visibleExpandableIds.has(id));
                }

                return Array.from(new Set([...currentIds, ...expandableRootIds]));
              });
            }}
          >
            {areAllVisibleExpanded ? "Collapse all" : "Expand all"}
          </Button>
        </div>
      )}

      <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {visibleBranches.map(({ root, children }) => {
          const hasChildren = children.length > 0;
          const isExpanded = expandedRootIds.includes(root.id);

          return (
            <div key={root.id} className="rounded-xl border bg-muted/10 p-2">
              <RootCategoryRow
                category={root}
                childCount={children.length}
                isExpanded={isExpanded}
                disabled={disabled}
                onSelect={onSelect}
                onToggle={() => {
                  if (!hasChildren) {
                    return;
                  }

                  setExpandedRootIds((currentIds) =>
                    currentIds.includes(root.id)
                      ? currentIds.filter((id) => id !== root.id)
                      : [...currentIds, root.id]
                  );
                }}
              />

              {hasChildren && isExpanded && (
                <div className="ml-5 mt-2 border-l border-border/70 pl-4">
                  <div className="space-y-2 py-1">
                    {children.map((category) => (
                      <ChildCategoryRow
                        key={category.id}
                        category={category}
                        disabled={disabled}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RootCategoryRow({
  category,
  childCount,
  isExpanded,
  disabled,
  onSelect,
  onToggle,
}: {
  category: CategoryDTO;
  childCount: number;
  isExpanded: boolean;
  disabled: boolean;
  onSelect: (category: CategoryDTO) => void;
  onToggle: () => void;
}) {
  const hasChildren = childCount > 0;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (hasChildren) {
            onToggle();
            return;
          }

          onSelect(category);
        }}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 text-left transition-colors",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-foreground"
        )}
      >
        <span className="flex h-4 w-4 items-center justify-center text-muted-foreground">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : null}
        </span>
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: category.color ?? "#737373" }}
        />
        <span className="min-w-0">
          <span className="block truncate font-medium" dir="auto">
            {category.name}
          </span>
          <span className="block text-xs text-muted-foreground">
            {hasChildren
              ? `${childCount} subcategor${childCount === 1 ? "y" : "ies"}`
              : "Main category"}
          </span>
        </span>
      </button>

      <span className="shrink-0 text-xs text-muted-foreground">
        {hasChildren ? "Expand" : "Select"}
      </span>
    </div>
  );
}

function ChildCategoryRow({
  category,
  disabled,
  onSelect,
}: {
  category: CategoryDTO;
  disabled: boolean;
  onSelect: (category: CategoryDTO) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(category)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer hover:border-foreground/20 hover:bg-muted"
      )}
    >
      <span
        className="mt-1 h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: category.color ?? "#737373" }}
      />
      <span className="min-w-0">
        <span className="block truncate font-medium" dir="auto">
          {category.name}
        </span>
        <span className="block text-xs text-muted-foreground" dir="auto">
          {getCategoryDisplayName(category)}
        </span>
      </span>
    </button>
  );
}

function buildCategoryBranches(categories: CategoryDTO[]): CategoryBranch[] {
  const rootCategories = categories
    .filter((category) => category.parentId === null)
    .sort((left, right) => left.name.localeCompare(right.name));

  const childrenByParent = categories.reduce<Map<string, CategoryDTO[]>>((map, category) => {
    if (!category.parentId) {
      return map;
    }

    const siblings = map.get(category.parentId) ?? [];
    siblings.push(category);
    map.set(category.parentId, siblings);
    return map;
  }, new Map());

  return rootCategories.map((root) => ({
    root,
    children: (childrenByParent.get(root.id) ?? []).sort((left, right) =>
      left.name.localeCompare(right.name)
    ),
  }));
}

function filterBranch(
  branch: CategoryBranch,
  normalizedQuery: string
): CategoryBranch | null {
  if (!normalizedQuery) {
    return branch;
  }

  const rootMatches = branch.root.name.toLowerCase().includes(normalizedQuery);
  if (rootMatches) {
    return branch;
  }

  const matchingChildren = branch.children.filter((category) =>
    getCategoryDisplayName(category).toLowerCase().includes(normalizedQuery)
  );

  if (matchingChildren.length === 0) {
    if (branch.children.length === 0 && getCategoryDisplayName(branch.root).toLowerCase().includes(normalizedQuery)) {
      return branch;
    }

    return null;
  }

  return {
    ...branch,
    children: matchingChildren,
  };
}

function syncExpandedRootIds(
  currentIds: string[],
  branches: CategoryBranch[],
  searchQuery: string
): string[] {
  const validRootIds = new Set(branches.map(({ root }) => root.id));
  const nextIds = currentIds.filter((id) => validRootIds.has(id));

  if (nextIds.length === 0) {
    nextIds.push(...branches.map(({ root }) => root.id));
  }

  if (!searchQuery.trim()) {
    return nextIds;
  }

  const matchingRootIds = branches
    .filter((branch) => filterBranch(branch, searchQuery.trim().toLowerCase()) !== null)
    .map(({ root }) => root.id);

  return Array.from(new Set([...nextIds, ...matchingRootIds]));
}