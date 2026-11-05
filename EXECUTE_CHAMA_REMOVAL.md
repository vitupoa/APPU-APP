# EXECUTE CHAMA & REVIEWS REMOVAL - STEP BY STEP

**Current Status**: Database connection issue detected  
**Railway URL**: `thomas.proxy.rlwy.net:33376` (not reachable)  

---

## ⚠️ DATABASE CONNECTION ISSUE

The Railway database is currently not reachable. This could be:
1. Railway service is down/restarting
2. Network connectivity issue
3. Database credentials changed
4. Firewall blocking connection

**Test connection first**:
```powershell
cd backend
npx prisma db pull
```

If this fails, check Railway dashboard or wait a few minutes and retry.

---

## 🚀 OPTION 1: Execute When Database is Available (RECOMMENDED)

### Step 1: Run Cleanup Script
```powershell
cd C:\Users\ADMIN\Runinga
.\scripts\remove-chama-and-reviews.ps1
```

**What it does**:
- ✅ Deletes all Chama backend files
- ✅ Deletes all Chama frontend files  
- ✅ Updates backend imports/routes
- ✅ Updates configuration files

### Step 2: Run Database Migration
```powershell
cd backend

# Wait until database is accessible, then run:
npx prisma db execute --file=".\prisma\migrations\remove_chama_and_reviews.sql"
```

### Step 3: Update Prisma Schema
Open `backend/prisma/schema.prisma` and remove these models:

**Search for and DELETE** (13 Chama models):
```prisma
model chama { ... }
model chama_wallet { ... }
model chama_member { ... }
model chama_contribution { ... }
model chama_cycle { ... }
model chama_payout { ... }
model chama_payout_approval { ... }
model chama_transaction { ... }
model chama_defaulter { ... }
model chama_election { ... }
model chama_nomination { ... }
model chama_secondment { ... }
model chama_vote { ... }
```

**Search for and DELETE** (4 Review models):
```prisma
model product_reviews { ... }
model wishlists { ... }
model wishlist_items { ... }
model garage_reviews { ... }
```

**Update products model** (remove these fields):
```prisma
model products {
  // ... other fields ...
  review_count  Int @default(0)  // DELETE THIS LINE
  avg_rating    Decimal @default(0) @db.Decimal(3, 2)  // DELETE THIS LINE
  // ... other fields ...
}
```

**Update garage_profiles model** (remove these fields):
```prisma
model garage_profiles {
  // ... other fields ...
  review_count  Int @default(0)  // DELETE THIS LINE
  avg_rating    Decimal @default(0) @db.Decimal(3, 2)  // DELETE THIS LINE
  // ... other fields ...
}
```

### Step 4: Regenerate Prisma Client
```powershell
npx prisma generate
```

### Step 5: Build Backend
```powershell
npm run build
```

### Step 6: Build Frontend
```powershell
cd ..
.\gradlew.bat clean build
```

### Step 7: Test
```powershell
cd backend
npm run dev
```

Test these endpoints:
- ✅ Auth: `POST /api/v1/auth/login`
- ✅ Feed: `GET /api/v1/feed`
- ✅ Contests: `GET /api/v1/contests`
- ✅ Shop: `GET /api/v1/shop/products`
- ✅ Wallet: `GET /api/v1/wallet/balance`

### Step 8: Commit
```powershell
git add .
git commit -m "chore: remove Chama and Shop reviews/wishlists for MVP"
git push origin remove-chama-reviews
```

---

## 🔧 OPTION 2: Manual SQL Execution (If Prisma Fails)

If `npx prisma db execute` continues to fail, execute SQL manually:

### Using psql (if installed):
```powershell
cd backend

# Set password
$env:PGPASSWORD = "CvzKYmYOnJvQKPPDnHvmMCxYlCJVDZWR"

# Execute
psql -h thomas.proxy.rlwy.net -p 33376 -U postgres -d railway -f "prisma\migrations\remove_chama_and_reviews.sql"
```

### Using Railway CLI:
```powershell
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Connect to database
railway connect

# Then paste the SQL from remove_chama_and_reviews.sql
```

### Using pgAdmin or DBeaver:
1. Open your database client
2. Connect to: `thomas.proxy.rlwy.net:33376`
3. Database: `railway`
4. User: `postgres`
5. Password: `CvzKYmYOnJvQKPPDnHvmMCxYlCJVDZWR`
6. Execute `backend/prisma/migrations/remove_chama_and_reviews.sql`

---

## ⏭️ OPTION 3: Skip Database for Now (Code Cleanup Only)

If you want to clean up code first and handle database later:

### Step 1: Run Cleanup Script
```powershell
cd C:\Users\ADMIN\Runinga
.\scripts\remove-chama-and-reviews.ps1
```

### Step 2: Update Schema (Don't Run Migration Yet)
- Manually remove Chama and review models from `schema.prisma`
- Keep schema in sync with what you'll delete in database

### Step 3: Build (Will Fail Until Database Matches)
```powershell
cd backend
npm run build  # May have some errors until DB is cleaned
```

### Step 4: When Database is Accessible
- Run the SQL migration
- Regenerate Prisma client
- Rebuild

---

## 🔍 VERIFY DATABASE CONNECTION

Before proceeding, verify database is reachable:

```powershell
cd backend

# Test 1: Prisma introspection
npx prisma db pull

# Test 2: Prisma Studio
npx prisma studio

# Test 3: Simple connection test
npx tsx -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); prisma.user.count().then(c => console.log('Users:', c)).catch(e => console.error('Error:', e.message));"
```

**If all fail**: Wait 5-10 minutes and retry. Railway sometimes restarts databases.

---

## 📋 QUICK CHECKLIST

**Before Migration**:
- [ ] Database is accessible (test with `npx prisma db pull`)
- [ ] Created backup: `git checkout -b backup-before-cleanup`
- [ ] Railway console shows database is running

**After Migration**:
- [ ] Chama files deleted (run cleanup script)
- [ ] Schema updated (remove models)
- [ ] Prisma regenerated (`npx prisma generate`)
- [ ] Backend builds (`npm run build`)
- [ ] Frontend builds (`.\gradlew.bat clean build`)
- [ ] Tests pass (`npm run dev` starts without errors)
- [ ] Committed changes

---

## 🆘 TROUBLESHOOTING

### Error: "Can't reach database server"
**Solution**: Wait 5-10 minutes, check Railway dashboard, retry

### Error: "Table 'chama' is referenced by..."
**Solution**: Migration drops tables in correct order with CASCADE

### Error: "Unknown field 'chama_member'"
**Solution**: Update schema.prisma first, then regenerate

### Error: "Cannot find module './modules/chama/chama.routes.js'"
**Solution**: Cleanup script should have removed this - check index.ts

---

## 📞 NEED HELP?

If stuck, check:
1. Railway Dashboard: Is database running?
2. Network: Can you ping `thomas.proxy.rlwy.net`?
3. Credentials: Did DATABASE_URL change?
4. Logs: Check `backend/npm-debug.log`

---

**Status**: ⏸️ PAUSED (Database unreachable)  
**Next Action**: Wait for database connection, then execute Step 1  
**ETA**: 10 minutes (after database is accessible)
