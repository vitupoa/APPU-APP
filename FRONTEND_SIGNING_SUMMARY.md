# Frontend Transaction Signing - Implementation Summary

## ✅ Completed Implementation

### Files Created

1. **c:\Users\ADMIN\Krieta\composeApp\src\commonMain\kotlin\com\krieta\com\core\security\TransactionSigner.kt**
   - Platform-agnostic signature generation
   - Nonce generation (16 random bytes, Base64 encoded)
   - Timestamp generation (Unix milliseconds)
   - Canonical string creation for HMAC-SHA256
   - Main signing function: `signWithdrawal()`

2. **c:\Users\ADMIN\Krieta\composeApp\src\androidMain\kotlin\com\krieta\com\core\security\HmacSha256.android.kt**
   - Android-specific HMAC-SHA256 implementation
   - Uses javax.crypto.Mac
   - SecretKeySpec for key management

3. **c:\Users\ADMIN\Krieta\composeApp\src\iosMain\kotlin\com\krieta\com\core\security\HmacSha256.ios.kt**
   - iOS-specific HMAC-SHA256 implementation
   - Uses CommonCrypto CCHmac
   - Native interop with C libraries

4. **c:\Users\ADMIN\Krieta\FRONTEND_TRANSACTION_SIGNING.md**
   - Comprehensive documentation (200+ lines)
   - Architecture overview
   - Security features
   - Testing guide
   - Troubleshooting
   - Deployment checklist

5. **c:\Users\ADMIN\Krieta\TRANSACTION_SIGNING_QUICK_REF.md**
   - Quick reference guide
   - Usage examples
   - Error codes
   - Common issues

### Files Modified

1. **WalletApi.kt**
   - Added `withdraw()` method
   - Accepts signature, timestamp, nonce as query parameters
   - Sends request body with withdrawal details

2. **WalletRepository.kt**
   - Added `withdraw()` interface method
   - Returns NetworkResult<Unit>

3. **WalletRepositoryImpl.kt**
   - Implemented `withdraw()` with automatic signature generation
   - Extracts krAmount, provider, currency from request
   - Generates nonce and timestamp
   - Creates signature using TransactionSigner
   - Calls API with all security parameters

4. **WithdrawViewModel.kt**
   - Fixed missing repository methods (loadCountries, loadBanks, verifyAccount)
   - Added placeholder implementations for future backend endpoints
   - Maintained existing withdrawal flow

## How It Works

### Request Flow

```
User clicks "Withdraw"
    ↓
WithdrawViewModel.withdraw()
    ↓
WalletRepositoryImpl.withdraw(request)
    ↓
Extract: krAmount, provider, currency
    ↓
Generate: nonce, timestamp
    ↓
Sign: TransactionSigner.signWithdrawal()
    ↓
Platform-specific HMAC-SHA256
    ↓
WalletApi.withdraw(request, signature, timestamp, nonce)
    ↓
Backend verifies signature
    ↓
Process withdrawal
```

### Security Features

1. **HMAC-SHA256 Signature**
   - Cryptographic hash of request parameters
   - Prevents tampering with withdrawal amounts
   - Verifies request authenticity

2. **Nonce (Number Used Once)**
   - 16 random bytes, Base64 encoded
   - Single-use per request
   - Prevents replay attacks

3. **Timestamp**
   - Unix milliseconds
   - 5-minute expiry window
   - Prevents old request replay

4. **Canonical String**
   - Deterministic field ordering
   - Format: `krAmount=X&provider=Y&currency=Z&timestamp=T&nonce=N`
   - Prevents parameter reordering attacks

## API Integration

### Request Format

```http
POST /api/v1/kyc/withdraw?signature=ABC123&timestamp=1234567890&nonce=XYZ789
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "krAmount": 50000.0,
  "provider": "mpesa",
  "currency": "KES",
  "phoneNumber": "+254712345678"
}
```

### Backend Verification

Backend must:
1. Extract signature, timestamp, nonce from query params
2. Check timestamp is within 5 minutes
3. Check nonce hasn't been used before
4. Recreate canonical string from request body
5. Generate signature using same secret
6. Compare signatures using constant-time comparison
7. Mark nonce as used
8. Process withdrawal

## Configuration Required

### Frontend (TODO)

Update `TransactionSigner.kt`:
```kotlin
// Replace hardcoded secret with secure config
private const val SECRET = "your-transaction-signing-secret-key-here"

// Should be:
private val SECRET = BuildConfig.TRANSACTION_SIGNING_SECRET
```

### Backend (Already Done)

Environment variable:
```bash
TRANSACTION_SIGNING_SECRET=your-secret-key-here
```

⚠️ **CRITICAL**: Frontend and backend MUST use the same secret key!

## Testing Checklist

### Unit Tests (TODO)
- [ ] Test nonce generation uniqueness
- [ ] Test timestamp generation
- [ ] Test signature consistency
- [ ] Test canonical string format
- [ ] Test platform-specific HMAC implementations

### Integration Tests (TODO)
- [ ] Test withdrawal with valid signature
- [ ] Test withdrawal with invalid signature
- [ ] Test withdrawal with expired timestamp
- [ ] Test withdrawal with reused nonce
- [ ] Test withdrawal with missing parameters

### Manual Testing
- [ ] Test M-Pesa withdrawal
- [ ] Test PayPal withdrawal
- [ ] Test Paystack withdrawal
- [ ] Test with different amounts
- [ ] Test error handling
- [ ] Test on Android device
- [ ] Test on iOS device

## Deployment Steps

1. **Update Secret Key**
   ```kotlin
   // In TransactionSigner.kt
   private val SECRET = BuildConfig.TRANSACTION_SIGNING_SECRET
   ```

2. **Add to Build Config**
   ```gradle
   // In build.gradle.kts
   buildConfigField("String", "TRANSACTION_SIGNING_SECRET", "\"${System.getenv("TRANSACTION_SIGNING_SECRET")}\"")
   ```

3. **Set Environment Variable**
   ```bash
   export TRANSACTION_SIGNING_SECRET="your-production-secret"
   ```

4. **Verify Backend Secret Matches**
   ```bash
   # Backend .env
   TRANSACTION_SIGNING_SECRET=your-production-secret
   ```

5. **Deploy and Test**
   - Deploy frontend
   - Test withdrawal on staging
   - Monitor logs for signature errors
   - Deploy to production

## Monitoring

### Metrics to Track
- Signature generation time
- Signature verification success rate
- Replay attack attempts
- Time sync errors

### Logs to Monitor
- "Invalid signature" errors
- "Signature expired" errors
- "Nonce already used" errors
- Withdrawal success rate

## Known Limitations

1. **Desktop/Web Not Implemented**
   - Only Android and iOS have HMAC implementations
   - Need to add JVM and JS implementations

2. **Hardcoded Secret**
   - Currently in source code
   - Should be moved to secure config

3. **No Key Rotation**
   - Secret key is static
   - Should implement rotation mechanism

4. **No Multi-Signature**
   - Single signature per request
   - Could add multiple signatures for large amounts

## Next Steps

1. ✅ Implement signature generation (DONE)
2. ✅ Add platform-specific HMAC (DONE)
3. ✅ Update API integration (DONE)
4. ✅ Create documentation (DONE)
5. ⏳ Move secret to secure config (TODO)
6. ⏳ Add unit tests (TODO)
7. ⏳ Add integration tests (TODO)
8. ⏳ Test on real devices (TODO)
9. ⏳ Deploy to staging (TODO)
10. ⏳ Deploy to production (TODO)

## Support

### Documentation
- `FRONTEND_TRANSACTION_SIGNING.md` - Full documentation
- `TRANSACTION_SIGNING_QUICK_REF.md` - Quick reference
- `TRANSACTION_SIGNING_SYSTEM.md` - Backend documentation

### Troubleshooting
1. Check secret key matches backend
2. Verify device time is synchronized
3. Check network connectivity
4. Review backend logs for signature errors
5. Test with curl/Postman first

---

**Status**: ✅ Implementation Complete
**Testing**: ⏳ Pending
**Deployment**: ⏳ Pending
**Last Updated**: 2026
