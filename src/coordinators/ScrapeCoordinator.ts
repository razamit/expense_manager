import { AccountRepository } from "@/repositories/AccountRepository";
import { ScrapingManager } from "@/managers/ScrapingManager";
import { TransactionImportCoordinator } from "./TransactionImportCoordinator";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";
import type { ScrapeProgress } from "@/types";

export type ProgressCallback = (progress: ScrapeProgress) => void;

export class ScrapeCoordinator {
  static async scrapeAllAccounts(
    onProgress?: ProgressCallback
  ): Promise<ScrapeProgress[]> {
    const accounts = await AccountRepository.findActive();
    const results: ScrapeProgress[] = [];

    for (const account of accounts) {
      const progress: ScrapeProgress = {
        accountId: account.id,
        accountName: account.displayName,
        status: "scraping",
        message: "Starting scrape...",
      };

      onProgress?.(progress);

      const credentials = ConfigEncryptionManager.getCredentials(account.id);
      if (!credentials) {
        progress.status = "error";
        progress.message = "No credentials found";
        results.push({ ...progress });
        onProgress?.(progress);
        continue;
      }

      const runId = await ScrapingManager.createScrapeRun(account.id);

      try {
        const scrapeResult = await ScrapingManager.executeScrape(
          account.companyType,
          credentials as Record<string, string>
        );

        if (!scrapeResult.success) {
          progress.status = "error";
          progress.message = scrapeResult.errorMessage ?? "Scrape failed";

          await ScrapingManager.completeScrapeRun(runId, {
            status: "error",
            txnCount: 0,
            newTxnCount: 0,
            errorType: scrapeResult.errorType,
            errorMessage: scrapeResult.errorMessage,
          });

          results.push({ ...progress });
          onProgress?.(progress);
          continue;
        }

        progress.status = "importing";
        progress.message = "Importing transactions...";
        onProgress?.(progress);

        let totalTxn = 0;
        let totalNew = 0;

        for (const scrapeAccount of scrapeResult.accounts) {
          const updateData: Record<string, unknown> = {};
          if (scrapeAccount.accountNumber !== "unknown") {
            updateData.accountNumber = scrapeAccount.accountNumber;
          }
          if (scrapeAccount.balance != null) {
            updateData.lastBalance = scrapeAccount.balance;
          }
          if (Object.keys(updateData).length > 0) {
            await AccountRepository.update(account.id, updateData as { accountNumber?: string });
          }

          const importResult =
            await TransactionImportCoordinator.importTransactions(
              account.id,
              runId,
              scrapeAccount.transactions
            );

          totalTxn += importResult.totalProcessed;
          totalNew += importResult.newTransactions;
        }

        await ScrapingManager.completeScrapeRun(runId, {
          status: "completed",
          txnCount: totalTxn,
          newTxnCount: totalNew,
        });

        await AccountRepository.updateLastScraped(account.id);

        progress.status = "done";
        progress.message = `${totalNew} new transactions`;
        progress.txnCount = totalTxn;
        progress.newTxnCount = totalNew;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        progress.status = "error";
        progress.message = errorMessage;

        await ScrapingManager.completeScrapeRun(runId, {
          status: "error",
          txnCount: 0,
          newTxnCount: 0,
          errorType: "GENERIC",
          errorMessage,
        });
      }

      results.push({ ...progress });
      onProgress?.(progress);
    }

    return results;
  }

  static async scrapeSingleAccount(
    accountId: string,
    onProgress?: ProgressCallback
  ): Promise<ScrapeProgress> {
    const account = await AccountRepository.findById(accountId);
    if (!account) {
      return {
        accountId,
        accountName: "Unknown",
        status: "error",
        message: "Account not found",
      };
    }

    const results = await this.scrapeAllAccounts((p) => {
      if (p.accountId === accountId) onProgress?.(p);
    });

    return (
      results.find((r) => r.accountId === accountId) ?? {
        accountId,
        accountName: account.displayName,
        status: "error",
        message: "Account not processed",
      }
    );
  }
}
