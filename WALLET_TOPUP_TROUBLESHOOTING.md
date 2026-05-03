# Wallet Top-Up Error Fix & Troubleshooting Guide

## Issue Description
When users click "Top Up via M-Pesa", "Top Up via PayPal", or "Top Up via Paystack" buttons, they receive an error:
```
Expected required body of the type class 'com.krieta.feature.wallet.data.remote.dto.TopUpInitiationResponseDto' 
but in reflection it is not available
```

## Root Cause
The backend payment provider integration is throwing an error, causing the API to return an error response instead of the expected `TopupInitiateResponseDto` structure. The frontend was unable to deserialize the error response because all fields were marked as required (non-nullable).

## Solution Applied

### 1. Frontend Changes (WalletDtos.kt)
Made all response fields nullable to handle error cases gracefully:

**Before:**
```kotlin
@Serializable
data class TopupInitiateResponseDto(
    val success: Boolean,
    val transactionId: String,  // Required
    val reference: String,      // Required
    val krAmount: Int,          // Required
    // ... other required fields
)
```

**After:**
```kotlin
@Serializable
data class TopupInitiateResponseDto(
    val success: Boolean,
    val transactionId: String? = null,  // Nullable
    val reference: String? = null,      // Nullable
    val krAmount: Int? = null,          // Nullable
    val fiatAmount: Int? = null,
    val currency: String? = null,
    val provider: String? = null,
    val status: String? = null,
    val paymentInstructions: PaymentInstructionsDto? = null,
    val error: String? = null           // New error field
)
```

### 2. Backend Changes (wallet.controller.ts)
Improved error handling to always return consistent JSON:

**Before:**
```typescript
catch (error: any) {
  if (error.name === 'ZodError') {
    res.status(400).json({ error: 'Validation failed', details: error.errors });
  } else {
    res.status(400).json({ error: error.message });
  }
}
```

**After:**
```typescript
catch (error: any) {
  console.error('❌ Top-up initiation error:', error);
  if (error.name === 'ZodError') {
    res.status(400).json({ 
      success: false,
      error: 'Validation failed', 
      details: error.errors 
    });
  } else {
    res.status(400).json({ 
      success: false,
      error: error.message || 'Failed to initiate top-up'
    });
  }
}
```

## Payment Provider Configuration Required

The actual issue is likely that one or more payment providers are not properly configured. Check the following:

### M-Pesa Configuration
**File:** `backend/src/services/payments/mpesa.service.ts`

**Required Environment Variables:**
```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/v1/webhooks/mpesa
MPESA_ENVIRONMENT=sandbox  # or 'production'
```

**Common Issues:**
- Invalid credentials
- Expired access token
- Callback URL not accessible
- Shortcode not registered
- Insufficient permissions

### PayPal Configuration
**File:** `backend/src/services/payment/paypal.service.ts`

**Required Environment Variables:**
```env
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret
PAYPAL_MODE=sandbox  # or 'live'
PAYPAL_RETURN_URL=https://your-domain.com/wallet/topup/success
PAYPAL_CANCEL_URL=https://your-domain.com/wallet/topup/cancel
```

**Common Issues:**
- Invalid API credentials
- Sandbox vs Live mode mismatch
- Return/Cancel URLs not whitelisted
- Currency not supported
- Account not verified

### Paystack Configuration
**File:** `backend/src/services/payment/paystack.service.ts`

**Required Environment Variables:**
```env
PAYSTACK_SECRET_KEY=your_secret_key
PAYSTACK_PUBLIC_KEY=your_public_key
PAYSTACK_CALLBACK_URL=https://your-domain.com/api/v1/webhooks/paystack
```

**Common Issues:**
- Invalid API keys
- Test vs Live keys mismatch
- Callback URL not accessible
- Currency not supported in country
- Account not activated

## Debugging Steps

### 1. Check Backend Logs
Look for error messages when initiating top-up:
```bash
# In backend directory
npm run dev
```

Watch for:
- `❌ Top-up initiation error:` messages
- Payment provider API errors
- Network connection errors
- Authentication failures

### 2. Test Payment Provider APIs Directly

**M-Pesa:**
```bash
curl -X POST https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials \
  -H "Authorization: Basic <base64_encoded_credentials>"
```

**PayPal:**
```bash
curl -X POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "<client_id>:<secret>" \
  -d "grant_type=client_credentials"
```

**Paystack:**
```bash
curl https://api.paystack.co/transaction/initialize \
  -H "Authorization: Bearer <secret_key>" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","amount":"10000"}'
```

### 3. Check Environment Variables
Ensure all required environment variables are set:
```bash
# In backend directory
cat .env | grep -E "MPESA|PAYPAL|PAYSTACK"
```

### 4. Verify Webhook Endpoints
Ensure webhook URLs are accessible:
```bash
curl -X POST https://your-domain.com/api/v1/webhooks/mpesa
curl -X POST https://your-domain.com/api/v1/webhooks/paypal
curl -X POST https://your-domain.com/api/v1/webhooks/paystack
```

## Testing Checklist

### After Configuration
- [ ] M-Pesa credentials are valid
- [ ] PayPal credentials are valid
- [ ] Paystack credentials are valid
- [ ] All webhook URLs are accessible
- [ ] Environment variables are loaded
- [ ] Backend server restarted

### User Flow Testing
- [ ] Select M-Pesa payment method
- [ ] Enter amount (e.g., KES 50)
- [ ] Enter phone number
- [ ] Click "Top Up via M-Pesa"
- [ ] Verify STK push is sent
- [ ] Complete payment on phone
- [ ] Verify wallet balance updates

- [ ] Select PayPal payment method
- [ ] Enter amount
- [ ] Enter email
- [ ] Click "Top Up via PayPal"
- [ ] Verify redirect to PayPal
- [ ] Complete payment
- [ ] Verify redirect back to app
- [ ] Verify wallet balance updates

- [ ] Select Paystack payment method
- [ ] Enter amount
- [ ] Enter email
- [ ] Click "Top Up via Paystack"
- [ ] Verify redirect to Paystack
- [ ] Complete payment
- [ ] Verify redirect back to app
- [ ] Verify wallet balance updates

## Error Messages to Watch For

### Frontend
- "Expected required body..." - Fixed by making fields nullable
- "Failed to initiate top-up" - Check backend logs
- "Validation failed" - Check request data format

### Backend
- "M-Pesa integration error" - Check M-Pesa credentials
- "PayPal integration error" - Check PayPal credentials
- "Paystack integration error" - Check Paystack credentials
- "Invalid amount" - Amount validation failed
- "Invalid phone number format" - Phone number validation failed
- "Invalid email format" - Email validation failed

## Files Modified

### Frontend
- `composeApp/src/commonMain/kotlin/com/krieta/feature/wallet/data/remote/dto/WalletDtos.kt`
  - Made TopupInitiateResponseDto fields nullable
  - Added error field

### Backend
- `backend/src/modules/wallet/wallet.controller.ts`
  - Improved error handling
  - Added console.error logging
  - Return consistent error format

## Next Steps

1. **Configure Payment Providers**
   - Set up M-Pesa credentials
   - Set up PayPal credentials
   - Set up Paystack credentials

2. **Test Each Provider**
   - Test M-Pesa STK push
   - Test PayPal redirect flow
   - Test Paystack redirect flow

3. **Set Up Webhooks**
   - Configure M-Pesa callback URL
   - Configure PayPal IPN/webhooks
   - Configure Paystack webhooks

4. **Monitor Logs**
   - Watch backend logs for errors
   - Check payment provider dashboards
   - Monitor transaction status

## Support Resources

- **M-Pesa:** https://developer.safaricom.co.ke/
- **PayPal:** https://developer.paypal.com/
- **Paystack:** https://paystack.com/docs/

## Security Notes

- Never commit API keys to version control
- Use environment variables for all credentials
- Use sandbox/test mode during development
- Validate all webhook signatures
- Implement rate limiting
- Log all transactions for audit trail
