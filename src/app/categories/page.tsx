"use client";

import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BankCategoryMappingEditor } from "@/components/categories/BankCategoryMappingEditor";
import { CategoryList } from "@/components/categories/CategoryList";
import { CategoryRuleEditor } from "@/components/categories/CategoryRuleEditor";
import { useCategoriesViewModel } from "@/viewmodels/useCategoriesViewModel";
import type { CategoryDTO, CategoryRuleDTO } from "@/types";

const CATEGORY_PALETTE = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#0d9488",
  "#4f46e5",
  "#7c3aed",
  "#db2777",
];

type CategoryDeleteImpact = {
  totalCategoryCount: number;
  descendantCount: number;
  transactionCount: number;
  ruleCount: number;
  descendantNames: string[];
};

function randomCategoryColor(): string {
  return CATEGORY_PALETTE[Math.floor(Math.random() * CATEGORY_PALETTE.length)];
}

export default function CategoriesPage() {
  const vm = useCategoriesViewModel();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryDTO | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#737373");
  const [selectedParentId, setSelectedParentId] = useState("none");
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<CategoryDTO | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const rootCategories = vm.categories.filter((category) => category.parentId === null);
  const availableParentCategories = rootCategories.filter((category) => {
    if (!editCategory) {
      return true;
    }

    return category.id !== editCategory.id;
  });
  const editCategoryHasChildren = Boolean(
    editCategory && (editCategory.childCount ?? 0) > 0
  );
  const deleteImpact = deleteCategory
    ? buildCategoryDeleteImpact(deleteCategory.id, vm.categories, vm.rules)
    : null;

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      setFormError("Name is required");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await vm.addCategory({
        name,
        color: newCategoryColor,
        parentId: selectedParentId === "none" ? null : selectedParentId,
      });
      closeDialog();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditCategory() {
    if (!editCategory) {
      return;
    }

    const name = newCategoryName.trim();
    if (!name) {
      setFormError("Name is required");
      return;
    }

    if (editCategoryHasChildren && selectedParentId !== "none") {
      setFormError("A category with subcategories must stay a main category.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      await vm.updateCategory(editCategory.id, {
        name,
        color: newCategoryColor,
        parentId: selectedParentId === "none" ? null : selectedParentId,
      });
      closeDialog();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditDialog(category: CategoryDTO) {
    setEditCategory(category);
    setShowAddDialog(false);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color ?? "#737373");
    setSelectedParentId(category.parentId ?? "none");
    setFormError("");
  }

  function openAddDialog() {
    setActionError("");
    setEditCategory(null);
    setShowAddDialog(true);
    setNewCategoryName("");
    setNewCategoryColor(randomCategoryColor());
    setSelectedParentId("none");
    setFormError("");
  }

  function closeDialog() {
    setShowAddDialog(false);
    setEditCategory(null);
    setNewCategoryName("");
    setSelectedParentId("none");
    setFormError("");
    setIsSubmitting(false);
  }

  function openDeleteDialog(category: CategoryDTO) {
    setActionError("");
    setDeleteError("");
    setDeleteCategory(category);
  }

  function closeDeleteDialog() {
    if (isDeletingCategory) {
      return;
    }

    setDeleteCategory(null);
    setDeleteError("");
  }

  async function handleDeleteCategory() {
    if (!deleteCategory) {
      return;
    }

    setActionError("");
    setDeleteError("");
    setIsDeletingCategory(true);

    try {
      await vm.removeCategory(deleteCategory.id);
      setDeleteCategory(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setIsDeletingCategory(false);
    }
  }

  if (vm.isLoading) {
    return (
      <div className="app-page-shell">
        <p className="text-sm text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="app-page-shell">
      <div className="space-y-2">
        <p className="app-eyebrow-label">Classification System</p>
        <div className="space-y-2">
          <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-foreground">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Maintain the category hierarchy, refine bank mapping hints, and manage categorization rules.
          </p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max justify-start gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest p-1">
            <TabsTrigger value="categories" className="min-h-10 rounded-md px-4">
              Categories
            </TabsTrigger>
            <TabsTrigger value="bank-mappings" className="min-h-10 rounded-md px-4">
              Bank Category Mappings
            </TabsTrigger>
            <TabsTrigger value="rules" className="min-h-10 rounded-md px-4">
              Auto-Categorization Rules
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="categories" className="mt-0">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle>Categories</CardTitle>
              <Button size="sm" onClick={openAddDialog}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {actionError && <p className="mb-4 text-sm text-destructive">{actionError}</p>}
              <CategoryList
                categories={vm.categories}
                onEdit={openEditDialog}
                onDelete={openDeleteDialog}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank-mappings" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Bank Category Mappings</CardTitle>
              <p className="text-sm text-muted-foreground">
                These mappings only prefill the category search inside the assign dialog.
              </p>
            </CardHeader>
            <CardContent>
              <BankCategoryMappingEditor
                mappings={vm.bankCategoryMappings}
                observedBankCategories={vm.observedBankCategories}
                categories={vm.categories}
                onAdd={vm.addBankCategoryMapping}
                onDelete={vm.removeBankCategoryMapping}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Categorization Rules</CardTitle>
              <CardDescription>
                Filter existing rules here. Create new rules from the transaction categorization dialog.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryRuleEditor
                rules={vm.rules}
                categories={vm.categories}
                onDelete={vm.removeRule}
                onDeleteAll={vm.removeAllRules}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={showAddDialog || editCategory !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Category name"
              />
            </div>

            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={selectedParentId}
                onValueChange={setSelectedParentId}
                disabled={editCategoryHasChildren}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Main category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Main category</SelectItem>
                  {availableParentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editCategoryHasChildren ? (
                <p className="text-xs text-muted-foreground">
                  This category already has subcategories, so it must stay a main category.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choose a main category to make this a subcategory.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(event) => setNewCategoryColor(event.target.value)}
                  className="h-9 w-9 cursor-pointer rounded border"
                />
                <Input
                  value={newCategoryColor}
                  onChange={(event) => setNewCategoryColor(event.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={editCategory ? handleEditCategory : handleAddCategory}
              disabled={isSubmitting || !newCategoryName.trim()}
            >
              {isSubmitting ? "Saving..." : editCategory ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteCategory !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Delete {deleteCategory ? `"${deleteCategory.name}"` : "category"}?
            </DialogTitle>
            <DialogDescription>
              This permanently removes the selected category and any nested categories.
            </DialogDescription>
          </DialogHeader>

          {deleteCategory && deleteImpact && (
            <div className="space-y-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div className="space-y-2 text-sm">
                    <p>
                      {deleteImpact.totalCategoryCount === 1
                        ? "This category will be deleted."
                        : `This category and ${deleteImpact.descendantCount} subcategor${deleteImpact.descendantCount === 1 ? "y" : "ies"} will be deleted.`}
                    </p>
                    <p>
                      {deleteImpact.transactionCount} transaction
                      {deleteImpact.transactionCount === 1 ? "" : "s"} currently assigned to this category tree will become uncategorized.
                    </p>
                    <p>
                      {deleteImpact.ruleCount} auto-categorization rule
                      {deleteImpact.ruleCount === 1 ? "" : "s"} linked to these categories will be removed.
                    </p>
                    <p>Any budgets tied to these categories will also be deleted.</p>
                    <p className="font-medium text-foreground">This action cannot be undone.</p>
                  </div>
                </div>
              </div>

              {deleteImpact.descendantNames.length > 0 && (
                <div className="rounded-lg border bg-muted/20 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Also deleting
                  </p>
                  <p className="mt-2 text-sm" dir="auto">
                    {deleteImpact.descendantNames.join(", ")}
                  </p>
                </div>
              )}

              {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDeleteDialog}
              disabled={isDeletingCategory}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={isDeletingCategory}
            >
              {isDeletingCategory ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildCategoryDeleteImpact(
  rootCategoryId: string,
  categories: CategoryDTO[],
  rules: CategoryRuleDTO[]
): CategoryDeleteImpact {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const categoryIds = collectCategoryTreeIds(rootCategoryId, categories);
  const categoryIdSet = new Set(categoryIds);
  const descendantNames = categoryIds
    .slice(1)
    .map((categoryId) => categoriesById.get(categoryId)?.name)
    .filter((name): name is string => Boolean(name));

  const transactionCount = categoryIds.reduce(
    (total, categoryId) => total + (categoriesById.get(categoryId)?.transactionCount ?? 0),
    0
  );
  const ruleCount = rules.filter((rule) => categoryIdSet.has(rule.categoryId)).length;

  return {
    totalCategoryCount: categoryIds.length,
    descendantCount: Math.max(categoryIds.length - 1, 0),
    transactionCount,
    ruleCount,
    descendantNames,
  };
}

function collectCategoryTreeIds(
  rootCategoryId: string,
  categories: CategoryDTO[]
): string[] {
  const childrenByParent = categories.reduce<Map<string, string[]>>((map, category) => {
    if (!category.parentId) {
      return map;
    }

    const childIds = map.get(category.parentId) ?? [];
    childIds.push(category.id);
    map.set(category.parentId, childIds);
    return map;
  }, new Map());

  const categoryIds: string[] = [];

  function visit(categoryId: string) {
    categoryIds.push(categoryId);

    for (const childId of childrenByParent.get(categoryId) ?? []) {
      visit(childId);
    }
  }

  visit(rootCategoryId);

  return categoryIds;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}
