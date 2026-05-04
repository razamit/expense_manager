import { NextResponse } from "next/server";
import { ScrapingManager } from "@/managers/ScrapingManager";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";
import type { ScrapeProgress } from "@/types";

const TERMINAL_STATUSES = new Set(["completed", "error", "binding_needed"]);

function rowToProgress(row: {
  id: string;
  accountId: string;
  accountName: string;
  status: string;
  progressJson: string | null;
  errorMessage: string | null;
  txnCount: number;
  newTxnCount: number;
  completedAt: Date | null;
}): ScrapeProgress {
  if (row.progressJson) {
    try {
      const parsed = JSON.parse(row.progressJson) as ScrapeProgress;
      return { ...parsed, accountName: row.accountName, runId: row.id };
    } catch {
      // fall through to synthesized
    }
  }

  const status = ((): ScrapeProgress["status"] => {
    if (row.status === "completed") return "done";
    if (row.status === "binding_needed") return "binding-needed";
    if (row.status === "error") return "error";
    if (row.status === "importing") return "importing";
    if (row.status === "scraping") return "scraping";
    return "pending";
  })();

  return {
    accountId: row.accountId,
    accountName: row.accountName,
    runId: row.id,
    status,
    message: row.errorMessage ?? undefined,
    txnCount: row.txnCount,
    newTxnCount: row.newTxnCount,
  };
}

export async function GET() {
  if (!ConfigEncryptionManager.isUnlocked()) {
    return NextResponse.json({ error: "App is locked" }, { status: 401 });
  }

  await ScrapingManager.markStaleRunsAsErrored();
  const rows = await ScrapingManager.findActiveAndRecentRuns();

  const active: ScrapeProgress[] = [];
  const recent: ScrapeProgress[] = [];

  for (const row of rows) {
    const progress = rowToProgress(row);
    if (TERMINAL_STATUSES.has(row.status)) {
      recent.push(progress);
    } else {
      active.push(progress);
    }
  }

  return NextResponse.json({ active, recent });
}
