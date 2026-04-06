-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'GUARDAR_DEBIT';

-- CreateTable
CREATE TABLE "VaultBalance" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "balanceCents" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardarDeposit" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardarDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VaultBalance_accountId_key" ON "VaultBalance"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardarDeposit_transactionId_key" ON "GuardarDeposit"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardarDeposit_accountId_idempotencyKey_key" ON "GuardarDeposit"("accountId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "VaultBalance" ADD CONSTRAINT "VaultBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardarDeposit" ADD CONSTRAINT "GuardarDeposit_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardarDeposit" ADD CONSTRAINT "GuardarDeposit_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
