# Security Flow Diagrams

Visual representation of how the secure financial transaction system works.

---

## 🔐 Complete Security Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER AUTHENTICATION                          │
└─────────────────────────────────────────────────────────────────────┘

    📱 Client                                    🖥️  Server
    ┌──────┐                                    ┌──────┐
    │ User │                                    │ API  │
    └──┬───┘                                    └───┬──┘
       │                                            │
       │  1. POST /api/auth/login                  │
       │     {email, password, deviceId}           │
       ├──────────────────────────────────────────>│
       │                                            │
       │                                            │  2. Authenticate
       │                                            │     user credentials
       │                                            │
       │                                            │  3. Generate JWT
       │                                            │     tokens
       │                                            │
       │                                            │  4. Generate session
       │                                            │     secret (256-bit)
       │                                            │
       │                                            │  5. Store secret in
       │                                            │     database with
       │                                            │     expiry (24-48h)
       │                                            │
       │  6. Response:                              │
       │     {                                      │
       │       user: {...},                         │
       │       accessToken: "jwt...",               │
       │       refreshToken: "jwt...",              │
       │       sessionSecret: "base64...", ◄────────┤
       │       secretExpiresAt: 1234567890          │
       │     }                                      │
       │<──────────────────────────────────────────┤
       │                                            │
       │  7. Initialize                             │
       │     FinancialTransactionSecurity           │
       │     with session secret                    │
       │                                            │
       │  8. Store secret in                        │
       │     hardware keystore                      │
       │     (Android Keystore/                     │
       │      iOS Secure Enclave)                   │
       │                                            │

┌─────────────────────────────────────────────────────────────────────┐
│                      SEND TIP (ONLINE MODE)                          │
└─────────────────────────────────────────────────────────────────────┘

    📱 Client                                    🖥️  Server
    ┌──────┐                                    ┌──────┐
    │ User │                                    │ API  │
    └──┬───┘                                    └───┬──┘
       │                                            │
       │  1. User clicks "Send Tip"                │
       │                                            │
       │  2. Check: Is online?                     │
       │     OfflineModeGuard.isOnline             │
       │     ✅ YES → Continue                     │
       │                                            │
       │  3. Validate amount                        │
       │     financialSecurity.validateAmount()    │
       │     ✅ Valid → Continue                   │
       │                                            │
       │  4. Generate nonce                         │
       │     WithdrawalSecurity.generateNonce()    │
       │     → "a1b2c3d4e5f6..."                   │
       │                                            │
       │  5. Get timestamp                          │
       │     System.currentTimeMillis()            │
       │     → 1234567890123                        │
       │                                            │
       │  6. Create canonical string                │
       │     "TIP|senderId=user1&                   │
       │      recipientId=user2&                    │
       │      krAmount=100&                         │
       │      nonce=a1b2c3d4&                       │
       │      timestamp=1234567890"                 │
       │                                            │
       │  7. Sign with HMAC-SHA256                  │
       │     SecureHmac.sign(canonical, secret)    │
       │     → "base64_signature..."                │
       │                                            │
       │  8. POST /api/wallet/tip                   │
       │     {                                      │
       │       recipientId: "user2",                │
       │       krAmount: 100,                       │
       │       signature: "base64...",              │
       │       nonce: "a1b2c3d4...",                │
       │       timestamp: 1234567890                │
       │     }                                      │
       ├──────────────────────────────────────────>│
       │                                            │
       │                                            │  9. Get user's session
       │                                            │     secret from DB
       │                                            │
       │                                            │  10. Reconstruct
       │                                            │      canonical string
       │                                            │
       │                                            │  11. Verify signature
       │                                            │      HMAC-SHA256
       │                                            │      ✅ Valid
       │                                            │
       │                                            │  12. Check nonce
       │                                            │      uniqueness in DB
       │                                            │      ✅ Not used
       │                                            │
       │                                            │  13. Validate timestamp
       │                                            │      (max 5 min old)
       │                                            │      ✅ Valid
       │                                            │
       │                                            │  14. Check sender
       │                                            │      balance in DB
       │                                            │      ✅ Sufficient
       │                                            │
       │                                            │  15. BEGIN TRANSACTION
       │                                            │
       │                                            │  16. Deduct from sender
       │                                            │      UPDATE wallets
       │                                            │      SET balance -= 100
       │                                            │
       │                                            │  17. Add to recipient
       │                                            │      UPDATE wallets
       │                                            │      SET balance += 100
       │                                            │
       │                                            │  18. Record transaction
       │                                            │      INSERT INTO
       │                                            │      transactions
       │                                            │
       │                                            │  19. Store nonce
       │                                            │      INSERT INTO nonces
       │                                            │
       │                                            │  20. Log transaction
       │                                            │      INSERT INTO logs
       │                                            │
       │                                            │  21. COMMIT TRANSACTION
       │                                            │
       │  22. Response:                             │
       │      {                                     │
       │        success: true,                      │
       │        transactionId: "tx123",             │
       │        krTipped: 100                       │
       │      }                                     │
       │<──────────────────────────────────────────┤
       │                                            │
       │  23. Show success message                  │
       │      "Tip sent successfully!"              │
       │                                            │

┌─────────────────────────────────────────────────────────────────────┐
│                     SEND TIP (OFFLINE MODE)                          │
└─────────────────────────────────────────────────────────────────────┘

    📱 Client                                    🖥️  Server
    ┌──────┐                                    ┌──────┐
    │ User │                                    │ API  │
    └──┬───┘                                    └───┬──┘
       │                                            │
       │  1. User clicks "Send Tip"                │
       │                                            │
       │  2. Check: Is online?                     │
       │     OfflineModeGuard.isOnline             │
       │     ❌ NO → BLOCK                         │
       │                                            │
       │  3. Throw OfflineTransactionException     │
       │     "Tips require an active internet      │
       │      connection"                           │
       │                                            │
       │  4. Show error message                     │
       │     "Please connect to the internet       │
       │      to send tips"                         │
       │                                            │
       │  ❌ TRANSACTION BLOCKED                   │
       │     (Never reaches server)                 │
       │                                            │

┌─────────────────────────────────────────────────────────────────────┐
│                      SESSION EXPIRY HANDLING                         │
└─────────────────────────────────────────────────────────────────────┘

    📱 Client                                    🖥️  Server
    ┌──────┐                                    ┌──────┐
    │ User │                                    │ API  │
    └──┬───┘                                    └───┬──┘
       │                                            │
       │  1. User tries to send tip                │
       │     (24-48 hours after login)             │
       │                                            │
       │  2. Check session validity                │
       │     financialSecurity.isSessionValid()    │
       │     ❌ Expired                            │
       │                                            │
       │  3. Return null signature                  │
       │     signTip() → null                       │
       │                                            │
       │  4. Show error message                     │
       │     "Session expired.                      │
       │      Please login again."                  │
       │                                            │
       │  5. Redirect to login screen              │
       │                                            │

┌─────────────────────────────────────────────────────────────────────┐
│                         LOGOUT FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘

    📱 Client                                    🖥️  Server
    ┌──────┐                                    ┌──────┐
    │ User │                                    │ API  │
    └──┬───┘                                    └───┬──┘
       │                                            │
       │  1. User clicks "Logout"                  │
       │                                            │
       │  2. POST /api/auth/logout                 │
       ├──────────────────────────────────────────>│
       │                                            │
       │                                            │  3. Invalidate tokens
       │                                            │
       │                                            │  4. Deactivate session
       │                                            │     secret in DB
       │                                            │
       │  5. Response: {success: true}             │
       │<──────────────────────────────────────────┤
       │                                            │
       │  6. Clear JWT tokens                       │
       │     tokenManager.clearTokens()            │
       │                                            │
       │  7. Clear session secret                   │
       │     financialSecurity.clearSession()      │
       │     (Memory zeroed)                        │
       │                                            │
       │  8. Clear user data                        │
       │                                            │
       │  9. Redirect to login screen              │
       │                                            │

┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY ATTACK PREVENTION                        │
└─────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════╗
║  ATTACK: Hardcoded Secret Extraction                              ║
╚═══════════════════════════════════════════════════════════════════╝

    🔴 OLD (VULNERABLE):
    ┌─────────────────────────────────────┐
    │  APK/IPA File                       │
    │  ┌───────────────────────────────┐  │
    │  │ BuildConfig.kt                │  │
    │  │ const val SECRET = "abc123"   │  │ ← Attacker extracts
    │  └───────────────────────────────┘  │
    └─────────────────────────────────────┘
    
    ✅ NEW (SECURE):
    ┌─────────────────────────────────────┐
    │  APK/IPA File                       │
    │  ┌───────────────────────────────┐  │
    │  │ No secrets in code            │  │
    │  │ Secrets from server only      │  │ ← Nothing to extract
    │  └───────────────────────────────┘  │
    └─────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════╗
║  ATTACK: Replay Attack                                            ║
╚═══════════════════════════════════════════════════════════════════╝

    🔴 ATTACK ATTEMPT:
    Attacker intercepts request:
    {
      recipientId: "attacker",
      krAmount: 1000,
      signature: "valid_sig",
      nonce: "abc123",
      timestamp: 1234567890
    }
    
    Attacker replays same request 10 times
    
    ✅ BLOCKED BY:
    Server checks nonce in database:
    
    Request 1: ✅ Nonce "abc123" not in DB → Process
    Request 2: ❌ Nonce "abc123" in DB → REJECT
    Request 3: ❌ Nonce "abc123" in DB → REJECT
    ...

╔═══════════════════════════════════════════════════════════════════╗
║  ATTACK: Amount Tampering                                         ║
╚═══════════════════════════════════════════════════════════════════╝

    🔴 ATTACK ATTEMPT:
    Attacker intercepts request and changes amount:
    
    Original:
    {
      krAmount: 10,
      signature: "sig_for_10"
    }
    
    Tampered:
    {
      krAmount: 1000,  ← Changed
      signature: "sig_for_10"  ← Old signature
    }
    
    ✅ BLOCKED BY:
    Server reconstructs canonical string:
    "TIP|...&krAmount=1000&..."  ← Uses tampered amount
    
    Verifies signature:
    HMAC-SHA256("TIP|...&krAmount=1000&...", secret)
    ≠ "sig_for_10"
    
    ❌ SIGNATURE MISMATCH → REJECT

╔═══════════════════════════════════════════════════════════════════╗
║  ATTACK: Offline Transaction Queue                                ║
╚═══════════════════════════════════════════════════════════════════╝

    🔴 ATTACK ATTEMPT:
    Attacker turns off internet and queues 100 tips
    Then turns on internet hoping all process
    
    ✅ BLOCKED BY:
    OfflineModeGuard.requireOnlineForFinancialTransaction()
    
    Offline check happens BEFORE queueing:
    
    if (!isOnline) {
        throw OfflineTransactionException()
    }
    
    ❌ TRANSACTION NEVER QUEUED

╔═══════════════════════════════════════════════════════════════════╗
║  ATTACK: Session Hijacking                                        ║
╚═══════════════════════════════════════════════════════════════════╝

    🔴 ATTACK ATTEMPT:
    Attacker steals session secret from device
    
    ✅ MITIGATED BY:
    1. Secret stored in hardware keystore
       (Android Keystore/iOS Secure Enclave)
       → Cannot be extracted without biometric/PIN
    
    2. Secret expires after 24-48 hours
       → Limited time window
    
    3. Secret tied to device ID
       → Cannot use on different device
    
    4. All transactions logged with IP/device
       → Suspicious activity detected

┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                                 │
└─────────────────────────────────────────────────────────────────────┘

    Layer 1: Offline Blocking
    ┌─────────────────────────────────────┐
    │ OfflineModeGuard                    │
    │ ✅ Blocks financial transactions    │
    │    when device is offline           │
    └─────────────────────────────────────┘
                    ↓
    Layer 2: Client Validation
    ┌─────────────────────────────────────┐
    │ FinancialTransactionSecurity        │
    │ ✅ Validates amount                 │
    │ ✅ Checks session validity          │
    │ ✅ Generates secure nonce           │
    └─────────────────────────────────────┘
                    ↓
    Layer 3: Cryptographic Signing
    ┌─────────────────────────────────────┐
    │ SecureHmac                          │
    │ ✅ HMAC-SHA256 signature            │
    │ ✅ Server-provided secret           │
    │ ✅ Tamper-proof                     │
    └─────────────────────────────────────┘
                    ↓
    Layer 4: Server Verification
    ┌─────────────────────────────────────┐
    │ Server-side Checks                  │
    │ ✅ Signature verification           │
    │ ✅ Nonce uniqueness                 │
    │ ✅ Timestamp validation             │
    │ ✅ Balance verification             │
    └─────────────────────────────────────┘
                    ↓
    Layer 5: Transaction Logging
    ┌─────────────────────────────────────┐
    │ Audit Trail                         │
    │ ✅ All transactions logged          │
    │ ✅ Suspicious activity detected     │
    │ ✅ Forensic analysis possible       │
    └─────────────────────────────────────┘

```

---

## 📊 Security Comparison

### Before vs After

```
┌─────────────────────────────────────────────────────────────────┐
│                    BEFORE (INSECURE)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Secrets:        ❌ Hardcoded in BuildConfig                   │
│  Offline:        ❌ No blocking                                 │
│  Signatures:     ❌ Weak (hashCode)                            │
│  Replay:         ❌ No protection                               │
│  Tampering:      ❌ Easy to modify amounts                      │
│  Session:        ❌ No expiration                               │
│  Logging:        ❌ Minimal                                     │
│                                                                 │
│  Risk Level:     🔴 CRITICAL                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     AFTER (SECURE)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Secrets:        ✅ Server-provided, hardware-stored           │
│  Offline:        ✅ Financial transactions blocked             │
│  Signatures:     ✅ HMAC-SHA256                                │
│  Replay:         ✅ Nonce tracking                             │
│  Tampering:      ✅ Signature verification                     │
│  Session:        ✅ 24-48 hour expiration                      │
│  Logging:        ✅ Comprehensive audit trail                  │
│                                                                 │
│  Risk Level:     🟢 LOW (with server implementation)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Takeaways

1. **No Hardcoded Secrets** - All secrets come from server
2. **Offline = Blocked** - Financial transactions require internet
3. **HMAC-SHA256** - Industry-standard cryptographic signing
4. **Nonce Tracking** - Prevents replay attacks
5. **Session Expiry** - Limits attack window
6. **Server Validation** - Client signatures are anti-tampering only
7. **Comprehensive Logging** - Full audit trail

---

**Remember**: This is a multi-layered security system. Each layer provides protection, but ALL layers must be implemented for complete security.
