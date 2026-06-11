# Database Backfill Fix for Comments API

## Problem
The comments API was failing with JSON serialization errors because some users in the database have NULL values for `display_name` and `is_verified` fields, even though these fields are defined as NOT NULL in the schema.

## Root Cause
Old user records were created before proper defaults were enforced, leaving NULL values in these required fields.

## Solution
Run a database migration to backfill NULL values:

### Local Development
```bash
cd backend
npm run ts-node scripts/backfill-user-fields.ts
```

### Production (Railway)
```bash
# Option 1: Via Railway CLI
railway run npm run ts-node scripts/backfill-user-fields.ts

# Option 2: Add to package.json scripts and run
npm run backfill-users
```

## What the Migration Does

1. **display_name**: Sets to `username` if NULL
2. **is_verified**: Sets to `false` if NULL

## SQL Equivalent (if you prefer direct SQL)

```sql
-- Update display_name
UPDATE "user" 
SET display_name = username 
WHERE display_name IS NULL;

-- Update is_verified  
UPDATE "user" 
SET is_verified = false 
WHERE is_verified IS NULL;
```

## Verification

After running the migration, verify:

```sql
-- Check for any remaining NULLs
SELECT COUNT(*) FROM "user" WHERE display_name IS NULL;
SELECT COUNT(*) FROM "user" WHERE is_verified IS NULL;
-- Both should return 0
```

## Why NOT to Use Default Values in Service Layer

❌ **Bad Practice**: Adding fallback logic (`|| username` or `|| false`) in the service layer
- Hides data quality issues
- Must be repeated everywhere users are queried
- Performance overhead
- Inconsistent with database schema expectations

✓ **Best Practice**: Fix the data at the source
- Schema defines NOT NULL constraints
- Database enforces data integrity
- Service layer can trust the data
- Single point of truth

## Prevention

To prevent this in the future:
1. Always define defaults in Prisma schema for required fields
2. Run data migrations alongside schema migrations
3. Use database constraints to enforce data integrity
4. Add validation in user creation logic
