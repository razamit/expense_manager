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
  sortCategoriesByDisplayName,
} from "@/lib/category-hierarchy";
import { Switch } from "@/components/ui/switch";
import { CategoryTreePicker } from "@/components/transactions/CategoryTreePicker";
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

  const rootCategories = sortCategoriesByDisplayName(
    categories.filter((category) => category.parentId === null)
  );

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

  useEffect(() => {
    if (open && transaction) {
      setRulePattern(transaction.description);
    }
  }, [open, transaction?.id]);

  async function handleSelect(category: CategoryDTO) {
    if (!transaction) return;

    setError("");
    setIsSubmitting(true);

    try {
      await onAssign(
        transaction.id,
        category.id,
        createRule,
        createRule ? rulePattern.trim() || transaction.description : undefined,
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
        createRule ? rulePattern.trim() || transaction.description : undefined,
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
      <DialogContent className="w-[96vw] max-w-7xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Category</DialogTitle>
        </DialogHeader>

        {transaction && (
          <div className="mb-4 rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground" dir="auto">
              {transaction.description}
            </p>
            <p>Amount: {transaction.chargedAmount} ILS</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.95fr)]">
          <div className="space-y-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories or paths..."
              autoFocus
            />

            <div className="rounded-xl border bg-muted/10 p-3">
              <CategoryTreePicker
                categories={categories}
                searchQuery={searchQuery}
                disabled={isSubmitting}
                onSelect={handleSelect}
              />
            </div>
          </div>

          <div className="space-y-4">
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

            <div className="rounded-lg border px-4 py-3 space-y-3">
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
                    placeholder="e.g. SPOTIFY"
                  />
                  <p className="text-xs text-muted-foreground">
                    Edit this down to the stable part of the description, like SPOTIFY.
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </div>
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
