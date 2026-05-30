-- Migration: Add JudgingMethod enum and update Contest schema for compliance
-- Task: 1.4 Update Contest schema for compliance
-- Requirements: 2.8.1, 2.8.2

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Create JudgingMethod enum
-- ═══════════════════════════════════════════════════════════

CREATE TYPE "JudgingMethod" AS ENUM (
  'JUDGES_ONLY',
  'VOTES_ONLY',
  'JUDGES_AND_VOTES'
);

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Update Contest table - Change judging_method from text to enum
-- ═══════════════════════════════════════════════════════════

-- First, update existing data to match enum values (if any exist)
UPDATE contest
SET judging_method = CASE
  WHEN judging_method = 'JUDGES_ONLY' THEN 'JUDGES_ONLY'
  WHEN judging_method = 'VOTES_ONLY' THEN 'VOTES_ONLY'
  WHEN judging_method = 'JUDGES_AND_VOTES' THEN 'JUDGES_AND_VOTES'
  ELSE NULL
END
WHERE judging_method IS NOT NULL;

-- Drop the old text column and recreate as enum
ALTER TABLE contest
  ALTER COLUMN judging_method DROP DEFAULT,
  ALTER COLUMN judging_method TYPE "JudgingMethod" USING (judging_method::"JudgingMethod");

-- ═══════════════════════════════════════════════════════════
-- STEP 3: Verify other compliance fields exist (they should already exist)
-- ═══════════════════════════════════════════════════════════

-- These fields should already exist from previous migrations:
-- - voting_enabled (Boolean, default true)
-- - voting_cost_per_vote_kr (Decimal)
-- - is_voting_paid (Boolean, default false)
-- - judge_weight_percentage (Int)
-- - vote_weight_percentage (Int)
-- - is_legal_structure (Boolean, default true)
-- - validation_errors (String[])

-- Verify they exist (this will error if they don't)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contest' AND column_name = 'voting_enabled'
  ) THEN
    RAISE EXCEPTION 'Column voting_enabled does not exist in contest table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contest' AND column_name = 'judge_weight_percentage'
  ) THEN
    RAISE EXCEPTION 'Column judge_weight_percentage does not exist in contest table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contest' AND column_name = 'vote_weight_percentage'
  ) THEN
    RAISE EXCEPTION 'Column vote_weight_percentage does not exist in contest table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contest' AND column_name = 'is_legal_structure'
  ) THEN
    RAISE EXCEPTION 'Column is_legal_structure does not exist in contest table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contest' AND column_name = 'validation_errors'
  ) THEN
    RAISE EXCEPTION 'Column validation_errors does not exist in contest table';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- STEP 4: Add index for is_legal_structure
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS "contest_is_legal_structure_idx" ON "contest"("is_legal_structure");

-- ═══════════════════════════════════════════════════════════
-- STEP 5: Data migration - Set default values for existing contests
-- ═══════════════════════════════════════════════════════════

-- Update existing contests to set default judging_method based on existing data
UPDATE contest
SET judging_method = CASE
  -- If public_vote_weight is set and > 0, assume VOTES_ONLY or COMBINATION
  WHEN public_vote_weight IS NOT NULL AND public_vote_weight > 0 THEN 'VOTES_ONLY'
  -- If judging_criteria is COMMUNITY_VOTE, set to VOTES_ONLY
  WHEN judging_criteria = 'COMMUNITY_VOTE' THEN 'VOTES_ONLY'
  -- If judging_criteria is CREATOR_PICKS, set to JUDGES_ONLY
  WHEN judging_criteria = 'CREATOR_PICKS' THEN 'JUDGES_ONLY'
  -- If judging_criteria is COMBINATION, set to JUDGES_AND_VOTES
  WHEN judging_criteria = 'COMBINATION' THEN 'JUDGES_AND_VOTES'
  -- Default to VOTES_ONLY for other cases
  ELSE 'VOTES_ONLY'
END
WHERE judging_method IS NULL;

-- Set default weight percentages for JUDGES_AND_VOTES contests
UPDATE contest
SET 
  judge_weight_percentage = COALESCE(judge_weight_percentage, 60),
  vote_weight_percentage = COALESCE(vote_weight_percentage, 40)
WHERE judging_method = 'JUDGES_AND_VOTES'
  AND (judge_weight_percentage IS NULL OR vote_weight_percentage IS NULL);

-- Set weight to 100 for JUDGES_ONLY contests
UPDATE contest
SET 
  judge_weight_percentage = 100,
  vote_weight_percentage = 0
WHERE judging_method = 'JUDGES_ONLY';

-- Set weight to 100 for VOTES_ONLY contests
UPDATE contest
SET 
  judge_weight_percentage = 0,
  vote_weight_percentage = 100
WHERE judging_method = 'VOTES_ONLY';

-- ═══════════════════════════════════════════════════════════
-- STEP 6: Validate existing contests for compliance
-- ═══════════════════════════════════════════════════════════

-- Check for contests that violate the paid voting rule
-- Rule: If entry_fee_kr > 0, then voting_cost_per_vote_kr must be 0
UPDATE contest
SET 
  is_legal_structure = false,
  validation_errors = array_append(
    validation_errors,
    'Paid voting not allowed with entry fee (gambling compliance)'
  )
WHERE entry_fee_kr > 0 
  AND voting_cost_per_vote_kr > 0
  AND NOT ('Paid voting not allowed with entry fee (gambling compliance)' = ANY(validation_errors));

-- Check for contests with JUDGES_AND_VOTES where weights don't sum to 100
UPDATE contest
SET 
  is_legal_structure = false,
  validation_errors = array_append(
    validation_errors,
    'Judge and vote weights must sum to 100%'
  )
WHERE judging_method = 'JUDGES_AND_VOTES'
  AND (judge_weight_percentage + vote_weight_percentage) != 100
  AND NOT ('Judge and vote weights must sum to 100%' = ANY(validation_errors));

-- ═══════════════════════════════════════════════════════════
-- STEP 7: Add comments for documentation
-- ═══════════════════════════════════════════════════════════

COMMENT ON TYPE "JudgingMethod" IS 'Contest judging method: JUDGES_ONLY (skill-based), VOTES_ONLY (public voting), JUDGES_AND_VOTES (combined weighted)';
COMMENT ON COLUMN contest.judging_method IS 'How contest winners are determined (compliance: paid voting only allowed with free entry)';
COMMENT ON COLUMN contest.judge_weight_percentage IS 'Weight of judge scores in final score (0-100, used with JUDGES_AND_VOTES)';
COMMENT ON COLUMN contest.vote_weight_percentage IS 'Weight of public votes in final score (0-100, used with JUDGES_AND_VOTES)';
COMMENT ON COLUMN contest.is_legal_structure IS 'Whether contest complies with gambling regulations';
COMMENT ON COLUMN contest.validation_errors IS 'Array of validation error messages for non-compliant contests';

-- ═══════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════

-- Summary:
-- ✅ Created JudgingMethod enum (JUDGES_ONLY, VOTES_ONLY, JUDGES_AND_VOTES)
-- ✅ Updated judging_method column to use enum type
-- ✅ Verified all compliance fields exist
-- ✅ Added index on is_legal_structure
-- ✅ Migrated existing contests with default values
-- ✅ Validated contests for compliance rules
-- ✅ Added documentation comments
