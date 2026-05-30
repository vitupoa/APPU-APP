-- Velocity Tracking Tables Migration
-- This migration adds velocity tracking tables for transaction rate limiting
-- Task 1.3: Create velocity tracking tables
-- Requirements: 2.4.2

-- ═══════════════════════════════════════════════════════════
-- 1. TRANSACTION VELOCITY TABLE
-- ═══════════════════════════════════════════════════════════

-- Create transaction_velocity table for tracking transaction rates
CREATE TABLE IF NOT EXISTS "transaction_velocity" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "time_window" TEXT NOT NULL, -- '1_MINUTE', '1_HOUR', '24_HOURS'
  "window_start" TIMESTAMP(3) NOT NULL,
  "window_end" TIMESTAMP(3) NOT NULL,
  "transaction_count" INTEGER NOT NULL DEFAULT 0,
  "total_amount_kr" DECIMAL(18, 4) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for transaction_velocity
CREATE INDEX IF NOT EXISTS "transaction_velocity_user_id_time_window_idx" ON "transaction_velocity"("user_id", "time_window");
CREATE INDEX IF NOT EXISTS "transaction_velocity_window_end_idx" ON "transaction_velocity"("window_end");
CREATE INDEX IF NOT EXISTS "transaction_velocity_user_id_idx" ON "transaction_velocity"("user_id");

-- Comments for documentation
COMMENT ON TABLE "transaction_velocity" IS 'Tracks transaction velocity for rate limiting and compliance monitoring';
COMMENT ON COLUMN "transaction_velocity"."time_window" IS 'Time window type: 1_MINUTE, 1_HOUR, 24_HOURS';
COMMENT ON COLUMN "transaction_velocity"."window_start" IS 'Start timestamp of the time window';
COMMENT ON COLUMN "transaction_velocity"."window_end" IS 'End timestamp of the time window';
COMMENT ON COLUMN "transaction_velocity"."transaction_count" IS 'Number of transactions in this window';
COMMENT ON COLUMN "transaction_velocity"."total_amount_kr" IS 'Total Kr amount transacted in this window';

-- ═══════════════════════════════════════════════════════════
-- 2. VELOCITY LIMITS CONFIGURATION
-- ═══════════════════════════════════════════════════════════

-- Velocity limits enforced:
-- - Max 10 tips per minute per user
-- - Max 50 transactions per hour per user
-- - Max 100,000 Kr per 24h for non-KYC users
-- - Max 500,000 Kr per 24h for KYC-approved users
-- - 24-hour cooling-off period for new accounts before first withdrawal

-- These limits are enforced in application code and cached in Redis
-- See: backend/src/services/velocity-checker.service.ts

-- ═══════════════════════════════════════════════════════════
-- 3. VERIFICATION
-- ═══════════════════════════════════════════════════════════

-- Verify table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transaction_velocity') THEN
    RAISE NOTICE 'Table transaction_velocity created successfully';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════
-- Tables created:
--   1. transaction_velocity - Tracks transaction rates per user per time window
--
-- Indexes added:
--   - (user_id, time_window) - Composite index for velocity lookups
--   - window_end - For cleanup of expired windows
--   - user_id - For user-specific queries
--
-- Velocity Limits:
--   - 10 tips/minute
--   - 50 transactions/hour
--   - 100,000 Kr/24h (non-KYC)
--   - 500,000 Kr/24h (KYC-approved)
--   - 24h cooling-off for new accounts
--
-- Requirements satisfied: 2.4.2
-- ═══════════════════════════════════════════════════════════
