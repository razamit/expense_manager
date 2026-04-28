import type { CategoryDTO } from "@/types";
import { CategoryRepository } from "@/repositories/CategoryRepository";

type CategoryMutation = {
  name?: string;
  icon?: string | null;
  color?: string | null;
  parentId?: string | null;
};

export class CategoryHierarchyError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "CategoryHierarchyError";
    this.statusCode = statusCode;
  }
}

export class CategoryHierarchyManager {
  static async listCategories(): Promise<CategoryDTO[]> {
    const categories = await CategoryRepository.findAll();
    return categories.map((category) => this.toDTO(category));
  }

  static async createCategory(data: {
    name: string;
    icon?: string | null;
    color?: string | null;
    parentId?: string | null;
  }): Promise<CategoryDTO> {
    const parentId = this.normalizeParentId(data.parentId);

    await this.validateParentAssignment(null, parentId);

    const created = await CategoryRepository.create({
      name: data.name,
      ...(data.icon !== undefined && { icon: data.icon ?? undefined }),
      ...(data.color !== undefined && { color: data.color ?? undefined }),
      ...(parentId !== undefined && { parentId }),
    });

    const category = await this.requireCategory(created.id);
    return this.toDTO(category);
  }

  static async updateCategory(
    id: string,
    data: CategoryMutation
  ): Promise<CategoryDTO> {
    const currentCategory = await this.requireCategory(id);
    const parentId =
      data.parentId !== undefined
        ? this.normalizeParentId(data.parentId)
        : currentCategory.parentId ?? undefined;

    await this.validateParentAssignment(id, parentId);

    await CategoryRepository.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.icon !== undefined && { icon: data.icon ?? undefined }),
      ...(data.color !== undefined && { color: data.color ?? undefined }),
      ...(data.parentId !== undefined && { parentId }),
    });

    const category = await this.requireCategory(id);
    return this.toDTO(category);
  }

  static async deleteCategory(id: string): Promise<void> {
    await this.requireCategory(id);
    await CategoryRepository.removeTree(id);
  }

  static async assertLeafCategory(categoryId: string): Promise<void> {
    const category = await this.requireCategory(categoryId);
    if (category._count.children > 0) {
      throw new CategoryHierarchyError(
        "Select a subcategory instead of a main category."
      );
    }
  }

  static async resolveFilterCategoryIds(categoryId: string): Promise<string[]> {
    const category = await this.requireCategory(categoryId);
    const children = await CategoryRepository.findByParentId(category.id);

    return [category.id, ...children.map((child) => child.id)];
  }

  private static async validateParentAssignment(
    categoryId: string | null,
    parentId: string | undefined
  ): Promise<void> {
    if (!parentId) {
      return;
    }

    if (categoryId === parentId) {
      throw new CategoryHierarchyError("A category cannot be its own parent.");
    }

    const parent = await this.requireCategory(parentId);
    if (parent.parentId) {
      throw new CategoryHierarchyError(
        "Subcategories cannot have their own subcategories."
      );
    }

    if (parent._count.rules > 0) {
      throw new CategoryHierarchyError(
        "Move or remove rules from this main category before adding subcategories."
      );
    }

    if (!categoryId) {
      return;
    }

    const category = await this.requireCategory(categoryId);
    if (category._count.children > 0 && parentId) {
      throw new CategoryHierarchyError(
        "A category with subcategories cannot become a subcategory."
      );
    }
  }

  private static normalizeParentId(parentId: string | null | undefined) {
    if (!parentId) {
      return undefined;
    }
    return parentId;
  }

  private static async requireCategory(id: string) {
    const category = await CategoryRepository.findByIdWithMetadata(id);
    if (!category) {
      throw new CategoryHierarchyError("Category not found.", 404);
    }
    return category;
  }

  private static toDTO(category: Awaited<ReturnType<typeof CategoryRepository.findAll>>[number]): CategoryDTO {
    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      parentId: category.parentId,
      parentName: category.parent?.name ?? null,
      isSystem: category.isSystem,
      transactionCount: category._count.transactions,
      childCount: category._count.children,
      isLeaf: category._count.children === 0,
    };
  }
}