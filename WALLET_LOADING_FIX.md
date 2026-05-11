# Wallet Loading Error Fix

## Problem
When clicking the wallet button in the profile tab, you get the error: "Failed to load wallet - Retry"

## Root Causes

### 1. Authentication Issue
The most common cause is that the authentication token is missing or expired.

**Check:**
- Open the app logs when clicking the wallet button
- Look for authentication errors (401 Unauthorized)
- Check if the token is being sent with the request

### 2. Backend API Not Running
The backend server might not be running or accessible.

**Check:**
- Is the backend server running?
- Can you access `https://your-backend-url/api/v1/wallet/balance` in a browser?
- Check the `RAILWAY_URL` in your `local.properties` file

### 3. Network Connectivity
The app might not have internet access or the backend URL is incorrect.

**Check:**
- Is the device/emulator connected to the internet?
- Is the backend URL correct in `local.properties`?
- Try accessing other API endpoints to see if they work

### 4. Database/Wallet Not Created
The wallet might not exist in the database for the user.

**Check:**
- The backend automatically creates a wallet if it doesn't exist (see `WalletService.getBalance`)
- Check the database to see if the user has a wallet record

## Changes Made

### 1. Enhanced Error Logging
**File:** `WalletViewModel.kt`
- Added try-catch block to capture exceptions
- Added detailed logging for debugging
- Now prints the actual error message

### 2. Better Error Display
**File:** `WalletScreen.kt`
- Now shows the actual error message (not just "Failed to load wallet")
- Improved error UI with better spacing and styling
- Added fallback for empty country code

### 3. Simplified API Call
**File:** `WalletApi.kt`
- Removed redundant error handling (let `safeApiCall` handle it)
- Cleaner code that properly propagates errors

## How to Debug

### Step 1: Check the Logs
Run the app and click the wallet button. Look for these log messages:

```
🔍 Fetching wallet balance for currency: USD
🔍 API Endpoint: /api/v1/wallet/balance
✅ Wallet Balance Response Status: 200
```

Or error messages like:
```
❌ ClientRequestException (401): Unauthorized
❌ Balance fetch error: Client error: Unauthorized
```

### Step 2: Verify Backend
1. Make sure your backend is running
2. Check the `local.properties` file:
   ```properties
   RAILWAY_URL=your-backend-url.railway.app
   ```
3. Test the endpoint manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-backend-url/api/v1/wallet/balance
   ```

### Step 3: Check Authentication
The wallet routes require authentication. Make sure:
1. User is logged in
2. Token is valid and not expired
3. Token is being sent with the request

### Step 4: Check Database
Connect to your database and verify:
```sql
-- Check if user exists
SELECT * FROM "User" WHERE id = 'user-id';

-- Check if wallet exists
SELECT * FROM "Wallet" WHERE "userId" = 'user-id';

-- If wallet doesn't exist, the backend should create it automatically
```

## Expected Behavior

When you click the wallet button:
1. App detects your location/currency
2. Sends GET request to `/api/v1/wallet/balance?currency=USD`
3. Backend checks if wallet exists, creates if not
4. Returns wallet balance and fiat equivalent
5. App displays balance and recent transactions

## Common Error Messages

### "Client error: Unauthorized"
- **Cause:** Authentication token is missing or invalid
- **Fix:** Log out and log back in to get a fresh token

### "Network error: Unable to resolve host"
- **Cause:** Backend URL is incorrect or device has no internet
- **Fix:** Check `local.properties` and internet connection

### "Parse error: ..."
- **Cause:** Backend response doesn't match expected format
- **Fix:** Check backend logs to see what's being returned

### "Server error: Internal Server Error"
- **Cause:** Backend crashed or database error
- **Fix:** Check backend logs for the actual error

## Testing the Fix

1. **Clean and rebuild:**
   ```bash
   .\gradlew.bat clean
   .\gradlew.bat :composeApp:assembleDebug
   ```

2. **Run the app and check logs:**
   - Open Android Studio Logcat
   - Filter by "Wallet" or "Balance"
   - Click the wallet button
   - Read the error messages

3. **The error message should now be more specific:**
   - Instead of just "Failed to load wallet"
   - You'll see "Client error: Unauthorized" or "Network error: ..." etc.

## Next Steps

Once you see the specific error message:
1. Share the error message
2. I can provide a targeted fix
3. The issue is likely one of:
   - Authentication (most common)
   - Backend not running
   - Network configuration
   - Database issue

## Quick Fixes

### If it's an auth issue:
1. Log out from the app
2. Log back in
3. Try accessing wallet again

### If backend is not running:
1. Start your backend server
2. Verify it's accessible
3. Try again

### If it's a network issue:
1. Check `local.properties` has correct URL
2. Make sure device has internet
3. Try accessing other features (profile, feed) to see if they work
