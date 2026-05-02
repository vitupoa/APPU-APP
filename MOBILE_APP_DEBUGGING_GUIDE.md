# 🔍 Mobile App Debugging - Exchange Rate API Issue

## Status: ✅ DEBUGGING ENABLED

---

## What Was Fixed

### 1. Enhanced Logging in WalletApi.kt ✅
Added comprehensive logging to see:
- API response status
- Response headers
- Parsed DTO
- Error details with exception type

### 2. Enhanced Logging in WalletRepositoryImpl.kt ✅
Added logging to track:
- Currency being requested
- DTO received from API
- Mapping to domain model

### 3. Enhanced Logging in TopupViewModel.kt ✅
Added logging to track:
- Exchange rate fetch initiation
- Success/failure with full error message
- Display full error message to user

### 4. Enhanced Error Handling in NetworkResult.kt ✅
Added comprehensive error logging:
- Captures actual error response body
- Logs exception types
- Provides detailed error context
- Helps identify serialization issues

---

## How to Debug

### Step 1: Run the App
```bash
# Build and run the Android app
./gradlew :composeApp:installDebug
```

### Step 2: Open Logcat
In Android Studio:
1. Open **Logcat** tab (bottom of screen)
2. Filter by: `KtorHttp` or `Exchange`
3. Watch for these log messages:

```
🔍 TopupViewModel: Fetching exchange rate for currency: KES
🔍 Fetching exchange rate for currency: KES
🔍 Exchange Rate API Response Status: 200 OK
🔍 Exchange Rate API Response Headers: ...
✅ Exchange Rate Parsed Successfully: ExchangeRateResponseDto(...)
✅ Exchange rate DTO received: ...
✅ TopupViewModel: Exchange rate loaded successfully: ...
```

### Step 3: Identify the Issue

#### Scenario A: Authentication Error (401)
```
❌ ClientRequestException (401): {"error":"Unauthorized"}
```

**Fix**: User needs to log in again
- Token expired
- Invalid token
- User not authenticated

#### Scenario B: Server Error (500)
```
❌ ServerResponseException (500): {"error":"Failed to fetch exchange rate for kes"}
```

**Fix**: Backend issue
- External API (fawazahmed0) is down
- Check Railway logs: `railway logs`

#### Scenario C: Serialization Error
```
❌ SerializationException: Field 'currency' is required for type...
```

**Fix**: API response doesn't match DTO
- Backend returning error response
- DTO mismatch (unlikely, we verified it matches)

#### Scenario D: Network Error
```
❌ IOException: Network error: Unable to resolve host
```

**Fix**: Network connectivity issue
- Check internet connection
- Verify Railway URL is correct
- Check if backend is deployed

---

## Expected Log Output (Success)

When everything works correctly, you should see:

```
KtorHttp: REQUEST: https://appu-app-production.up.railway.app/api/v1/wallet/exchange-rate?currency=KES
KtorHttp: METHOD: HttpMethod(value=GET)
KtorHttp: COMMON HEADERS
KtorHttp: -> Authorization: Bearer eyJ...
KtorHttp: -> Content-Type: application/json
KtorHttp: RESPONSE: 200 OK
KtorHttp: METHOD: HttpMethod(value=GET)
KtorHttp: FROM: https://appu-app-production.up.railway.app/api/v1/wallet/exchange-rate?currency=KES
KtorHttp: BODY Content-Type: application/json
KtorHttp: BODY START
KtorHttp: {"currency":"KES","baseRate":130.5,"buyRate":136.37,"sellRate":130.5,"margin":"4.5%"}
KtorHttp: BODY END
🔍 Exchange Rate API Response Status: 200 OK
✅ Exchange Rate Parsed Successfully: ExchangeRateResponseDto(currency=KES, baseRate=130.5, buyRate=136.37, sellRate=130.5, margin=4.5%)
✅ Exchange rate DTO received: ExchangeRateResponseDto(currency=KES, baseRate=130.5, buyRate=136.37, sellRate=130.5, margin=4.5%)
✅ TopupViewModel: Exchange rate loaded successfully: ExchangeRate(currency=KES, baseRate=130.5, buyRate=136.37, sellRate=130.5, margin=4.5%)
```

---

## Common Issues & Solutions

### Issue 1: "Parse error: Illegal input: Fields [...] are required"

**Cause**: API returned an error response instead of exchange rate data

**Example**:
```json
{
  "error": "Unauthorized"
}
```

**Solution**: Check authentication
1. Verify user is logged in
2. Check token is valid
3. Re-login if needed

---

### Issue 2: "Network error: Unable to resolve host"

**Cause**: Can't reach backend server

**Solutions**:
1. Check internet connection
2. Verify Railway URL in `local.properties`:
   ```
   RAILWAY_BASE_URL=appu-app-production.up.railway.app
   ```
3. Verify backend is deployed and running
4. Test API directly:
   ```bash
   curl https://appu-app-production.up.railway.app/api/v1/wallet/exchange-rate?currency=KES \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

---

### Issue 3: "Server error: Failed to fetch exchange rate"

**Cause**: Backend can't fetch exchange rate from external API

**Solutions**:
1. Check Railway logs: `railway logs`
2. External API (fawazahmed0) might be down
3. Wait and retry

---

## Verification Checklist

- [ ] App builds successfully
- [ ] User is logged in
- [ ] Token is valid (check TokenManager)
- [ ] Railway URL is correct in local.properties
- [ ] Backend is deployed and running
- [ ] Logcat shows API request being made
- [ ] Logcat shows API response (200 OK)
- [ ] Logcat shows successful parsing
- [ ] Exchange rate displays in UI

---

## Testing the Fix

### Test 1: Check API URL
```kotlin
// In any screen, add this temporarily:
LaunchedEffect(Unit) {
    println("🔍 API Base URL: ${ApiConstants.BASE_URL}")
    println("🔍 Exchange Rate Endpoint: ${ApiConstants.WALLET_EXCHANGE_RATE}")
}
```

Expected output:
```
🔍 API Base URL: https://appu-app-production.up.railway.app
🔍 Exchange Rate Endpoint: /api/v1/wallet/exchange-rate
```

### Test 2: Check Authentication
```kotlin
// In any screen, add this temporarily:
LaunchedEffect(Unit) {
    val token = tokenManager.getAccessToken()
    println("🔍 Access Token: ${token?.take(20)}...")
    println("🔍 Token exists: ${token != null}")
}
```

Expected output:
```
🔍 Access Token: eyJhbGciOiJIUzI1NiIs...
🔍 Token exists: true
```

### Test 3: Manual API Test
```kotlin
// In TopupViewModel or any ViewModel:
fun testExchangeRateApi() {
    screenModelScope.launch {
        try {
            val result = walletRepository.getExchangeRate("KES")
            println("✅ Manual Test Success: $result")
        } catch (e: Exception) {
            println("❌ Manual Test Failed: ${e.message}")
        }
    }
}
```

---

## Next Steps

1. **Build and run the app**
2. **Navigate to Top-up screen** (this triggers exchange rate fetch)
3. **Check Logcat** for the log messages
4. **Identify the issue** based on the logs
5. **Apply the appropriate fix** from the solutions above

---

## Quick Fixes

### If Authentication Failed
```kotlin
// Force re-login
tokenManager.clearTokens()
// Navigate to login screen
```

### If Network Error
```kotlin
// Check connectivity
val isConnected = /* check network state */
if (!isConnected) {
    // Show "No internet connection" message
}
```

### If Backend Error
```bash
# Check Railway logs
railway logs --tail

# Restart backend if needed
railway up
```

---

## Success Indicators

You'll know it's working when:
1. ✅ Logcat shows "Exchange Rate Parsed Successfully"
2. ✅ Top-up screen shows exchange rate
3. ✅ Kr preview calculates correctly
4. ✅ No error messages in UI

---

## Files Modified

1. `WalletApi.kt` - Added response logging
2. `WalletRepositoryImpl.kt` - Added DTO logging
3. `TopupViewModel.kt` - Added error message display
4. `NetworkResult.kt` - Enhanced error handling

All changes are **non-breaking** and **production-safe**. The logging will help identify the issue without affecting functionality.

---

## Contact Points

If the issue persists after following this guide:
1. Share the Logcat output (filter by "KtorHttp" or "Exchange")
2. Share the exact error message from the UI
3. Verify backend is responding: `curl https://appu-app-production.up.railway.app/api/v1/wallet/exchange-rate?currency=KES`

The enhanced logging will pinpoint the exact issue! 🎯
