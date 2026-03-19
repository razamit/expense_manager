import { NextRequest, NextResponse } from "next/server";
import { ScrapeCoordinator } from "@/coordinators/ScrapeCoordinator";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";

export async function POST(request: NextRequest) {
  console.log("[Scrape API] POST received, isUnlocked:", ConfigEncryptionManager.isUnlocked());

  if (!ConfigEncryptionManager.isUnlocked()) {
    console.log("[Scrape API] Rejected: app is locked");
    return NextResponse.json({ error: "App is locked" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const accountId = body.accountId as string | undefined;
  console.log("[Scrape API] accountId:", accountId ?? "all");

  try {
    if (accountId) {
      console.log("[Scrape API] Starting single account scrape:", accountId);
      const result = await ScrapeCoordinator.scrapeSingleAccount(accountId);
      console.log("[Scrape API] Scrape result:", JSON.stringify(result));
      return NextResponse.json(result);
    }

    console.log("[Scrape API] Starting scrape for all accounts");
    const results = await ScrapeCoordinator.scrapeAllAccounts();
    console.log("[Scrape API] All accounts result:", JSON.stringify(results));
    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Scrape failed";
    console.error("[Scrape API] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
