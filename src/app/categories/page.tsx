"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryList } from "@/components/categories/CategoryList";
import { CategoryRuleEditor } from "@/components/categories/CategoryRuleEditor";
import { useCategoriesViewModel } from "@/viewmodels/useCategoriesViewModel";
import type { CategoryDTO } from "@/types";

const CATEGORY_PALETTE = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  "#f43f5e", "#0d9488", "#4f46e5", "#7c3aed", "#db2777",
];

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

  const rootCategories = vm.categories.filter((category) => category.parentId === null);
  const availableParentCategories = rootCategories.filter((category) => {
    if (!editCategory) {
      return true;
    }

    return category.id !== editCategory.id;
  });
  const editCategoryHasChildren = Boolean(editCategory && (editCategory.childCount ?? 0) > 0);

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

  async function handleDeleteCategory(id: string) {
    setActionError("");

    try {
      await vm.removeCategory(id);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  }

  if (vm.isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="rules">Auto-Categorization Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
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
                onDelete={handleDeleteCategory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Categorization Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryRuleEditor
                rules={vm.rules}
                categories={vm.categories}
                onAdd={vm.addRule}
                onDelete={vm.removeRule}
                onDeleteAll={vm.removeAllRules}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={showAddDialog || editCategory !== null}
        onOpenChange={(v) => {
          if (!v) {
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
                onChange={(e) => setNewCategoryName(e.target.value)}
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
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="h-9 w-9 rounded border cursor-pointer"
                />
                <Input
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
            >
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
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}
