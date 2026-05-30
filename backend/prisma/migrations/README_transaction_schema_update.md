# Transaction Schema Update - Task 1.1

## Overview

This migration updates the `transactions` table schema to add structured context fields while maintaining backward compatibility with existing code.

## Changes Made

### 1. Added TransactionType Enum

Created a new Prisma enum `TransactionType` with the following valid values:

- `CONTENT_TIP` - Tip on post/short/video
- `LOCKED_CHAT_TASK` - Pay to unlock chat for a specific task
- `SUBSCRIPTION` - Monthly subscription
- `CONTEST_ENTRY` - Contest entry fee
- `CONTEST_VOTE` - Paid vote on contest
- `CONTEST_PRIZE` - Contest prize distribution
- `CHAMA_CONTRIBUTION` - Group savings contribution
- `CHAMA_PAYOUT` - Group savings payout
- `PLATFORM_REWARD` - Platform-funded reward
- `WITHDRAWAL` - Cash out to fiat
- `TOP_UP` - Buy Kr with fiat
- `SHOP_LISTING_FEE` - Fee to list product in shop

**Note:** `WALLET_TRANSFER` and `CHAT_TIP` are explicitly excluded to prevent money transmission classification.

### 2. Added New Fields to transactions Table

#### New Structured Fields:
- `context` (JSONB) - Consolidated context object
- `transaction_type` (TransactionType enum) - Enum-based transaction type
- `reference_id` (TEXT) - Reference to content/service
- `description` (TEXT) - Human-readable context

#### Existing Fields (Preserved):
- `context_type` (TEXT) - Legacy string-based type
- `context_ref_id` (TEXT) - Legacy reference ID
- `context_desc` (TEXT) - Legacy description
- `risk_score` (INT) - Risk score
- `is_flagged` (BOOLEAN) - Flagged status
- `flag_reason` (TEXT) - Flag reason
- `device_id` (TEXT) - Device identifier
- `ip_address` (TEXT) - IP address
- `user_agent` (TEXT) - User agent string

### 3. Added Indexes

- `transactions_transaction_type_idx` - Index on transaction_type
- `transactions_reference_id_idx` - Index on reference_id
- `transactions_user_id_transaction_type_idx` - Composite index on user_id + transaction_type

## Migration Strategy

### Backward Compatibility

All existing fields are preserved to ensure existing code continues to work:

```typescript
// OLD CODE (still works)
const transaction = await prisma.transactions.create({
  data: {
    user_id: userId,
    type: 'tip',
    amount_kr: 100,
    context_type: 'CONTENT_TIP',
    context_ref_id: postId,
    context_desc: 'Tip on post',
  }
});

// NEW CODE (preferred)
const transaction = await prisma.transactions.create({
  data: {
    user_id: userId,
    type: 'tip',
    amount_kr: 100,
    transaction_type: 'CONTENT_TIP',
    reference_id: postId,
    description: 'Tip on post',
    context: {
      type: 'CONTENT_TIP',
      reference_id: postId,
      description: 'Tip on post',
      content_type: 'post',
    }
  }
});
```

### Data Migration

The migration script automatically backfills existing data:

1. Migrates `context_type` → `transaction_type` (enum)
2. Migrates `context_ref_id` → `reference_id`
3. Migrates `context_desc` → `description`
4. Builds `context` JSONB object from existing fields

## Running the Migration

### Option 1: Using Prisma Migrate (Recommended)

```bash
# Generate migration
npx prisma migrate dev --name update_transaction_schema_with_context_fields

# Apply migration to production
npx prisma migrate deploy
```

### Option 2: Manual SQL Execution

```bash
# Connect to database
psql -U your_user -d your_database

# Run migration
\i prisma/migrations/update_transaction_schema_with_context_fields.sql
```

## Validation

After running the migration, validate the changes:

```sql
-- Check enum was created
SELECT typname, enumlabel 
FROM pg_type 
JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid 
WHERE typname = 'TransactionType';

-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name IN ('context', 'transaction_type', 'reference_id', 'description');

-- Check indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'transactions' 
  AND indexname LIKE '%transaction_type%' OR indexname LIKE '%reference_id%';

-- Check migration success rate
SELECT 
  COUNT(*) as total_transactions,
  COUNT(transaction_type) as migrated_transaction_type,
  COUNT(reference_id) as migrated_reference_id,
  COUNT(description) as migrated_description,
  COUNT(context) as migrated_context
FROM transactions;
```

## TypeScript Types

TypeScript types are defined in `src/types/transaction.types.ts`:

```typescript
import { TransactionType, TransactionContext } from '@/types/transaction.types';

// Use enum for type safety
const type: TransactionType = TransactionType.CONTENT_TIP;

// Build context object
const context: TransactionContext = {
  type: TransactionType.CONTENT_TIP,
  reference_id: postId,
  description: 'Tip on post',
  content_type: 'post',
};
```

## Compliance Notes

### Blocked Transaction Types

The following transaction types are **NOT** included in the enum and should be blocked:

- `WALLET_TRANSFER` - Direct wallet-to-wallet transfers (money transmission risk)
- `CHAT_TIP` - Tips in direct/private chats (illicit activity risk)

### Context Requirements

All transactions MUST have:
1. A valid `transaction_type` from the enum
2. A `description` explaining the transaction
3. A `reference_id` (for most transaction types)

Transactions without proper context should be rejected at the API level.

## Rollback

To rollback this migration:

```sql
-- Drop indexes
DROP INDEX IF EXISTS "transactions_transaction_type_idx";
DROP INDEX IF EXISTS "transactions_reference_id_idx";
DROP INDEX IF EXISTS "transactions_user_id_transaction_type_idx";

-- Drop new columns
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "context";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "transaction_type";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "reference_id";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "description";

-- Drop enum
DROP TYPE IF EXISTS "TransactionType";
```

## Next Steps

1. Update transaction creation endpoints to use new fields
2. Add validation middleware to enforce context requirements
3. Update frontend to display transaction types using enum labels
4. Gradually migrate existing code to use new fields
5. Eventually deprecate legacy fields (context_type, context_ref_id, context_desc)

## Related Tasks

- Task 2.1: Create TransactionContext service
- Task 2.2: Update transaction creation endpoints
- Task 2.3: Block wallet-to-wallet transfers
- Task 2.4: Block direct chat tips

## References

- Requirements: Section 2.2.1, 2.2.2
- Design Document: Transaction Context Validation
- Spec: wallet-compliance-restructuring
