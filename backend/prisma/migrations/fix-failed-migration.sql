-- This script marks the failed migration as rolled back
-- so Prisma can retry it with the fixed (BOM-free) migration.sql

-- Option 1: Mark as rolled back (Prisma will retry)
UPDATE "_prisma_migrations" 
SET rolled_back_at = NOW() 
WHERE migration_name = '20260617080623_consolidated_init' 
  AND finished_at IS NULL;

-- Option 2: If that doesn't work, delete the failed record
-- DELETE FROM "_prisma_migrations" 
-- WHERE migration_name = '20260617080623_consolidated_init' 
--   AND finished_at IS NULL;
