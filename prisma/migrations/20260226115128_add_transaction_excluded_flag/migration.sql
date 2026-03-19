-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "externalId" TEXT,
    "date" DATETIME NOT NULL,
    "processedDate" DATETIME,
    "originalAmount" REAL NOT NULL,
    "originalCurrency" TEXT NOT NULL DEFAULT 'ILS',
    "chargedAmount" REAL NOT NULL,
    "chargedCurrency" TEXT NOT NULL DEFAULT 'ILS',
    "description" TEXT NOT NULL,
    "memo" TEXT,
    "bankCategory" TEXT,
    "rawTransaction" TEXT,
    "transactionType" TEXT NOT NULL DEFAULT 'normal',
    "installmentNumber" INTEGER,
    "installmentTotal" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "direction" TEXT NOT NULL DEFAULT 'expense',
    "categoryId" TEXT,
    "isCategorizedByRule" BOOLEAN NOT NULL DEFAULT false,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,
    "scrapeRunId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_scrapeRunId_fkey" FOREIGN KEY ("scrapeRunId") REFERENCES "ScrapeRun" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("accountId", "bankCategory", "categoryId", "chargedAmount", "chargedCurrency", "createdAt", "date", "description", "direction", "externalId", "id", "installmentNumber", "installmentTotal", "isCategorizedByRule", "memo", "originalAmount", "originalCurrency", "processedDate", "rawTransaction", "scrapeRunId", "status", "transactionType", "updatedAt") SELECT "accountId", "bankCategory", "categoryId", "chargedAmount", "chargedCurrency", "createdAt", "date", "description", "direction", "externalId", "id", "installmentNumber", "installmentTotal", "isCategorizedByRule", "memo", "originalAmount", "originalCurrency", "processedDate", "rawTransaction", "scrapeRunId", "status", "transactionType", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");
CREATE INDEX "Transaction_direction_idx" ON "Transaction"("direction");
CREATE UNIQUE INDEX "Transaction_accountId_externalId_date_chargedAmount_key" ON "Transaction"("accountId", "externalId", "date", "chargedAmount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
