import {
  createScraper,
  CompanyTypes,
  type ScraperOptions,
  type ScraperScrapingResult,
  type ScraperCredentials,
} from "israeli-bank-scrapers";

type PuppeteerLauncher = {
  launch: (opts: object) => Promise<unknown>;
};

let cachedLauncher: PuppeteerLauncher | null = null;

async function getStealthLauncher(): Promise<PuppeteerLauncher> {
  if (cachedLauncher) return cachedLauncher;

  const puppeteerExtra = await eval('import("puppeteer-extra")');
  const stealthMod = await eval('import("puppeteer-extra-plugin-stealth")');
  const StealthPlugin = stealthMod.default ?? stealthMod;
  const pExtra = puppeteerExtra.default ?? puppeteerExtra;
  pExtra.use(StealthPlugin());
  cachedLauncher = pExtra as PuppeteerLauncher;
  return cachedLauncher;
}

export type { ScraperScrapingResult, ScraperCredentials };
export { CompanyTypes };

export interface ScrapeRequest {
  companyType: CompanyTypes;
  credentials: Record<string, string>;
  startDate: Date;
  futureMonthsToScrape?: number;
}

export interface ScrapeResult {
  success: boolean;
  accounts: ScrapeAccountResult[];
  errorType?: string;
  errorMessage?: string;
}

export interface ScrapeAccountResult {
  accountNumber: string;
  balance?: number;
  transactions: ScrapedTransaction[];
}

export interface ScrapedTransaction {
  date: string;
  processedDate?: string;
  originalAmount: number;
  originalCurrency: string;
  chargedAmount: number;
  chargedCurrency?: string;
  description: string;
  memo?: string;
  category?: string;
  type: string;
  identifier?: string;
  installments?: {
    number: number;
    total: number;
  };
  status: string;
  rawTransaction?: unknown;
}

export async function scrapeAccount(
  request: ScrapeRequest
): Promise<ScrapeResult> {
  const launcher = await getStealthLauncher();
  const browser = await launcher.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1920,1080",
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const options: ScraperOptions = {
      companyId: request.companyType,
      startDate: request.startDate,
      combineInstallments: false,
      showBrowser: false,
      additionalTransactionInformation: true,
      includeRawTransaction: true,
      futureMonthsToScrape: request.futureMonthsToScrape ?? 0,
      defaultTimeout: 60000,
      browser,
    } as ScraperOptions;

    const scraper = createScraper(options);
    const result: ScraperScrapingResult = await scraper.scrape(
      request.credentials as ScraperCredentials
    );

    if (!result.success) {
      return {
        success: false,
        accounts: [],
        errorType: result.errorType,
        errorMessage: result.errorMessage,
      };
    }

    const accounts: ScrapeAccountResult[] = (result.accounts ?? []).map(
      (account) => ({
        accountNumber: String(account.accountNumber ?? "unknown"),
        balance: (account as unknown as Record<string, unknown>).balance as
          | number
          | undefined,
        transactions: (account.txns ?? []).map((txn) => ({
          date: txn.date,
          processedDate: txn.processedDate,
          originalAmount: txn.originalAmount,
          originalCurrency: txn.originalCurrency ?? "ILS",
          chargedAmount: txn.chargedAmount,
          chargedCurrency: (
            txn as unknown as Record<string, unknown>
          ).chargedCurrency as string | undefined,
          description: txn.description,
          memo: txn.memo,
          category: (txn as unknown as Record<string, unknown>).category as
            | string
            | undefined,
          type: String(txn.type ?? "normal"),
          identifier:
            txn.identifier != null ? String(txn.identifier) : undefined,
          installments: txn.installments
            ? {
                number: txn.installments.number,
                total: txn.installments.total,
              }
            : undefined,
          status: String(txn.status ?? "completed"),
          rawTransaction: (txn as unknown as Record<string, unknown>)
            .rawTransaction,
        })),
      })
    );

    return { success: true, accounts };
  } finally {
    try {
      await (browser as unknown as { close: () => Promise<void> }).close();
    } catch {
      // browser may already be closed by the library
    }
  }
}
