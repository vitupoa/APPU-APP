-- Migration Script: Add default context to existing transactions
-- This script adds default context to transactions that don't have context fields

-- Step 1: Add default context to tip transactions
UPDATE transactions
SET 
  context_type = 'CONTENT_TIP',
  context_desc = 'Legacy tip transaction (migrated)',
  transaction_type = 'CONTENT_TIP'
WHERE type = 'tip_sent' 
  AND context_type IS NULL;

UPDATE transactions
SET 
  context_type = 'CONTENT_TIP',
  context_desc = 'Legacy tip received (migrated)',
  transaction_type = 'CONTENT_TIP'
WHERE type = 'tip_received' 
  AND context_type IS NULL;

-- Step 2: Add default context to subscription transactions
UPDATE transactions
SET 
  context_type = 'SUBSCRIPTION',
  context_desc = 'Legacy subscription payment (migrated)',
  transaction_type = 'SUBSCRIPTION'
WHERE type = 'subscription' 
  AND context_type IS NULL;

-- Step 3: Add default context to contest transactions
UPDATE transactions
SET 
  context_type = 'CONTEST_ENTRY',
  context_desc = 'Legacy contest transaction (migrated)',
  transaction_type = 'CONTEST_ENTRY'
WHERE type = 'contest_escrow' 
  AND context_type IS NULL;

UPDATE transactions
SET 
  context_type = 'CONTEST_PRIZE',
  context_desc = 'Legacy contest prize (migrated)',
  transaction_type = 'CONTEST_PRIZE'
WHERE type = 'contest_prize' 
  AND context_type IS NULL;

-- Step 4: Add default context to topup/withdrawal transactions
UPDATE transactions
SET 
  context_type = 'TOPUP',
  context_desc = 'Wallet top-up',
  transaction_type = 'TOPUP'
WHERE type = 'topup' 
  AND context_type IS NULL;

UPDATE transactions
SET 
  context_type = 'WITHDRAWAL',
  context_desc = 'Wallet withdrawal',
  transaction_type = 'WITHDRAWAL'
WHERE type = 'withdrawal' 
  AND context_type IS NULL;

-- Step 5: Add default context to platform fee transactions
UPDATE transactions
SET 
  context_type = 'PLATFORM_FEE',
  context_desc = 'Platform fee',
  transaction_type = 'PLATFORM_FEE'
WHERE type = 'platform_fee' 
  AND context_type IS NULL;

-- Step 6: Calculate initial risk scores for all users
-- This will be done via a Node.js script, not SQL

-- Step 7: Initialize withdrawal limits for all users
INSERT INTO withdrawal_limits (user_id, daily_limit_kr, withdrawn_today_kr, last_reset_date)
SELECT 
  id,
  500000, -- Default limit
  0,
  CURRENT_DATE
FROM "User"
WHERE id NOT IN (SELECT user_id FROM withdrawal_limits)
ON CONFLICT (user_id) DO NOTHING;

-- Step 8: Initialize user risk profiles
INSERT INTO user_risk_profiles (user_id, risk_score, risk_level, last_calculated_at)
SELECT 
  id,
  0, -- Will be calculated by service
  'LOW',
  NOW()
FROM "User"
WHERE id NOT IN (SELECT user_id FROM user_risk_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Step 9: Mark all existing contests as validated
UPDATE "Contest"
SET 
  is_legal_structure = true,
  validation_errors = '{}'::jsonb
WHERE is_legal_structure IS NULL;

-- Step 10: Set default judging method for existing contests
UPDATE "Contest"
SET judging_method = 'VOTES_ONLY'
WHERE judging_method IS NULL;

-- Step 11: Set default KYC requirements for existing chamas
UPDATE "Chama"
SET kyc_verified_members_only = true
WHERE kyc_verified_members_only IS NULL;

-- Verification queries
SELECT 'Transactions without context' as check_name, COUNT(*) as count
FROM transactions
WHERE context_type IS NULL;

SELECT 'Users without risk profiles' as check_name, COUNT(*) as count
FROM "User"
WHERE id NOT IN (SELECT user_id FROM user_risk_profiles);

SELECT 'Users without withdrawal limits' as check_name, COUNT(*) as count
FROM "User"
WHERE id NOT IN (SELECT user_id FROM withdrawal_limits);

SELECT 'Contests without validation' as check_name, COUNT(*) as count
FROM "Contest"
WHERE is_legal_structure IS NULL;
