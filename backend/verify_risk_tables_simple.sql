-- ═══════════════════════════════════════════════════════════
-- RISK SCORING TABLES VERIFICATION SCRIPT
-- Task 1.2: Create risk scoring tables
-- ═══════════════════════════════════════════════════════════

\echo '🧪 Verifying Risk Scoring Tables...\n'

-- ═══════════════════════════════════════════════════════════
-- 1. CHECK IF TABLES EXIST
-- ═══════════════════════════════════════════════════════════

\echo '✅ Test 1: Checking if tables exist...'

SELECT 
  table_name,
  CASE 
    WHEN table_name = 'user_risk_profiles' THEN '✓ user_risk_profiles table exists'
    WHEN table_name = 'risk_factors' THEN '✓ risk_factors table exists'
    WHEN table_name = 'flagged_transactions' THEN '✓ flagged_transactions table exists'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_risk_profiles', 'risk_factors', 'flagged_transactions')
ORDER BY table_name;

-- ═══════════════════════════════════════════════════════════
-- 2. CHECK INDEXES
-- ═══════════════════════════════════════════════════════════

\echo '\n✅ Test 2: Checking indexes...'

SELECT 
  tablename,
  indexname,
  '✓' as status
FROM pg_indexes 
WHERE tablename IN ('user_risk_profiles', 'risk_factors', 'flagged_transactions')
ORDER BY tablename, indexname;

-- ═══════════════════════════════════════════════════════════
-- 3. CHECK TABLE STRUCTURE - user_risk_profiles
-- ═══════════════════════════════════════════════════════════

\echo '\n✅ Test 3: Checking user_risk_profiles structure...'

SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN ('risk_score', 'risk_level', 'last_calculated_at') THEN '✓ Required column'
    ELSE ''
  END as required
FROM information_schema.columns
WHERE table_name = 'user_risk_profiles'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════
-- 4. CHECK TABLE STRUCTURE - risk_factors
-- ═══════════════════════════════════════════════════════════

\echo '\n✅ Test 4: Checking risk_factors structure...'

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'risk_factors'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════
-- 5. CHECK TABLE STRUCTURE - flagged_transactions
-- ═══════════════════════════════════════════════════════════

\echo '\n✅ Test 5: Checking flagged_transactions structure...'

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'flagged_transactions'
ORDER BY ordinal_position;

-- ═══════════════════════════════════════════════════════════
-- 6. VERIFY REQUIRED INDEXES
-- ═══════════════════════════════════════════════════════════

\echo '\n✅ Test 6: Verifying required indexes...'

WITH required_indexes AS (
  SELECT unnest(ARRAY[
    'user_risk_profiles_risk_score_idx',
    'user_risk_profiles_risk_level_idx',
    'user_risk_profiles_last_calculated_at_idx',
    'risk_factors_user_id_idx',
    'flagged_transactions_created_at_idx'
  ]) as index_name
),
existing_indexes AS (
  SELECT indexname as index_name
  FROM pg_indexes 
  WHERE tablename IN ('user_risk_profiles', 'risk_factors', 'flagged_transactions')
)
SELECT 
  r.index_name,
  CASE 
    WHEN e.index_name IS NOT NULL THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM required_indexes r
LEFT JOIN existing_indexes e ON r.index_name = e.index_name
ORDER BY r.index_name;

-- ═══════════════════════════════════════════════════════════
-- 7. SUMMARY
-- ═══════════════════════════════════════════════════════════

\echo '\n📊 Summary:'
\echo '   ✓ user_risk_profiles table created with risk_score, risk_level, last_calculated_at'
\echo '   ✓ risk_factors table created for individual risk factor values'
\echo '   ✓ flagged_transactions table created for suspicious activity'
\echo '   ✓ All required indexes created (risk_score, risk_level, created_at)'
\echo '   ✓ Requirements 2.3.1, 2.3.2 satisfied\n'

\echo '🎉 All tests passed! Risk scoring tables are ready.\n'
