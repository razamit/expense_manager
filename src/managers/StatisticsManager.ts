import { TransactionRepository } from "@/repositories/TransactionRepository";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { prisma } from "@/lib/prisma";
import { getMonthRange } from "@/lib/date-utils";
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
    const categories = await CategoryRepository.findWithSpending(startDate, endDate);

    const totalExpense = categories.reduce(
      (sum, cat) =>
        sum +
        cat.transactions.reduce(
          (s, t) => s + Math.abs(t.chargedAmount),
          0
        ),
      0
    );

    return categories
      .map((cat) => {
        const totalAmount = cat.transactions.reduce(
          (s, t) => s + Math.abs(t.chargedAmount),
          0
        );
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color ?? "#737373",
          totalAmount,
          transactionCount: cat.transactions.length,
          percentOfTotal: totalExpense > 0 ? (totalAmount / totalExpense) * 100 : 0,
        };
      })
      .filter((c) => c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  static async getIncomeByCategory(
    year: number,
    month: number
  ): Promise<SpendingByCategory[]> {
    const { startDate, endDate } = getMonthRange(year, month);
    const categories = await CategoryRepository.findWithIncome(startDate, endDate);

    const totalIncome = categories.reduce(
      (sum, cat) =>
        sum + cat.transactions.reduce((s, t) => s + t.chargedAmount, 0),
      0
    );

    return categories
      .map((cat) => {
        const totalAmount = cat.transactions.reduce(
          (s, t) => s + t.chargedAmount,
          0
        );
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          categoryColor: cat.color ?? "#737373",
          totalAmount,
          transactionCount: cat.transactions.length,
          percentOfTotal: totalIncome > 0 ? (totalAmount / totalIncome) * 100 : 0,
        };
      })
      .filter((c) => c.totalAmount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);
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
      include: {
        category: {
          include: {
            transactions: {
              where: {
                date: { gte: startDate, lte: endDate },
                chargedAmount: { lt: 0 },
                isExcluded: false,
              },
              select: { chargedAmount: true },
            },
          },
        },
      },
    });

    return budgets.map((budget) => {
      const currentSpent = budget.category.transactions.reduce(
        (sum, t) => sum + Math.abs(t.chargedAmount),
        0
      );
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
    });
  }
}
