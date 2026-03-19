import { prisma } from "@/lib/prisma";
import type { Transaction, Prisma } from "@prisma/client";
import type { TransactionFilters } from "@/types";

type UpsertData = {
  accountId: string;
  externalId: string | null;
  date: Date;
  processedDate: Date | null;
  originalAmount: number;
  originalCurrency: string;
  chargedAmount: number;
  chargedCurrency: string;
  description: string;
  memo: string | null;
  bankCategory: string | null;
  rawTransaction: string | null;
  transactionType: string;
  installmentNumber: number | null;
  installmentTotal: number | null;
  status: string;
  direction: string;
  scrapeRunId: string;
};

export class TransactionRepository {
  static async findWithFilters(filters: TransactionFilters) {
    const where: Prisma.TransactionWhereInput = {};
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 50;

    if (filters.startDate) {
      where.date = { ...((where.date as object) ?? {}), gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      where.date = { ...((where.date as object) ?? {}), lte: new Date(filters.endDate) };
    }
    if (filters.accountId) where.accountId = filters.accountId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.direction) where.direction = filters.direction;
    if (filters.status) where.status = filters.status;
    if (filters.uncategorizedOnly) where.categoryId = null;
    if (filters.excludeExcluded) where.isExcluded = false;
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search } },
        { memo: { contains: filters.search } },
      ];
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, color: true } },
          account: { select: { displayName: true } },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transactions, total, page, pageSize };
  }

  static async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: { category: true, account: true },
    });
  }

  static async upsertFromScrape(
    data: UpsertData
  ): Promise<{ transaction: Transaction; isNew: boolean }> {
    const existing = await this.findExistingTransaction(data);

    if (existing) {
      const updated = await this.updateExistingTransaction(existing, data);
      return { transaction: updated, isNew: false };
    }

    const created = await prisma.transaction.create({ data });
    return { transaction: created, isNew: true };
  }

  private static async findExistingTransaction(
    data: UpsertData
  ): Promise<Transaction | null> {
    if (data.externalId) {
      const byExternalId = await prisma.transaction.findFirst({
        where: {
          accountId: data.accountId,
          externalId: data.externalId,
          date: data.date,
        },
      });
      if (byExternalId) return byExternalId;
    }

    return prisma.transaction.findFirst({
      where: {
        accountId: data.accountId,
        date: data.date,
        chargedAmount: data.chargedAmount,
        description: data.description,
      },
    });
  }

  private static async updateExistingTransaction(
    existing: Transaction,
    data: UpsertData
  ): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        processedDate: data.processedDate,
        scrapeRunId: data.scrapeRunId,
        externalId: data.externalId ?? existing.externalId,
      },
    });
  }

  static async updateCategory(
    id: string,
    categoryId: string | null,
    byRule: boolean = false
  ): Promise<Transaction> {
    return prisma.transaction.update({
      where: { id },
      data: { categoryId, isCategorizedByRule: byRule },
    });
  }

  static async countUncategorized(): Promise<number> {
    return prisma.transaction.count({
      where: { categoryId: null, chargedAmount: { lt: 0 }, isExcluded: false },
    });
  }

  static async findRecent(limit: number = 10) {
    return prisma.transaction.findMany({
      include: {
        category: { select: { id: true, name: true, color: true } },
        account: { select: { displayName: true } },
      },
      orderBy: { date: "desc" },
      take: limit,
    });
  }

  static async aggregateByCategory(startDate: Date, endDate: Date) {
    return prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        date: { gte: startDate, lte: endDate },
        chargedAmount: { lt: 0 },
        isExcluded: false,
      },
      _sum: { chargedAmount: true },
      _count: true,
    });
  }

  static async aggregateMonthly(startDate: Date, endDate: Date) {
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate }, isExcluded: false },
      select: { date: true, chargedAmount: true },
    });

    const monthlyMap = new Map<string, { income: number; expense: number }>();
    for (const txn of transactions) {
      const key = `${txn.date.getFullYear()}-${String(txn.date.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key) ?? { income: 0, expense: 0 };
      if (txn.chargedAmount > 0) {
        entry.income += txn.chargedAmount;
      } else {
        entry.expense += Math.abs(txn.chargedAmount);
      }
      monthlyMap.set(key, entry);
    }

    return Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }));
  }

  static async findByCategoryInRange(
    categoryId: string,
    startDate: Date,
    endDate: Date
  ) {
    return prisma.transaction.findMany({
      where: {
        categoryId,
        date: { gte: startDate, lte: endDate },
        chargedAmount: { lt: 0 },
        isExcluded: false,
      },
    });
  }

  static async toggleExcluded(id: string): Promise<boolean> {
    const txn = await prisma.transaction.findUnique({
      where: { id },
      select: { isExcluded: true },
    });
    if (!txn) throw new Error(`Transaction ${id} not found`);

    const updated = await prisma.transaction.update({
      where: { id },
      data: { isExcluded: !txn.isExcluded },
    });
    return updated.isExcluded;
  }
}
