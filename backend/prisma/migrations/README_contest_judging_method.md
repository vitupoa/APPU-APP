# Contest Schema Update - JudgingMethod Enum Migration

## Overview
This migration adds the `JudgingMethod` enum to the Contest schema and updates related fields for gambling compliance.

**Task:** 1.4 Update Contest schema for compliance  
**Requirements:** 2.8.1, 2.8.2  
**Spec:** wallet-compliance-restructuring

## Changes Made

### 1. New Enum Type
Created `JudgingMethod` enum with three values:
- `JUDGES_ONLY` - Contest winners determined by judges only (skill-based)
- `VOTES_ONLY` - Contest winners determined by public voting
- `JUDGES_AND_VOTES` - Combined judging with weighted scores

### 2. Schema Updates
- Changed `judging_method` field from `String?` to `JudgingMethod?`
- Verified existence of compliance fields:
  - `voting_enabled` (Boolean, default true)
  - `voting_cost_per_vote_kr` (Decimal)
  - `is_voting_paid` (Boolean, default false)
  - `judge_weight_percentage` (Int, 0-100)
  - `vote_weight_percentage` (Int, 0-100)
  - `is_legal_structure` (Boolean, default true)
  - `validation_errors` (String[])

### 3. New Index
Added index on `is_legal_structure` for efficient filtering of non-compliant contests:
```sql
CREATE INDEX "contest_is_legal_structure_idx" ON "contest"("is_legal_structure");
```

### 4. Data Migration
Existing contests are automatically migrated with default values:
- Contests with `judging_criteria = 'COMMUNITY_VOTE'` → `judging_method = 'VOTES_ONLY'`
- Contests with `judging_criteria = 'CREATOR_PICKS'` → `judging_method = 'JUDGES_ONLY'`
- Contests with `judging_criteria = 'COMBINATION'` → `judging_method = 'JUDGES_AND_VOTES'`
- Default weight percentages set based on judging method

### 5. Validation Rules
The migration validates existing contests against compliance rules:

**Rule 1: No Paid Voting with Entry Fee**
```
IF entry_fee_kr > 0 AND voting_cost_per_vote_kr > 0
THEN is_legal_structure = false
```

**Rule 2: Weights Must Sum to 100%**
```
IF judging_method = 'JUDGES_AND_VOTES'
AND (judge_weight_percentage + vote_weight_percentage) ≠ 100
THEN is_legal_structure = false
```

## Running the Migration

### Option 1: Using Prisma Migrate (Recommended)
```bash
cd backend
npx prisma migrate dev --name add_contest_judging_method_enum
```

### Option 2: Manual SQL Execution
```bash
cd backend
psql -U your_username -d your_database -f prisma/migrations/add_contest_judging_method_enum.sql
```

### Option 3: Using Prisma Studio
```bash
cd backend
npx prisma db push
```

## Verification

### 1. Check Enum Creation
```sql
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'JudgingMethod'::regtype;
```

Expected output:
```
 enumlabel
-----------------
 JUDGES_ONLY
 VOTES_ONLY
 JUDGES_AND_VOTES
```

### 2. Check Column Type
```sql
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'contest' 
AND column_name = 'judging_method';
```

Expected output:
```
 column_name    | data_type      | udt_name
----------------+----------------+---------------
 judging_method | USER-DEFINED   | JudgingMethod
```

### 3. Check Index
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'contest' 
AND indexname = 'contest_is_legal_structure_idx';
```

### 4. Check Data Migration
```sql
-- Count contests by judging method
SELECT judging_method, COUNT(*) 
FROM contest 
GROUP BY judging_method;

-- Check for non-compliant contests
SELECT id, title, is_legal_structure, validation_errors
FROM contest
WHERE is_legal_structure = false;
```

## Rollback

If you need to rollback this migration:

```sql
-- 1. Drop the index
DROP INDEX IF EXISTS contest_is_legal_structure_idx;

-- 2. Convert judging_method back to text
ALTER TABLE contest
  ALTER COLUMN judging_method TYPE text;

-- 3. Drop the enum
DROP TYPE IF EXISTS "JudgingMethod";
```

## Impact Analysis

### Database
- **Tables Modified:** 1 (contest)
- **New Enums:** 1 (JudgingMethod)
- **New Indexes:** 1 (contest_is_legal_structure_idx)
- **Data Migration:** All existing contests updated

### Application Code
- **Files Updated:** 
  - `backend/prisma/schema.prisma` - Schema definition
  - `backend/src/services/compliance/contestValidation.service.ts` - Type imports

### API
- **Breaking Changes:** None (judging_method was already optional)
- **New Validations:** Enum validation enforced at database level

## Testing

### Unit Tests
Run the contest validation service tests:
```bash
npm test -- contestValidation.service.test.ts
```

### Integration Tests
Test contest creation with different judging methods:
```bash
npm test -- contest.integration.test.ts
```

### Manual Testing
1. Create contest with `JUDGES_ONLY`
2. Create contest with `VOTES_ONLY`
3. Create contest with `JUDGES_AND_VOTES` (verify weights sum to 100)
4. Try to create contest with entry fee + paid voting (should fail)

## Related Files
- Migration SQL: `prisma/migrations/add_contest_judging_method_enum.sql`
- Schema: `prisma/schema.prisma`
- Validation Service: `src/services/compliance/contestValidation.service.ts`
- Requirements: `.kiro/specs/wallet-compliance-restructuring/requirements.md`
- Design: `.kiro/specs/wallet-compliance-restructuring/design.md`

## Notes
- This migration is part of the wallet compliance restructuring initiative
- The enum enforces type safety at the database level
- Existing contests are automatically validated and flagged if non-compliant
- The `is_legal_structure` flag allows contests to be created but flagged for review
- Validation errors are stored in the `validation_errors` array for audit purposes

## Support
For questions or issues, refer to:
- Requirements: Section 2.8 (Contest Module Compliance)
- Design Document: Contest Validation section
- Task: 1.4 in tasks.md
