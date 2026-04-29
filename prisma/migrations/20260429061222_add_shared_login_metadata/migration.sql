-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "companyType" TEXT NOT NULL,
    "accountNumber" TEXT,
    "credentialSourceAccountId" TEXT,
    "lastScrapedAt" DATETIME,
    "lastBalance" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_credentialSourceAccountId_fkey" FOREIGN KEY ("credentialSourceAccountId") REFERENCES "Account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Account" ("accountNumber", "companyType", "createdAt", "displayName", "id", "isActive", "lastBalance", "lastScrapedAt", "updatedAt") SELECT "accountNumber", "companyType", "createdAt", "displayName", "id", "isActive", "lastBalance", "lastScrapedAt", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE INDEX "Account_credentialSourceAccountId_idx" ON "Account"("credentialSourceAccountId");
CREATE UNIQUE INDEX "Account_companyType_accountNumber_key" ON "Account"("companyType", "accountNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
