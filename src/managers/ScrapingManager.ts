import { prisma } from "@/lib/prisma";
import { scrapeAccount, type ScrapeResult } from "@/lib/scraper-adapter";
import { CompanyTypes } from "israeli-bank-scrapers";
import { getMonthsAgo } from "@/lib/date-utils";

const DEFAULT_MONTHS_BACK = 3;
const SCRAPE_MONTHS_KEY = "scrape_months_back";
const DEFAULT_FUTURE_MONTHS = 1;
const FUTURE_MONTHS_KEY = "scrape_future_months";

export interface ScrapeRunRecord {
  id: string;
  accountId: string;
  status: string;
  txnCount: number;
  newTxnCount: number;
  errorType?: string;
  errorMessage?: string;
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

  static async getRecentRuns(accountId: string, limit: number = 5) {
    return prisma.scrapeRun.findMany({
      where: { accountId },
      orderBy: { startedAt: "desc" },
      take: limit,
    });
  }
}
