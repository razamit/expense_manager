import { NextResponse } from "next/server";
import { ScrapingManager } from "@/managers/ScrapingManager";
import { ConfigEncryptionManager } from "@/managers/ConfigEncryptionManager";
import type { ScrapeRunDTO } from "@/types";

export async function GET() {
  if (!ConfigEncryptionManager.isUnlocked()) {
    return NextResponse.json({ error: "App is locked" }, { status: 401 });
  }

  const rows = await ScrapingManager.getRunHistory(100);

  const runs: ScrapeRunDTO[] = rows.map((row) => ({
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
  }));

  return NextResponse.json({ runs });
}
