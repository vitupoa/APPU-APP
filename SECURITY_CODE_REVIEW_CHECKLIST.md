# Financial Security Code Review Checklist

Use this checklist when reviewing code that involves financial transactions, authentication, or sensitive data.

---

## 🔐 Cryptography Review

### Secrets & Keys
- [ ] No hardcoded secrets in code
- [ ] No secrets in BuildConfig or gradle.properties
- [ ] No secrets in comments or logs
- [ ] Secrets come from server at runtime
- [ ] Secrets stored in hardware-backed keystore
- [ ] Secrets cleared on logout
- [ ] Secrets have expiration time

### Algorithms
- [ ] Uses HMAC-SHA256 (not MD5, SHA1, or hashCode)
- [ ] Uses AES-256-GCM for encryption (not ECB mode)
- [ ] Uses SecureRandom for key generation (not Random)
- [ ] Key size is at least 256 bits
- [ ] IV/nonce is unique per encryption
- [ ] Constant-time comparison for signatures

### Code Patterns to Reject
```kotlin
// ❌ REJECT
private const val SECRET = "..."
val hash = data.hashCode()
val random = Random()
cipher.init(Cipher.ENCRYPT_MODE, key) // Missing IV
if (signature == expected) // Timing attack
```

---

## 💰 Financial Transaction Review

### Online Requirement
- [ ] Calls `offlineModeGuard.requireOnlineForFinancialTransaction()`
- [ ] No try-catch that bypasses offline check
- [ ] UI disabled when offline
- [ ] Clear error message shown to user
- [ ] No offline queueing of financial actions

### Amount Validation
- [ ] Validates amount > 0
- [ ] Validates amount is finite (not NaN/Infinity)
- [ ] Checks minimum amount
- [ ] Checks maximum amount
- [ ] Validates decimal precision (max 2 places)
- [ ] Validation happens before API call

### Request Signing
- [ ] Generates unique nonce per request
- [ ] Uses current timestamp
- [ ] Signs with `FinancialTransactionSecurity`
- [ ] Handles null signature (session expired)
- [ ] Includes all critical fields in signature
- [ ] Canonical string format matches server

### Code Patterns to Reject
```kotlin
// ❌ REJECT - No offline check
suspend fun sendTip(recipientId: String, amount: Int) {
    return api.sendTip(recipientId, amount)
}

// ❌ REJECT - Queuing financial transaction
if (!isOnline) {
    offlineQueue.queueAction(ActionType.TIP, ...)
}

// ❌ REJECT - No amount validation
suspend fun withdraw(amount: Double) {
    return api.withdraw(amount)
}

// ❌ REJECT - Using deprecated TransactionSigner
val signature = TransactionSigner.signTip(...)
```

### Code Patterns to Approve
```kotlin
// ✅ APPROVE
suspend fun sendTip(recipientId: String, amount: Int) {
    offlineModeGuard.requireOnlineForFinancialTransaction()
    
    val validation = financialSecurity.validateAmount(
        amount = amount.toDouble(),
        minAmount = 1.0,
        maxAmount = 10000.0
    )
    if (!validation.isValid) return Result.Error(validation.message)
    
    val nonce = WithdrawalSecurity.generateNonce()
    val timestamp = System.currentTimeMillis()
    
    val signature = financialSecurity.signTip(
        senderId = currentUserId,
        recipientId = recipientId,
        krAmount = amount,
        nonce = nonce,
        timestamp = timestamp
    ) ?: return Result.Error("Session expired")
    
    return api.sendTip(recipientId, amount, signature, nonce, timestamp)
}
```

---

## 🔒 Authentication Review

### Session Management
- [ ] Session secret initialized on login
- [ ] Session secret cleared on logout
- [ ] Session expiration checked before use
- [ ] Expired sessions handled gracefully
- [ ] No session data in SharedPreferences
- [ ] Session data in hardware keystore only

### Token Handling
- [ ] JWT tokens not logged
- [ ] Tokens cleared on logout
- [ ] Token expiration handled
- [ ] Refresh token flow secure
- [ ] No tokens in URL parameters

### Code Patterns to Reject
```kotlin
// ❌ REJECT - Logging sensitive data
Log.d("Auth", "Token: $jwtToken")

// ❌ REJECT - Storing in SharedPreferences
prefs.putString("session_secret", secret)

// ❌ REJECT - Not clearing on logout
suspend fun logout() {
    api.logout()
    // Missing: financialSecurity.clearSession()
}
```

---

## 📡 Network Security Review

### API Calls
- [ ] Uses HTTPS (not HTTP)
- [ ] Certificate pinning enabled
- [ ] Timeout configured
- [ ] Retry logic has max attempts
- [ ] Error messages don't leak sensitive info
- [ ] No sensitive data in URL parameters

### Request/Response
- [ ] Sensitive data in request body (not query params)
- [ ] Request signed/authenticated
- [ ] Response validated
- [ ] Error responses handled securely
- [ ] No sensitive data logged

### Code Patterns to Reject
```kotlin
// ❌ REJECT - Sensitive data in URL
api.get("/withdraw?amount=$amount&userId=$userId")

// ❌ REJECT - Logging response
Log.d("API", "Response: $response")

// ❌ REJECT - Exposing error details
catch (e: Exception) {
    showToast("Error: ${e.message}") // May leak internal info
}
```

---

## 💾 Data Storage Review

### Local Database
- [ ] Sensitive data encrypted
- [ ] Encryption key in hardware keystore
- [ ] No financial data cached
- [ ] Cache has expiration
- [ ] Database wiped on logout (if needed)

### File Storage
- [ ] Files in app-private directory
- [ ] Sensitive files encrypted
- [ ] No world-readable permissions
- [ ] Temporary files cleaned up
- [ ] No sensitive data in file names

### Code Patterns to Reject
```kotlin
// ❌ REJECT - Storing unencrypted sensitive data
database.insert("user_balance", balance)

// ❌ REJECT - World-readable file
file.setReadable(true, false)

// ❌ REJECT - Sensitive data in filename
File(cacheDir, "user_${userId}_balance_${balance}.tmp")
```

---

## 🎯 Offline Mode Review

### Action Queue
- [ ] Financial actions NOT in ActionType for queueing
- [ ] `canQueueOffline()` returns false for financial actions
- [ ] Queue validates action type before insertion
- [ ] Queue throws exception for financial actions
- [ ] Non-financial actions safe to queue

### Allowed Offline
- [ ] LIKE/UNLIKE
- [ ] BOOKMARK/UNBOOKMARK
- [ ] COMMENT
- [ ] SEND_MESSAGE
- [ ] VIEW
- [ ] SHARE

### NEVER Allowed Offline
- [ ] TIP
- [ ] WITHDRAW
- [ ] TOPUP
- [ ] PURCHASE
- [ ] Any action involving money

### Code Patterns to Reject
```kotlin
// ❌ REJECT - Financial action in queue
enum class ActionType {
    LIKE, UNLIKE, TIP // TIP should not be here
}

// ❌ REJECT - Not checking if can queue
suspend fun queueAction(actionType: ActionType) {
    // Missing: if (!offlineModeGuard.canQueueOffline(actionType))
    database.insert(actionType)
}
```

---

## 🧪 Testing Review

### Unit Tests
- [ ] Tests for offline blocking
- [ ] Tests for amount validation
- [ ] Tests for signature generation
- [ ] Tests for session expiration
- [ ] Tests for nonce uniqueness
- [ ] Tests for error handling

### Security Tests
- [ ] Cannot extract secrets from APK
- [ ] Cannot send tip while offline
- [ ] Cannot bypass amount validation
- [ ] Cannot replay old requests
- [ ] Session expires correctly
- [ ] Logout clears secrets

### Test Patterns to Reject
```kotlin
// ❌ REJECT - Not testing offline blocking
@Test
fun `send tip success`() {
    // Missing: verify offline check
    val result = repository.sendTip("user123", 10)
    assertTrue(result.isSuccess)
}

// ❌ REJECT - Not testing validation
@Test
fun `withdraw funds`() {
    // Missing: test invalid amounts
    val result = repository.withdraw(100.0)
    assertTrue(result.isSuccess)
}
```

### Test Patterns to Approve
```kotlin
// ✅ APPROVE
@Test
fun `send tip blocked when offline`() {
    offlineModeGuard.updateConnectivity(false)
    
    assertThrows<OfflineTransactionException> {
        repository.sendTip("user123", 10)
    }
}

@Test
fun `withdraw rejects negative amount`() {
    val result = repository.withdraw(-100.0)
    
    assertTrue(result is Result.Error)
    assertEquals("Amount must be greater than 0", result.message)
}
```

---

## 📱 UI/UX Review

### Offline State
- [ ] Financial buttons disabled when offline
- [ ] Clear message shown to user
- [ ] UI reflects connectivity state
- [ ] No confusing error messages
- [ ] Graceful degradation

### Error Handling
- [ ] User-friendly error messages
- [ ] No technical jargon
- [ ] No stack traces shown
- [ ] Actionable guidance provided
- [ ] Errors logged for debugging

### Code Patterns to Reject
```kotlin
// ❌ REJECT - No offline handling
@Composable
fun TipButton(recipientId: String) {
    Button(onClick = { sendTip(recipientId, 10) }) {
        Text("Send Tip")
    }
}

// ❌ REJECT - Technical error message
catch (e: Exception) {
    showToast("SQLException: ${e.message}")
}
```

### Code Patterns to Approve
```kotlin
// ✅ APPROVE
@Composable
fun TipButton(recipientId: String) {
    val isOnline by offlineModeGuard.isOnline.collectAsState()
    
    Button(
        onClick = { 
            if (isOnline) sendTip(recipientId, 10)
            else showToast("Tips require internet connection")
        },
        enabled = isOnline
    ) {
        Text(if (isOnline) "Send Tip" else "Offline")
    }
}

// ✅ APPROVE
catch (e: OfflineTransactionException) {
    showToast("Please connect to the internet to complete this transaction")
}
```

---

## 🚨 Red Flags

Immediately reject code that contains:

1. **Hardcoded Secrets**
   - `private const val SECRET = "..."`
   - `BuildConfig.TRANSACTION_SIGNING_SECRET`
   - Any secret in code or config files

2. **Weak Cryptography**
   - `hashCode()`
   - `MD5`
   - `SHA1`
   - `Random()` (not SecureRandom)

3. **Offline Financial Transactions**
   - Queueing tips/withdrawals/purchases
   - No offline check before financial API calls
   - Try-catch bypassing offline guard

4. **Missing Validation**
   - No amount validation
   - No session expiration check
   - No signature verification

5. **Insecure Storage**
   - Sensitive data in SharedPreferences
   - Unencrypted database
   - World-readable files

6. **Information Leakage**
   - Logging sensitive data
   - Exposing error details
   - Sensitive data in URLs

---

## ✅ Approval Criteria

Code can be approved if:

1. **Security Requirements Met**
   - All checklist items passed
   - No red flags present
   - Follows security best practices

2. **Documentation Present**
   - Code comments explain security decisions
   - Complex logic documented
   - References to security docs

3. **Tests Included**
   - Security scenarios tested
   - Edge cases covered
   - Error handling tested

4. **Code Quality**
   - Clean and readable
   - No code duplication
   - Follows project patterns

---

## 📝 Review Comments Template

### For Hardcoded Secrets
```
❌ Security Issue: Hardcoded secret detected

This secret can be extracted from the APK by attackers.

Required changes:
1. Remove hardcoded secret
2. Use FinancialTransactionSecurity with server-provided secrets
3. See FINANCIAL_TRANSACTION_SECURITY.md for implementation

References:
- SECURITY_FIXES_SUMMARY.md - Vulnerability #1
```

### For Missing Offline Check
```
❌ Security Issue: Financial transaction missing offline check

This allows financial transactions to be attempted offline, which is a security risk.

Required changes:
1. Add offlineModeGuard.requireOnlineForFinancialTransaction() at start of function
2. Update UI to disable button when offline
3. See FINANCIAL_SECURITY_QUICK_REF.md for example

References:
- SECURITY_FIXES_SUMMARY.md - Vulnerability #3
```

### For Weak Cryptography
```
❌ Security Issue: Weak cryptographic function

hashCode() is not cryptographically secure and can be easily reversed.

Required changes:
1. Remove hashCode() usage
2. Use SecureHmac.sign() with HMAC-SHA256
3. Get secret from FinancialTransactionSecurity

References:
- SECURITY_FIXES_SUMMARY.md - Vulnerability #2
```

---

## 🎓 Training Resources

Before reviewing financial code, reviewers should read:

1. **FINANCIAL_TRANSACTION_SECURITY.md** - Complete implementation guide
2. **SECURITY_FIXES_SUMMARY.md** - Vulnerabilities and fixes
3. **FINANCIAL_SECURITY_QUICK_REF.md** - Quick reference
4. **SECURITY_MIGRATION_GUIDE.md** - Migration examples

---

## 📞 Escalation

Escalate to security team if:
- Unsure about cryptographic implementation
- Complex security scenario
- Potential vulnerability found
- Need security architecture review

**Remember:** When in doubt, reject and ask for security review. Better safe than sorry with financial transactions.
