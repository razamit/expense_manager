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
  }) => void;
  onDelete: (id: string) => void;
}

export function CategoryRuleEditor({
  rules,
  categories,
  onAdd,
  onDelete,
}: CategoryRuleEditorProps) {
  const [newPattern, setNewPattern] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [isRegex, setIsRegex] = useState(false);

  function handleAdd() {
    if (!newPattern || !newCategoryId) return;
    onAdd({
      categoryId: newCategoryId,
      matchPattern: newPattern,
      isRegex,
    });
    setNewPattern("");
    setNewCategoryId("");
    setIsRegex(false);
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
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isRegex} onCheckedChange={setIsRegex} />
          <Label className="text-xs">Regex</Label>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={!newPattern || !newCategoryId}>
          <Plus className="h-3 w-3" />
          Add
        </Button>
      </div>

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
              <span>{rule.categoryName ?? rule.categoryId}</span>
              {rule.isRegex && (
                <span className="text-xs text-muted-foreground">(regex)</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive h-7 w-7"
              onClick={() => onDelete(rule.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
