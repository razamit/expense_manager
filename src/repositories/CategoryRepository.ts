import { prisma } from "@/lib/prisma";
import type { Category } from "@prisma/client";

export class CategoryRepository {
  static async findAll(): Promise<Category[]> {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { transactions: true } } },
    });
  }

  static async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
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
