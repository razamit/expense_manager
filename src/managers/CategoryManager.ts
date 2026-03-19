import { CategoryRuleRepository } from "@/repositories/CategoryRuleRepository";
import { TransactionRepository } from "@/repositories/TransactionRepository";
import type { CategoryRule } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class CategoryManager {
  private static rulesCache: CategoryRule[] | null = null;

  static invalidateCache(): void {
    this.rulesCache = null;
  }

  static async getRules(): Promise<CategoryRule[]> {
    if (!this.rulesCache) {
      this.rulesCache = await CategoryRuleRepository.findAllOrderedByPriority();
    }
    return this.rulesCache;
  }

  static async categorizeTransaction(
    description: string,
    memo: string | null
  ): Promise<string | null> {
    const rules = await this.getRules();

    for (const rule of rules) {
      const fieldValue =
        rule.matchField === "memo" ? (memo ?? "") : description;

      if (this.matchesRule(fieldValue, rule)) {
        return rule.categoryId;
      }
    }
    return null;
  }

  private static matchesRule(
    text: string,
    rule: Pick<CategoryRule, "matchPattern" | "isRegex">
  ): boolean {
    if (rule.isRegex) {
      try {
        const regex = new RegExp(rule.matchPattern, "i");
        return regex.test(text);
      } catch {
        return false;
      }
    }
    return text.toLowerCase().includes(rule.matchPattern.toLowerCase());
  }

  static async categorizeUncategorized(): Promise<number> {
    const result = await prisma.transaction.findMany({
      where: { categoryId: null },
      select: { id: true, description: true, memo: true },
    });

    let categorized = 0;
    for (const txn of result) {
      const categoryId = await this.categorizeTransaction(
        txn.description,
        txn.memo
      );
      if (categoryId) {
        await TransactionRepository.updateCategory(txn.id, categoryId, true);
        categorized++;
      }
    }

    return categorized;
  }

  static async createRuleFromTransaction(
    transactionId: string,
    categoryId: string,
    pattern?: string
  ): Promise<{ autoCategorized: number }> {
    const txn = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!txn) return { autoCategorized: 0 };

    const matchPattern = pattern ?? txn.description;

    await CategoryRuleRepository.create({
      categoryId,
      matchField: "description",
      matchPattern,
      isRegex: false,
      priority: 10,
    });

    this.invalidateCache();

    await TransactionRepository.updateCategory(transactionId, categoryId, true);

    const autoCategorized = await this.applyRuleToUncategorized(
      "description",
      matchPattern,
      false,
      categoryId,
      transactionId
    );

    return { autoCategorized };
  }

  private static async applyRuleToUncategorized(
    matchField: string,
    matchPattern: string,
    isRegex: boolean,
    categoryId: string,
    excludeTransactionId: string
  ): Promise<number> {
    const uncategorized = await prisma.transaction.findMany({
      where: { categoryId: null, id: { not: excludeTransactionId } },
      select: { id: true, description: true, memo: true },
    });

    const rule = { matchField, matchPattern, isRegex } as Pick<
      CategoryRule,
      "matchField" | "matchPattern" | "isRegex"
    >;

    let count = 0;
    for (const txn of uncategorized) {
      const fieldValue = matchField === "memo" ? (txn.memo ?? "") : txn.description;
      if (this.matchesRule(fieldValue, rule)) {
        await TransactionRepository.updateCategory(txn.id, categoryId, true);
        count++;
      }
    }

    return count;
  }
}
