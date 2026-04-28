import { prisma } from "@/lib/prisma";
import type { Category, Prisma } from "@prisma/client";

const categoryMetadataInclude = {
  parent: {
    select: {
      id: true,
      name: true,
      parentId: true,
    },
  },
  _count: {
    select: {
      transactions: true,
      children: true,
      rules: true,
    },
  },
} satisfies Prisma.CategoryInclude;

export type CategoryWithMetadata = Prisma.CategoryGetPayload<{
  include: typeof categoryMetadataInclude;
}>;

export class CategoryRepository {
  static async findAll(): Promise<CategoryWithMetadata[]> {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      include: categoryMetadataInclude,
    });
  }

  static async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  }

  static async findByIdWithMetadata(
    id: string
  ): Promise<CategoryWithMetadata | null> {
    return prisma.category.findUnique({
      where: { id },
      include: categoryMetadataInclude,
    });
  }

  static async findByParentId(parentId: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { parentId },
      orderBy: { name: "asc" },
    });
  }

  static async create(data: {
    name: string;
    icon?: string;
    color?: string;
    parentId?: string;
  }): Promise<Category> {
    return prisma.category.create({ data });
  }

  static async update(
    id: string,
    data: Partial<{ name: string; icon: string; color: string; parentId: string }>
  ): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  }

  static async remove(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } });
  }

  static async findWithSpending(startDate: Date, endDate: Date) {
    return prisma.category.findMany({
      include: {
        children: {
          select: { id: true },
        },
        transactions: {
          where: {
            date: { gte: startDate, lte: endDate },
            chargedAmount: { lt: 0 },
            isExcluded: false,
          },
          select: { chargedAmount: true },
        },
        _count: { select: { transactions: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  static async findWithIncome(startDate: Date, endDate: Date) {
    return prisma.category.findMany({
      include: {
        children: {
          select: { id: true },
        },
        transactions: {
          where: {
            date: { gte: startDate, lte: endDate },
            chargedAmount: { gt: 0 },
            isExcluded: false,
          },
          select: { chargedAmount: true },
        },
        _count: { select: { transactions: true } },
      },
      orderBy: { name: "asc" },
    });
  }
}
