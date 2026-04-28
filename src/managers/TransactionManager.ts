import { TransactionRepository } from "@/repositories/TransactionRepository";
import { getCategoryDisplayName } from "@/lib/category-hierarchy";
import type { TransactionDTO, TransactionFilters } from "@/types";
import { prisma } from "@/lib/prisma";
import { CategoryHierarchyManager } from "@/managers/CategoryHierarchyManager";

function mapCategoryName(
  category:
    | {
        name: string;
        parent?: { name: string } | null;
      }
    | null
    | undefined
): string | undefined {
  if (!category) {
    return undefined;
  }

  return getCategoryDisplayName({
    id: "",
    name: category.name,
    icon: null,
    color: null,
    parentId: null,
    parentName: category.parent?.name ?? null,
    isSystem: false,
  });
}

export class TransactionManager {
  static async getTransactions(filters: TransactionFilters) {
    const categoryIds =
      filters.categoryId && !filters.uncategorizedOnly
        ? await CategoryHierarchyManager.resolveFilterCategoryIds(filters.categoryId)
        : undefined;

    const result = await TransactionRepository.findWithFilters(filters, categoryIds);

    const transactions: TransactionDTO[] = result.transactions.map((txn) => ({
      id: txn.id,
      accountId: txn.accountId,
      accountName: txn.account.displayName,
      externalId: txn.externalId,
      date: txn.date.toISOString(),
      processedDate: txn.processedDate?.toISOString() ?? null,
      originalAmount: txn.originalAmount,
      originalCurrency: txn.originalCurrency,
      chargedAmount: txn.chargedAmount,
      chargedCurrency: txn.chargedCurrency,
      description: txn.description,
      memo: txn.memo,
      bankCategory: txn.bankCategory,
      rawTransaction: txn.rawTransaction ? JSON.parse(txn.rawTransaction) : null,
      transactionType: txn.transactionType,
      installmentNumber: txn.installmentNumber,
      installmentTotal: txn.installmentTotal,
      status: txn.status,
      direction: txn.direction,
      categoryId: txn.categoryId,
      categoryName: mapCategoryName(txn.category),
      categoryColor: txn.category?.color ?? undefined,
      isCategorizedByRule: txn.isCategorizedByRule,
      isExcluded: txn.isExcluded,
    }));

    return {
      transactions,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  static async assignCategory(
    transactionId: string,
    categoryId: string | null
  ): Promise<void> {
    if (categoryId) {
      await CategoryHierarchyManager.assertLeafCategory(categoryId);
    }

    await TransactionRepository.updateCategory(transactionId, categoryId, false);
  }

  static async getUncategorizedCount(): Promise<number> {
    return TransactionRepository.countUncategorized();
  }

  static async getRecentTransactions(limit: number = 10): Promise<TransactionDTO[]> {
    const transactions = await TransactionRepository.findRecent(limit);

    return transactions.map((txn) => ({
      id: txn.id,
      accountId: txn.accountId,
      accountName: txn.account.displayName,
      externalId: txn.externalId,
      date: txn.date.toISOString(),
      processedDate: txn.processedDate?.toISOString() ?? null,
      originalAmount: txn.originalAmount,
      originalCurrency: txn.originalCurrency,
      chargedAmount: txn.chargedAmount,
      chargedCurrency: txn.chargedCurrency,
      description: txn.description,
      memo: txn.memo,
      bankCategory: txn.bankCategory,
      rawTransaction: txn.rawTransaction ? JSON.parse(txn.rawTransaction) : null,
      transactionType: txn.transactionType,
      installmentNumber: txn.installmentNumber,
      installmentTotal: txn.installmentTotal,
      status: txn.status,
      direction: txn.direction,
      categoryId: txn.categoryId,
      categoryName: mapCategoryName(txn.category),
      categoryColor: txn.category?.color ?? undefined,
      isCategorizedByRule: txn.isCategorizedByRule,
      isExcluded: txn.isExcluded,
    }));
  }

  static async toggleExcluded(transactionId: string): Promise<boolean> {
    return TransactionRepository.toggleExcluded(transactionId);
  }

  static async exportCSV(filters: TransactionFilters): Promise<string> {
    const allFilters = { ...filters, page: 1, pageSize: 100000 };
    const categoryIds =
      allFilters.categoryId && !allFilters.uncategorizedOnly
        ? await CategoryHierarchyManager.resolveFilterCategoryIds(allFilters.categoryId)
        : undefined;

    const result = await TransactionRepository.findWithFilters(
      allFilters,
      categoryIds
    );

    const headers = [
      "Date", "Description", "Amount", "Currency", "Direction",
      "Category", "Account", "Status", "Type",
    ];

    const rows = result.transactions.map((txn) => [
      txn.date.toISOString().split("T")[0],
      `"${txn.description.replace(/"/g, '""')}"`,
      txn.chargedAmount.toString(),
      txn.originalCurrency,
      txn.direction,
      mapCategoryName(txn.category) ?? "",
      txn.account.displayName,
      txn.status,
      txn.transactionType,
    ]);

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  }

  static async bulkCategorize(
    transactionIds: string[],
    categoryId: string
  ): Promise<number> {
    await CategoryHierarchyManager.assertLeafCategory(categoryId);

    const result = await prisma.transaction.updateMany({
      where: { id: { in: transactionIds } },
      data: { categoryId, isCategorizedByRule: false },
    });
    return result.count;
  }
}
