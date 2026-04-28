-- DropIndex
DROP INDEX "Transaction_accountId_externalId_date_chargedAmount_key";

-- CreateIndex
CREATE INDEX "Transaction_accountId_externalId_date_chargedAmount_idx" ON "Transaction"("accountId", "externalId", "date", "chargedAmount");