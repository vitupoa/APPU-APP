# TypeScript Build Errors - Comprehensive Fix Guide

## 🎯 Error Categories & Fixes

### 1. ✅ FIXED: Missing Return Types
**Pattern:** `error TS7030: Not all code paths return a value`

**Solution:** Add explicit `Promise<void>` return type and use `return` after `res.json()`:
```typescript
// ❌ Before
router.get('/path', async (req, res) => {
  if (!data) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(data);
});

// ✅ After
router.get('/path', async (req, res): Promise<void> => {
  if (!data) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(data);
});
```

### 2. ✅ FIXED: Query Parameter Types
**Pattern:** `error TS2345: Argument of type 'string | string[]' is not assignable to parameter of type 'string'`

**Solution:** Handle array case explicitly:
```typescript
// ❌ Before
const limit = parseInt(req.query.limit as string);

// ✅ After
const limitQuery = req.query.limit;
const limit = limitQuery ? parseInt(Array.isArray(limitQuery) ? limitQuery[0] : limitQuery) : 20;
```

### 3. ⚠️ TO FIX: Missing Prisma Properties
**Errors:**
- `Property 'viewsCount' does not exist on type 'Short'`
- `Property 'prizeKr' does not exist on type 'Contest'`
- `Property 'participantsCount' does not exist on type 'Contest'`
- `Property 'metadata' does not exist on type 'User'`

**Root Cause:** Prisma schema doesn't match code expectations

**Solution:** Update Prisma schema or fix code to use correct property names

### 4. ⚠️ TO FIX: Missing Module Declarations
**Errors:**
- `Cannot find module '../../generated/prisma'`
- `Cannot find module '../generated/prisma'`

**Solution:** Fix import paths to use correct generated client location:
```typescript
// ❌ Wrong
import { PrismaClient } from '../../generated/prisma';
import { PrismaClient } from '../generated/prisma';

// ✅ Correct
import { PrismaClient } from '../generated/prisma/client.js';
```

### 5. ⚠️ TO FIX: Missing OAuth Config Properties
**Errors:**
- `Property 'INSTAGRAM_CLIENT_ID' does not exist on type 'Env'`
- `Property 'TIKTOK_CLIENT_KEY' does not exist on type 'Env'`
- `Property 'YOUTUBE_CLIENT_ID' does not exist on type 'Env'`

**Status:** ✅ Already added to env.ts schema - services just need to use them correctly

### 6. ⚠️ TO FIX: Implicit Any Types
**Pattern:** `error TS7006: Parameter 'x' implicitly has an 'any' type`

**Solution:** Add explicit types:
```typescript
// ❌ Before
.map(tag => tag.name)
.filter(loc => loc.country === 'KE')

// ✅ After
.map((tag: any) => tag.name)
.filter((loc: any) => loc.country === 'KE')
```

### 7. ⚠️ TO FIX: Top-Level Await
**Error:** `'await' expressions are only allowed within async functions and at the top levels of modules`

**Location:** `src/index.ts` lines 203-212

**Solution:** Already wrapped in async IIFE - check if there are stray awaits outside

### 8. ⚠️ TO FIX: Missing Type Declarations
**Error:** `Could not find a declaration file for module 'html-escaper'`

**Solution:** Install types or create declaration:
```bash
npm install --save-dev @types/html-escaper
```

Or create `src/types/html-escaper.d.ts`:
```typescript
declare module 'html-escaper' {
  export function escape(html: string): string;
  export function unescape(html: string): string;
}
```

## 📋 Fix Priority Order

### HIGH PRIORITY (Blocking Build)
1. ✅ Fix all route handler return types
2. ✅ Fix query parameter type handling
3. ⚠️ Fix Prisma import paths
4. ⚠️ Install @types/html-escaper
5. ⚠️ Fix top-level await issues

### MEDIUM PRIORITY (Schema Mismatches)
6. ⚠️ Fix Prisma schema property mismatches
7. ⚠️ Add missing Contest/Short properties
8. ⚠️ Fix User metadata property

### LOW PRIORITY (Type Safety)
9. ⚠️ Add explicit types to implicit any parameters
10. ⚠️ Fix duplicate property names in objects

## 🚀 Quick Fix Commands

```bash
# 1. Install missing type definitions
npm install --save-dev @types/html-escaper

# 2. Regenerate Prisma Client
npx prisma generate

# 3. Run build to see remaining errors
npm run build

# 4. Fix import paths (run from backend directory)
# This will be done file by file as we identify them
```

## 📝 Files Requiring Fixes

### ✅ Already Fixed:
- `src/modules/ads/adManagement.routes.ts` - Return types & query params
- `src/modules/explore/explore.routes.ts` - Query param handling
- `tsconfig.json` - Kept strict mode enabled
- `package.json` - Build script updated

### ⚠️ Need Fixing:
- `src/modules/contests/contests.service.ts` - Prisma schema mismatch
- `src/modules/explore/explore.service.ts` - Property name mismatches
- `src/modules/displayAds/*.ts` - Import paths & auth properties
- `src/modules/creatorBoost/*.ts` - Import paths
- `src/modules/locations/*.ts` - Import paths & auth properties
- `src/modules/niches/*.ts` - Import paths & auth properties
- `src/modules/kyc/*.ts` - Import paths & auth properties
- `src/modules/recommendation/*.ts` - Service initialization
- `src/modules/marketplace/oauth.routes.ts` - User metadata property
- `src/modules/payments/payment.routes.ts` - Withdrawal request properties
- `src/services/oauth/*.service.ts` - OAuth config properties (already in env)
- `src/services/payments/mpesa.service.ts` - M-Pesa config properties
- `src/workers/*.ts` - Service initialization & types
- `src/shared/gateway/*.ts` - Import paths & type assertions

## 🔍 Next Steps

1. Run `npm install --save-dev @types/html-escaper`
2. Fix all Prisma import paths to use `../generated/prisma/client.js`
3. Review Prisma schema for missing properties
4. Fix remaining implicit any types
5. Test build: `npm run build`
6. Deploy to Railway

## 📚 Reference

- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
- Prisma Client API: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
- Express TypeScript: https://expressjs.com/en/guide/using-middleware.html
