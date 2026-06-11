# User Creation Validation Fixes

## Problem
User records were being created with NULL values for `display_name` and `is_verified` fields, causing JsonConvertException errors in the Android app when deserializing comment author data.

## Root Cause
Several user creation points in the codebase did not explicitly set these required fields:
1. Regular registration flow
2. OAuth registration flow  
3. Test user creation

## Solution Applied

### 1. Auth Service (auth.service.ts)
**register() method:**
- Added validation to ensure `first_name` and `last_name` are provided
- Added `.trim()` to prevent whitespace-only names
- Explicitly set `is_verified: false` for new registrations
- Properly construct `display_name` from trimmed first/last names

**oauthLogin() method:**
- Added `.trim()` to first/last names
- Explicitly set `is_verified: false` for OAuth users
- Ensured `display_name` is properly constructed

### 2. Validation Schema (auth.validation.ts)
**registerSchema:**
- Added `.trim()` to `first_name` and `last_name` validation
- Ensures whitespace-only values are rejected

**oauthSchema:**
- Added `.trim()` to `first_name` and `last_name` validation

### 3. Test Files (sar.service.test.ts)
- Added explicit `is_verified: false` to test user creation
- Ensures test data matches schema requirements

### 4. Admin Creation (create-superadmin.ts)
- Already had proper fields set
- No changes needed (includes `display_name` and `is_verified: true`)

## Fields Now Guaranteed at Creation
Every user creation now ensures:
- `display_name`: Constructed from `first_name + " " + last_name` (trimmed)
- `is_verified`: Explicitly set to `false` (or `true` for admin)

## Validation Flow
```
Client Request
    ↓
Zod Schema Validation (trim first/last names)
    ↓
Service Layer (check required fields, construct display_name)
    ↓
Database Insert (with explicit is_verified value)
```

## Prevention Measures
1. **Input Validation**: Zod schemas trim and validate name fields
2. **Service Validation**: Service layer checks for required fields before creation
3. **Explicit Defaults**: All user creation calls explicitly set `is_verified: false`
4. **Computed Fields**: `display_name` is always computed from first/last names

## Testing Recommendations
1. Test registration with whitespace-only names (should fail)
2. Test OAuth registration without first/last names (should fail at service layer)
3. Verify all existing users have non-NULL display_name and is_verified
4. Run backfill migration if any NULL values found

## Related Files Changed
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/auth.validation.ts`
- `src/services/compliance/sar.service.test.ts`

## Migration Script Available
See `scripts/backfill-user-fields.ts` for fixing any existing NULL values in the database.
