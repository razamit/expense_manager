import { TransactionRepository } from "@/repositories/TransactionRepository";
import { CategoryManager } from "@/managers/CategoryManager";
import { detectDirection } from "@/lib/amount-utils";
import { normalizeToDateOnly } from "@/lib/date-utils";
import type { ScrapedTransaction } from "@/lib/scraper-adapter";

export interface ImportResult {
  totalProcessed: number;
  newTransactions: number;
  updatedTransactions: number;
  categorizedCount: number;
}

export class TransactionImportCoordinator {
  static async importTransactions(
    accountId: string,
    scrapeRunId: string,
    scrapedTransactions: ScrapedTransaction[]
  ): Promise<ImportResult> {
    let newTransactions = 0;
    let updatedTransactions = 0;
    let categorizedCount = 0;

    for (const scraped of scrapedTransactions) {
      const direction = detectDirection(scraped.chargedAmount);

      const { isNew, transaction } = await TransactionRepository.upsertFromScrape({
        accountId,
        externalId: scraped.identifier?.trim() || null,
        date: normalizeToDateOnly(scraped.date),
        processedDate: scraped.processedDate
          ? normalizeToDateOnly(scraped.processedDate)
          : null,
        originalAmount: scraped.originalAmount,
        originalCurrency: scraped.originalCurrency,
        chargedAmount: scraped.chargedAmount,
        chargedCurrency: scraped.chargedCurrency ?? scraped.originalCurrency,
        description: scraped.description,
        memo: scraped.memo ?? null,
        bankCategory: scraped.category ?? null,
        rawTransaction: scraped.rawTransaction
          ? JSON.stringify(scraped.rawTransaction)
          : null,
        transactionType: scraped.installments ? "installments" : "normal",
        installmentNumber: scraped.installments?.number ?? null,
        installmentTotal: scraped.installments?.total ?? null,
        status: scraped.status,
        direction,
        scrapeRunId,
      });

      if (isNew) {
        newTransactions++;

        if (!transaction.categoryId) {
          const categoryId = await CategoryManager.categorizeTransaction(
            scraped.description,
            scraped.memo ?? null
          );
          if (categoryId) {
            await TransactionRepository.updateCategory(
              transaction.id,
              categoryId,
              true
            );
            categorizedCount++;
          }
        }
      } else {
        updatedTransactions++;
      }
    }

    return {
      totalProcessed: scrapedTransactions.length,
      newTransactions,
      updatedTransactions,
      categorizedCount,
    };
  }
}
