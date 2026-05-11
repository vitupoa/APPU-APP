# Security Migration Guide

## Overview
This guide helps you migrate from the old insecure implementation to the new secure financial transaction system.

---

## 🔴 Critical Changes

### 1. TransactionSigner is DEPRECATED
**Old (INSECURE):**
```kotlin
val signature = TransactionSigner.signTip(
    recipientId = recipientId,
    krAmount = amount,
    currency = "USD",
    timestamp = timestamp,
    nonce = nonce
)
```

**New (SECURE):**
```kotlin
val signature = financialTransactionSecurity.signTip(
    senderId = currentUserId,
    recipientId = recipientId,
    krAmount = amount,
    nonce = nonce,
    timestamp = timestamp
)
```

**Why?**
- Old: Used hardcoded secret from BuildConfig (can be extracted from APK)
- New: Uses server-provided session secret (unique per user, rotates periodically)

---

### 2. WithdrawalSecurity Hash Functions REMOVED
**Old (INSECURE):**
```kotlin
val hash = WithdrawalSecurity.generateAmountHash(
    userId = userId,
    amount = amount,
    timestamp = timestamp
)
```

**New (SECURE):**
```kotlin
// Client-side hashing removed - server validates everything
// Only use WithdrawalSecurity for:
// 1. Amount validation
// 2. Nonce generation

val validation = financialTransactionSecurity.validateAmount(
    amount = amount,
    minAmount = 10.0,
    maxAmount = 100000.0
)

val nonce = WithdrawalSecurity.generateNonce()
```

**Why?**
- Old: Used weak hashCode() function with hardcoded salt
- New: Server-side validation with proper HMAC-SHA256

---

### 3. Financial Transactions Now Blocked Offline
**Old (INSECURE):**
```kotlin
// Would attempt transaction even offline
suspend fun sendTip(recipientId: String, amount: Int) {
    val result = api.sendTip(recipientId, amount)
    // ...
}
```

**New (SECURE):**
```kotlin
suspend fun sendTip(recipientId: String, amount: Int) {
    // CRITICAL: Block if offline
    offlineModeGuard.requireOnlineForFinancialTransaction()
    
    val result = api.sendTip(recipientId, amount)
    // ...
}
```

**Why?**
- Old: Could queue financial transactions offline (fraud risk)
- New: Requires active internet for all financial operations

---

## 📋 Step-by-Step Migration

### Step 1: Update Dependencies

Add to your DI module:

```kotlin
// In AppModule.kt
single { OfflineModeGuard() }
single { FinancialTransactionSecurity() }
```

### Step 2: Initialize on Login

Update your authentication flow:

```kotlin
class AuthRepository(
    private val api: AuthApi,
    private val financialSecurity: FinancialTransactionSecurity
) {
    suspend fun login(username: String, password: String): Result<User> {
        val response = api.login(username, password)
        
        if (response is NetworkResult.Success) {
            // NEW: Initialize financial security with server secret
            financialSecurity.initializeSessionSecret(
                secret = response.data.sessionSecret,
                expiresAt = response.data.secretExpiresAt
            )
        }
        
        return response
    }
    
    suspend fun logout() {
        // NEW: Clear session secret
        financialSecurity.clearSession()
        api.logout()
    }
}
```

### Step 3: Update Server Response Models

Add session secret to login response:

```kotlin
@Serializable
data class LoginResponse(
    val user: User,
    val token: String,
    // NEW: Server provides session secret
    val sessionSecret: String,
    val secretExpiresAt: Long
)
```

### Step 4: Migrate Tip Implementation

**Before:**
```kotlin
suspend fun sendTip(recipientId: String, amount: Int): Result<TipResponse> {
    val nonce = TransactionSigner.generateNonce()
    val timestamp = TransactionSigner.generateTimestamp()
    
    val signature = TransactionSigner.signTip(
        recipientId = recipientId,
        krAmount = amount,
        currency = "USD",
        timestamp = timestamp,
        nonce = nonce
    )
    
    return api.sendTip(
        recipientId = recipientId,
        amount = amount,
        signature = signature,
        nonce = nonce,
        timestamp = timestamp
    )
}
```

**After:**
```kotlin
suspend fun sendTip(recipientId: String, amount: Int): Result<TipResponse> {
    // NEW: Block if offline
    offlineModeGuard.requireOnlineForFinancialTransaction()
    
    // NEW: Validate amount
    val validation = financialSecurity.validateAmount(
        amount = amount.toDouble(),
        minAmount = 1.0,
        maxAmount = 10000.0
    )
    if (!validation.isValid) {
        return Result.Error(validation.message)
    }
    
    val nonce = WithdrawalSecurity.generateNonce()
    val timestamp = System.currentTimeMillis()
    
    // NEW: Use FinancialTransactionSecurity
    val signature = financialSecurity.signTip(
        senderId = getCurrentUserId(),
        recipientId = recipientId,
        krAmount = amount,
        nonce = nonce,
        timestamp = timestamp
    ) ?: return Result.Error("Session expired")
    
    return api.sendTip(
        recipientId = recipientId,
        amount = amount,
        signature = signature,
        nonce = nonce,
        timestamp = timestamp
    )
}
```

### Step 5: Migrate Withdrawal Implementation

**Before:**
```kotlin
suspend fun withdraw(amount: Double, provider: String): Result<WithdrawalResponse> {
    val nonce = TransactionSigner.generateNonce()
    val timestamp = TransactionSigner.generateTimestamp()
    
    val signature = TransactionSigner.signWithdrawal(
        krAmount = amount,
        provider = provider,
        currency = "USD",
        timestamp = timestamp,
        nonce = nonce
    )
    
    return api.withdraw(amount, provider, signature, nonce, timestamp)
}
```

**After:**
```kotlin
suspend fun withdraw(amount: Double, provider: String, currency: String): Result<WithdrawalResponse> {
    // NEW: Block if offline
    offlineModeGuard.requireOnlineForFinancialTransaction()
    
    // NEW: Validate amount
    val validation = financialSecurity.validateAmount(
        amount = amount,
        minAmount = 10.0,
        maxAmount = 100000.0
    )
    if (!validation.isValid) {
        return Result.Error(validation.message)
    }
    
    val nonce = WithdrawalSecurity.generateNonce()
    val timestamp = System.currentTimeMillis()
    
    // NEW: Use FinancialTransactionSecurity
    val signature = financialSecurity.signWithdrawal(
        userId = getCurrentUserId(),
        krAmount = amount,
        provider = provider,
        currency = currency,
        nonce = nonce,
        timestamp = timestamp
    ) ?: return Result.Error("Session expired")
    
    return api.withdraw(amount, provider, currency, signature, nonce, timestamp)
}
```

### Step 6: Update UI to Handle Offline State

**Before:**
```kotlin
@Composable
fun TipButton(recipientId: String) {
    Button(onClick = { sendTip(recipientId, 10) }) {
        Text("Send Tip")
    }
}
```

**After:**
```kotlin
@Composable
fun TipButton(recipientId: String) {
    val offlineModeGuard: OfflineModeGuard = get()
    val isOnline by offlineModeGuard.isOnline.collectAsState()
    
    Button(
        onClick = { 
            if (isOnline) {
                sendTip(recipientId, 10)
            } else {
                showToast("Tips require internet connection")
            }
        },
        enabled = isOnline
    ) {
        Text(if (isOnline) "Send Tip" else "Offline")
    }
}
```

### Step 7: Monitor Network Connectivity

Add to your Application class:

```kotlin
class KrietaApp : Application() {
    private val offlineModeGuard: OfflineModeGuard by inject()
    
    override fun onCreate() {
        super.onCreate()
        
        // Monitor network connectivity
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

## 🔧 Server-Side Changes Required

### 1. Generate Session Secrets

Add to login endpoint:

```kotlin
@POST("/auth/login")
suspend fun login(@Body request: LoginRequest): LoginResponse {
    val user = authenticateUser(request.username, request.password)
    
    // Generate session secret
    val sessionSecret = generateSessionSecret(user.id)
    
    return LoginResponse(
        user = user,
        token = generateJWT(user),
        sessionSecret = sessionSecret.secret,
        secretExpiresAt = sessionSecret.expiresAt
    )
}

fun generateSessionSecret(userId: String): SessionSecret {
    val secret = SecureRandom().generateSeed(32) // 256 bits
    val expiresAt = System.currentTimeMillis() + (24 * 60 * 60 * 1000)
    
    database.storeSessionSecret(userId, secret, expiresAt)
    
    return SessionSecret(
        secret = Base64.encode(secret),
        expiresAt = expiresAt
    )
}
```

### 2. Update Signature Verification

Replace old verification:

```kotlin
// OLD (INSECURE)
fun verifySignature(request: TipRequest): Boolean {
    val canonical = "tip|recipientId=${request.recipientId}&krAmount=${request.krAmount}&currency=${request.currency}&timestamp=${request.timestamp}&nonce=${request.nonce}"
    val expectedSignature = HmacSHA256.sign(canonical, HARDCODED_SECRET)
    return request.signature == expectedSignature
}

// NEW (SECURE)
fun verifySignature(request: TipRequest): Boolean {
    // Get user's session secret
    val sessionSecret = database.getSessionSecret(request.senderId)
    if (sessionSecret == null || sessionSecret.isExpired()) {
        return false
    }
    
    val canonical = "TIP|senderId=${request.senderId}&recipientId=${request.recipientId}&krAmount=${request.krAmount}&nonce=${request.nonce}&timestamp=${request.timestamp}"
    val expectedSignature = HmacSHA256.sign(canonical, sessionSecret.secret)
    
    return constantTimeEquals(request.signature, expectedSignature)
}
```

### 3. Add Nonce Tracking

Prevent replay attacks:

```kotlin
@POST("/tip/send")
suspend fun sendTip(@Body request: TipRequest): TipResponse {
    // Verify signature
    if (!verifySignature(request)) {
        throw SecurityException("Invalid signature")
    }
    
    // NEW: Check nonce uniqueness
    if (database.nonceExists(request.nonce)) {
        throw SecurityException("Duplicate request")
    }
    
    // NEW: Validate timestamp (max 5 minutes old)
    if (System.currentTimeMillis() - request.timestamp > 5 * 60 * 1000) {
        throw SecurityException("Request expired")
    }
    
    // Process transaction
    val result = processTransaction(request)
    
    // NEW: Store nonce to prevent replay
    database.storeNonce(request.nonce, expiresAt = request.timestamp + (10 * 60 * 1000))
    
    return result
}
```

---

## ✅ Testing Checklist

### Client-Side Tests
- [ ] Tips blocked when offline
- [ ] Withdrawals blocked when offline
- [ ] Top-ups blocked when offline
- [ ] Session secret initialized on login
- [ ] Session secret cleared on logout
- [ ] Amount validation works correctly
- [ ] UI shows offline state
- [ ] Error messages are user-friendly

### Server-Side Tests
- [ ] Session secrets generated uniquely
- [ ] Signature verification works
- [ ] Nonce tracking prevents replay
- [ ] Timestamp validation rejects old requests
- [ ] Balance checks prevent overdraft
- [ ] Transactions are atomic
- [ ] All transactions logged

### Security Tests
- [ ] Cannot extract secrets from APK
- [ ] Cannot send tip while offline
- [ ] Cannot replay old requests
- [ ] Cannot tamper with amounts
- [ ] Session expires correctly
- [ ] Logout clears secrets

---

## 🚨 Breaking Changes

1. **TransactionSigner.signTip()** - DEPRECATED (compile error)
2. **TransactionSigner.signWithdrawal()** - DEPRECATED (compile error)
3. **WithdrawalSecurity.generateAmountHash()** - REMOVED
4. **WithdrawalSecurity.generateBalanceHash()** - REMOVED
5. **WithdrawalSecurity.validateAmountHash()** - REMOVED
6. **WithdrawalSecurity.validateBalanceHash()** - REMOVED
7. **SecureConfig.TRANSACTION_SIGNING_SECRET** - REMOVED

---

## 📞 Need Help?

If you encounter issues during migration:
1. Check FINANCIAL_TRANSACTION_SECURITY.md for detailed examples
2. Verify server-side changes are deployed
3. Test with small amounts first
4. Check logs for error messages
5. Ensure network connectivity monitoring is working

**Remember:** This migration is critical for security. Do not skip steps.
