# TypeScript Error Fixing Plan

## Error Categories (200+ errors total)

### 1. Import Path Errors (TS2307) - ~20 files
**Pattern:** `Cannot find module '../../generated/prisma'`
**Fix:** Change to `from '../generated/prisma/index.js'` OR use shared `prisma` from `config/database.js`

**Affected files:**
- src/modules/creatorBoost/creatorBoost.routes.ts ✅ FIXED
- src/modules/displayAds/displayAds.service.ts
- src/modules/displayAds/nicheAdTargeting.service.ts
- src/modules/kyc/kyc.service.ts
- src/modules/kyc/withdrawal.service.ts
- src/modules/locations/locations.routes.ts
- src/modules/niches/niches.routes.ts
- src/services/nonce.service.ts
- src/shared/gateway/liveSocket.ts
- src/shared/gateway/databaseMonitorSocket.ts

### 2. Missing Properties (TS2339) - ~80 errors
**Pattern:** `Property 'X' does not exist on type 'Y'`

**Sub-categories:**
a) **req.user.userId** - Use `req.userId` instead
b) **req.user.role** - Not in type definition
c) **req.prisma** - Use shared `prisma` from config
d) **Schema mismatches:**
   - `viewsCount` → use `views`
   - `prizeKr` → use `prizeTotalKr`
   - `participantsCount` → use `totalParticipants`
   - `metadata` on User → doesn't exist
   - `reference` on WithdrawalRequest → doesn't exist

### 3. Query Parameter Type Errors (TS2345) - ~40 errors
**Pattern:** `Argument of type 'string | string[]' is not assignable to parameter of type 'string'`
**Fix:** Add type guard before using:
```typescript
const param = Array.isArray(req.query.param) ? req.query.param[0] : req.query.param;
```

### 4. Missing Return Statements (TS7030) - ~30 errors
**Pattern:** `Not all code paths return a value`
**Fix:** Add `return;` after `res.json()` or `res.status().json()`

### 5. Implicit Any Types (TS7006) - ~20 errors
**Pattern:** `Parameter 'x' implicitly has an 'any' type`
**Fix:** Add explicit type annotations

### 6. Schema Field Errors (TS2353, TS2561, TS2551) - ~15 errors
**Pattern:** Fields that don't exist in Prisma schema
**Fix:** Use correct field names from schema

### 7. Type Compatibility (TS2322, TS2678) - ~10 errors
**Pattern:** Type mismatches
**Fix:** Cast or adjust types

### 8. Missing Exports (TS2305) - ~5 errors
**Pattern:** Module has no exported member
**Fix:** Export the member or use correct import

### 9. Function Signature (TS2554, TS2769) - ~5 errors
**Pattern:** Wrong number of arguments
**Fix:** Match function signature

### 10. Other (TS2662, TS1117) - ~5 errors
**Pattern:** Various specific errors
**Fix:** Case-by-case

## Systematic Fix Approach

### Phase 1: Critical Infrastructure (30 min)
1. ✅ Fix src/index.ts (top-level await)
2. Fix all Prisma import paths
3. Fix req.user/req.userId usage
4. Export missing functions

### Phase 2: Route Handlers (1 hour)
1. Add return statements after responses
2. Add query parameter type guards
3. Fix schema field references

### Phase 3: Services & Workers (30 min)
1. Add explicit type annotations
2. Fix function signatures
3. Fix type compatibility issues

### Phase 4: Verification (15 min)
1. Run `npm run build`
2. Fix any remaining errors
3. Test critical endpoints

## Quick Wins (Do These First)

### 1. Global Find & Replace
```powershell
# In VS Code or IDE:
Find: from '../../generated/prisma'
Replace: from '../../generated/prisma/index.js'

Find: from '../generated/prisma'
Replace: from '../generated/prisma/index.js'

Find: req.user!.id
Replace: req.userId!

Find: req.user?.id
Replace: req.userId
```

### 2. Common Patterns
```typescript
// Query params
const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;

// Return after response
res.json(data);
return;

// Type annotations
.map((item: any) => ...)
.filter((x: any) => ...)
```

## Estimated Time
- **Manual fixes:** 2-3 hours
- **Automated script:** 30 minutes (but needs testing)
- **Verification:** 30 minutes

## Recommendation
Given the scope, I recommend:
1. Fix critical infrastructure files manually (30 min)
2. Run automated fixes for common patterns (15 min)
3. Fix remaining errors manually (1-2 hours)
4. Test thoroughly (30 min)

Total: 2.5-3.5 hours for complete fix
