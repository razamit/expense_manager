"use client";

import { useState, useEffect, useCallback } from "react";
import type { CategoryDTO, CategoryRuleDTO } from "@/types";

interface CategoriesState {
  categories: CategoryDTO[];
  rules: CategoryRuleDTO[];
  isLoading: boolean;
}

export function useCategoriesViewModel() {
  const [state, setState] = useState<CategoriesState>({
    categories: [],
    rules: [],
    isLoading: true,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    const [catRes, ruleRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/category-rules"),
    ]);
    const categories = await catRes.json();
    const rules = await ruleRes.json();
    setState({ categories, rules, isLoading: false });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addCategory(data: {
    name: string;
    icon?: string;
    color?: string;
  }) {
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchData();
  }

  async function updateCategory(
    id: string,
    data: { name?: string; icon?: string; color?: string }
  ) {
    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    fetchData();
  }

  async function removeCategory(id: string) {
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function addRule(data: {
    categoryId: string;
    matchPattern: string;
    matchField?: string;
    isRegex?: boolean;
    priority?: number;
  }) {
    await fetch("/api/category-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchData();
  }

  async function updateRule(
    id: string,
    data: Partial<CategoryRuleDTO>
  ) {
    await fetch("/api/category-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    fetchData();
  }

  async function removeRule(id: string) {
    await fetch(`/api/category-rules?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  return {
    ...state,
    addCategory,
    updateCategory,
    removeCategory,
    addRule,
    updateRule,
    removeRule,
    refresh: fetchData,
  };
}
