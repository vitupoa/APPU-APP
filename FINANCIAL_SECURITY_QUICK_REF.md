# Financial Security Quick Reference

## 🚨 Golden Rules

1. **NO hardcoded secrets** - Ever. Period.
2. **Financial transactions MUST be online** - No exceptions.
3. **Server validates everything** - Client signatures are anti-tampering only.
4. **Use HMAC-SHA256** - Not hashCode(), not MD5, not SHA1.
5. **Session secrets expire** - Rotate every 24-48 hours.

---

## ✅ Correct Implementation

### Initialize on Login
```kotlin
// In AuthRepository
suspend fun login(username: String, password: String) {
    val response = api.login(username, password)
    
    financialSecurity.initializeSessionSecret(
        secret = response.sessionSecret,
        expiresAt = response.secretExpiresAt
    )
}
```

### Send Tip
```kotlin
suspend fun sendTip(recipientId: String, amount: Int) {
    // 1. Block if offline
    offlineModeGuard.requireOnlineForFinancialTransaction()
    
    // 2. Validate amount
    val validation = financialSecurity.validateAmount(
        amount = amount.toDouble(),
        minAmount = 1.0,
        maxAmount = 10000.0
    )
    if (!validation.isValid) return Result.Error(validation.message)
    
    // 3. Generate nonce & timestamp
    val nonce = WithdrawalSecurity.generateNonce()
    val timestamp = System.currentTimeMillis()
    
    // 4. Sign request
    val signature = financialSecurity.signTip(
        senderId = currentUserId,
        recipientId = recipientId,
        krAmount = amount,
        nonce = nonce,
        timestamp = timestamp
    ) ?: return Result.Error("Session expired")
    
    // 5. Send to server
    return api.sendTip(recipientId, amount, signature, nonce, timestamp)
}
```

### Withdraw Funds
```kotlin
suspend fun withdraw(amount: Double, provider: String, currency: String) {
    // 1. Block if offline
    offlineModeGuard.requireOnlineForFinancialTransaction()
    
    // 2. Validate amount
    val validation = financialSecurity.validateAmount(
        amount = amount,
        minAmount = 10.0,
        maxAmount = 100000.0
    )
    if (!validation.isValid) return Result.Error(validation.message)
    
    // 3. Generate nonce & timestamp
    val nonce = WithdrawalSecurity.generateNonce()
    val timestamp = System.currentTimeMillis()
    
    // 4. Sign request
    val signature = financialSecurity.signWithdrawal(
        userId = currentUserId,
        krAmount = amount,
        provider = provider,
        currency = currency,
        nonce = nonce,
        timestamp = timestamp
    ) ?: return Result.Error("Session expired")
    
    // 5. Send to server
    return api.withdraw(amount, provider, currency, signature, nonce, timestamp)
}
```

### Top-Up Account
```kotlin
suspend fun topUp(amount: Double, currency: String, paymentMethod: String) {
    // 1. Block if offline
    offlineModeGuard.requireOnlineForFinancialTransaction()
    
    // 2. Validate amount
    val validation = financialSecurity.validateAmount(
        amount = amount,
        minAmount = 5.0,
        maxAmount = 50000.0
    )
    if (!validation.isValid) return Result.Error(validation.message)
    
    // 3. Generate nonce & timestamp
    val nonce = WithdrawalSecurity.generateNonce()
    val timestamp = System.currentTimeMillis()
    
    // 4. Sign request
    val signature = financialSecurity.signTopUp(
        userId = currentUserId,
        amount = amount,
        currency = currency,
        paymentMethod = paymentMethod,
        nonce = nonce,
        timestamp = timestamp
    ) ?: return Result.Error("Session expired")
    
    // 5. Send to server
    return api.topUp(amount, currency, paymentMethod, signature, nonce, timestamp)
}
```

### Handle Offline UI
```kotlin
@Composable
fun TipButton(recipientId: String) {
    val offlineModeGuard: OfflineModeGuard = get()
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
```

---

## ❌ NEVER Do This

### ❌ Hardcode Secrets
```kotlin
// WRONG
private const val SECRET = "my_secret_key"
```

### ❌ Queue Financial Transactions Offline
```kotlin
// WRONG
if (!isOnline) {
    offlineQueue.queueTip(recipientId, amount)
}
```

### ❌ Use Weak Hashing
```kotlin
// WRONG
val hash = "$userId:$amount".hashCode()
```

### ❌ Skip Offline Check
```kotlin
// WRONG
suspend fun sendTip(recipientId: String, amount: Int) {
    // Missing: offlineModeGuard.requireOnlineForFinancialTransaction()
    return api.sendTip(recipientId, amount)
}
```

### ❌ Trust Client Balance
```kotlin
// WRONG - Server MUST verify balance too
if (localBalance >= amount) {
    sendTip() // Not enough!
}
```

---

## 🔧 DI Setup

```kotlin
// In AppModule.kt
single { OfflineModeGuard() }
single { FinancialTransactionSecurity() }

// In repositories
single { 
    TipRepository(
        api = get(),
        financialSecurity = get(),
        offlineModeGuard = get()
    )
}
```

---

## 📱 Network Monitoring

```kotlin
// In Application class
class RuningaApp : Application() {
    private val offlineModeGuard: OfflineModeGuard by inject()
    
    override fun onCreate() {
        super.onCreate()
        
        val connectivityManager = getSystemService(ConnectivityManager::class.java)
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                offlineModeGuard.updateConnectivity(true)
            }
            
            override fun onLost(network: Network) {
                offlineModeGuard.updateConnectivity(false)
            }
        }
        
        connectivityManager.registerDefaultNetworkCallback(callback)
    }
}
```

---

## 🔒 Server Requirements

### Login Response
```json
{
  "user": {...},
  "token": "jwt_token",
  "sessionSecret": "base64_encoded_256bit_secret",
  "secretExpiresAt": 1234567890000
}
```

### Signature Verification
```kotlin
// Server-side
fun verifySignature(request: TipRequest): Boolean {
    val sessionSecret = database.getSessionSecret(request.senderId)
    if (sessionSecret == null || sessionSecret.isExpired()) return false
    
    val canonical = "TIP|senderId=${request.senderId}&recipientId=${request.recipientId}&krAmount=${request.krAmount}&nonce=${request.nonce}&timestamp=${request.timestamp}"
    val expectedSignature = HmacSHA256.sign(canonical, sessionSecret.secret)
    
    return constantTimeEquals(request.signature, expectedSignature)
}
```

### Transaction Validation
```kotlin
// Server-side
fun processTip(request: TipRequest): Result {
    // 1. Verify signature
    if (!verifySignature(request)) return Error("Invalid signature")
    
    // 2. Check nonce uniqueness
    if (database.nonceExists(request.nonce)) return Error("Duplicate request")
    
    // 3. Validate timestamp (max 5 minutes)
    if (System.currentTimeMillis() - request.timestamp > 5 * 60 * 1000) {
        return Error("Request expired")
    }
    
    // 4. Check balance
    if (getUserBalance(request.senderId) < request.krAmount) {
        return Error("Insufficient balance")
    }
    
    // 5. Process atomically
    database.transaction {
        deductBalance(request.senderId, request.krAmount)
        addBalance(request.recipientId, request.krAmount)
        recordTransaction(request)
        storeNonce(request.nonce)
    }
    
    return Success()
}
```

---

## 🧪 Testing Checklist

### Client Tests
- [ ] Tips blocked when offline
- [ ] Withdrawals blocked when offline
- [ ] Top-ups blocked when offline
- [ ] Session initialized on login
- [ ] Session cleared on logout
- [ ] Amount validation works
- [ ] UI shows offline state

### Server Tests
- [ ] Session secrets generated
- [ ] Signatures verified
- [ ] Nonces prevent replay
- [ ] Timestamps validated
- [ ] Balance checked
- [ ] Transactions atomic

---

## 📚 Documentation

- **FINANCIAL_TRANSACTION_SECURITY.md** - Full implementation guide
- **SECURITY_MIGRATION_GUIDE.md** - Migration from old code
- **SECURITY_FIXES_SUMMARY.md** - Vulnerabilities & fixes

---

## 🆘 Common Errors

### "Session expired"
**Cause:** Session secret expired or not initialized
**Fix:** User needs to login again

### "Tips require internet connection"
**Cause:** Device is offline
**Fix:** User needs to connect to internet

### "Invalid signature"
**Cause:** Server couldn't verify signature
**Fix:** Check server-side secret matches, check canonical string format

### "Duplicate request"
**Cause:** Nonce already used
**Fix:** Generate new nonce for each request

---

## ⚡ Quick Commands

```bash
# Find usage of deprecated TransactionSigner
grep -r "TransactionSigner" --include="*.kt"

# Find hardcoded secrets
grep -r "SECRET\|secret\|key" --include="*.kt" | grep "const val"

# Find offline queue usage
grep -r "queueAction" --include="*.kt"
```

---

**Remember:** When in doubt, check the full documentation. Security is not optional!
