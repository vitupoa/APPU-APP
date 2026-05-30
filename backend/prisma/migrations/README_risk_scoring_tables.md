# Risk Scoring Tables Migration

## Overview
This migration implements Task 1.2 of the Wallet Compliance Restructuring spec: Create risk scoring tables for user risk assessment and suspicious activity monitoring.

## Tables Created

### 1. user_risk_profiles
Stores comprehensive user risk scores and compliance flags.

**Fields:**
- `id` - Primary key (UUID)
- `user_id` - Unique user identifier
- `risk_score` - Overall risk score (0-100)
- `risk_level` - Risk level enum: LOW, MEDIUM, HIGH, CRITICAL
- `kyc_risk_score` - KYC-related risk (0-30 points)
- `geographic_risk_score` - Geographic risk (0-20 points)
- `transaction_risk_score` - Transaction pattern risk (0-30 points)
- `behavioral_risk_score` - Behavioral risk (0-20 points)
- `self_tipping_score` - Self-tipping detection score (0-100)
- `circular_tipping_score` - Circular tipping detection score (0-100)
- `recipient_diversity` - Recipient diversity score (0-100)
- `withdrawal_blocked` - Automatic withdrawal block flag
- `transaction_limited` - Transaction limit flag
- `requires_manual_review` - Manual review required flag
- `last_calculated_at` - Timestamp of last calculation
- `flagged_reasons` - Array of flag reasons
- `created_at`, `updated_at` - Timestamps

**Indexes:**
- `risk_level` - For filtering by risk level
- `risk_score` - For sorting by risk score
- `user_id` - For user lookups
- `last_calculated_at` - For finding stale profiles

**Risk Levels:**
- LOW: 0-29 points
- MEDIUM: 30-49 points
- HIGH: 50-69 points
- CRITICAL: 70-100 points

### 2. risk_factors
Stores individual risk factor values for detailed tracking and audit trail.

**Fields:**
- `id` - Primary key (UUID)
- `user_id` - User identifier
- `factor_type` - Category: PROFILE, GEOGRAPHIC, TRANSACTION, BEHAVIORAL
- `factor_name` - Specific factor name (e.g., kyc_status, account_age, country)
- `factor_value` - Factor value stored as string
- `factor_score` - Points contributed to overall risk score
- `calculated_at` - Timestamp of calculation

**Indexes:**
- `user_id` - For user lookups
- `factor_type` - For filtering by category
- `user_id, calculated_at` - For historical tracking

**Factor Types:**
- **PROFILE**: kyc_status, account_age, email_verified, phone_verified
- **GEOGRAPHIC**: country, is_high_risk_country, ip_country_mismatch, vpn_detected
- **TRANSACTION**: volume_24h, volume_30d, rapid_transactions_1h, large_transactions_count
- **BEHAVIORAL**: self_tipping_score, circular_tipping_score, recipient_diversity, withdrawal_frequency

### 3. flagged_transactions
Stores transactions flagged for suspicious activity and compliance review.

**Fields:**
- `id` - Primary key (UUID)
- `transaction_id` - Transaction identifier
- `user_id` - User identifier
- `flag_reason` - Detailed reason for flagging
- `flag_type` - Type: VELOCITY, SELF_TIPPING, CIRCULAR, HIGH_RISK, OFAC_MATCH
- `severity` - Severity: LOW, MEDIUM, HIGH, CRITICAL
- `risk_score` - User risk score at time of flagging
- `status` - Review status: PENDING, REVIEWED, APPROVED, BLOCKED
- `reviewed_by` - Admin who reviewed
- `reviewed_at` - Review timestamp
- `review_note` - Review notes
- `action_taken` - Action: NONE, BLOCKED, LIMITED, SUSPENDED
- `created_at`, `updated_at` - Timestamps

**Indexes:**
- `user_id` - For user lookups
- `status` - For filtering pending reviews
- `severity` - For prioritizing reviews
- `flag_type` - For filtering by flag type
- `risk_score` - For sorting by risk
- `created_at` - For chronological sorting

## Requirements Satisfied

### Requirement 2.3.1: User Risk Profile
✅ Every user has a risk score (0-100)
✅ Risk level: LOW (0-29), MEDIUM (30-49), HIGH (50-69), CRITICAL (70-100)
✅ Risk score recalculated on every transaction
✅ High-risk users face automatic restrictions
✅ Risk factors include: KYC status, account age, geography, transaction patterns, behavioral signals

### Requirement 2.3.2: Automated Risk Actions
✅ CRITICAL (70-100): Suspend account, block withdrawals, require manual review
✅ HIGH (50-69): Require KYC, limit transactions, flag for review
✅ MEDIUM (30-49): Enhanced monitoring, suggest KYC
✅ LOW (0-29): Standard monitoring

## Schema Changes

### Prisma Schema Updates
1. **Removed duplicate model definitions** - Consolidated into single comprehensive definitions
2. **Updated risk_level field** - Changed from String to RiskLevel enum for type safety
3. **Added risk_factors table** - New table for detailed risk factor tracking
4. **Added indexes** - Performance indexes on risk_score, risk_level, created_at, last_calculated_at

### Migration File
- Location: `backend/prisma/migrations/add_risk_scoring_tables.sql`
- Safe to run multiple times (uses `CREATE TABLE IF NOT EXISTS`)
- Includes verification queries
- Includes table and column comments for documentation

## Running the Migration

### Option 1: Using Prisma (Recommended)
```bash
cd backend
npx prisma db push
```

### Option 2: Manual SQL Execution
```bash
psql $DATABASE_URL < backend/prisma/migrations/add_risk_scoring_tables.sql
```

### Option 3: Railway CLI
```bash
railway run psql < backend/prisma/migrations/add_risk_scoring_tables.sql
```

## Verification

After running the migration, verify the tables exist:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_risk_profiles', 'risk_factors', 'flagged_transactions');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('user_risk_profiles', 'risk_factors', 'flagged_transactions');

-- Check table structure
\d user_risk_profiles
\d risk_factors
\d flagged_transactions
```

## Integration Points

### Services Using These Tables
1. **Risk Scoring Service** (`backend/src/services/compliance/riskScoring.service.ts`)
   - Calculates and updates user_risk_profiles
   - Stores individual risk_factors for audit trail
   - Flags transactions in flagged_transactions

2. **Transaction Validation Service** (`backend/src/services/compliance/transactionValidation.service.ts`)
   - Checks user_risk_profiles before allowing transactions
   - Flags suspicious transactions in flagged_transactions

3. **Compliance Dashboard** (`backend/src/modules/compliance/compliance.controller.ts`)
   - Displays flagged_transactions for review
   - Shows user_risk_profiles for monitoring
   - Allows manual review and action

### API Endpoints
- `GET /api/v1/compliance/risk-profile/:userId` - Get user risk profile
- `POST /api/v1/compliance/risk-profile/:userId/recalculate` - Recalculate risk
- `GET /api/v1/compliance/flagged-transactions` - List flagged transactions
- `PUT /api/v1/compliance/flagged-transactions/:flagId/review` - Review transaction

## Performance Considerations

### Indexes
All critical query paths are indexed:
- User lookups: `user_id` indexes on all tables
- Risk filtering: `risk_level`, `risk_score` indexes
- Review workflow: `status`, `severity` indexes
- Time-based queries: `created_at`, `last_calculated_at` indexes

### Caching Strategy
- Risk profiles cached for 24 hours (stale threshold)
- Recalculated on every transaction
- Background job recalculates HIGH/CRITICAL users every 6 hours

### Query Optimization
- Use composite indexes for common query patterns
- Limit result sets with pagination
- Use `SELECT` specific columns instead of `SELECT *`

## Monitoring

### Key Metrics to Track
1. **Risk Score Distribution**
   ```sql
   SELECT risk_level, COUNT(*) 
   FROM user_risk_profiles 
   GROUP BY risk_level;
   ```

2. **Flagged Transactions by Severity**
   ```sql
   SELECT severity, COUNT(*) 
   FROM flagged_transactions 
   WHERE status = 'PENDING' 
   GROUP BY severity;
   ```

3. **Stale Risk Profiles**
   ```sql
   SELECT COUNT(*) 
   FROM user_risk_profiles 
   WHERE last_calculated_at < NOW() - INTERVAL '24 hours';
   ```

## Rollback

If you need to rollback this migration:

```sql
-- Drop tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS "flagged_transactions" CASCADE;
DROP TABLE IF EXISTS "risk_factors" CASCADE;
DROP TABLE IF EXISTS "user_risk_profiles" CASCADE;
```

## Next Steps

After running this migration:

1. ✅ **Verify tables exist** - Run verification queries
2. ⏭️ **Deploy services** - Deploy risk scoring and validation services
3. ⏭️ **Test risk calculation** - Test with sample users
4. ⏭️ **Monitor performance** - Track query performance and optimize if needed
5. ⏭️ **Set up alerts** - Alert on CRITICAL risk users and high-severity flags

## Related Files

- Spec: `.kiro/specs/wallet-compliance-restructuring/requirements.md`
- Design: `.kiro/specs/wallet-compliance-restructuring/design.md`
- Tasks: `.kiro/specs/wallet-compliance-restructuring/tasks.md`
- Schema: `backend/prisma/schema.prisma`
- Migration: `backend/prisma/migrations/add_risk_scoring_tables.sql`
- Implementation: `COMPLIANCE_IMPLEMENTATION.md`

## Support

For questions or issues:
1. Check this README
2. Review the requirements document
3. Check the implementation guide
4. Contact the development team
