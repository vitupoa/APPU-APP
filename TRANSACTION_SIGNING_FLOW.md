# Transaction Signing - Visual Flow Diagram

## Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  WithdrawScreen.kt                                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │  Amount    │  │  Provider  │  │   Phone    │             │  │
│  │  │  Kr 50,000 │  │   M-Pesa   │  │ +254712... │             │  │
│  │  └────────────┘  └────────────┘  └────────────┘             │  │
│  │                                                                │  │
│  │                  ┌──────────────┐                             │  │
│  │                  │   WITHDRAW   │ ◄── User clicks             │  │
│  │                  └──────────────┘                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         VIEW MODEL                                   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  WithdrawViewModel.kt                                         │  │
│  │                                                                │  │
│  │  fun withdraw() {                                             │  │
│  │      val request = mapOf(                                     │  │
│  │          "krAmount" to 50000.0,                               │  │
│  │          "provider" to "mpesa",                               │  │
│  │          "currency" to "KES",                                 │  │
│  │          "phoneNumber" to "+254712345678"                     │  │
│  │      )                                                         │  │
│  │      repository.withdraw(request) ───────────────────┐        │  │
│  │  }                                                    │        │  │
│  └───────────────────────────────────────────────────────┼────────┘  │
└────────────────────────────────────────────────────────┼─────────────┘
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         REPOSITORY                                   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  WalletRepositoryImpl.kt                                      │  │
│  │                                                                │  │
│  │  suspend fun withdraw(request: Map<String, Any>) {            │  │
│  │      // 1. Extract required fields                            │  │
│  │      val krAmount = request["krAmount"] as Double             │  │
│  │      val provider = request["provider"] as String             │  │
│  │      val currency = request["currency"] as String             │  │
│  │                                                                │  │
│  │      // 2. Generate security parameters ──────────────┐       │  │
│  │      val nonce = TransactionSigner.generateNonce()    │       │  │
│  │      val timestamp = TransactionSigner.generateTimestamp()    │  │
│  │                                                        │       │  │
│  │      // 3. Create signature ◄──────────────────────────┘      │  │
│  │      val signature = TransactionSigner.signWithdrawal(        │  │
│  │          krAmount, provider, currency, timestamp, nonce       │  │
│  │      )                                                         │  │
│  │                                                                │  │
│  │      // 4. Call API with signature ────────────────────┐      │  │
│  │      api.withdraw(request, signature, timestamp, nonce)│      │  │
│  │  }                                                      │      │  │
│  └─────────────────────────────────────────────────────────┼──────┘  │
└──────────────────────────────────────────────────────────┼───────────┘
                                                            │
                                                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TRANSACTION SIGNER                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  TransactionSigner.kt (Common)                                │  │
│  │                                                                │  │
│  │  fun signWithdrawal(...) {                                    │  │
│  │      // 1. Create canonical string                            │  │
│  │      val canonical = "krAmount=50000.0&provider=mpesa&" +     │  │
│  │                      "currency=KES&timestamp=1234567890&" +   │  │
│  │                      "nonce=abc123"                           │  │
│  │                                                                │  │
│  │      // 2. Sign with HMAC-SHA256 ──────────────────────┐      │  │
│  │      val signature = HmacSha256.sign(canonical, SECRET)│      │  │
│  │                                                         │      │  │
│  │      // 3. Encode as Base64                            │      │  │
│  │      return signature.encodeBase64()                   │      │  │
│  │  }                                                      │      │  │
│  └─────────────────────────────────────────────────────────┼──────┘  │
└──────────────────────────────────────────────────────────┼───────────┘
                                                            │
                    ┌───────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│  HmacSha256      │   │  HmacSha256      │
│  (Android)       │   │  (iOS)           │
│                  │   │                  │
│  javax.crypto    │   │  CommonCrypto    │
│  Mac.getInstance │   │  CCHmac          │
│  ("HmacSHA256")  │   │  (kCCHmacAlgSHA) │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  Signature (Base64) │
         │  "Xy7z9A3b..."      │
         └──────────┬──────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API LAYER                                    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  WalletApi.kt                                                 │  │
│  │                                                                │  │
│  │  suspend fun withdraw(                                        │  │
│  │      request: Map<String, Any>,                               │  │
│  │      signature: String,                                       │  │
│  │      timestamp: Long,                                         │  │
│  │      nonce: String                                            │  │
│  │  ) {                                                           │  │
│  │      httpClient.post("/api/v1/kyc/withdraw") {                │  │
│  │          parameter("signature", signature)                    │  │
│  │          parameter("timestamp", timestamp)                    │  │
│  │          parameter("nonce", nonce)                            │  │
│  │          setBody(request)                                     │  │
│  │      }                                                         │  │
│  │  }                                                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         HTTP REQUEST                                 │
│                                                                       │
│  POST /api/v1/kyc/withdraw?signature=Xy7z9A3b...&                   │
│                             timestamp=1234567890&                    │
│                             nonce=abc123                             │
│  Authorization: Bearer JWT_TOKEN                                     │
│  Content-Type: application/json                                      │
│                                                                       │
│  {                                                                    │
│    "krAmount": 50000.0,                                              │
│    "provider": "mpesa",                                              │
│    "currency": "KES",                                                │
│    "phoneNumber": "+254712345678"                                    │
│  }                                                                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND                                      │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  withdrawal.service.ts                                        │  │
│  │                                                                │  │
│  │  1. Extract signature, timestamp, nonce from query params     │  │
│  │  2. Verify timestamp is within 5 minutes                      │  │
│  │  3. Check nonce hasn't been used before                       │  │
│  │  4. Recreate canonical string from request body               │  │
│  │  5. Generate signature using same secret                      │  │
│  │  6. Compare signatures (constant-time)                        │  │
│  │  7. Mark nonce as used                                        │  │
│  │  8. Process withdrawal                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │   SUCCESS     │
                        │   or ERROR    │
                        └───────────────┘
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY PARAMETERS                           │
└─────────────────────────────────────────────────────────────────┘

1. NONCE (Prevents Replay Attacks)
   ┌──────────────────────────────────────────────────────────┐
   │  Random.nextBytes(16) → Base64 → "Xy7z9A3bC1d2E3f4G5h6" │
   │  ✓ Unique per request                                    │
   │  ✓ Single-use only                                       │
   │  ✓ Stored in database                                    │
   └──────────────────────────────────────────────────────────┘

2. TIMESTAMP (Prevents Old Request Replay)
   ┌──────────────────────────────────────────────────────────┐
   │  Clock.System.now() → 1234567890123 (milliseconds)       │
   │  ✓ 5-minute expiry window                                │
   │  ✓ Prevents time-based attacks                           │
   └──────────────────────────────────────────────────────────┘

3. SIGNATURE (Prevents Tampering)
   ┌──────────────────────────────────────────────────────────┐
   │  Canonical String:                                        │
   │  "krAmount=50000.0&provider=mpesa&currency=KES&          │
   │   timestamp=1234567890&nonce=abc123"                     │
   │                                                           │
   │  HMAC-SHA256(canonical, SECRET) → Base64                 │
   │  ✓ Cryptographically secure                              │
   │  ✓ Verifies request authenticity                         │
   │  ✓ Prevents parameter modification                       │
   └──────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS                               │
└─────────────────────────────────────────────────────────────────┘

1. Invalid Signature
   Request → Backend → Verify Signature → ❌ Mismatch
                                           │
                                           ▼
                                    400 Bad Request
                                    "Invalid signature"
                                           │
                                           ▼
                                    Frontend Error
                                    "Withdrawal failed"

2. Expired Timestamp
   Request → Backend → Check Timestamp → ❌ > 5 minutes
                                          │
                                          ▼
                                   400 Bad Request
                                   "Signature expired"
                                          │
                                          ▼
                                   Frontend Error
                                   "Request expired"

3. Replay Attack
   Request → Backend → Check Nonce → ❌ Already used
                                      │
                                      ▼
                                 409 Conflict
                                 "Nonce already used"
                                      │
                                      ▼
                                 Frontend Error
                                 "Duplicate request"

4. Success
   Request → Backend → All Checks Pass → ✅ Process
                                          │
                                          ▼
                                     200 OK
                                     "Withdrawal submitted"
                                          │
                                          ▼
                                     Frontend Success
                                     "Withdrawal successful"
```

## Platform-Specific Implementation

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM IMPLEMENTATIONS                      │
└─────────────────────────────────────────────────────────────────┘

Common (Kotlin Multiplatform)
┌──────────────────────────────────────────────────────────────┐
│  TransactionSigner.kt                                         │
│  ├─ generateNonce(): String                                   │
│  ├─ generateTimestamp(): Long                                 │
│  ├─ signWithdrawal(...): String                               │
│  └─ createCanonicalString(...): String                        │
└──────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│  Android                │   │  iOS                    │
│  HmacSha256.android.kt  │   │  HmacSha256.ios.kt      │
│                         │   │                         │
│  javax.crypto.Mac       │   │  CommonCrypto.CCHmac    │
│  ├─ getInstance()       │   │  ├─ kCCHmacAlgSHA256    │
│  ├─ init(SecretKeySpec) │   │  ├─ keyData.usePinned() │
│  └─ doFinal()           │   │  └─ result.usePinned()  │
└─────────────────────────┘   └─────────────────────────┘
```

## Data Flow Summary

```
User Input → ViewModel → Repository → TransactionSigner
                                            │
                                            ▼
                                    Platform HMAC
                                            │
                                            ▼
                                       Signature
                                            │
                                            ▼
                                       API Layer
                                            │
                                            ▼
                                    HTTP Request
                                            │
                                            ▼
                                       Backend
                                            │
                                            ▼
                                    Verification
                                            │
                                            ▼
                                    Success/Error
```

---

**Legend**:
- `→` : Data flow
- `▼` : Next step
- `✓` : Security feature
- `❌` : Error condition
- `┌─┐` : Component boundary
