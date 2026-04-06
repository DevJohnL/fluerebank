-- AlterEnum (idempotent for bases já sincronizadas com prisma db push)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    INNER JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'TransactionType' AND e.enumlabel = 'PIX_CREDIT'
  ) THEN
    ALTER TYPE "TransactionType" ADD VALUE 'PIX_CREDIT';
  END IF;
END $$;
