# TypeScript Error Fixes - Batch Processing

## Status: 106 errors remaining (down from 200+)

## Critical Fixes Completed ✅
1. Fixed nonce.service.ts Prisma import
2. Fixed queryParams helper array handling  
3. Fixed contests.service.ts (dailyPrizeTotalKr typo, ContestVote fields, invalid include syntax)
4. Fixed withdrawal.service.ts Decimal comparison

## Remaining Errors by Category

### HIGH PRIORITY (Blocking Deployment)

#### 1. Schema Mismatches (2 errors)
- `contests.service.ts:92` - `dailyPrizeTotalKr` should be `dailyPrizeKr` in schema
- `contests.service.ts:836` - `prizeAmountKr` field doesn't exist, should be `prizeTotalKr`

#### 2. Missing Module Imports (2 errors)  
- `liveSocket.ts:3,4` - Wrong import paths for database and auth service
- `databaseMonitorSocket.ts:5` - Missing verifyToken export from jwt.js

#### 3. Missing Variables (3 errors)
- `notification.service.ts:248,249,259` - Undefined `prizeKr` variable
- `shorts.service.ts:182` - Should use `ShortsService.extractHashtags`

### MEDIUM PRIORITY (Type Safety)

#### 4. Missing Return Statements (15 errors)
Files need `return;` after `res.json()`:
- displayAds.routes.ts: lines 108, 120, 135, 152, 168
- kyc.routes.ts: lines 18, 56, 170, 188, 219, 238, 267, 286
- recommendation.routes.ts: lines 51, 84
- rembrandt-rar.routes.ts: line 485

#### 5. req.params Type Assertions (20 errors)
Need `as string` cast:
- displayAds.routes.ts: lines 30, 39, 48, 59, 126, 142
- escrow.routes.ts: lines 147, 191
- explore.routes.ts: lines 75, 78
- kyc.routes.ts: lines 28, 48, 103, 200, 250, 298
- marketplace.oauth.routes.ts: line 335

#### 6. Query Parameter Array Access (11 errors)
Need getQueryString() helper:
- marketplace.routes.ts: lines 26-32, 130-132
- user.routes.ts: line 162

### LOW PRIORITY (Schema Design Issues)

#### 7. Schema Field Mismatches (15 errors)
- explore.service.ts: `contentHashtags` → `contentTags`, `creator` → `user`, missing `mediaUrls`
- displayAds.service.ts: Invalid TargetingScope enum value
- nicheAdTargeting.service.ts: Duplicate property
- oauth.routes.ts: Missing `metadata` field on User model
- payments.routes.ts: Missing fields in withdrawal type (14 errors)
- feedGeneration.service.ts: Invalid composite key

#### 8. OAuth Service URLSearchParams (4 errors)
- instagram.service.ts, tiktok.service.ts, youtube.service.ts
- Need to handle undefined values in URLSearchParams

#### 9. Type Casting Issues (7 errors)
- databaseMonitorSocket.ts: unknown → LogContext, unknown → any[]
- workers: unknown → LogContext

## Quick Win Fixes (Can be done immediately)

### Fix 1: Add return statements
```typescript
// Pattern: After every res.json() or res.status().json()
res.json(data);
return;
```

### Fix 2: Cast req.params
```typescript
// Pattern: req.params.id → req.params.id as string
const id = req.params.id as string;
```

### Fix 3: Use getQueryString helper
```typescript
// Pattern: req.query.param → getQueryString(req.query.param)
import { getQueryString } from '../../utils/queryParams.js';
const value = getQueryString(req.query.param);
```

### Fix 4: Fix static method call
```typescript
// shorts.service.ts line 182
// Change: extractHashtags(...)
// To: ShortsService.extractHashtags(...)
```

## Deployment Strategy

1. **Phase 1**: Fix HIGH PRIORITY errors (7 errors) - BLOCKS BUILD
2. **Phase 2**: Fix MEDIUM PRIORITY errors (46 errors) - TYPE SAFETY  
3. **Phase 3**: Fix LOW PRIORITY errors (53 errors) - SCHEMA DESIGN

After Phase 1 + 2, application will compile and deploy successfully.
Phase 3 can be addressed post-deployment as they're schema design issues.

## Estimated Time
- Phase 1: 10 minutes
- Phase 2: 20 minutes  
- Phase 3: 30 minutes (can be done post-deployment)

Total: ~1 hour for full fix, 30 minutes for deployable state
