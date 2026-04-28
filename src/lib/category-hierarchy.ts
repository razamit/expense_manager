import type { CategoryDTO } from "@/types";

export function isLeafCategory(
  category: CategoryDTO,
  categories: CategoryDTO[]
): boolean {
  if (category.isLeaf !== undefined) {
    return category.isLeaf;
  }

  return !categories.some((candidate) => candidate.parentId === category.id);
}

export function getLeafCategories(categories: CategoryDTO[]): CategoryDTO[] {
  return categories.filter((category) => isLeafCategory(category, categories));
}

export function getCategoryDisplayName(category: CategoryDTO): string {
  if (!category.parentName) {
    return category.name;
  }

  return `${category.parentName} / ${category.name}`;
}

export function sortCategoriesByDisplayName(
  categories: CategoryDTO[]
): CategoryDTO[] {
  return [...categories].sort((left, right) =>
    getCategoryDisplayName(left).localeCompare(getCategoryDisplayName(right))
  );
}