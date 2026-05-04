-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScrapeRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "errorType" TEXT,
    "errorMessage" TEXT,
    "txnCount" INTEGER NOT NULL DEFAULT 0,
    "newTxnCount" INTEGER NOT NULL DEFAULT 0,
    "progressJson" TEXT,
    CONSTRAINT "ScrapeRun_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScrapeRun" ("accountId", "completedAt", "errorMessage", "errorType", "id", "newTxnCount", "progressJson", "startedAt", "status", "txnCount", "updatedAt") SELECT "accountId", "completedAt", "errorMessage", "errorType", "id", "newTxnCount", "progressJson", "startedAt", "status", "txnCount", "updatedAt" FROM "ScrapeRun";
DROP TABLE "ScrapeRun";
ALTER TABLE "new_ScrapeRun" RENAME TO "ScrapeRun";
CREATE INDEX "ScrapeRun_status_completedAt_idx" ON "ScrapeRun"("status", "completedAt");
CREATE INDEX "ScrapeRun_status_updatedAt_idx" ON "ScrapeRun"("status", "updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
