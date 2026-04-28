import { prisma } from "@/lib/prisma";
import { getMonthRange, getMonthsAgo } from "@/lib/date-utils";
import { TransactionRepository } from "@/repositories/TransactionRepository";
import { StatisticsManager } from "@/managers/StatisticsManager";
import type { AnomalyAlert } from "@/types";

export class AnomalyDetectionManager {
  static async detectAnomalies(
    year: number,
    month: number
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];

    const [highSpending, largeTransactions] = await Promise.all([
      this.detectHighCategorySpending(year, month),
      this.detectLargeTransactions(year, month),
    ]);

    alerts.push(...highSpending, ...largeTransactions);
    return alerts;
  }

  private static async detectHighCategorySpending(
    year: number,
    month: number
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];
    const { startDate, endDate } = getMonthRange(year, month);

    const currentSpending = await StatisticsManager.getSpendingByDateRange(
      startDate,
      endDate
    );

    const threeMonthsAgo = getMonthsAgo(3);
    const lastMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const historicalSpending = await StatisticsManager.getSpendingByDateRange(
      threeMonthsAgo,
      lastMonthEnd
    );

    const historicalAvg = new Map<string, number>();
    for (const item of historicalSpending) {
      const avg = item.totalAmount / 3;
      historicalAvg.set(item.categoryId, avg);
    }

    for (const item of currentSpending) {
      const currentAmount = item.totalAmount;
      const avgAmount = historicalAvg.get(item.categoryId);

      if (avgAmount && avgAmount > 0 && currentAmount > avgAmount * 1.5) {
        alerts.push({
          type: "high_spending",
          severity: currentAmount > avgAmount * 2 ? "alert" : "warning",
          title: `High spending in ${item.categoryName}`,
          description: `Spent ${currentAmount.toFixed(0)} ILS vs ${avgAmount.toFixed(0)} ILS average`,
          categoryId: item.categoryId,
          amount: currentAmount,
          expectedAmount: avgAmount,
        });
      }
    }

    return alerts;
  }

  private static async detectLargeTransactions(
    year: number,
    month: number
  ): Promise<AnomalyAlert[]> {
    const alerts: AnomalyAlert[] = [];
    const { startDate, endDate } = getMonthRange(year, month);

    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        chargedAmount: { lt: 0 },
        categoryId: { not: null },
        isExcluded: false,
      },
      include: { category: true },
    });

    const categoryAmounts = new Map<string, number[]>();
    for (const txn of transactions) {
      if (!txn.categoryId) continue;
      const amounts = categoryAmounts.get(txn.categoryId) ?? [];
      amounts.push(Math.abs(txn.chargedAmount));
      categoryAmounts.set(txn.categoryId, amounts);
    }

    for (const txn of transactions) {
      if (!txn.categoryId) continue;
      const amounts = categoryAmounts.get(txn.categoryId) ?? [];
      if (amounts.length < 3) continue;

      const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
      const txnAmount = Math.abs(txn.chargedAmount);

      if (txnAmount > avg * 2 && txnAmount > 100) {
        alerts.push({
          type: "large_transaction",
          severity: "warning",
          title: `Large transaction: ${txn.description}`,
          description: `${txnAmount.toFixed(0)} ILS is ${(txnAmount / avg).toFixed(1)}x the category average`,
          transactionId: txn.id,
          categoryId: txn.categoryId,
          amount: txnAmount,
          expectedAmount: avg,
        });
      }
    }

    return alerts;
  }
}
