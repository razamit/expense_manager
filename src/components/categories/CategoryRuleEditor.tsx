"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import type { CategoryDTO, CategoryRuleDTO } from "@/types";

interface CategoryRuleEditorProps {
  rules: CategoryRuleDTO[];
  categories: CategoryDTO[];
  onAdd: (data: {
    categoryId: string;
    matchPattern: string;
    matchField?: string;
    isRegex?: boolean;
    priority?: number;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void> | void;
  onDeleteAll: () => Promise<void> | void;
}

export function CategoryRuleEditor({
  rules,
  categories,
  onAdd,
  onDelete,
  onDeleteAll,
}: CategoryRuleEditorProps) {
  const [newPattern, setNewPattern] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [isRegex, setIsRegex] = useState(false);
  const [error, setError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const leafCategories = sortCategoriesByDisplayName(getLeafCategories(categories));
  const categoryLabelById = new Map(
    categories.map((category) => [category.id, getCategoryDisplayName(category)])
  );

  async function handleAdd() {
    if (!newPattern || !newCategoryId) return;

    setError("");

    try {
      await onAdd({
        categoryId: newCategoryId,
        matchPattern: newPattern,
        isRegex,
      });
      setNewPattern("");
      setNewCategoryId("");
      setIsRegex(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

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
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-xs">Pattern</Label>
          <Input
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            placeholder="e.g. שופרסל or regex"
          />
        </div>
        <div className="space-y-1 w-[180px]">
          <Label className="text-xs">Category</Label>
          <Select value={newCategoryId} onValueChange={setNewCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {leafCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {getCategoryDisplayName(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isRegex} onCheckedChange={setIsRegex} />
          <Label className="text-xs">Regex</Label>
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newPattern || !newCategoryId || isDeletingAll}
        >
          <Plus className="h-3 w-3" />
          Add
        </Button>
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
        {rules.map((rule) => (
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
        ))}
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
