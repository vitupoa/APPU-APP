# Transaction Signing - Developer Checklist

## ✅ Completed (By AI)

- [x] Create TransactionSigner.kt (common)
- [x] Create HmacSha256.android.kt (Android implementation)
- [x] Create HmacSha256.ios.kt (iOS implementation)
- [x] Update WalletApi.kt with withdraw method
- [x] Update WalletRepository.kt interface
- [x] Update WalletRepositoryImpl.kt with signature generation
- [x] Fix WithdrawViewModel.kt placeholder methods
- [x] Create comprehensive documentation
- [x] Create quick reference guide
- [x] Create implementation summary

## 🔧 Configuration (Required Before Testing)

### 1. Update Secret Key

**File**: `composeApp/src/commonMain/kotlin/com/runinga/com/core/security/TransactionSigner.kt`

**Current**:
```kotlin
private const val SECRET = "your-transaction-signing-secret-key-here"
```

**Change to**:
```kotlin
private val SECRET = BuildConfig.TRANSACTION_SIGNING_SECRET
```

### 2. Add BuildConfig Field

**File**: `composeApp/build.gradle.kts`

**Add**:
```kotlin
android {
    buildFeatures {
        buildConfig = true
    }
    
    defaultConfig {
        buildConfigField(
            "String",
            "TRANSACTION_SIGNING_SECRET",
            "\"${System.getenv("TRANSACTION_SIGNING_SECRET") ?: "dev-secret-key"}\""
        )
    }
}
```

### 3. Set Environment Variable

**Development**:
```bash
# Windows
set TRANSACTION_SIGNING_SECRET=dev-secret-key

# macOS/Linux
export TRANSACTION_SIGNING_SECRET=dev-secret-key
```

**Production**:
```bash
# Use the SAME secret as backend
export TRANSACTION_SIGNING_SECRET=your-production-secret-from-backend
```

### 4. Verify Backend Secret

**File**: `backend/.env`

**Check**:
```bash
TRANSACTION_SIGNING_SECRET=your-production-secret-from-backend
```

⚠️ **CRITICAL**: Frontend and backend MUST use the EXACT SAME secret!

## 🧪 Testing (Required)

### 1. Unit Tests

**Create**: `composeApp/src/commonTest/kotlin/com/runinga/com/core/security/TransactionSignerTest.kt`

```kotlin
class TransactionSignerTest {
    @Test
    fun testNonceUniqueness() {
        val nonce1 = TransactionSigner.generateNonce()
        val nonce2 = TransactionSigner.generateNonce()
        assertNotEquals(nonce1, nonce2)
    }
    
    @Test
    fun testSignatureConsistency() {
        val sig1 = TransactionSigner.signWithdrawal(
            krAmount = 50000.0,
            provider = "mpesa",
            currency = "KES",
            timestamp = 1234567890,
            nonce = "test-nonce"
        )
        val sig2 = TransactionSigner.signWithdrawal(
            krAmount = 50000.0,
            provider = "mpesa",
            currency = "KES",
            timestamp = 1234567890,
            nonce = "test-nonce"
        )
        assertEquals(sig1, sig2)
    }
}
```

**Run**:
```bash
./gradlew :composeApp:testDebugUnitTest
```

### 2. Integration Tests

**Test withdrawal flow**:
1. Open app
2. Navigate to Wallet → Withdraw
3. Enter amount (e.g., Rc 50,000)
4. Select M-Pesa
5. Enter phone number
6. Click "Withdraw"
7. Check backend logs for signature verification

**Expected**:
- ✅ Request sent with signature, timestamp, nonce
- ✅ Backend verifies signature successfully
- ✅ Withdrawal request created

**If fails**:
- ❌ Check secret key matches
- ❌ Check device time is correct
- ❌ Check backend logs for error details

### 3. Platform Tests

**Android**:
```bash
./gradlew :composeApp:assembleDebug
adb install composeApp/build/outputs/apk/debug/composeApp-debug.apk
# Test withdrawal on device
```

**iOS**:
```bash
# Open in Xcode
open iosApp/iosApp.xcodeproj
# Build and run on simulator/device
# Test withdrawal
```

## 📱 Manual Testing Scenarios

### Scenario 1: Successful Withdrawal
- [ ] Amount: Rc 50,000
- [ ] Provider: M-Pesa
- [ ] Phone: +254712345678
- [ ] Expected: Success message, balance updated

### Scenario 2: Invalid Amount
- [ ] Amount: Rc 0
- [ ] Expected: "Invalid amount" error

### Scenario 3: Insufficient Balance
- [ ] Amount: Rc 999,999,999
- [ ] Expected: "Insufficient balance" error

### Scenario 4: Network Error
- [ ] Turn off WiFi/data
- [ ] Try withdrawal
- [ ] Expected: Network error message

### Scenario 5: Signature Verification
- [ ] Change secret key in frontend
- [ ] Try withdrawal
- [ ] Expected: "Invalid signature" error from backend

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing complete on Android
- [ ] Manual testing complete on iOS
- [ ] Secret key configured in production
- [ ] Backend signature verification working
- [ ] Documentation reviewed

### Deployment
- [ ] Update secret key in production config
- [ ] Build release APK/IPA
- [ ] Test on staging environment
- [ ] Monitor logs for signature errors
- [ ] Deploy to production
- [ ] Monitor withdrawal success rate

### Post-Deployment
- [ ] Verify withdrawals working
- [ ] Check signature success rate (should be >99%)
- [ ] Monitor for replay attacks
- [ ] Check error logs
- [ ] User feedback

## 🐛 Troubleshooting

### Issue: "Invalid signature"
**Check**:
- [ ] Secret key matches backend
- [ ] Canonical string format correct
- [ ] No extra spaces in values
- [ ] Timestamp in milliseconds

**Debug**:
```kotlin
// Add temporary logging (remove in production!)
println("Canonical: $canonical")
println("Signature: $signature")
```

### Issue: "Signature expired"
**Check**:
- [ ] Device time is correct
- [ ] Network latency < 5 minutes
- [ ] Timestamp generation working

**Fix**:
```kotlin
// Check time sync
val deviceTime = Clock.System.now().toEpochMilliseconds()
println("Device time: $deviceTime")
```

### Issue: "Nonce already used"
**Check**:
- [ ] Not retrying same request
- [ ] Generating new nonce each time
- [ ] No duplicate button clicks

**Fix**:
```kotlin
// Prevent duplicate submissions
var isSubmitting = false
if (isSubmitting) return
isSubmitting = true
```

## 📊 Monitoring

### Metrics to Track
- [ ] Signature generation time (should be <5ms)
- [ ] Signature verification success rate (should be >99%)
- [ ] Withdrawal success rate
- [ ] Replay attack attempts
- [ ] Time sync errors

### Logs to Monitor
- [ ] "Invalid signature" errors
- [ ] "Signature expired" errors
- [ ] "Nonce already used" errors
- [ ] Withdrawal failures

### Alerts to Set Up
- [ ] Signature success rate drops below 95%
- [ ] High number of replay attacks
- [ ] Withdrawal failure rate increases

## 📚 Documentation

### Files to Review
- [ ] FRONTEND_TRANSACTION_SIGNING.md (full docs)
- [ ] TRANSACTION_SIGNING_QUICK_REF.md (quick ref)
- [ ] FRONTEND_SIGNING_SUMMARY.md (summary)
- [ ] TRANSACTION_SIGNING_SYSTEM.md (backend docs)

### Knowledge Transfer
- [ ] Share docs with team
- [ ] Explain signature flow
- [ ] Demo on device
- [ ] Document common issues
- [ ] Train support team

## ✅ Sign-Off

### Developer
- [ ] Code reviewed
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Ready for QA

### QA
- [ ] Functional testing complete
- [ ] Security testing complete
- [ ] Performance testing complete
- [ ] Ready for staging

### DevOps
- [ ] Secret configured
- [ ] Monitoring set up
- [ ] Alerts configured
- [ ] Ready for production

### Product
- [ ] Feature verified
- [ ] User flow tested
- [ ] Error messages reviewed
- [ ] Ready for release

---

**Next Action**: Configure secret key and run tests!
**Estimated Time**: 30 minutes
**Priority**: High (Security Feature)
