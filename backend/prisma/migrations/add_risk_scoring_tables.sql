-- Risk Scoring Tables Migration
-- This migration adds/updates risk scoring tables for compliance monitoring
-- Task 1.2: Create risk scoring tables

-- ═══════════════════════════════════════════════════════════
-- 1. USER RISK PROFILES TABLE
-- ═══════════════════════════════════════════════════════════

-- Create or update user_risk_profiles table
CREATE TABLE IF NOT EXISTS "user_risk_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL UNIQUE,
  "risk_score" INTEGER NOT NULL DEFAULT 0, -- 0-100
  "risk_level" TEXT NOT NULL DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
  
  -- Risk factor scores (breakdown)
  "kyc_risk_score" INTEGER NOT NULL DEFAULT 0,
  "geographic_risk_score" INTEGER NOT NULL DEFAULT 0,
  "transaction_risk_score" INTEGER NOT NULL DEFAULT 0,
  "behavioral_risk_score" INTEGER NOT NULL DEFAULT 0,
  
  -- Behavioral flags
  "self_tipping_score" INTEGER NOT NULL DEFAULT 0,
  "circular_tipping_score" INTEGER NOT NULL DEFAULT 0,
  "recipient_diversity" INTEGER NOT NULL DEFAULT 100,
  
  -- Automated actions
  "withdrawal_blocked" BOOLEAN NOT NULL DEFAULT false,
  "transaction_limited" BOOLEAN NOT NULL DEFAULT false,
  "requires_manual_review" BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "flagged_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_risk_profiles
CREATE INDEX IF NOT EXISTS "user_risk_profiles_risk_level_idx" ON "user_risk_profiles"("risk_level");
CREATE INDEX IF NOT EXISTS "user_risk_profiles_risk_score_idx" ON "user_risk_profiles"("risk_score");
CREATE INDEX IF NOT EXISTS "user_risk_profiles_user_id_idx" ON "user_risk_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "user_risk_profiles_last_calculated_at_idx" ON "user_risk_profiles"("last_calculated_at");

COMMENT ON TABLE "user_risk_profiles" IS 'Stores user risk scores (0-100) with levels: LOW, MEDIUM, HIGH, CRITICAL. Includes risk factor breakdown and automated action flags.';
COMMENT ON COLUMN "user_risk_profiles"."risk_score" IS 'Overall risk score (0-100)';
COMMENT ON COLUMN "user_risk_profiles"."risk_level" IS 'Risk level: LOW (0-29), MEDIUM (30-49), HIGH (50-69), CRITICAL (70-100)';
COMMENT ON COLUMN "user_risk_profiles"."last_calculated_at" IS 'Timestamp of last risk score calculation';

-- ═══════════════════════════════════════════════════════════
-- 2. RISK FACTORS TABLE
-- ═══════════════════════════════════════════════════════════

-- Create risk_factors table for detailed risk factor tracking
CREATE TABLE IF NOT EXISTS "risk_factors" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "factor_type" TEXT NOT NULL, -- PROFILE, GEOGRAPHIC, TRANSACTION, BEHAVIORAL
  "factor_name" TEXT NOT NULL, -- kyc_status, account_age, country, volume_24h, etc.
  "factor_value" TEXT NOT NULL, -- Stored as string, parsed as needed
  "factor_score" INTEGER NOT NULL, -- Individual factor contribution to risk score
  "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for risk_factors
CREATE INDEX IF NOT EXISTS "risk_factors_user_id_idx" ON "risk_factors"("user_id");
CREATE INDEX IF NOT EXISTS "risk_factors_factor_type_idx" ON "risk_factors"("factor_type");
CREATE INDEX IF NOT EXISTS "risk_factors_user_id_calculated_at_idx" ON "risk_factors"("user_id", "calculated_at");

COMMENT ON TABLE "risk_factors" IS 'Stores individual risk factor values for detailed tracking and audit trail';
COMMENT ON COLUMN "risk_factors"."factor_type" IS 'Category: PROFILE, GEOGRAPHIC, TRANSACTION, BEHAVIORAL';
COMMENT ON COLUMN "risk_factors"."factor_name" IS 'Specific factor: kyc_status, account_age, country, volume_24h, self_tipping_score, etc.';
COMMENT ON COLUMN "risk_factors"."factor_value" IS 'Factor value stored as string (e.g., "NOT_STARTED", "14", "US", "50000")';
COMMENT ON COLUMN "risk_factors"."factor_score" IS 'Points contributed to overall risk score';

-- ═══════════════════════════════════════════════════════════
-- 3. FLAGGED TRANSACTIONS TABLE
-- ═══════════════════════════════════════════════════════════

-- Create or update flagged_transactions table
CREATE TABLE IF NOT EXISTS "flagged_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "transaction_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  
  -- Flag details
  "flag_reason" TEXT NOT NULL,
  "flag_type" TEXT NOT NULL, -- VELOCITY, SELF_TIPPING, CIRCULAR, HIGH_RISK, etc.
  "severity" TEXT NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
  "risk_score" INTEGER NOT NULL, -- Risk score at time of flagging
  
  -- Review workflow
  "status" TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, REVIEWED, APPROVED, BLOCKED
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "review_note" TEXT,
  
  -- Actions taken
  "action_taken" TEXT, -- NONE, BLOCKED, LIMITED, SUSPENDED
  
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for flagged_transactions
CREATE INDEX IF NOT EXISTS "flagged_transactions_user_id_idx" ON "flagged_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "flagged_transactions_status_idx" ON "flagged_transactions"("status");
CREATE INDEX IF NOT EXISTS "flagged_transactions_severity_idx" ON "flagged_transactions"("severity");
CREATE INDEX IF NOT EXISTS "flagged_transactions_flag_type_idx" ON "flagged_transactions"("flag_type");
CREATE INDEX IF NOT EXISTS "flagged_transactions_risk_score_idx" ON "flagged_transactions"("risk_score");
CREATE INDEX IF NOT EXISTS "flagged_transactions_created_at_idx" ON "flagged_transactions"("created_at");

COMMENT ON TABLE "flagged_transactions" IS 'Transactions flagged for suspicious activity and compliance review';
COMMENT ON COLUMN "flagged_transactions"."flag_type" IS 'Type of flag: VELOCITY, SELF_TIPPING, CIRCULAR, HIGH_RISK, OFAC_MATCH, etc.';
COMMENT ON COLUMN "flagged_transactions"."severity" IS 'Severity level: LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN "flagged_transactions"."risk_score" IS 'User risk score at time of flagging';
COMMENT ON COLUMN "flagged_transactions"."status" IS 'Review status: PENDING, REVIEWED, APPROVED, BLOCKED';

-- ═══════════════════════════════════════════════════════════
-- 4. VERIFICATION
-- ═══════════════════════════════════════════════════════════

-- Verify tables exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_risk_profiles') THEN
    RAISE NOTICE 'Table user_risk_profiles created successfully';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'risk_factors') THEN
    RAISE NOTICE 'Table risk_factors created successfully';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'flagged_transactions') THEN
    RAISE NOTICE 'Table flagged_transactions created successfully';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════
-- Tables created:
--   1. user_risk_profiles - User risk scores and compliance flags
--   2. risk_factors - Individual risk factor values for audit trail
--   3. flagged_transactions - Suspicious transactions for review
--
-- Indexes added:
--   - risk_score, risk_level, user_id, last_calculated_at (user_risk_profiles)
--   - user_id, factor_type, calculated_at (risk_factors)
--   - user_id, status, severity, flag_type, risk_score, created_at (flagged_transactions)
--
-- Requirements satisfied: 2.3.1, 2.3.2
-- ═══════════════════════════════════════════════════════════
