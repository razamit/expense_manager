"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCategoryDisplayName } from "@/lib/category-hierarchy";
import type { CategoryDTO, CategoryRuleDTO } from "@/types";

interface CategoryRuleEditorProps {
  rules: CategoryRuleDTO[];
  categories: CategoryDTO[];
  onDelete: (id: string) => Promise<void> | void;
  onDeleteAll: () => Promise<void> | void;
}

export function CategoryRuleEditor({
  rules,
  categories,
  onDelete,
  onDeleteAll,
}: CategoryRuleEditorProps) {
  const [filterText, setFilterText] = useState("");
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const categoryLabelById = new Map(
    categories.map((category) => [category.id, getCategoryDisplayName(category)])
  );
  const normalizedFilter = filterText.trim().toLocaleLowerCase();
  const filteredRules = rules.filter((rule) => {
    if (!normalizedFilter) {
      return true;
    }

    const categoryLabel =
      categoryLabelById.get(rule.categoryId) ?? rule.categoryName ?? rule.categoryId;

    return (
      rule.matchPattern.toLocaleLowerCase().includes(normalizedFilter)
      || categoryLabel.toLocaleLowerCase().includes(normalizedFilter)
      || (rule.isRegex && "regex".includes(normalizedFilter))
    );
  });

  async function handleDelete(ruleId: string) {
    setError("");
    setPendingDeleteId(ruleId);

    try {
      await onDelete(ruleId);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function handleDeleteAll() {
    if (rules.length === 0) {
      return;
    }

    if (!confirm("Delete all auto-categorization rules?")) {
      return;
    }

    setError("");
    setIsDeletingAll(true);

    try {
      await onDeleteAll();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsDeletingAll(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1 flex-1 min-w-[240px]">
          <Label htmlFor="category-rule-filter" className="text-xs">Filter rules</Label>
          <Input
            id="category-rule-filter"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search by pattern or category"
          />
        </div>
        <div className="flex min-h-9 items-center text-xs text-muted-foreground">
          {filteredRules.length} of {rules.length} rule{rules.length === 1 ? "" : "s"}
        </div>
        {filterText && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFilterText("")}
            disabled={isDeletingAll || pendingDeleteId !== null}
          >
            Clear
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          className="text-white disabled:opacity-100 disabled:bg-destructive/55 disabled:text-white"
          onClick={handleDeleteAll}
          disabled={rules.length === 0 || isDeletingAll || pendingDeleteId !== null}
        >
          <Trash2 className="h-3 w-3" />
          {isDeletingAll ? "Deleting..." : "Delete All"}
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        {filteredRules.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">
            {rules.length === 0
              ? "No auto-categorization rules yet. Create them from the transaction categorization dialog."
              : "No rules match this filter."}
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-3">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded" dir="auto">
                  {rule.matchPattern}
                </code>
                <span className="text-muted-foreground">→</span>
                <span>{categoryLabelById.get(rule.categoryId) ?? rule.categoryName ?? rule.categoryId}</span>
                {rule.isRegex && (
                  <span className="text-xs text-muted-foreground">(regex)</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-7 w-7"
                disabled={isDeletingAll || pendingDeleteId !== null}
                onClick={() => handleDelete(rule.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
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
