"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
  getLeafCategories,
  sortCategoriesByDisplayName,
} from "@/lib/category-hierarchy";
import type {
  BankCategoryMappingDTO,
  CategoryDTO,
  ObservedBankCategoryDTO,
} from "@/types";

type VisibleBankCategoryRow = {
  key: string;
  rawBankCategory: string;
  normalizedBankCategory: string;
  occurrenceCount: number;
  accountNames: string[];
  mapping: BankCategoryMappingDTO | null;
  isObserved: boolean;
};

interface BankCategoryMappingEditorProps {
  mappings: BankCategoryMappingDTO[];
  observedBankCategories: ObservedBankCategoryDTO[];
  categories: CategoryDTO[];
  onAdd: (data: {
    bankCategory: string;
    categoryId: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void> | void;
}

export function BankCategoryMappingEditor({
  mappings,
  observedBankCategories,
  categories,
  onAdd,
  onDelete,
}: BankCategoryMappingEditorProps) {
  const [draftCategoryIds, setDraftCategoryIds] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pendingSaveKey, setPendingSaveKey] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const leafCategories = sortCategoriesByDisplayName(getLeafCategories(categories));
  const categoryLabelById = new Map(
    categories.map((category) => [category.id, getCategoryDisplayName(category)])
  );
  const mappingByNormalizedKey = new Map(
    mappings.map((mapping) => [mapping.normalizedBankCategory, mapping])
  );
  const observedNormalizedKeys = new Set(
    observedBankCategories.map((bankCategory) => bankCategory.normalizedBankCategory)
  );
  const visibleBankCategoryRows = [
    ...observedBankCategories.map((bankCategory) => ({
      key: `observed-${bankCategory.normalizedBankCategory}`,
      rawBankCategory: bankCategory.rawBankCategory,
      normalizedBankCategory: bankCategory.normalizedBankCategory,
      occurrenceCount: bankCategory.occurrenceCount,
      accountNames: bankCategory.accountNames,
      mapping:
        mappingByNormalizedKey.get(bankCategory.normalizedBankCategory) ?? null,
      isObserved: true,
    })),
    ...mappings
      .filter(
        (mapping) => !observedNormalizedKeys.has(mapping.normalizedBankCategory)
      )
      .map((mapping) => ({
        key: `mapping-${mapping.id}`,
        rawBankCategory: mapping.rawBankCategory,
        normalizedBankCategory: mapping.normalizedBankCategory,
        occurrenceCount: 0,
        accountNames: [],
        mapping,
        isObserved: false,
      })),
  ].sort((left, right) => left.rawBankCategory.localeCompare(right.rawBankCategory)) satisfies VisibleBankCategoryRow[];

  async function handleAdd(row: VisibleBankCategoryRow) {
    const categoryId = getSelectedCategoryId(row);
    if (!categoryId) {
      return;
    }

    setError("");
    setPendingSaveKey(row.key);

    try {
      await onAdd({ bankCategory: row.rawBankCategory, categoryId });
      setDraftCategoryIds((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[row.normalizedBankCategory];
        return nextDrafts;
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingSaveKey(null);
    }
  }

  async function handleDelete(mappingId: string) {
    setError("");
    setPendingDeleteId(mappingId);

    try {
      await onDelete(mappingId);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingDeleteId(null);
    }
  }

  function getSelectedCategoryId(row: VisibleBankCategoryRow): string {
    return (
      draftCategoryIds[row.normalizedBankCategory] ?? row.mapping?.categoryId ?? ""
    );
  }

  function handleDraftCategoryChange(row: VisibleBankCategoryRow, categoryId: string) {
    setDraftCategoryIds((currentDrafts) => ({
      ...currentDrafts,
      [row.normalizedBankCategory]: categoryId,
    }));
    setError("");
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Each bank category can be mapped inline. Pick a leaf category on the same row and save it.
      </p>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        {visibleBankCategoryRows.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No credit-card bank categories observed yet.
          </p>
        ) : (
          visibleBankCategoryRows.map((row) => (
            <div
              key={row.key}
              className="grid gap-3 rounded-xl border px-3 py-3 text-sm md:grid-cols-[minmax(0,1fr)_18rem_5.75rem_2.25rem] md:items-center"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex min-w-0 items-center gap-3">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs" dir="auto">
                    {row.rawBankCategory}
                  </code>
                  <span className="text-muted-foreground">→</span>
                  <span className="truncate">
                    {row.mapping
                      ? categoryLabelById.get(row.mapping.categoryId) ??
                        row.mapping.categoryName ??
                        row.mapping.categoryId
                      : "Unmapped"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {row.isObserved ? (
                    <span>
                      Seen in {row.occurrenceCount} credit-card transaction{row.occurrenceCount === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span>Saved mapping with no current credit-card matches</span>
                  )}
                  {row.accountNames.length > 0 && (
                    <span dir="auto">Accounts: {row.accountNames.join(", ")}</span>
                  )}
                </div>
              </div>
              <div className="min-w-[220px]">
                <Select
                  value={getSelectedCategoryId(row)}
                  onValueChange={(categoryId) => handleDraftCategoryChange(row, categoryId)}
                  disabled={pendingSaveKey !== null || pendingDeleteId !== null}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label={`Map ${row.rawBankCategory} to category`}
                  >
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {leafCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {getCategoryDisplayName(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 md:justify-self-start">
                <Button
                  size="sm"
                  className="w-full justify-center"
                  disabled={
                    !getSelectedCategoryId(row) ||
                    pendingSaveKey !== null ||
                    pendingDeleteId !== null ||
                    getSelectedCategoryId(row) === row.mapping?.categoryId
                  }
                  onClick={() => handleAdd(row)}
                >
                  {pendingSaveKey === row.key
                    ? row.mapping
                      ? "Updating..."
                      : "Mapping..."
                    : row.mapping
                      ? "Update"
                      : "Map"}
                </Button>
              </div>
              {row.mapping ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive md:justify-self-end"
                  disabled={pendingSaveKey !== null || pendingDeleteId !== null}
                  onClick={() => handleDelete(row.mapping!.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              ) : (
                <div className="hidden md:block" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}