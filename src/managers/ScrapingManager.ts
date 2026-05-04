import { prisma } from "@/lib/prisma";
import { scrapeAccount, type ScrapeResult } from "@/lib/scraper-adapter";
import { CompanyTypes } from "israeli-bank-scrapers";
import { getMonthsAgo } from "@/lib/date-utils";
import type { ScrapeProgress } from "@/types";

const DEFAULT_MONTHS_BACK = 3;
const SCRAPE_MONTHS_KEY = "scrape_months_back";
const DEFAULT_FUTURE_MONTHS = 1;
const FUTURE_MONTHS_KEY = "scrape_future_months";
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

  static async executeScrape(
    companyType: string,
    credentials: Record<string, string>,
    monthsBack?: number
  ): Promise<ScrapeResult> {
    const months = monthsBack ?? await this.getMonthsBack();
    const futureMonths = await this.getFutureMonths();
    const startDate = getMonthsAgo(months);
    return scrapeAccount({
      companyType: companyType as CompanyTypes,
      credentials,
      startDate,
      futureMonthsToScrape: futureMonths,
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
}
