# Financial Transaction Security - Implementation Guide

## 🔴 Critical Security Principles

### 1. NO Hardcoded Secrets
**NEVER** hardcode cryptographic keys, secrets, or salts in your application code.

**Why?**
- APK/IPA files can be decompiled
- Attackers can extract secrets from binary
- Compromised secrets affect ALL users
- Cannot rotate secrets without app update

**Solution:**
- Server provides session-specific secrets
- Secrets stored in hardware-backed keystore
- Secrets rotate periodically
- Each user session has unique secret

### 2. Financial Transactions MUST Be Online
**NEVER** queue financial transactions for offline processing.

**Why?**
- Real money is involved
- Server must validate immediately
- Prevents double-spending
- Prevents amount tampering
- Ensures balance checks are current

**Blocked Offline:**
- ✅ Tips
- ✅ Withdrawals
- ✅ Top-ups
- ✅ Purchases

**Allowed Offline (queued):**
- ✅ Likes/Unlikes
- ✅ Bookmarks
- ✅ Comments
- ✅ Messages
- ✅ Views
- ✅ Shares

### 3. Client Signatures Are NOT Authorization
Client-side signatures are **anti-tampering only**, NOT authorization.

**Server MUST:**
- Validate ALL transactions independently
- Check user balance
- Verify transaction limits
- Validate signatures with server-side secret
- Generate unique transaction IDs
- Log all transactions

**Client signatures prevent:**
- Man-in-the-middle tampering
- Accidental data corruption
- Basic replay attacks

**Client signatures DO NOT prevent:**
- Determined attackers (server validation required)
- Compromised devices
- Root/jailbreak attacks

---

## 📋 Implementation Guide

### Step 1: Initialize Financial Security on Login

```kotlin
// In your login/authentication flow
class AuthRepository(
    private val financialSecurity: FinancialTransactionSecurity
) {
    suspend fun login(username: String, password: String): Result<User> {
        val response = api.login(username, password)
        
        if (response.isSuccess) {
            // Server provides session secret
            val sessionSecret = response.data.sessionSecret
            val expiresAt = response.data.secretExpiresAt
            
            // Initialize financial security
            financialSecurity.initializeSessionSecret(
                secret = sessionSecret,
                expiresAt = expiresAt
            )
        }
        
        return response
    }
    
    suspend fun logout() {
        // Clear session secret
        financialSecurity.clearSession()
        api.logout()
    }
}
```

### Step 2: Send Tip (Online Only)

```kotlin
class TipRepository(
    private val api: TipApi,
    private val financialSecurity: FinancialTransactionSecurity,
    private val offlineModeGuard: OfflineModeGuard
) {
    suspend fun sendTip(
        recipientId: String,
        krAmount: Int
    ): Result<TipResponse> {
        // CRITICAL: Block if offline
        offlineModeGuard.requireOnlineForFinancialTransaction()
        
        // Validate amount
        val validation = financialSecurity.validateAmount(
            amount = krAmount.toDouble(),
            minAmount = 1.0,
            maxAmount = 10000.0
        )
        
        if (!validation.isValid) {
            return Result.Error(validation.message)
        }
        
        // Generate request parameters
        val nonce = WithdrawalSecurity.generateNonce()
        val timestamp = System.currentTimeMillis()
        
        // Sign request (anti-tampering)
        val signature = financialSecurity.signTip(
            senderId = getCurrentUserId(),
            recipientId = recipientId,
            krAmount = krAmount,
            nonce = nonce,
            timestamp = timestamp
        ) ?: return Result.Error("Session expired. Please login again.")
        
        // Send to server
        return api.sendTip(
            recipientId = recipientId,
            krAmount = krAmount,
            nonce = nonce,
            timestamp = timestamp,
            signature = signature
        )
    }
}
```

### Step 3: Withdraw Funds (Online Only)

```kotlin
class WithdrawalRepository(
    private val api: WithdrawalApi,
    private val financialSecurity: FinancialTransactionSecurity,
    private val offlineModeGuard: OfflineModeGuard
) {
    suspend fun withdrawFunds(
        krAmount: Double,
        provider: String,
        currency: String
    ): Result<WithdrawalResponse> {
        // CRITICAL: Block if offline
        offlineModeGuard.requireOnlineForFinancialTransaction()
        
        // Validate amount
        val validation = financialSecurity.validateAmount(
            amount = krAmount,
            minAmount = 10.0,
            maxAmount = 100000.0
        )
        
        if (!validation.isValid) {
            return Result.Error(validation.message)
        }
        
        // Generate request parameters
        val nonce = WithdrawalSecurity.generateNonce()
        val timestamp = System.currentTimeMillis()
        
        // Sign request
        val signature = financialSecurity.signWithdrawal(
            userId = getCurrentUserId(),
            krAmount = krAmount,
            provider = provider,
            currency = currency,
            nonce = nonce,
            timestamp = timestamp
        ) ?: return Result.Error("Session expired. Please login again.")
        
        // Send to server
        return api.withdraw(
            krAmount = krAmount,
            provider = provider,
            currency = currency,
            nonce = nonce,
            timestamp = timestamp,
            signature = signature
        )
    }
}
```

### Step 4: Top-Up Account (Online Only)

```kotlin
class TopUpRepository(
    private val api: TopUpApi,
    private val financialSecurity: FinancialTransactionSecurity,
    private val offlineModeGuard: OfflineModeGuard
) {
    suspend fun topUpAccount(
        amount: Double,
        currency: String,
        paymentMethod: String
    ): Result<TopUpResponse> {
        // CRITICAL: Block if offline
        offlineModeGuard.requireOnlineForFinancialTransaction()
        
        // Validate amount
        val validation = financialSecurity.validateAmount(
            amount = amount,
            minAmount = 5.0,
            maxAmount = 50000.0
        )
        
        if (!validation.isValid) {
            return Result.Error(validation.message)
        }
        
        // Generate request parameters
        val nonce = WithdrawalSecurity.generateNonce()
        val timestamp = System.currentTimeMillis()
        
        // Sign request
        val signature = financialSecurity.signTopUp(
            userId = getCurrentUserId(),
            amount = amount,
            currency = currency,
            paymentMethod = paymentMethod,
            nonce = nonce,
            timestamp = timestamp
        ) ?: return Result.Error("Session expired. Please login again.")
        
        // Send to server
        return api.topUp(
            amount = amount,
            currency = currency,
            paymentMethod = paymentMethod,
            nonce = nonce,
            timestamp = timestamp,
            signature = signature
        )
    }
}
```

### Step 5: Monitor Network Connectivity

```kotlin
// In your App initialization
class App : Application() {
    private val offlineModeGuard: OfflineModeGuard by inject()
    
    override fun onCreate() {
        super.onCreate()
        
        // Monitor network connectivity
        val connectivityManager = getSystemService(ConnectivityManager::class.java)
        val networkCallback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                offlineModeGuard.updateConnectivity(true)
            }
            
            override fun onLost(network: Network) {
                offlineModeGuard.updateConnectivity(false)
            }
        }
        
        connectivityManager.registerDefaultNetworkCallback(networkCallback)
    }
}
```

### Step 6: Handle Offline UI

```kotlin
@Composable
fun TipButton(
    recipientId: String,
    onTipSent: () -> Unit
) {
    val offlineModeGuard: OfflineModeGuard = get()
    val isOnline by offlineModeGuard.isOnline.collectAsState()
    
    Button(
        onClick = {
            if (isOnline) {
                // Show tip dialog
                showTipDialog()
            } else {
                // Show offline message
                showToast("Tips require an active internet connection")
            }
        },
        enabled = isOnline
    ) {
        Text(if (isOnline) "Send Tip" else "Offline - Tips Disabled")
    }
}
```

---

## 🔒 Server-Side Requirements

### 1. Session Secret Generation

```kotlin
// Server-side (example)
fun generateSessionSecret(userId: String): SessionSecret {
    // Generate cryptographically secure random secret
    val secret = SecureRandom().generateSeed(32) // 256 bits
    
    // Store in database with expiry
    val expiresAt = System.currentTimeMillis() + (24 * 60 * 60 * 1000) // 24 hours
    
    database.storeSessionSecret(
        userId = userId,
        secret = secret,
        expiresAt = expiresAt
    )
    
    return SessionSecret(
        secret = Base64.encode(secret),
        expiresAt = expiresAt
    )
}
```

### 2. Signature Verification

```kotlin
// Server-side (example)
fun verifyTipSignature(request: TipRequest): Boolean {
    // Retrieve user's session secret
    val sessionSecret = database.getSessionSecret(request.userId)
    
    if (sessionSecret == null || sessionSecret.isExpired()) {
        return false
    }
    
    // Reconstruct canonical string
    val canonical = "TIP|senderId=${request.senderId}&recipientId=${request.recipientId}&krAmount=${request.krAmount}&nonce=${request.nonce}&timestamp=${request.timestamp}"
    
    // Verify signature
    val expectedSignature = HmacSHA256.sign(canonical, sessionSecret.secret)
    
    return constantTimeEquals(request.signature, expectedSignature)
}
```

### 3. Transaction Validation

```kotlin
// Server-side (example)
fun processTip(request: TipRequest): Result {
    // 1. Verify signature
    if (!verifyTipSignature(request)) {
        return Result.Error("Invalid signature")
    }
    
    // 2. Check nonce uniqueness (prevent replay)
    if (database.nonceExists(request.nonce)) {
        return Result.Error("Duplicate request")
    }
    
    // 3. Validate timestamp (prevent old requests)
    if (System.currentTimeMillis() - request.timestamp > 5 * 60 * 1000) {
        return Result.Error("Request expired")
    }
    
    // 4. Check sender balance
    val senderBalance = database.getUserBalance(request.senderId)
    if (senderBalance < request.krAmount) {
        return Result.Error("Insufficient balance")
    }
    
    // 5. Validate amount limits
    if (request.krAmount < 1 || request.krAmount > 10000) {
        return Result.Error("Invalid amount")
    }
    
    // 6. Process transaction atomically
    database.transaction {
        database.deductBalance(request.senderId, request.krAmount)
        database.addBalance(request.recipientId, request.krAmount)
        database.recordTransaction(request)
        database.storeNonce(request.nonce)
    }
    
    return Result.Success()
}
```

---

## ✅ Security Checklist

### Client-Side
- [ ] No hardcoded secrets in code
- [ ] Financial transactions blocked offline
- [ ] Session secrets stored in hardware keystore
- [ ] Signatures use HMAC-SHA256
- [ ] Nonces are cryptographically random
- [ ] Amount validation before API calls
- [ ] Clear secrets on logout
- [ ] Handle session expiry gracefully

### Server-Side
- [ ] Generate unique session secrets per user
- [ ] Rotate secrets periodically (24-48 hours)
- [ ] Verify ALL transaction signatures
- [ ] Check nonce uniqueness (prevent replay)
- [ ] Validate timestamps (max 5 minutes old)
- [ ] Verify user balance before transaction
- [ ] Use database transactions (atomicity)
- [ ] Log all financial transactions
- [ ] Rate limit financial endpoints
- [ ] Monitor for suspicious patterns

---

## 🚨 What NOT To Do

### ❌ DON'T: Hardcode Secrets
```kotlin
// WRONG - Secret in code
private const val SECRET = "my_secret_key_123"
```

### ❌ DON'T: Queue Financial Transactions Offline
```kotlin
// WRONG - Queuing tip offline
if (!isOnline) {
    offlineQueue.queueTip(recipientId, amount) // NEVER DO THIS
}
```

### ❌ DON'T: Trust Client Balance
```kotlin
// WRONG - Only checking client-side balance
if (localBalance >= amount) {
    sendTip() // Server MUST verify balance too
}
```

### ❌ DON'T: Skip Signature Verification
```kotlin
// WRONG - Processing without verification
fun processTip(request: TipRequest) {
    // Missing signature verification!
    database.transfer(request.senderId, request.recipientId, request.amount)
}
```

### ❌ DON'T: Use Weak Hashing
```kotlin
// WRONG - hashCode() is not cryptographically secure
val hash = "$userId:$amount".hashCode()
```

---

## 📞 Support

If you have questions about financial transaction security:
1. Review this document thoroughly
2. Check server-side implementation
3. Test with small amounts first
4. Monitor transaction logs
5. Implement fraud detection

**Remember:** Security is not optional for financial transactions. Follow these guidelines strictly.
