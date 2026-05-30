-- Migration: Update transaction schema with context fields
-- Task: 1.1 Update transaction schema with context fields
-- Date: 2025-01-XX
-- Description: Adds structured context fields to transactions table while preserving existing fields for backward compatibility

-- ═══════════════════════════════════════════════════════════
-- 1. CREATE TRANSACTION TYPE ENUM
-- ═══════════════════════════════════════════════════════════

-- Create TransactionType enum with all valid types
-- Note: WALLET_TRANSFER and CHAT_TIP are explicitly excluded for compliance
CREATE TYPE "TransactionType" AS ENUM (
  'CONTENT_TIP',
  'LOCKED_CHAT_TASK',
  'SUBSCRIPTION',
  'CONTEST_ENTRY',
  'CONTEST_VOTE',
  'CONTEST_PRIZE',
  'CHAMA_CONTRIBUTION',
  'CHAMA_PAYOUT',
  'PLATFORM_REWARD',
  'WITHDRAWAL',
  'TOP_UP',
  'SHOP_LISTING_FEE'
);

COMMENT ON TYPE "TransactionType" IS 'Valid transaction types for platform compliance. WALLET_TRANSFER and CHAT_TIP are excluded to prevent money transmission classification.';

-- ═══════════════════════════════════════════════════════════
-- 2. ADD NEW FIELDS TO TRANSACTIONS TABLE
-- ═══════════════════════════════════════════════════════════

-- Add context JSONB field for consolidated context information
ALTER TABLE "transactions" 
  ADD COLUMN IF NOT EXISTS "context" JSONB;

-- Add transaction_type enum field
ALTER TABLE "transactions" 
  ADD COLUMN IF NOT EXISTS "transaction_type" "TransactionType";

-- Add reference_id field (replaces context_ref_id in new code)
ALTER TABLE "transactions" 
  ADD COLUMN IF NOT EXISTS "reference_id" TEXT;

-- Add description field (replaces context_desc in new code)
ALTER TABLE "transactions" 
  ADD COLUMN IF NOT EXISTS "description" TEXT;

-- ═══════════════════════════════════════════════════════════
-- 3. CREATE INDEXES FOR NEW FIELDS
-- ═══════════════════════════════════════════════════════════

-- Index on transaction_type for filtering by type
CREATE INDEX IF NOT EXISTS "transactions_transaction_type_idx" 
  ON "transactions"("transaction_type");

-- Index on reference_id for looking up transactions by content/service
CREATE INDEX IF NOT EXISTS "transactions_reference_id_idx" 
  ON "transactions"("reference_id");

-- Composite index for user + transaction_type queries
CREATE INDEX IF NOT EXISTS "transactions_user_id_transaction_type_idx" 
  ON "transactions"("user_id", "transaction_type");

-- ═══════════════════════════════════════════════════════════
-- 4. DATA MIGRATION (OPTIONAL - BACKFILL EXISTING DATA)
-- ═══════════════════════════════════════════════════════════

-- Migrate existing context_type to transaction_type enum
-- This is a best-effort migration - adjust mappings as needed
UPDATE "transactions"
SET "transaction_type" = 
  CASE 
    WHEN "context_type" = 'CONTENT_TIP' THEN 'CONTENT_TIP'::"TransactionType"
    WHEN "context_type" = 'LOCKED_CHAT_TASK' THEN 'LOCKED_CHAT_TASK'::"TransactionType"
    WHEN "context_type" = 'SUBSCRIPTION' THEN 'SUBSCRIPTION'::"TransactionType"
    WHEN "context_type" = 'CONTEST_ENTRY' THEN 'CONTEST_ENTRY'::"TransactionType"
    WHEN "context_type" = 'CONTEST_VOTE' THEN 'CONTEST_VOTE'::"TransactionType"
    WHEN "context_type" = 'CONTEST_PRIZE' THEN 'CONTEST_PRIZE'::"TransactionType"
    WHEN "context_type" = 'CHAMA_CONTRIBUTION' THEN 'CHAMA_CONTRIBUTION'::"TransactionType"
    WHEN "context_type" = 'CHAMA_PAYOUT' THEN 'CHAMA_PAYOUT'::"TransactionType"
    WHEN "context_type" = 'PLATFORM_REWARD' THEN 'PLATFORM_REWARD'::"TransactionType"
    WHEN "context_type" = 'WITHDRAWAL' THEN 'WITHDRAWAL'::"TransactionType"
    WHEN "context_type" = 'TOP_UP' THEN 'TOP_UP'::"TransactionType"
    WHEN "context_type" = 'SHOP_LISTING_FEE' THEN 'SHOP_LISTING_FEE'::"TransactionType"
    -- Skip WALLET_TRANSFER and CHAT_TIP - they should be blocked
    ELSE NULL
  END
WHERE "context_type" IS NOT NULL 
  AND "transaction_type" IS NULL;

-- Migrate context_ref_id to reference_id
UPDATE "transactions"
SET "reference_id" = "context_ref_id"
WHERE "context_ref_id" IS NOT NULL 
  AND "reference_id" IS NULL;

-- Migrate context_desc to description
UPDATE "transactions"
SET "description" = "context_desc"
WHERE "context_desc" IS NOT NULL 
  AND "description" IS NULL;

-- Build consolidated context JSONB object from existing fields
UPDATE "transactions"
SET "context" = jsonb_build_object(
  'type', "context_type",
  'reference_id', "context_ref_id",
  'description', "context_desc"
)
WHERE "context_type" IS NOT NULL 
  AND "context" IS NULL;

-- ═══════════════════════════════════════════════════════════
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════

COMMENT ON COLUMN "transactions"."context" IS 'Consolidated JSONB context object containing transaction business context';
COMMENT ON COLUMN "transactions"."transaction_type" IS 'Enum-based transaction type for type safety and validation';
COMMENT ON COLUMN "transactions"."reference_id" IS 'Reference to content/service (replaces context_ref_id)';
COMMENT ON COLUMN "transactions"."description" IS 'Human-readable transaction context (replaces context_desc)';

-- ═══════════════════════════════════════════════════════════
-- 6. VALIDATION QUERIES (FOR TESTING)
-- ═══════════════════════════════════════════════════════════

-- Check for transactions with WALLET_TRANSFER or CHAT_TIP (should be blocked)
-- SELECT COUNT(*) as blocked_transaction_count
-- FROM "transactions"
-- WHERE "context_type" IN ('WALLET_TRANSFER', 'CHAT_TIP');

-- Check migration success rate
-- SELECT 
--   COUNT(*) as total_transactions,
--   COUNT("transaction_type") as migrated_transaction_type,
--   COUNT("reference_id") as migrated_reference_id,
--   COUNT("description") as migrated_description,
--   COUNT("context") as migrated_context
-- FROM "transactions";

-- ═══════════════════════════════════════════════════════════
-- NOTES
-- ═══════════════════════════════════════════════════════════

-- 1. BACKWARD COMPATIBILITY: All existing fields (context_type, context_ref_id, 
--    context_desc) are preserved to ensure existing code continues to work.
--
-- 2. NEW FIELDS: New code should use transaction_type, reference_id, description,
--    and context fields for better type safety and structure.
--
-- 3. MIGRATION STRATEGY: Existing data is migrated to new fields, but old fields
--    remain populated. This allows gradual migration of application code.
--
-- 4. BLOCKED TYPES: WALLET_TRANSFER and CHAT_TIP are not included in the enum
--    to prevent direct wallet transfers and chat tips (compliance requirement).
--
-- 5. INDEXES: New indexes are created for efficient querying by transaction_type
--    and reference_id.
--
-- 6. ROLLBACK: To rollback this migration:
--    - DROP INDEX "transactions_transaction_type_idx";
--    - DROP INDEX "transactions_reference_id_idx";
--    - DROP INDEX "transactions_user_id_transaction_type_idx";
--    - ALTER TABLE "transactions" DROP COLUMN "context";
--    - ALTER TABLE "transactions" DROP COLUMN "transaction_type";
--    - ALTER TABLE "transactions" DROP COLUMN "reference_id";
--    - ALTER TABLE "transactions" DROP COLUMN "description";
--    - DROP TYPE "TransactionType";

