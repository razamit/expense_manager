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

  function handleAddCategory() {
    if (!newCategoryName) return;
    vm.addCategory({ name: newCategoryName, color: newCategoryColor });
    setNewCategoryName("");
    setShowAddDialog(false);
  }

  function handleEditCategory() {
    if (!editCategory || !newCategoryName) return;
    vm.updateCategory(editCategory.id, {
      name: newCategoryName,
      color: newCategoryColor,
    });
    setEditCategory(null);
    setNewCategoryName("");
  }

  function openEditDialog(category: CategoryDTO) {
    setEditCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color ?? "#737373");
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
              <Button size="sm" onClick={() => {
                setNewCategoryColor(randomCategoryColor());
                setShowAddDialog(true);
              }}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={vm.categories}
                onEdit={openEditDialog}
                onDelete={(id) => vm.removeCategory(id)}
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
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={showAddDialog || editCategory !== null}
        onOpenChange={(v) => {
          if (!v) {
            setShowAddDialog(false);
            setEditCategory(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editCategory ? handleEditCategory : handleAddCategory}
            >
              {editCategory ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
