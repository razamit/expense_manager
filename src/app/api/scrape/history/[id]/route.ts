import { NextRequest, NextResponse } from "next/server";
import { ScrapingManager } from "@/managers/ScrapingManager";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";
import type { ScrapeLogEntry, ScrapeRunDetailDTO } from "@/types";

function parseLog(logJson: string | null): ScrapeLogEntry[] {
  if (!logJson) return [];
  try {
    const parsed = JSON.parse(logJson);
    return Array.isArray(parsed) ? (parsed as ScrapeLogEntry[]) : [];
  } catch {
    return [];
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!ConfigEncryptionManager.isUnlocked()) {
    return NextResponse.json({ error: "App is locked" }, { status: 401 });
  }

  const { id } = await params;
  const row = await ScrapingManager.getRunById(id);
  if (!row) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const detail: ScrapeRunDetailDTO = {
    id: row.id,
    accountId: row.accountId,
    accountName: row.account.displayName,
    companyType: row.account.companyType,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    status: row.status,
    errorType: row.errorType,
    errorMessage: row.errorMessage,
    txnCount: row.txnCount,
    newTxnCount: row.newTxnCount,
    hasLog: Boolean(row.logJson),
    log: parseLog(row.logJson),
  };

  return NextResponse.json(detail);
}
