import { prisma } from "@/lib/prisma";
import type { CategoryRule } from "@prisma/client";

export class CategoryRuleRepository {
  static async findAll(): Promise<CategoryRule[]> {
    return prisma.categoryRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      include: { category: { select: { name: true } } },
    });
  }

  static async findById(id: string): Promise<CategoryRule | null> {
    return prisma.categoryRule.findUnique({ where: { id } });
  }

  static async create(data: {
    categoryId: string;
    matchField?: string;
    matchPattern: string;
    isRegex?: boolean;
    priority?: number;
  }): Promise<CategoryRule> {
    return prisma.categoryRule.create({ data });
  }

  static async update(
    id: string,
    data: Partial<{
      categoryId: string;
      matchField: string;
      matchPattern: string;
      isRegex: boolean;
      priority: number;
    }>
  ): Promise<CategoryRule> {
    return prisma.categoryRule.update({ where: { id }, data });
  }

  static async remove(id: string): Promise<void> {
    await prisma.categoryRule.delete({ where: { id } });
  }

  static async findAllOrderedByPriority() {
    return prisma.categoryRule.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });
  }
}
