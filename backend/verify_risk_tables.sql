-- Verify risk scoring tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_risk_profiles', 'risk_factors', 'flagged_transactions')
ORDER BY table_name;

-- Check indexes on user_risk_profiles
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'user_risk_profiles'
ORDER BY indexname;

-- Check indexes on risk_factors
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'risk_factors'
ORDER BY indexname;

-- Check indexes on flagged_transactions
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'flagged_transactions'
ORDER BY indexname;

-- Check table structure for user_risk_profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_risk_profiles'
ORDER BY ordinal_position;

-- Check table structure for risk_factors
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'risk_factors'
ORDER BY ordinal_position;

-- Check table structure for flagged_transactions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'flagged_transactions'
ORDER BY ordinal_position;
