# Railway Deployment Fix Guide

## Issue: Table Naming Mismatch

Your Prisma schema uses **camelCase** field mapping but does NOT have `@@map()` directives on models. This can cause naming mismatches between Prisma models and actual database tables.

## Solution 1: Add @@map() Directives (Recommended)

If your PostgreSQL database has lowercase table names (e.g., `transactions`, `users`), add `@@map()` directives to your Prisma schema:

```prisma
model User {
  // ... fields
  
  @@map("users")  // Maps to 'users' table in database
}

model Transaction {
  // ... fields
  
  @@map("transactions")  // Maps to 'transactions' table
}

model Contest {
  // ... fields
  
  @@map("contests")
}

// Add @@map() for ALL models that have lowercase table names in database
```

## Solution 2: Verify Database Table Names

Check your actual PostgreSQL table names on Railway:

```sql
-- Connect to Railway PostgreSQL and run:
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Then ensure your Prisma model names match EXACTLY (case-sensitive).

## Railway Build Configuration

### ✅ Your package.json is CORRECT:

```json
{
  "scripts": {
    "build": "prisma generate && tsc --noEmitOnError false && node -e \"require('fs').cpSync('src/generated', 'dist/generated', {recursive: true})\"",
    "start": "node dist/index.js",
    "postinstall": "prisma generate"
  }
}
```

### Railway Environment Variables

Ensure these are set in Railway dashboard:

```env
DATABASE_URL=postgresql://postgres:password@host:port/railway
NODE_ENV=production
PORT=4000
```

### Railway Service Settings

1. **Build Command**: Leave empty (uses package.json scripts)
2. **Start Command**: `npm start`
3. **Root Directory**: `/backend` (if monorepo)

## Common Issues & Fixes

### Issue 1: Prisma Client Not Generated

**Fix**: Add to Railway build command:
```bash
prisma generate && npm run build
```

### Issue 2: Database Connection Timeout

**Fix**: Use Railway's internal DATABASE_URL (not public URL) in production:
```env
# Railway provides this automatically
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Issue 3: Migration Not Applied

**Fix**: Add migration step to Railway:
```bash
# In Railway dashboard, add a deploy command:
prisma migrate deploy && npm start
```

Or use this in package.json:
```json
{
  "scripts": {
    "start": "prisma migrate deploy && node dist/index.js"
  }
}
```

## Verification Steps

1. **Check Prisma Schema**:
   ```bash
   npx prisma validate
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Test Database Connection**:
   ```bash
   npx prisma db pull
   ```

4. **Check Table Names**:
   ```bash
   npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
   ```

## Quick Fix for Immediate Deployment

If you need to deploy NOW without schema changes:

1. **Ensure all tables exist**:
   ```bash
   npx prisma db push --accept-data-loss
   ```

2. **Deploy to Railway** with this start command:
   ```bash
   prisma db push && node dist/index.js
   ```

## Database URL Configuration

Your `.env` shows:
```env
DATABASE_URL=postgresql://postgres:MrlnWKZwSuxDvpEzysbpqVLEyCICKMtv@centerbeam.proxy.rlwy.net:12988/railway
```

✅ This is correct for Railway deployment.

## Final Checklist

- [ ] Add `@@map()` directives to all models (if needed)
- [ ] Run `prisma validate` locally
- [ ] Run `prisma generate` locally
- [ ] Test build: `npm run build`
- [ ] Commit and push to Railway
- [ ] Check Railway logs for errors
- [ ] Verify database connection in Railway dashboard

## Example: Adding @@map() to Key Models

```prisma
model User {
  id String @id
  email String @unique
  // ... other fields
  
  @@map("users")
}

model Transaction {
  id String @id
  user_id String
  type String
  amount_kr Decimal @db.Decimal(18, 4)
  // ... other fields
  
  @@map("transactions")
}

model Wallet {
  id String @id
  user_id String @unique
  kr_balance Decimal @default(0) @db.Decimal(18, 4)
  // ... other fields
  
  @@map("wallets")
}
```

## Need More Help?

Check Railway logs:
```bash
railway logs
```

Or connect to Railway PostgreSQL:
```bash
railway connect postgres
```
