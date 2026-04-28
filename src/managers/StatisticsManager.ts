import { TransactionRepository } from "@/repositories/TransactionRepository";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { prisma } from "@/lib/prisma";
import { getMonthRange } from "@/lib/date-utils";
import { CategoryHierarchyManager } from "@/managers/CategoryHierarchyManager";
import type {
  SpendingByCategory,
  IncomeExpenseTrend,
  BudgetDTO,
} from "@/types";

export class StatisticsManager {
  static async getSpendingByCategory(
    year: number,
    month: number
  ): Promise<SpendingByCategory[]> {
    const { startDate, endDate } = getMonthRange(year, month);
    return this.getSpendingByDateRange(startDate, endDate);
  }

  static async getIncomeByCategory(
    year: number,
    month: number
  ): Promise<SpendingByCategory[]> {
    const { startDate, endDate } = getMonthRange(year, month);
    return this.getIncomeByDateRange(startDate, endDate);
  }

  static async getSpendingByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<SpendingByCategory[]> {
    const categories = await CategoryRepository.findWithSpending(startDate, endDate);
    return buildCategoryRollups(categories, (txn) => Math.abs(txn.chargedAmount));
  }

  static async getIncomeByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<SpendingByCategory[]> {
    const categories = await CategoryRepository.findWithIncome(startDate, endDate);
    return buildCategoryRollups(categories, (txn) => txn.chargedAmount);
  }

  static async getIncomeExpenseTrend(
    months: number = 6
  ): Promise<IncomeExpenseTrend[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    return TransactionRepository.aggregateMonthly(startDate, endDate);
  }

  static async getMonthlyTotals(year: number, month: number) {
    const { startDate, endDate } = getMonthRange(year, month);

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate }, isExcluded: false },
      select: { chargedAmount: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;

    for (const txn of transactions) {
      if (txn.chargedAmount > 0) {
        totalIncome += txn.chargedAmount;
      } else {
        totalExpense += Math.abs(txn.chargedAmount);
      }
    }

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    };
  }

  static async getBudgetProgress(
    year: number,
    month: number
  ): Promise<BudgetDTO[]> {
    const { startDate, endDate } = getMonthRange(year, month);

    const budgets = await prisma.budget.findMany({
      include: { category: true },
    });

    return Promise.all(
      budgets.map(async (budget) => {
        const categoryIds = await CategoryHierarchyManager.resolveFilterCategoryIds(
          budget.categoryId
        );
        const spending = await prisma.transaction.aggregate({
          where: {
            categoryId: { in: categoryIds },
            date: { gte: startDate, lte: endDate },
            chargedAmount: { lt: 0 },
            isExcluded: false,
          },
          _sum: { chargedAmount: true },
        });

        const currentSpent = Math.abs(spending._sum.chargedAmount ?? 0);

        return {
          id: budget.id,
          categoryId: budget.categoryId,
          categoryName: budget.category.name,
          categoryColor: budget.category.color ?? "#737373",
          monthlyLimit: budget.monthlyLimit,
          currentSpent,
          percentUsed:
            budget.monthlyLimit > 0
              ? (currentSpent / budget.monthlyLimit) * 100
              : 0,
        };
      })
    );
  }
}

type CategoryRollupSource = Awaited<
  ReturnType<typeof CategoryRepository.findWithSpending>
>[number];

function buildCategoryRollups(
  categories: CategoryRollupSource[],
  amountForTransaction: (transaction: { chargedAmount: number }) => number
): SpendingByCategory[] {
  const childrenByParent = categories.reduce<Map<string, CategoryRollupSource[]>>(
    (map, category) => {
      if (!category.parentId) {
        return map;
      }

      const children = map.get(category.parentId) ?? [];
      children.push(category);
      map.set(category.parentId, children);
      return map;
    },
    new Map()
  );

  const summaries = categories
    .filter((category) => category.parentId === null)
    .map((category) => {
      const descendants = childrenByParent.get(category.id) ?? [];
      const transactions = [category, ...descendants].flatMap(
        (entry) => entry.transactions
      );
      const totalAmount = transactions.reduce(
        (sum, transaction) => sum + amountForTransaction(transaction),
        0
      );

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color ?? "#737373",
        totalAmount,
        transactionCount: transactions.length,
      };
    })
    .filter((summary) => summary.totalAmount > 0)
    .sort((left, right) => right.totalAmount - left.totalAmount);

  const totalAmount = summaries.reduce(
    (sum, category) => sum + category.totalAmount,
    0
  );

  return summaries.map((summary) => ({
    ...summary,
    percentOfTotal: totalAmount > 0 ? (summary.totalAmount / totalAmount) * 100 : 0,
  }));
}
