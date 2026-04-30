import { TransactionRepository } from "@/repositories/TransactionRepository";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { prisma } from "@/lib/prisma";
import {
  getMonthKey,
  getMonthRange,
  getShortMonthLabel,
  getYearRange,
} from "@/lib/date-utils";
import { CategoryHierarchyManager } from "@/managers/CategoryHierarchyManager";
import type {
  CategoryYearlySummary,
  CategoryYearlyTrend,
  CategoryYearlyTrendPoint,
  SpendingByCategory,
  IncomeExpenseTrend,
  BudgetDTO,
  StatisticsYearlyOverview,
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

  static async getIncomeExpenseTrendForYear(
    year: number
  ): Promise<IncomeExpenseTrend[]> {
    const { startDate, endDate } = getYearRange(year);
    const trend = await TransactionRepository.aggregateMonthly(startDate, endDate);
    return fillMissingTrendMonths(year, trend);
  }

  static async getYearlyOverview(
    year: number
  ): Promise<StatisticsYearlyOverview> {
    const { startDate, endDate } = getYearRange(year);

    const [spending, income, trend] = await Promise.all([
      this.getSpendingByDateRange(startDate, endDate),
      this.getIncomeByDateRange(startDate, endDate),
      this.getIncomeExpenseTrendForYear(year),
    ]);

    return {
      year,
      spending,
      income,
      trend,
    };
  }

  static async getCategoryYearlyTrend(
    year: number,
    categoryId: string
  ): Promise<CategoryYearlyTrend> {
    const [category, childCategories, categoryIds] = await Promise.all([
      CategoryRepository.findById(categoryId),
      CategoryRepository.findByParentId(categoryId),
      CategoryHierarchyManager.resolveFilterCategoryIds(categoryId),
    ]);

    if (!category) {
      throw new Error("Category not found.");
    }

    const { startDate, endDate } = getYearRange(year);
    const transactions = await prisma.transaction.findMany({
      where: {
        categoryId: { in: categoryIds },
        date: { gte: startDate, lte: endDate },
        isExcluded: false,
      },
      select: {
        categoryId: true,
        date: true,
        chargedAmount: true,
      },
    });

    const months = buildCategoryYearlyMonths(year, transactions);
    const childSummaries = summarizeChildCategories(childCategories, transactions);

    return {
      year,
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color ?? "#737373",
      totalIncome: months.reduce((sum, month) => sum + month.income, 0),
      totalExpense: months.reduce((sum, month) => sum + month.expense, 0),
      net: months.reduce((sum, month) => sum + month.net, 0),
      transactionCount: months.reduce(
        (sum, month) => sum + month.transactionCount,
        0
      ),
      months,
      childCategories: childSummaries,
    };
  }

  static async getLeafCategoryYearlyTrends(
    year: number
  ): Promise<CategoryYearlyTrend[]> {
    const { startDate, endDate } = getYearRange(year);
    const categories = await prisma.category.findMany({
      include: {
        children: { select: { id: true } },
        transactions: {
          where: {
            date: { gte: startDate, lte: endDate },
            isExcluded: false,
          },
          select: {
            categoryId: true,
            date: true,
            chargedAmount: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return categories
      .filter((category) => category.children.length === 0)
      .map((category) => {
        const months = buildCategoryYearlyMonths(year, category.transactions);

        return {
          year,
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color ?? "#737373",
          totalIncome: months.reduce((sum, month) => sum + month.income, 0),
          totalExpense: months.reduce((sum, month) => sum + month.expense, 0),
          net: months.reduce((sum, month) => sum + month.net, 0),
          transactionCount: months.reduce(
            (sum, month) => sum + month.transactionCount,
            0
          ),
          months,
          childCategories: [],
        } satisfies CategoryYearlyTrend;
      });
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
      const directSummary = createCategorySummary(category, amountForTransaction);
      const childSummaries = (childrenByParent.get(category.id) ?? [])
        .map((childCategory) =>
          createCategorySummary(childCategory, amountForTransaction)
        )
        .filter((summary) => summary.totalAmount > 0)
        .sort((left, right) => right.totalAmount - left.totalAmount);

      const childAmountTotal = childSummaries.reduce(
        (sum, summary) => sum + summary.totalAmount,
        0
      );
      const childTransactionTotal = childSummaries.reduce(
        (sum, summary) => sum + summary.transactionCount,
        0
      );
      const totalAmount = directSummary.totalAmount + childAmountTotal;
      const transactionCount =
        directSummary.transactionCount + childTransactionTotal;

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color ?? "#737373",
        totalAmount,
        transactionCount,
        percentOfTotal: 0,
        childCategories: childSummaries,
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
    childCategories: summary.childCategories.map((childCategory) => ({
      ...childCategory,
      percentOfTotal:
        summary.totalAmount > 0
          ? (childCategory.totalAmount / summary.totalAmount) * 100
          : 0,
    })),
  }));
}

function createCategorySummary(
  category: CategoryRollupSource,
  amountForTransaction: (transaction: { chargedAmount: number }) => number
): SpendingByCategory {
  const totalAmount = category.transactions.reduce(
    (sum, transaction) => sum + amountForTransaction(transaction),
    0
  );

  return {
    categoryId: category.id,
    categoryName: category.name,
    categoryColor: category.color ?? "#737373",
    totalAmount,
    transactionCount: category.transactions.length,
    percentOfTotal: 0,
    childCategories: [],
  };
}

function fillMissingTrendMonths(
  year: number,
  trend: IncomeExpenseTrend[]
): IncomeExpenseTrend[] {
  const trendByMonth = new Map(trend.map((entry) => [entry.month, entry]));

  return Array.from({ length: 12 }, (_, month) => {
    const monthKey = getMonthKey(year, month);
    return (
      trendByMonth.get(monthKey) ?? {
        month: monthKey,
        income: 0,
        expense: 0,
        net: 0,
      }
    );
  });
}

type CategoryTrendTransaction = {
  categoryId: string | null;
  date: Date;
  chargedAmount: number;
};

function buildCategoryYearlyMonths(
  year: number,
  transactions: CategoryTrendTransaction[]
): CategoryYearlyTrendPoint[] {
  const months = createEmptyCategoryYearlyMonths(year);

  for (const transaction of transactions) {
    const month = months[transaction.date.getMonth()];
    month.transactionCount += 1;

    if (transaction.chargedAmount > 0) {
      month.income += transaction.chargedAmount;
    } else {
      month.expense += Math.abs(transaction.chargedAmount);
    }

    month.net = month.income - month.expense;
  }

  return months;
}

function createEmptyCategoryYearlyMonths(year: number): CategoryYearlyTrendPoint[] {
  return Array.from({ length: 12 }, (_, month) => ({
    month: getMonthKey(year, month),
    label: getShortMonthLabel(year, month),
    income: 0,
    expense: 0,
    net: 0,
    transactionCount: 0,
  }));
}

function summarizeChildCategories(
  childCategories: Array<{ id: string; name: string; color: string | null }>,
  transactions: CategoryTrendTransaction[]
): CategoryYearlySummary[] {
  const summaries = new Map(
    childCategories.map((category) => [
      category.id,
      {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color ?? "#737373",
        totalIncome: 0,
        totalExpense: 0,
        net: 0,
        transactionCount: 0,
      } satisfies CategoryYearlySummary,
    ])
  );

  for (const transaction of transactions) {
    if (!transaction.categoryId) {
      continue;
    }

    const summary = summaries.get(transaction.categoryId);
    if (!summary) {
      continue;
    }

    summary.transactionCount += 1;
    if (transaction.chargedAmount > 0) {
      summary.totalIncome += transaction.chargedAmount;
    } else {
      summary.totalExpense += Math.abs(transaction.chargedAmount);
    }

    summary.net = summary.totalIncome - summary.totalExpense;
  }

  return Array.from(summaries.values())
    .filter((summary) => summary.transactionCount > 0)
    .sort(
      (left, right) =>
        right.totalIncome + right.totalExpense - (left.totalIncome + left.totalExpense)
    );
}
