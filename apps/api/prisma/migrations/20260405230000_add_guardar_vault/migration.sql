-- AlterEnum (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    INNER JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'TransactionType' AND e.enumlabel = 'GUARDAR_DEBIT'
  ) THEN
    ALTER TYPE "TransactionType" ADD VALUE 'GUARDAR_DEBIT';
  END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "VaultBalance" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "balanceCents" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaultBalance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "GuardarDeposit" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardarDeposit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VaultBalance_accountId_key" ON "VaultBalance"("accountId");
CREATE UNIQUE INDEX IF NOT EXISTS "GuardarDeposit_transactionId_key" ON "GuardarDeposit"("transactionId");
CREATE UNIQUE INDEX IF NOT EXISTS "GuardarDeposit_accountId_idempotencyKey_key" ON "GuardarDeposit"("accountId", "idempotencyKey");

DO $$
BEGIN
  ALTER TABLE "VaultBalance" ADD CONSTRAINT "VaultBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "GuardarDeposit" ADD CONSTRAINT "GuardarDeposit_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "GuardarDeposit" ADD CONSTRAINT "GuardarDeposit_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
