# Comprehensive TypeScript Error Fixes

This document tracks all remaining fixes needed and their implementation status.

## ✅ COMPLETED

### 1. Query Parameter Helper Created
- ✅ `src/utils/queryParams.ts` - Helper functions for safe query param extraction

### 2. Files Fixed with Query Helper
- ✅ `src/modules/ads/adManagement.routes.ts` - Using getQueryString, getQueryNumber, getQueryDate

## 🔧 IN PROGRESS - Query Parameter Fixes

### Files Needing Query Helper Import:

1. **src/modules/displayAds/displayAds.routes.ts**
   - Lines: 30, 39, 48, 59, 126, 142
   - Fix: Import and use `getQueryString()`

2. **src/modules/escrow/escrow.routes.ts**
   - Lines: 147, 191
   - Fix: Import and use `getQueryString()`

3. **src/modules/explore/explore.routes.ts**
   - Lines: 75, 78
   - Fix: Import and use `getQueryString()`, `getQueryNumber()`

4. **src/modules/kyc/kyc.routes.ts**
   - Lines: 28, 48, 103, 200, 250, 298
   - Fix: Import and use `getQueryString()`

5. **src/modules/locations/locations.routes.ts**
   - Lines: 85, 105, 122, 138
   - Fix: Import and use `getQueryString()`

6. **src/modules/marketplace/marketplace.routes.ts**
   - Lines: 26-32, 130-132
   - Fix: Import and use `getQueryString()`, `getQueryArray()`

7. **src/modules/niches/niches.routes.ts**
   - Line: 75
   - Fix: Import and use `getQueryString()`

8. **src/modules/marketplace/oauth.routes.ts**
   - Line: 335
   - Fix: Import and use `getQueryString()`

## 🔧 Prisma Client Initialization Fixes

### Files Creating New PrismaClient() - Should Use Singleton

1. **src/modules/displayAds/displayAds.service.ts**
   - Line: 3
   - Fix: `import { prisma } from '../../config/database.js';`

2. **src/modules/displayAds/nicheAdTargeting.service.ts**
   - Line: 3
   - Fix: `import { prisma } from '../../config/database.js';`

3. **src/modules/kyc/kyc.service.ts**
   - Line: 3
   - Fix: `import { prisma } from '../../config/database.js';`

4. **src/modules/kyc/withdrawal.service.ts**
   - Line: 7
   - Fix: `import { prisma } from '../../config/database.js';`

5. **src/modules/locations/locations.routes.ts**
   - Line: 6
   - Fix: Remove `const prisma = new PrismaClient();`, use import

6. **src/modules/niches/niches.routes.ts**
   - Line: 6
   - Fix: Already renamed to `prismaClient`, should use singleton

7. **src/services/analytics.service.ts**
   - Line: 4
   - Fix: `import { prisma } from '../config/database.js';`

8. **src/workers/contentDistributionWorker.ts**
   - Line: 4
   - Fix: `import { prisma } from '../config/database.js';`

9. **src/workers/microInterestWorker.ts**
   - Line: 3
   - Fix: `import { prisma } from '../config/database.js';`

10. **src/workers/trendingTopicsWorker.ts**
    - Line: 3
    - Fix: `import { prisma } from '../config/database.js';`

## 🔧 Missing Return Statements

### Files Needing Explicit Returns

1. **src/modules/displayAds/displayAds.routes.ts**
   - Lines: 108, 120, 135, 152, 168
   - Fix: Add `return;` after `res.json()` in early returns

2. **src/modules/kyc/kyc.routes.ts**
   - Lines: 18, 56, 170, 188, 219, 238, 267, 286
   - Fix: Add `return;` after `res.json()` in early returns

3. **src/modules/locations/locations.routes.ts**
   - Lines: 82, 98, 115
   - Fix: Add `return;` after `res.json()` in early returns

4. **src/modules/recommendation/recommendation.routes.ts**
   - Lines: 51, 84
   - Fix: Add `return;` after `res.json()` in early returns

5. **src/modules/rembrandt-rar/rembrandt-rar.routes.ts**
   - Line: 485
   - Fix: Add `return;` after `res.json()` in early return

## 🔧 Prisma Schema Mismatches

### Contest Model Issues

**File:** `src/modules/contests/contests.service.ts`

1. **Line 92:** `dailyprizeTotalKr` typo
   - Fix: Change to `prizeTotalKr`

2. **Lines 217, 279:** Missing `contest` relation in JudgeInvite
   - Fix: Add `include: { contest: true }` to query

3. **Line 764:** ContestVote missing `ipAddress` and `fingerprint`
   - Fix: Add these fields to the create data

4. **Line 836:** `prizeTotalKr` doesn't exist in ContestWinner
   - Fix: Remove or add to schema

### Explore Service Issues

**File:** `src/modules/explore/explore.service.ts`

1. **Line 18:** `contentHashtags` should be `contentTags`
   - Fix: Change property name

2. **Lines 56, 225:** Missing `creator` relation in Short
   - Fix: Add `include: { creator: true }` or remove usage

3. **Line 151:** `'ACTIVE'` not assignable to LiveStreamStatus
   - Fix: Cast as `'ACTIVE' as LiveStreamStatus`

4. **Line 170:** Missing `host` relation in LiveStream
   - Fix: Add `include: { host: true }` or remove usage

5. **Line 250:** `mediaUrls` doesn't exist in Post
   - Fix: Use `imageUrls` instead

### User Model Issues

**File:** `src/modules/marketplace/oauth.routes.ts`

1. **Lines 62, 83, 151:** `metadata` field doesn't exist
   - Fix: Add `metadata Json?` to User model in Prisma schema

**File:** `src/modules/kyc/withdrawal.service.ts`

1. **Line 374:** `kycTier` doesn't exist
   - Fix: Remove from select or add to schema

### WithdrawalRequest Model Issues

**File:** `src/modules/payments/payment.routes.ts`

1. **Line 495:** `reference` field doesn't exist
   - Fix: Remove or add to schema

## 🔧 OAuth Service Type Issues

### Files with URLSearchParams Type Issues

1. **src/services/oauth/instagram.service.ts**
   - Lines: 13, 31
   - Fix: Ensure env values are not undefined before using

2. **src/services/oauth/tiktok.service.ts**
   - Line: 13
   - Fix: Ensure env values are not undefined before using

3. **src/services/oauth/youtube.service.ts**
   - Line: 13
   - Fix: Ensure env values are not undefined before using

## 🔧 Miscellaneous Fixes

1. **src/modules/shorts/shorts.service.ts:182**
   - Issue: `extractHashtags` reference
   - Fix: Use `ShortsService.extractHashtags` or `this.extractHashtags`

2. **src/shared/gateway/databaseMonitorSocket.ts:5**
   - Issue: Missing `verifyToken` export
   - Fix: Export from jwt.ts or use jwtSecretManager

3. **src/shared/gateway/liveSocket.ts:3-4**
   - Issue: Module import errors
   - Fix: Correct import paths

4. **src/shared/services/notification.service.ts:248-249**
   - Issue: Undefined `prizeKr` variable
   - Fix: Define variable or use correct property

5. **src/modules/recommendation/recommendation.routes.ts:19**
   - Issue: Expected 3 arguments, got 1
   - Fix: Check function signature and provide all arguments

6. **src/modules/recommendation/services/feedGeneration.service.ts:393**
   - Issue: `userId_category_subcategory` doesn't exist
   - Fix: Use correct unique constraint name

7. **src/workers/microInterestWorker.ts:63**
   - Issue: Same as above
   - Fix: Use correct unique constraint name

## 📊 Progress Tracker

- ✅ Query Helper Created: 1/1
- ✅ Query Helper Applied: 1/8 files
- ⏳ Prisma Client Fixes: 0/10 files
- ⏳ Missing Returns: 0/5 files
- ⏳ Schema Mismatches: 0/15 issues
- ⏳ OAuth Fixes: 0/3 files
- ⏳ Miscellaneous: 0/7 issues

**Total Progress: ~5% complete**

## 🎯 Next Steps

1. Apply query helper to remaining 7 files
2. Fix all Prisma Client initializations
3. Add missing return statements
4. Fix Prisma schema mismatches
5. Fix OAuth service types
6. Fix miscellaneous issues

Estimated time: 2-3 hours for all fixes
