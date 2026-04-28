"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { TransactionDTO, CategoryDTO } from "@/types";

interface CategoryAssignDialogProps {
  open: boolean;
  transaction: TransactionDTO | null;
  categories: CategoryDTO[];
  onClose: () => void;
  onAssign: (
    transactionId: string,
    categoryId: string | null,
    createRule?: boolean,
    rulePattern?: string,
    category?: CategoryDTO
  ) => Promise<void>;
  onCreateCategory: (data: {
    name: string;
    parentId?: string | null;
    color?: string;
  }) => Promise<CategoryDTO>;
}

export function CategoryAssignDialog({
  open,
  transaction,
  categories,
  onClose,
  onAssign,
  onCreateCategory,
}: CategoryAssignDialogProps) {
  const [createRule, setCreateRule] = useState(false);
  const [rulePattern, setRulePattern] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState("none");

  const assignableCategories = sortCategoriesByDisplayName(getLeafCategories(categories));
  const rootCategories = sortCategoriesByDisplayName(
    categories.filter((category) => category.parentId === null)
  );

  const filteredCategories = searchQuery
    ? assignableCategories.filter((cat) =>
        getCategoryDisplayName(cat).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : assignableCategories;

  function resetDialogState() {
    setCreateRule(false);
    setRulePattern("");
    setSearchQuery("");
    setError("");
    setShowCreateForm(false);
    setNewCategoryName("");
    setNewCategoryParentId("none");
  }

  useEffect(() => {
    if (!open) {
      resetDialogState();
    }
  }, [open]);

  async function handleSelect(categoryId: string) {
    if (!transaction) return;

    setError("");
    setIsSubmitting(true);

    try {
      await onAssign(
        transaction.id,
        categoryId,
        createRule,
        createRule ? rulePattern || transaction.description : undefined
      );

      resetDialogState();
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove() {
    if (!transaction) return;

    setError("");
    setIsSubmitting(true);

    try {
      await onAssign(transaction.id, null);
      resetDialogState();
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateCategory() {
    if (!transaction) {
      return;
    }

    const name = newCategoryName.trim();
    if (!name) {
      setError("Category name is required");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const category = await onCreateCategory({
        name,
        parentId: newCategoryParentId === "none" ? null : newCategoryParentId,
        color: "#737373",
      });

      await onAssign(
        transaction.id,
        category.id,
        createRule,
        createRule ? rulePattern || transaction.description : undefined,
        category
      );

      resetDialogState();
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Category</DialogTitle>
        </DialogHeader>

        {transaction && (
          <div className="text-sm text-muted-foreground mb-4">
            <p className="font-medium text-foreground" dir="auto">
              {transaction.description}
            </p>
            <p>Amount: {transaction.chargedAmount} ILS</p>
          </div>
        )}

        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          autoFocus
        />

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filteredCategories.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              No subcategories match your search.
            </p>
          )}
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              disabled={isSubmitting}
              onClick={() => handleSelect(cat.id)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color ?? "#737373" }}
              />
              {getCategoryDisplayName(cat)}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-dashed px-4 py-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Create category here</p>
              <p className="text-xs text-muted-foreground">
                Add a category without leaving this transaction.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setShowCreateForm((current) => !current)}
            >
              <Plus className="h-3 w-3" />
              {showCreateForm ? "Hide" : "New Category"}
            </Button>
          </div>

          {showCreateForm && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="new-category-name">Category name</Label>
                <Input
                  id="new-category-name"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="e.g. Gas"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1">
                <Label>Parent category</Label>
                <Select
                  value={newCategoryParentId}
                  onValueChange={setNewCategoryParentId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Main category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No parent</SelectItem>
                    {rootCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pick a main category to create a subcategory.
                </p>
              </div>

              <Button
                type="button"
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Creating..." : "Create and Assign"}
              </Button>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={createRule}
              onCheckedChange={setCreateRule}
            />
            <Label>Create auto-categorization rule</Label>
          </div>
          {createRule && (
            <div className="space-y-2">
              <Label>Match pattern</Label>
              <Input
                value={rulePattern}
                onChange={(e) => setRulePattern(e.target.value)}
                placeholder={transaction?.description ?? "Pattern..."}
              />
              <p className="text-xs text-muted-foreground">
                Future transactions matching this pattern will be auto-categorized.
              </p>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          {transaction?.categoryId && (
            <Button variant="outline" onClick={handleRemove} disabled={isSubmitting}>
              Remove Category
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}
