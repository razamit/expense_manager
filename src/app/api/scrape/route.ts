import { NextRequest, NextResponse } from "next/server";
import { ScrapeCoordinator } from "@/coordinators/ScrapeCoordinator";
import { ScrapingManager } from "@/managers/ScrapingManager";
import { AccountRepository } from "@/repositories/AccountRepository";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";
import type { ScrapeProgress } from "@/types";

// This route assumes a long-running Node server (next dev / next start).
// The coordinator runs fire-and-forget after the response is sent.

export async function POST(request: NextRequest) {
  if (!ConfigEncryptionManager.isUnlocked()) {
    return NextResponse.json({ error: "App is locked" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const accountId = body.accountId as string | undefined;

  // Determine target accounts for the concurrency guard.
  let targetAccountIds: string[];
  if (accountId) {
    targetAccountIds = [accountId];
  } else {
    const accounts = await AccountRepository.findActive();
    targetAccountIds = accounts.map((a) => a.id);
  }

  const activeRuns = await ScrapingManager.findActiveRunsForAccountIds(targetAccountIds);
  if (activeRuns.length > 0) {
    return NextResponse.json(
      { error: "Scrape already in progress for one or more of these accounts" },
      { status: 409 }
    );
  }

  function onProgress(progress: ScrapeProgress) {
    if (!progress.runId) return;
    ScrapingManager.updateScrapeProgress(progress.runId, progress).catch(
      (err) => console.error("[scrape progress write]", err)
    );
  }

  // Fire-and-forget — response is sent before coordinator finishes.
  if (accountId) {
    void ScrapeCoordinator.scrapeSingleAccount(accountId, onProgress).catch(
      (err) => console.error("[scrape bg single]", err)
    );
  } else {
    void ScrapeCoordinator.scrapeAllAccounts(onProgress).catch(
      (err) => console.error("[scrape bg all]", err)
    );
  }

  return NextResponse.json({ ok: true });
}
