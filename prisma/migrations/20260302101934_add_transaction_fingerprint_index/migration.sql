-- CreateIndex
CREATE INDEX "Transaction_accountId_date_chargedAmount_description_idx" ON "Transaction"("accountId", "date", "chargedAmount", "description");
