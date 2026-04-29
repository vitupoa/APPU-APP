# Transaction Signing - Quick Reference

## Usage

### Basic Withdrawal Request

```kotlin
// In ViewModel
fun withdraw() {
    screenModelScope.launch {
        val request = mapOf(
            "krAmount" to 50000.0,
            "provider" to "mpesa",
            "currency" to "KES",
            "phoneNumber" to "+254712345678"
        )
        
        // Signature is automatically generated in repository
        when (val result = repository.withdraw(request)) {
            is NetworkResult.Success -> {
                // Withdrawal submitted
            }
            is NetworkResult.Error -> {
                // Handle error
            }
        }
    }
}
```

### Manual Signature Generation (Advanced)

```kotlin
import com.krieta.com.core.security.TransactionSigner

// Generate signature manually
val nonce = TransactionSigner.generateNonce()
val timestamp = TransactionSigner.generateTimestamp()
val signature = TransactionSigner.signWithdrawal(
    krAmount = 50000.0,
    provider = "mpesa",
    currency = "KES",
    timestamp = timestamp,
    nonce = nonce
)

// Use in API call
api.withdraw(request, signature, timestamp, nonce)
```

## Required Fields

All withdrawal requests must include:
- `krAmount` (Double): Amount in Krieta coins
- `provider` (String): Payment provider (mpesa, paypal, paystack)
- `currency` (String): Currency code (KES, USD, NGN, etc.)

Provider-specific fields:
- **M-Pesa**: `phoneNumber`
- **PayPal**: `email`
- **Paystack**: `accountNumber`, `bankCode`, `accountName`, `country`

## Error Codes

| Code | Error | Solution |
|------|-------|----------|
| 400 | Invalid signature | Check secret key |
| 400 | Signature expired | Check device time |
| 409 | Nonce already used | Don't retry with same nonce |
| 401 | Unauthorized | Check JWT token |

## Security Checklist

- ✅ Never log signatures or secrets
- ✅ Use HTTPS for all requests
- ✅ Generate new nonce for each request
- ✅ Don't retry failed requests with same signature
- ✅ Validate all inputs before signing
- ✅ Store secret securely (not in code)

## Configuration

### Development
```kotlin
// TransactionSigner.kt
private const val SECRET = "dev-secret-key"
```

### Production
```kotlin
// Use environment variable or secure storage
private val SECRET = BuildConfig.TRANSACTION_SIGNING_SECRET
```

## Testing

### Test Signature Generation
```bash
# Expected signature for test data
krAmount=50000.0
provider=mpesa
currency=KES
timestamp=1234567890
nonce=test-nonce

# Should produce consistent signature
```

### Test API Integration
```kotlin
@Test
fun testWithdrawal() = runTest {
    val result = repository.withdraw(mapOf(
        "krAmount" to 50000.0,
        "provider" to "mpesa",
        "currency" to "KES",
        "phoneNumber" to "+254712345678"
    ))
    assertTrue(result is NetworkResult.Success)
}
```

## Common Issues

### Issue: "Invalid signature"
**Cause**: Secret mismatch between frontend and backend
**Fix**: Ensure both use same secret key

### Issue: "Signature expired"
**Cause**: Device time is incorrect or request took >5 minutes
**Fix**: Sync device time, reduce network latency

### Issue: "Nonce already used"
**Cause**: Duplicate request or replay attack
**Fix**: Generate new nonce for each request

## Platform Support

| Platform | Implementation | Status |
|----------|---------------|--------|
| Android | javax.crypto | ✅ Ready |
| iOS | CommonCrypto | ✅ Ready |
| Desktop | Not implemented | ❌ TODO |
| Web | Not implemented | ❌ TODO |

## Performance

- Signature generation: ~1-2ms
- Network overhead: ~81 bytes
- No user-visible impact

## Support

For issues or questions:
1. Check FRONTEND_TRANSACTION_SIGNING.md
2. Check backend logs for signature errors
3. Verify secret key configuration
4. Test with curl/Postman first

---

**Quick Start**: Just call `repository.withdraw(request)` - signature is automatic!
