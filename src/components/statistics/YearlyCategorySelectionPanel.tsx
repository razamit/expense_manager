"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { getCategoryDisplayName } from "@/lib/category-hierarchy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types";

interface YearlyCategorySelectionPanelProps {
  categories: CategoryDTO[];
  searchQuery: string;
  selectedCategoryIds: string[];
  onSearchQueryChange: (query: string) => void;
  onToggleCategory: (categoryId: string) => void;
  onToggleCategoryGroup: (categoryId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

type CategoryBranch = {
  root: CategoryDTO;
  children: CategoryDTO[];
  targetIds: string[];
};

export function YearlyCategorySelectionPanel({
  categories,
  searchQuery,
  selectedCategoryIds,
  onSearchQueryChange,
  onToggleCategory,
  onToggleCategoryGroup,
  onSelectAll,
  onDeselectAll,
}: YearlyCategorySelectionPanelProps) {
  const branches = useMemo(() => buildCategoryBranches(categories), [categories]);
  const [expandedRootIds, setExpandedRootIds] = useState<string[]>(() =>
    branches.map((branch) => branch.root.id)
  );
  const selectedCategoryIdSet = useMemo(
    () => new Set(selectedCategoryIds),
    [selectedCategoryIds]
  );

  useEffect(() => {
    setExpandedRootIds((currentIds) =>
      syncExpandedRootIds(currentIds, branches, searchQuery)
    );
  }, [branches, searchQuery]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleBranches = branches
    .map((branch) => filterBranch(branch, normalizedQuery))
    .filter((branch): branch is CategoryBranch => branch !== null);
  const expandableRootIds = visibleBranches
    .filter((branch) => branch.children.length > 0)
    .map((branch) => branch.root.id);
  const areAllVisibleExpanded =
    expandableRootIds.length > 0 &&
    expandableRootIds.every((id) => expandedRootIds.includes(id));

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Category Explorer</CardTitle>
        <CardDescription>
          Select all, deselect all, or add and remove categories to update every yearly chart.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search categories"
            className="pl-9"
          />
        </div>

        <div className="rounded-xl border bg-muted/10 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Selected categories
          </p>
          <p className="mt-1 font-medium">
            {selectedCategoryIds.length.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clicking a main category toggles all of its subcategories.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
            Select all
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onDeselectAll}>
            Deselect all
          </Button>
          {expandableRootIds.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
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
          ) : null}
        </div>

        {visibleBranches.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No categories match your search.
          </p>
        ) : (
          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {visibleBranches.map((branch) => (
              <YearlyCategoryBranch
                key={branch.root.id}
                branch={branch}
                isExpanded={expandedRootIds.includes(branch.root.id)}
                selectedCategoryIds={selectedCategoryIdSet}
                onToggleExpand={() => {
                  if (branch.children.length === 0) {
                    return;
                  }

                  setExpandedRootIds((currentIds) =>
                    currentIds.includes(branch.root.id)
                      ? currentIds.filter((id) => id !== branch.root.id)
                      : [...currentIds, branch.root.id]
                  );
                }}
                onToggleBranch={() => onToggleCategoryGroup(branch.root.id)}
                onToggleCategory={onToggleCategory}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function YearlyCategoryBranch({
  branch,
  isExpanded,
  selectedCategoryIds,
  onToggleExpand,
  onToggleBranch,
  onToggleCategory,
}: {
  branch: CategoryBranch;
  isExpanded: boolean;
  selectedCategoryIds: Set<string>;
  onToggleExpand: () => void;
  onToggleBranch: () => void;
  onToggleCategory: (categoryId: string) => void;
}) {
  const selectedChildrenCount = branch.targetIds.filter((categoryId) =>
    selectedCategoryIds.has(categoryId)
  ).length;
  const hasChildren = branch.children.length > 0;
  const isFullySelected =
    branch.targetIds.length > 0 && selectedChildrenCount === branch.targetIds.length;
  const isPartiallySelected =
    selectedChildrenCount > 0 && selectedChildrenCount < branch.targetIds.length;

  return (
    <div className="rounded-xl border bg-muted/10 p-2">
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5">
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={
              isExpanded
                ? `Collapse ${branch.root.name}`
                : `Expand ${branch.root.name}`
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground" />
        )}

        <button
          type="button"
          onClick={onToggleBranch}
          aria-pressed={isFullySelected}
          className={cn(
            "flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
            isFullySelected
              ? "bg-primary/10 text-foreground ring-1 ring-primary/25"
              : isPartiallySelected
                ? "bg-primary/5 text-foreground ring-1 ring-primary/15"
                : "hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: branch.root.color ?? "#737373" }}
          />
          <span className="min-w-0">
            <span className="block truncate font-medium" dir="auto">
              {branch.root.name}
            </span>
            <span className="block text-xs text-muted-foreground">
              {hasChildren
                ? `${selectedChildrenCount}/${branch.targetIds.length} selected`
                : isFullySelected
                  ? "Selected"
                  : "Not selected"}
            </span>
          </span>
        </button>

        <span className="shrink-0 text-xs text-muted-foreground">
          {isFullySelected
            ? "Deselect all"
            : isPartiallySelected
              ? "Select all"
              : "Select all"}
        </span>
      </div>

      {hasChildren && isExpanded ? (
        <div className="ml-5 mt-2 border-l border-border/70 pl-4">
          <div className="space-y-2 py-1">
            {branch.children.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => onToggleCategory(category.id)}
                aria-pressed={selectedCategoryIds.has(category.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
                  selectedCategoryIds.has(category.id)
                    ? "border-primary/30 bg-primary/10"
                    : "hover:border-foreground/20 hover:bg-muted"
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
            ))}
          </div>
        </div>
      ) : null}
    </div>
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

  return rootCategories.map((root) => {
    const children = (childrenByParent.get(root.id) ?? []).sort((left, right) =>
      left.name.localeCompare(right.name)
    );

    return {
      root,
      children,
      targetIds: children.length > 0 ? children.map((category) => category.id) : [root.id],
    };
  });
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
    if (
      branch.children.length === 0 &&
      getCategoryDisplayName(branch.root).toLowerCase().includes(normalizedQuery)
    ) {
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
  const validRootIds = new Set(branches.map((branch) => branch.root.id));
  const nextIds = currentIds.filter((id) => validRootIds.has(id));

  if (nextIds.length === 0) {
    nextIds.push(...branches.map((branch) => branch.root.id));
  }

  if (!searchQuery.trim()) {
    return haveSameIds(currentIds, nextIds) ? currentIds : nextIds;
  }

  const matchingRootIds = branches
    .filter((branch) => filterBranch(branch, searchQuery.trim().toLowerCase()) !== null)
    .map((branch) => branch.root.id);

  const mergedIds = Array.from(new Set([...nextIds, ...matchingRootIds]));
  return haveSameIds(currentIds, mergedIds) ? currentIds : mergedIds;
}

function haveSameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}