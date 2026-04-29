-- CreateTable
CREATE TABLE "BankCategoryMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rawBankCategory" TEXT NOT NULL,
    "normalizedBankCategory" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankCategoryMapping_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BankCategoryMapping_normalizedBankCategory_key" ON "BankCategoryMapping"("normalizedBankCategory");

-- CreateIndex
CREATE INDEX "BankCategoryMapping_categoryId_idx" ON "BankCategoryMapping"("categoryId");
