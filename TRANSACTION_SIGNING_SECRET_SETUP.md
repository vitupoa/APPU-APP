# Transaction Signing Secret - Setup Guide

## ⚠️ IMPORTANT: Use the SAME Secret as Backend

The frontend and backend **MUST** use the **EXACT SAME** secret key for transaction signing to work.

## Where is the Backend Secret?

**File**: `backend/.env`

```bash
TRANSACTION_SIGNING_SECRET=204f0e5f24b632801671c9d9102df438015d592b5862aa2b2b30d34dc134c8610aa56a4087cc2c53b083375c981623c66c4574a27f6c4b3b43edb3ef9463332b
```

## Setup Steps

### 1. Copy Secret from Backend

```bash
# In backend/.env, find this line:
TRANSACTION_SIGNING_SECRET=your-secret-here

# Copy the entire secret value
```

### 2. Add to Frontend local.properties

**File**: `local.properties` (in project root)

```properties
# Add this line with the SAME secret from backend
TRANSACTION_SIGNING_SECRET=204f0e5f24b632801671c9d9102df438015d592b5862aa2b2b30d34dc134c8610aa56a4087cc2c53b083375c981623c66c4574a27f6c4b3b43edb3ef9463332b
```

### 3. Rebuild Project

```bash
# Clean and rebuild to pick up new BuildConfig
./gradlew clean
./gradlew :composeApp:assembleDebug
```

### 4. Verify Configuration

The secret is now loaded from `local.properties` into `BuildConfig.TRANSACTION_SIGNING_SECRET` and used by `TransactionSigner`.

## How It Works

```
local.properties
    ↓
build.gradle.kts (buildConfig block)
    ↓
BuildConfig.TRANSACTION_SIGNING_SECRET
    ↓
TransactionSigner.SECRET
    ↓
Used for signing withdrawal requests
```

## Security Notes

✅ **DO**:
- Keep `local.properties` in `.gitignore`
- Use the same secret as backend
- Rotate secret periodically
- Use strong, random secrets (64+ characters)

❌ **DON'T**:
- Commit `local.properties` to git
- Hardcode secret in source code
- Share secret in public channels
- Use weak or predictable secrets

## For Team Members

1. Ask DevOps/Backend team for the `TRANSACTION_SIGNING_SECRET`
2. Add it to your `local.properties` file
3. Rebuild the project
4. Test withdrawal functionality

## For Production

The secret is already configured in:
- **Backend**: Railway environment variable `TRANSACTION_SIGNING_SECRET`
- **Frontend**: Will be injected during CI/CD build process

## Troubleshooting

### Error: "Invalid signature"

**Cause**: Frontend and backend secrets don't match

**Fix**:
1. Check backend `.env` file
2. Check frontend `local.properties` file
3. Ensure they are EXACTLY the same (no extra spaces)
4. Rebuild frontend

### Error: "BuildConfig.TRANSACTION_SIGNING_SECRET not found"

**Cause**: Project not rebuilt after adding to `local.properties`

**Fix**:
```bash
./gradlew clean
./gradlew :composeApp:assembleDebug
```

### Error: "Signature expired"

**Cause**: Device time is incorrect (not related to secret)

**Fix**: Sync device time with network time

## Current Configuration

✅ **Backend Secret**: Set in `backend/.env`
✅ **Frontend Secret**: Set in `local.properties`
✅ **BuildConfig**: Configured in `composeApp/build.gradle.kts`
✅ **TransactionSigner**: Using `BuildConfig.TRANSACTION_SIGNING_SECRET`

---

**Status**: ✅ Configured
**Secret Source**: Backend `.env` file
**Secret Length**: 128 characters (SHA-512 hash)
