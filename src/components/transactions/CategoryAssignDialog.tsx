"use client";

import { useState } from "react";
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
    rulePattern?: string
  ) => void;
}

export function CategoryAssignDialog({
  open,
  transaction,
  categories,
  onClose,
  onAssign,
}: CategoryAssignDialogProps) {
  const [createRule, setCreateRule] = useState(false);
  const [rulePattern, setRulePattern] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = searchQuery
    ? categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  function handleSelect(categoryId: string) {
    if (!transaction) return;

    onAssign(
      transaction.id,
      categoryId,
      createRule,
      createRule ? rulePattern || transaction.description : undefined
    );

    setCreateRule(false);
    setRulePattern("");
    setSearchQuery("");
    onClose();
  }

  function handleRemove() {
    if (!transaction) return;
    onAssign(transaction.id, null);
    onClose();
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
          {filteredCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              className="flex items-center gap-3 w-full rounded-lg p-2 text-left text-sm hover:bg-muted transition-colors"
            >
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color ?? "#737373" }}
              />
              {cat.name}
            </button>
          ))}
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
        </div>

        <DialogFooter>
          {transaction?.categoryId && (
            <Button variant="outline" onClick={handleRemove}>
              Remove Category
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
