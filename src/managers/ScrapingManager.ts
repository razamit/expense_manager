import { prisma } from "@/lib/prisma";
import { scrapeAccount, type ScrapeResult } from "@/lib/scraper-adapter";
import { CompanyTypes } from "israeli-bank-scrapers";
import { getMonthsAgo } from "@/lib/date-utils";
import type { ScrapeProgress } from "@/types";

const DEFAULT_MONTHS_BACK = 3;
const SCRAPE_MONTHS_KEY = "scrape_months_back";
const DEFAULT_FUTURE_MONTHS = 1;
const FUTURE_MONTHS_KEY = "scrape_future_months";
const DEFAULT_GROUP_CONCURRENCY = 4;
const GROUP_CONCURRENCY_KEY = "scrape_group_concurrency";
const MAX_GROUP_CONCURRENCY = 10;
const STALE_MINUTES = 10;
const RECENT_SECONDS = 30;

const TERMINAL_STATUSES = ["completed", "error", "binding_needed"];

function progressStatusToDbStatus(status: ScrapeProgress["status"]): string {
  if (status === "done") return "completed";
  if (status === "binding-needed") return "binding_needed";
  return status;
}

export interface ScrapeRunRecord {
  id: string;
  accountId: string;
  status: string;
  txnCount: number;
  newTxnCount: number;
  errorType?: string;
  errorMessage?: string;
}

export interface ActiveScrapeRunRow {
  id: string;
  accountId: string;
  accountName: string;
  status: string;
  progressJson: string | null;
  errorMessage: string | null;
  txnCount: number;
  newTxnCount: number;
  completedAt: Date | null;
}

export class ScrapingManager {
  private static normalizePositiveInteger(
    value: string | null | undefined,
    fallback: number,
    max: number = Number.MAX_SAFE_INTEGER
  ): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    const normalized = Math.trunc(parsed);
    if (normalized < 1) {
      return fallback;
    }

    return Math.min(normalized, max);
  }

  static async createScrapeRun(accountId: string): Promise<string> {
    const run = await prisma.scrapeRun.create({
      data: { accountId },
    });
    return run.id;
  }

  static async getMonthsBack(): Promise<number> {
    const setting = await prisma.appSetting.findUnique({
      where: { key: SCRAPE_MONTHS_KEY },
    });
    return setting ? Number(setting.value) : DEFAULT_MONTHS_BACK;
  }

  static async getFutureMonths(): Promise<number> {
    const setting = await prisma.appSetting.findUnique({
      where: { key: FUTURE_MONTHS_KEY },
    });
    return setting ? Number(setting.value) : DEFAULT_FUTURE_MONTHS;
  }

  static async getGroupConcurrency(): Promise<number> {
    const setting = await prisma.appSetting.findUnique({
      where: { key: GROUP_CONCURRENCY_KEY },
    });

    return this.normalizePositiveInteger(
      setting?.value,
      DEFAULT_GROUP_CONCURRENCY,
      MAX_GROUP_CONCURRENCY
    );
  }

  static async executeScrape(
    companyType: string,
    credentials: Record<string, string>,
    options?: { monthsBack?: number; onStep?: (step: string) => void }
  ): Promise<ScrapeResult> {
    const months = options?.monthsBack ?? await this.getMonthsBack();
    const futureMonths = await this.getFutureMonths();
    const startDate = getMonthsAgo(months);
    return scrapeAccount({
      companyType: companyType as CompanyTypes,
      credentials,
      startDate,
      futureMonthsToScrape: futureMonths,
      onStep: options?.onStep,
    });
  }

  static async completeScrapeRun(
    runId: string,
    data: {
      status: string;
      txnCount: number;
      newTxnCount: number;
      errorType?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    await prisma.scrapeRun.update({
      where: { id: runId },
      data: {
        ...data,
        completedAt: new Date(),
      },
    });
  }

  /** Attaches the serialized session log to every run in a credential group. */
  static async attachLogToRuns(runIds: string[], logJson: string): Promise<void> {
    if (runIds.length === 0) return;
    await prisma.scrapeRun.updateMany({
      where: { id: { in: runIds } },
      data: { logJson },
    });
  }

  static async updateScrapeProgress(
    runId: string,
    progress: ScrapeProgress
  ): Promise<void> {
    const dbStatus = progressStatusToDbStatus(progress.status);
    await prisma.scrapeRun.update({
      where: { id: runId },
      data: {
        status: dbStatus,
        progressJson: JSON.stringify(progress),
        ...(progress.status === "error" ? { errorMessage: progress.message } : {}),
      },
    });
  }

  static async findActiveRunsForAccountIds(
    accountIds: string[]
  ): Promise<{ id: string; accountId: string }[]> {
    if (accountIds.length === 0) return [];
    return prisma.scrapeRun.findMany({
      where: {
        accountId: { in: accountIds },
        status: { notIn: TERMINAL_STATUSES },
      },
      select: { id: true, accountId: true },
    });
  }

  static async findAllActiveAccountIds(): Promise<string[]> {
    const runs = await prisma.scrapeRun.findMany({
      where: { status: { notIn: TERMINAL_STATUSES } },
      select: { accountId: true },
    });
    return runs.map((r) => r.accountId);
  }

  static async markStaleRunsAsErrored(): Promise<void> {
    const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000);
    await prisma.scrapeRun.updateMany({
      where: {
        status: { notIn: TERMINAL_STATUSES },
        updatedAt: { lt: cutoff },
      },
      data: {
        status: "error",
        errorMessage: "Sync interrupted (server restart or timeout)",
        completedAt: new Date(),
      },
    });
  }

  static async findActiveAndRecentRuns(): Promise<ActiveScrapeRunRow[]> {
    const recentCutoff = new Date(Date.now() - RECENT_SECONDS * 1000);

    const runs = await prisma.scrapeRun.findMany({
      where: {
        OR: [
          { status: { notIn: TERMINAL_STATUSES } },
          {
            status: { in: TERMINAL_STATUSES },
            completedAt: { gt: recentCutoff },
          },
        ],
      },
      include: { account: { select: { displayName: true } } },
      orderBy: { startedAt: "asc" },
    });

    return runs.map((run) => ({
      id: run.id,
      accountId: run.accountId,
      accountName: run.account.displayName,
      status: run.status,
      progressJson: run.progressJson,
      errorMessage: run.errorMessage,
      txnCount: run.txnCount,
      newTxnCount: run.newTxnCount,
      completedAt: run.completedAt,
    }));
  }

  static async getRecentRuns(accountId: string, limit: number = 5) {
    return prisma.scrapeRun.findMany({
      where: { accountId },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  }

  static async getRunHistory(limit: number = 100) {
    return prisma.scrapeRun.findMany({
      orderBy: { startedAt: "desc" },
      take: Math.min(Math.max(1, limit), 500),
      include: { account: { select: { displayName: true, companyType: true } } },
    });
  }

  static async getLatestRunsForAccounts(
    accountIds: string[]
  ): Promise<
    Map<string, { status: string; errorType: string | null; errorMessage: string | null }>
  > {
    const entries = await Promise.all(
      accountIds.map(async (accountId) => {
        const run = await prisma.scrapeRun.findFirst({
          where: { accountId },
          orderBy: { startedAt: "desc" },
          select: { status: true, errorType: true, errorMessage: true },
        });
        return [accountId, run] as const;
      })
    );

    const map = new Map<
      string,
      { status: string; errorType: string | null; errorMessage: string | null }
    >();
    for (const [accountId, run] of entries) {
      if (run) map.set(accountId, run);
    }
    return map;
  }

  static async getRunById(runId: string) {
    return prisma.scrapeRun.findUnique({
      where: { id: runId },
      include: { account: { select: { displayName: true, companyType: true } } },
    });
  }
}
