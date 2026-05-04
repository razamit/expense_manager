import { AccountRepository } from "@/repositories/AccountRepository";
import { ScrapingManager } from "@/managers/ScrapingManager";
import { TransactionImportCoordinator } from "./TransactionImportCoordinator";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";
import type { Account } from "@prisma/client";
import type { ScrapeAccountResult } from "@/lib/scraper-adapter";
import type { ScrapeBindingOption, ScrapeProgress } from "@/types";

export type ProgressCallback = (progress: ScrapeProgress) => void;

interface ScrapeAccountGroup {
  credentialOwnerId: string;
  credentialOwner: Account | null;
  accounts: Account[];
}

interface MatchPlan {
  assignedScrapeAccounts: Map<string, ScrapeAccountResult>;
  autoBoundAccountIds: Set<string>;
  bindingNeededAccountIds: Set<string>;
  unbindableAccountIds: Set<string>;
  availableBindings: ScrapeBindingOption[];
}

export class ScrapeCoordinator {
  static async scrapeAllAccounts(
    onProgress?: ProgressCallback
  ): Promise<ScrapeProgress[]> {
    const accounts = await AccountRepository.findActive();
    const groups = await this.groupAccountsByCredentialOwner(accounts);
    if (groups.length === 0) {
      return [];
    }

    const concurrency = await ScrapingManager.getGroupConcurrency();
    const groupResults = await this.mapWithConcurrency(
      groups,
      concurrency,
      (group) => this.scrapeAccountGroup(group, onProgress)
    );

    return groupResults.flat();
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

    if (!account.isActive) {
      return {
        accountId,
        accountName: account.displayName,
        status: "error",
        message: "Account is inactive",
      };
    }

    const activeAccounts = await AccountRepository.findActive();
    const groups = await this.groupAccountsByCredentialOwner(activeAccounts);
    const group = groups.find((candidate) =>
      candidate.accounts.some((candidateAccount) => candidateAccount.id === accountId)
    );

    if (!group) {
      return {
        accountId,
        accountName: account.displayName,
        status: "error",
        message: "Account not processed",
      };
    }

    const results = await this.scrapeAccountGroup(group, (progress) => {
      if (progress.accountId === accountId) {
        onProgress?.(progress);
      }
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

  private static async groupAccountsByCredentialOwner(
    accounts: Account[]
  ): Promise<ScrapeAccountGroup[]> {
    const credentialOwnerIds = Array.from(
      new Set(
        accounts.map((account) =>
          ConfigEncryptionManager.getCredentialOwnerAccountId(account)
        )
      )
    );
    const credentialOwners = await AccountRepository.findByIds(
      credentialOwnerIds
    );
    const credentialOwnersById = new Map(
      credentialOwners.map((owner) => [owner.id, owner])
    );
    const groups = new Map<string, ScrapeAccountGroup>();

    for (const account of accounts) {
      const credentialOwnerId =
        ConfigEncryptionManager.getCredentialOwnerAccountId(account);
      const existingGroup = groups.get(credentialOwnerId);

      if (existingGroup) {
        existingGroup.accounts.push(account);
        continue;
      }

      groups.set(credentialOwnerId, {
        credentialOwnerId,
        credentialOwner: credentialOwnersById.get(credentialOwnerId) ?? null,
        accounts: [account],
      });
    }

    return Array.from(groups.values());
  }

  private static async scrapeAccountGroup(
    group: ScrapeAccountGroup,
    onProgress?: ProgressCallback
  ): Promise<ScrapeProgress[]> {
    const baseProgresses = group.accounts.map((account) => {
      const progress = this.createProgress(account, group, {
        status: "scraping",
        message: "Starting scrape...",
      });
      onProgress?.(progress);
      return progress;
    });

    if (!group.credentialOwner) {
      return this.finishGroupWithError(
        group,
        baseProgresses,
        "Credential source account not found",
        undefined,
        onProgress
      );
    }

    const credentials = ConfigEncryptionManager.getCredentialsForAccount(
      group.credentialOwner
    );
    if (!credentials) {
      return this.finishGroupWithError(
        group,
        baseProgresses,
        `No credentials found for ${group.credentialOwner.displayName}`,
        undefined,
        onProgress
      );
    }

    const runIds = await this.createRunIdMap(group.accounts);

    // Re-emit with runId so onProgress writer can persist to DB.
    for (const account of group.accounts) {
      const runId = runIds.get(account.id);
      const p = this.createProgress(account, group, { status: "scraping", message: "Starting scrape..." }, runId);
      onProgress?.(p);
    }

    try {
      const scrapeResult = await ScrapingManager.executeScrape(
        group.credentialOwner.companyType,
        credentials
      );

      if (!scrapeResult.success) {
        return this.finishGroupWithError(
          group,
          baseProgresses,
          scrapeResult.errorMessage ?? "Scrape failed",
          scrapeResult.errorType,
          onProgress,
          runIds
        );
      }

      const matchPlan = this.buildMatchPlan(group.accounts, scrapeResult.accounts);
      const results: ScrapeProgress[] = [];

      for (const account of group.accounts) {
        const runId = runIds.get(account.id);
        if (!runId) {
          continue;
        }

        const matchedScrapeAccount = matchPlan.assignedScrapeAccounts.get(
          account.id
        );

        if (matchedScrapeAccount) {
          const progress = await this.importMatchedAccount({
            account,
            group,
            runId,
            scrapeAccount: matchedScrapeAccount,
            autoBound: matchPlan.autoBoundAccountIds.has(account.id),
            onProgress,
          });
          results.push(progress);
          continue;
        }

        if (matchPlan.bindingNeededAccountIds.has(account.id)) {
          const progress = await this.blockAccountForBinding({
            account,
            group,
            runId,
            availableBindings: matchPlan.availableBindings,
            onProgress,
          });
          results.push(progress);
          continue;
        }

        if (matchPlan.unbindableAccountIds.has(account.id)) {
          const progress = await this.finishAccountWithError({
            account,
            group,
            runId,
            errorType: "MISSING_ACCOUNT_NUMBER",
            errorMessage:
              "Scrape returned accounts without bindable card/account numbers",
            onProgress,
          });
          results.push(progress);
          continue;
        }

        const progress = await this.finishWithoutImport({
          account,
          group,
          runId,
          onProgress,
        });
        results.push(progress);
      }

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return this.finishGroupWithError(
        group,
        baseProgresses,
        errorMessage,
        "GENERIC",
        onProgress,
        runIds
      );
    }
  }

  private static createProgress(
    account: Account,
    group: ScrapeAccountGroup,
    overrides: Partial<ScrapeProgress>,
    runId?: string
  ): ScrapeProgress {
    return {
      accountId: account.id,
      accountName: account.displayName,
      credentialOwnerAccountId: group.credentialOwnerId,
      credentialOwnerName: group.credentialOwner?.displayName,
      status: "pending",
      runId,
      ...overrides,
    };
  }

  private static async createRunIdMap(accounts: Account[]) {
    const runIds = await Promise.all(
      accounts.map(async (account) => [
        account.id,
        await ScrapingManager.createScrapeRun(account.id),
      ] as const)
    );

    return new Map(runIds);
  }

  private static async mapWithConcurrency<TItem, TResult>(
    items: TItem[],
    concurrency: number,
    worker: (item: TItem) => Promise<TResult>
  ): Promise<TResult[]> {
    const results = new Array<TResult>(items.length);
    let nextIndex = 0;
    const workerCount = Math.min(items.length, Math.max(1, concurrency));

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (true) {
          const currentIndex = nextIndex;
          nextIndex += 1;

          if (currentIndex >= items.length) {
            return;
          }

          results[currentIndex] = await worker(items[currentIndex]);
        }
      })
    );

    return results;
  }

  private static buildMatchPlan(
    accounts: Account[],
    scrapedAccounts: ScrapeAccountResult[]
  ): MatchPlan {
    const assignedScrapeAccounts = new Map<string, ScrapeAccountResult>();
    const consumedAccountNumbers = new Set<string>();

    for (const account of accounts) {
      if (!account.accountNumber) {
        continue;
      }

      const matchedScrapeAccount = scrapedAccounts.find(
        (scrapeAccount) => scrapeAccount.accountNumber === account.accountNumber
      );
      if (!matchedScrapeAccount) {
        continue;
      }

      assignedScrapeAccounts.set(account.id, matchedScrapeAccount);
      consumedAccountNumbers.add(matchedScrapeAccount.accountNumber);
    }

    const unboundAccounts = accounts.filter((account) => !account.accountNumber);
    const unmatchedScrapeAccounts = scrapedAccounts.filter(
      (scrapeAccount) => !consumedAccountNumbers.has(scrapeAccount.accountNumber)
    );
    const bindableScrapeAccounts = unmatchedScrapeAccounts.filter(
      (scrapeAccount) => scrapeAccount.accountNumber !== "unknown"
    );

    const autoBoundAccountIds = new Set<string>();
    const bindingNeededAccountIds = new Set<string>();
    const unbindableAccountIds = new Set<string>();

    if (
      unboundAccounts.length === 1 &&
      unmatchedScrapeAccounts.length === 1 &&
      bindableScrapeAccounts.length === 1
    ) {
      assignedScrapeAccounts.set(
        unboundAccounts[0].id,
        bindableScrapeAccounts[0]
      );
      autoBoundAccountIds.add(unboundAccounts[0].id);
    } else if (unboundAccounts.length > 0 && bindableScrapeAccounts.length > 0) {
      for (const account of unboundAccounts) {
        bindingNeededAccountIds.add(account.id);
      }
    } else if (unboundAccounts.length > 0 && unmatchedScrapeAccounts.length > 0) {
      for (const account of unboundAccounts) {
        unbindableAccountIds.add(account.id);
      }
    }

    return {
      assignedScrapeAccounts,
      autoBoundAccountIds,
      bindingNeededAccountIds,
      unbindableAccountIds,
      availableBindings: bindableScrapeAccounts.map((scrapeAccount) => ({
        accountNumber: scrapeAccount.accountNumber,
        balance: scrapeAccount.balance ?? null,
        transactionCount: scrapeAccount.transactions.length,
      })),
    };
  }

  private static async importMatchedAccount(params: {
    account: Account;
    group: ScrapeAccountGroup;
    runId: string;
    scrapeAccount: ScrapeAccountResult;
    autoBound: boolean;
    onProgress?: ProgressCallback;
  }): Promise<ScrapeProgress> {
    const { account, group, runId, scrapeAccount, autoBound, onProgress } =
      params;

    const importingProgress = this.createProgress(account, group, {
      status: "importing",
      message: autoBound ? "Binding account and importing..." : "Importing transactions...",
      matchedAccountNumber: scrapeAccount.accountNumber,
    }, runId);
    onProgress?.(importingProgress);

    await this.updateAccountFromScrape(account, scrapeAccount);

    const importResult = await TransactionImportCoordinator.importTransactions(
      account.id,
      runId,
      scrapeAccount.transactions
    );

    await ScrapingManager.completeScrapeRun(runId, {
      status: "completed",
      txnCount: importResult.totalProcessed,
      newTxnCount: importResult.newTransactions,
    });
    await AccountRepository.updateLastScraped(account.id);

    const message = autoBound
      ? `Bound to ${scrapeAccount.accountNumber} and imported ${importResult.newTransactions} new transactions`
      : `${importResult.newTransactions} new transactions`;

    const completedProgress = this.createProgress(account, group, {
      status: "done",
      message,
      txnCount: importResult.totalProcessed,
      newTxnCount: importResult.newTransactions,
      matchedAccountNumber: scrapeAccount.accountNumber,
    }, runId);
    onProgress?.(completedProgress);
    return completedProgress;
  }

  private static async blockAccountForBinding(params: {
    account: Account;
    group: ScrapeAccountGroup;
    runId: string;
    availableBindings: ScrapeBindingOption[];
    onProgress?: ProgressCallback;
  }): Promise<ScrapeProgress> {
    const { account, group, runId, availableBindings, onProgress } = params;

    await ScrapingManager.completeScrapeRun(runId, {
      status: "binding_needed",
      txnCount: 0,
      newTxnCount: 0,
      errorType: "BINDING_REQUIRED",
      errorMessage: "Select the matching card before importing transactions",
    });

    const progress = this.createProgress(account, group, {
      status: "binding-needed",
      message: "Select the matching card before importing transactions.",
      availableBindings,
    }, runId);
    onProgress?.(progress);
    return progress;
  }

  private static async finishWithoutImport(params: {
    account: Account;
    group: ScrapeAccountGroup;
    runId: string;
    onProgress?: ProgressCallback;
  }): Promise<ScrapeProgress> {
    const { account, group, runId, onProgress } = params;

    await ScrapingManager.completeScrapeRun(runId, {
      status: "completed",
      txnCount: 0,
      newTxnCount: 0,
    });
    await AccountRepository.updateLastScraped(account.id);

    const progress = this.createProgress(account, group, {
      status: "done",
      message: "No matching scraped account found",
      txnCount: 0,
      newTxnCount: 0,
    }, runId);
    onProgress?.(progress);
    return progress;
  }

  private static async finishAccountWithError(params: {
    account: Account;
    group: ScrapeAccountGroup;
    runId: string;
    errorType: string;
    errorMessage: string;
    onProgress?: ProgressCallback;
  }): Promise<ScrapeProgress> {
    const { account, group, runId, errorType, errorMessage, onProgress } =
      params;

    await ScrapingManager.completeScrapeRun(runId, {
      status: "error",
      txnCount: 0,
      newTxnCount: 0,
      errorType,
      errorMessage,
    });

    const progress = this.createProgress(account, group, {
      status: "error",
      message: errorMessage,
    }, runId);
    onProgress?.(progress);
    return progress;
  }

  private static async finishGroupWithError(
    group: ScrapeAccountGroup,
    baseProgresses: ScrapeProgress[],
    errorMessage: string,
    errorType?: string,
    onProgress?: ProgressCallback,
    runIds?: Map<string, string>
  ): Promise<ScrapeProgress[]> {
    const results: ScrapeProgress[] = [];

    for (const progress of baseProgresses) {
      const runId = runIds?.get(progress.accountId);
      if (runId) {
        await ScrapingManager.completeScrapeRun(runId, {
          status: "error",
          txnCount: 0,
          newTxnCount: 0,
          errorType,
          errorMessage,
        });
      }

      const errorProgress = this.createProgress(
        group.accounts.find((account) => account.id === progress.accountId) ??
          group.accounts[0],
        group,
        {
          status: "error",
          message: errorMessage,
        },
        runId
      );

      results.push(errorProgress);
      onProgress?.(errorProgress);
    }

    return results;
  }

  private static async updateAccountFromScrape(
    account: Account,
    scrapeAccount: ScrapeAccountResult
  ) {
    const nextAccountNumber =
      scrapeAccount.accountNumber !== "unknown"
        ? scrapeAccount.accountNumber
        : account.accountNumber;
    const nextBalance = scrapeAccount.balance;

    if (
      nextAccountNumber === account.accountNumber &&
      nextBalance == null
    ) {
      return;
    }

    await AccountRepository.update(account.id, {
      ...(nextAccountNumber !== account.accountNumber && {
        accountNumber: nextAccountNumber ?? null,
      }),
      ...(nextBalance != null && { lastBalance: nextBalance }),
    });
  }
}
