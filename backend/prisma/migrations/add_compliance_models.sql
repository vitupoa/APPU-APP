-- Compliance Models Migration
-- This migration adds all compliance-related tables for wallet restructuring

-- User Risk Profiles for compliance monitoring
CREATE TABLE IF NOT EXISTS "user_risk_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL UNIQUE,
  "risk_score" INTEGER NOT NULL DEFAULT 0,
  "risk_level" TEXT NOT NULL DEFAULT 'LOW',
  
  -- Risk factors
  "kyc_risk_score" INTEGER NOT NULL DEFAULT 0,
  "geographic_risk_score" INTEGER NOT NULL DEFAULT 0,
  "transaction_risk_score" INTEGER NOT NULL DEFAULT 0,
  "behavioral_risk_score" INTEGER NOT NULL DEFAULT 0,
  
  -- Flags
  "self_tipping_score" INTEGER NOT NULL DEFAULT 0,
  "circular_tipping_score" INTEGER NOT NULL DEFAULT 0,
  "recipient_diversity" INTEGER NOT NULL DEFAULT 100,
  
  -- Actions
  "withdrawal_blocked" BOOLEAN NOT NULL DEFAULT false,
  "transaction_limited" BOOLEAN NOT NULL DEFAULT false,
  "requires_manual_review" BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "flagged_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "user_risk_profiles_risk_level_idx" ON "user_risk_profiles"("risk_level");
CREATE INDEX IF NOT EXISTS "user_risk_profiles_risk_score_idx" ON "user_risk_profiles"("risk_score");
CREATE INDEX IF NOT EXISTS "user_risk_profiles_user_id_idx" ON "user_risk_profiles"("user_id");

-- Device Fingerprints for fraud detection (server-side)
CREATE TABLE IF NOT EXISTS "device_fingerprints" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "fingerprint_hash" TEXT NOT NULL,
  
  -- Device info
  "user_agent" TEXT NOT NULL,
  "ip_address" TEXT NOT NULL,
  "browser" TEXT,
  "os" TEXT,
  "device_type" TEXT,
  
  -- Tracking
  "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "request_count" INTEGER NOT NULL DEFAULT 1,
  
  -- Flags
  "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
  "shared_with_users" TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "device_fingerprints_user_id_fingerprint_hash_key" UNIQUE ("user_id", "fingerprint_hash")
);

CREATE INDEX IF NOT EXISTS "device_fingerprints_fingerprint_hash_idx" ON "device_fingerprints"("fingerprint_hash");
CREATE INDEX IF NOT EXISTS "device_fingerprints_ip_address_idx" ON "device_fingerprints"("ip_address");
CREATE INDEX IF NOT EXISTS "device_fingerprints_is_suspicious_idx" ON "device_fingerprints"("is_suspicious");

-- Locked Chat Tasks (task-based service model)
CREATE TABLE IF NOT EXISTS "locked_chat_tasks" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "creator_id" TEXT NOT NULL,
  
  -- Task details
  "task_description" TEXT NOT NULL,
  "amount_kr" DECIMAL(18,4) NOT NULL,
  
  -- Status
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "deadline" TIMESTAMP(3) NOT NULL,
  
  -- Deliverable
  "deliverable_url" TEXT,
  "deliverable_type" TEXT,
  
  -- Timestamps
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "started_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "expired_at" TIMESTAMP(3),
  
  -- Chat access
  "chat_unlocked_until" TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "locked_chat_tasks_user_id_idx" ON "locked_chat_tasks"("user_id");
CREATE INDEX IF NOT EXISTS "locked_chat_tasks_creator_id_idx" ON "locked_chat_tasks"("creator_id");
CREATE INDEX IF NOT EXISTS "locked_chat_tasks_status_idx" ON "locked_chat_tasks"("status");
CREATE INDEX IF NOT EXISTS "locked_chat_tasks_creator_id_status_idx" ON "locked_chat_tasks"("creator_id", "status");

-- OFAC Sanctions Screening Cache
CREATE TABLE IF NOT EXISTS "ofac_screening_cache" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "name_normalized" TEXT NOT NULL UNIQUE,
  
  -- Match result
  "is_match" BOOLEAN NOT NULL DEFAULT false,
  "match_score" INTEGER,
  "matched_entry" TEXT,
  
  -- Cache metadata
  "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "list_version" TEXT,
  "expires_at" TIMESTAMP(3) NOT NULL,
  
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ofac_screening_cache_is_match_idx" ON "ofac_screening_cache"("is_match");
CREATE INDEX IF NOT EXISTS "ofac_screening_cache_expires_at_idx" ON "ofac_screening_cache"("expires_at");

-- Transaction Context (mandatory for all transactions)
CREATE TABLE IF NOT EXISTS "transaction_contexts" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "transaction_id" TEXT NOT NULL UNIQUE,
  
  -- Context type and reference
  "context_type" TEXT NOT NULL,
  "reference_id" TEXT,
  "description" TEXT NOT NULL,
  
  -- Additional context
  "content_type" TEXT,
  "metadata" JSONB,
  
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "transaction_contexts_context_type_idx" ON "transaction_contexts"("context_type");
CREATE INDEX IF NOT EXISTS "transaction_contexts_reference_id_idx" ON "transaction_contexts"("reference_id");

-- Compliance Dashboard - Flagged Transactions
CREATE TABLE IF NOT EXISTS "flagged_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "transaction_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  
  -- Flag details
  "flag_reason" TEXT NOT NULL,
  "flag_type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  
  -- Review
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "review_note" TEXT,
  
  -- Actions taken
  "action_taken" TEXT,
  
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "flagged_transactions_user_id_idx" ON "flagged_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "flagged_transactions_status_idx" ON "flagged_transactions"("status");
CREATE INDEX IF NOT EXISTS "flagged_transactions_severity_idx" ON "flagged_transactions"("severity");
CREATE INDEX IF NOT EXISTS "flagged_transactions_flag_type_idx" ON "flagged_transactions"("flag_type");

-- Locked Chat Settings (per creator)
CREATE TABLE IF NOT EXISTS "locked_chat_settings" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "creator_id" TEXT NOT NULL UNIQUE,
  
  -- Settings
  "is_locked" BOOLEAN NOT NULL DEFAULT false,
  "task_fee_kr" DECIMAL(18,4) NOT NULL,
  "typical_delivery_time" TEXT,
  
  -- Stats
  "total_tasks_completed" INTEGER NOT NULL DEFAULT 0,
  "average_rating" DECIMAL(3,2),
  
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "locked_chat_settings_creator_id_idx" ON "locked_chat_settings"("creator_id");
CREATE INDEX IF NOT EXISTS "locked_chat_settings_is_locked_idx" ON "locked_chat_settings"("is_locked");

-- Suspicious Activity Logs
CREATE TABLE IF NOT EXISTS "suspicious_activity_logs" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "activityType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "suspicious_activity_logs_user_id_idx" ON "suspicious_activity_logs"("user_id");
CREATE INDEX IF NOT EXISTS "suspicious_activity_logs_severity_idx" ON "suspicious_activity_logs"("severity");
CREATE INDEX IF NOT EXISTS "suspicious_activity_logs_activityType_idx" ON "suspicious_activity_logs"("activityType");

-- Add compliance fields to existing transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "context_type" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "context_ref_id" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "context_desc" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "risk_score" INTEGER DEFAULT 0;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "device_fingerprint" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "ip_address" TEXT;

-- Add compliance fields to Contest table
ALTER TABLE "contest" ADD COLUMN IF NOT EXISTS "voting_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "contest" ADD COLUMN IF NOT EXISTS "voting_cost_per_vote_kr" DECIMAL(18,4);
ALTER TABLE "contest" ADD COLUMN IF NOT EXISTS "is_voting_paid" BOOLEAN DEFAULT false;
ALTER TABLE "contest" ADD COLUMN IF NOT EXISTS "judging_method" TEXT;
ALTER TABLE "contest" ADD COLUMN IF NOT EXISTS "judge_weight_percentage" INTEGER;
ALTER TABLE "contest" ADD COLUMN IF NOT EXISTS "vote_weight_percentage" INTEGER;
ALTER TABLE "contest" ADD COLUMN IF NOT EXISTS "is_legal_structure" BOOLEAN DEFAULT true;
ALTER TABLE "contest" ADD COLUMN IF NOT EXISTS "validation_errors" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update ChamaType enum to only allow MERRY_GO_ROUND and WELFARE
-- Note: This requires manual intervention if there are existing INVESTMENT chamas
-- You may need to migrate or delete them first

COMMENT ON TABLE "user_risk_profiles" IS 'Stores user risk scores and compliance flags';
COMMENT ON TABLE "device_fingerprints" IS 'Tracks device fingerprints for fraud detection';
COMMENT ON TABLE "locked_chat_tasks" IS 'Task-based locked chat access (like Cameo/Fiverr)';
COMMENT ON TABLE "ofac_screening_cache" IS 'Cache for OFAC sanctions screening results';
COMMENT ON TABLE "transaction_contexts" IS 'Mandatory context for all transactions';
COMMENT ON TABLE "flagged_transactions" IS 'Transactions flagged for compliance review';
COMMENT ON TABLE "locked_chat_settings" IS 'Creator settings for locked chat feature';
COMMENT ON TABLE "suspicious_activity_logs" IS 'Logs of suspicious activities for compliance monitoring';
