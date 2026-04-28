import {
  TransactionRepository,
  type ImportedTransactionData,
} from "@/repositories/TransactionRepository";
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

type ImportPayload = {
  data: ImportedTransactionData;
  description: string;
  memo: string | null;
};

export class TransactionImportCoordinator {
  static async importTransactions(
    accountId: string,
    scrapeRunId: string,
    scrapedTransactions: ScrapedTransaction[]
  ): Promise<ImportResult> {
    let newTransactions = 0;
    let updatedTransactions = 0;
    let categorizedCount = 0;

    const groupedTransactions = this.groupTransactions(
      scrapedTransactions.map((scraped) =>
        this.buildImportPayload(accountId, scrapeRunId, scraped)
      )
    );

    for (const group of groupedTransactions.values()) {
      const existingTransactions = await TransactionRepository.findMatchingTransactions(
        group[0].data
      );

      for (const [index, payload] of group.entries()) {
        const existingTransaction = existingTransactions[index];
        const transaction = existingTransaction
          ? await TransactionRepository.updateFromScrape(
              existingTransaction.id,
              payload.data
            )
          : await TransactionRepository.createFromScrape(payload.data);

        if (existingTransaction) {
          updatedTransactions++;
          continue;
        }

        newTransactions++;

        if (!transaction.categoryId) {
          const categoryId = await CategoryManager.categorizeTransaction(
            payload.description,
            payload.memo
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
      }
    }

    return {
      totalProcessed: scrapedTransactions.length,
      newTransactions,
      updatedTransactions,
      categorizedCount,
    };
  }

  private static buildImportPayload(
    accountId: string,
    scrapeRunId: string,
    scraped: ScrapedTransaction
  ): ImportPayload {
    return {
      data: {
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
        direction: detectDirection(scraped.chargedAmount),
        scrapeRunId,
      },
      description: scraped.description,
      memo: scraped.memo ?? null,
    };
  }

  private static groupTransactions(payloads: ImportPayload[]) {
    const groups = new Map<string, ImportPayload[]>();

    for (const payload of payloads) {
      const key = TransactionRepository.buildImportMatchKey(payload.data);
      const group = groups.get(key) ?? [];
      group.push(payload);
      groups.set(key, group);
    }

    return groups;
  }
}
