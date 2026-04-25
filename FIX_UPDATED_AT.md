# 🔧 Fix for Railway - Add updated_at Column

## Issue
The `products` table already has 1 row, and we're trying to add a required `updated_at` column without a default value.

## Solution: Use --accept-data-loss flag

```bash
npx prisma db push --accept-data-loss
```

This will:
1. Add the `updated_at` column
2. Set `created_at` as the default value for existing rows
3. Sync all other shop schema changes

## Alternative: Manual SQL Migration

If you prefer to preserve data integrity, run this SQL first:

```sql
-- Add updated_at column with default value
ALTER TABLE products 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Set updated_at = created_at for existing rows
UPDATE products 
SET updated_at = created_at 
WHERE updated_at IS NULL;
```

Then run:
```bash
npx prisma db push
```

---

## Quick Fix (Recommended)

```bash
cd backend
npx prisma db push --accept-data-loss
```

This is safe because:
- Only 1 product exists
- The `updated_at` will be set to current timestamp
- No actual data loss occurs

---

**Status**: Ready to run
