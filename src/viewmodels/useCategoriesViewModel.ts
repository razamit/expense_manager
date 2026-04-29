"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  BankCategoryMappingCatalogDTO,
  BankCategoryMappingDTO,
  CategoryDTO,
  ObservedBankCategoryDTO,
  CategoryRuleDTO,
} from "@/types";

interface CategoriesState {
  categories: CategoryDTO[];
  rules: CategoryRuleDTO[];
  bankCategoryMappings: BankCategoryMappingDTO[];
  observedBankCategories: ObservedBankCategoryDTO[];
  isLoading: boolean;
}

export function useCategoriesViewModel() {
  const [state, setState] = useState<CategoriesState>({
    categories: [],
    rules: [],
    bankCategoryMappings: [],
    observedBankCategories: [],
    isLoading: true,
  });

  const fetchData = useCallback(async (showLoading: boolean = true) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, isLoading: true }));
    }

    const [catRes, ruleRes, mappingRes] = await Promise.all([
      fetch("/api/categories"),
      fetch("/api/category-rules"),
      fetch("/api/bank-category-mappings?includeObserved=true"),
    ]);
    const categories = await catRes.json();
    const rules = await ruleRes.json();
    const mappingCatalog =
      (await mappingRes.json()) as BankCategoryMappingCatalogDTO;
    setState((prev) => ({
      ...prev,
      categories,
      rules,
      bankCategoryMappings: mappingCatalog.mappings,
      observedBankCategories: mappingCatalog.observedBankCategories,
      isLoading: false,
    }));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addCategory(data: {
    name: string;
    icon?: string;
    color?: string;
    parentId?: string | null;
  }) {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await assertOk(response);
    await fetchData(false);
  }

  async function updateCategory(
    id: string,
    data: { name?: string; icon?: string; color?: string; parentId?: string | null }
  ) {
    const response = await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    await assertOk(response);
    await fetchData(false);
  }

  async function removeCategory(id: string) {
    const response = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    await assertOk(response);
    await fetchData(false);
  }

  async function addRule(data: {
    categoryId: string;
    matchPattern: string;
    matchField?: string;
    isRegex?: boolean;
    priority?: number;
  }) {
    const response = await fetch("/api/category-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await assertOk(response);
    await fetchData(false);
  }

  async function updateRule(
    id: string,
    data: Partial<CategoryRuleDTO>
  ) {
    const response = await fetch("/api/category-rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    await assertOk(response);
    await fetchData(false);
  }

  async function removeRule(id: string) {
    const response = await fetch(`/api/category-rules?id=${id}`, { method: "DELETE" });
    await assertOk(response);
    await fetchData(false);
  }

  async function removeAllRules() {
    const response = await fetch("/api/category-rules?all=true", {
      method: "DELETE",
    });
    await assertOk(response);
    await fetchData(false);
  }

  async function addBankCategoryMapping(data: {
    bankCategory: string;
    categoryId: string;
  }) {
    const response = await fetch("/api/bank-category-mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await assertOk(response);
    await fetchData(false);
  }

  async function removeBankCategoryMapping(id: string) {
    const response = await fetch(`/api/bank-category-mappings?id=${id}`, {
      method: "DELETE",
    });
    await assertOk(response);
    await fetchData(false);
  }

  return {
    ...state,
    addCategory,
    updateCategory,
    removeCategory,
    addRule,
    updateRule,
    removeRule,
    removeAllRules,
    addBankCategoryMapping,
    removeBankCategoryMapping,
    refresh: fetchData,
  };
}

async function assertOk(response: Response) {
  if (response.ok) {
    return;
  }

  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  throw new Error(data?.error ?? "Request failed");
}
