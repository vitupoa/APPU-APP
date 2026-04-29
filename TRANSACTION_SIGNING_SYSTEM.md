# TRANSACTION SIGNING SYSTEM

## Overview
Cryptographic transaction signing system that prevents tampering, replay attacks, and forged withdrawal requests using HMAC-SHA256 signatures.

## How It Works

### The Problem
Without transaction signing, attackers could:
- **Modify transaction amounts**: Change Kr 100 to Kr 10,000
- **Replay old transactions**: Reuse captured requests multiple times
- **Forge withdrawal requests**: Create fake withdrawal requests

### The Solution
**Transaction Signing** creates a tamper-proof seal using cryptography:

1. **Frontend creates signature** using secret key
2. **Backend verifies signature** before processing
3. **If tampered**, signature won't match → transaction rejected

**Real-world analogy**: Like a wax seal on a letter. If someone opens and rewrites the letter, the seal breaks, and you know it's been tampered with.

## Architecture

### Components

1. **TransactionSigner** (`transactionSigner.ts`)
   - Creates HMAC-SHA256 signatures
   - Verifies signatures with constant-time comparison
   - Checks timestamp expiry (5 minutes)

2. **NonceService** (`nonce.service.ts`)
   - Tracks used nonces to prevent replay attacks
   - Marks nonces as used
   - Cleans up expired nonces

3. **TransactionNonce Model** (database)
   - Stores used nonces with expiry
   - Prevents same transaction from being processed twice

4. **Nonce Cleanup Worker**
   - Runs hourly to remove expired nonces
   - Keeps database clean

## Implementation

### Backend

#### 1. Transaction Signing Utility

```typescript
// utils/transactionSigner.ts
import crypto from 'crypto';

interface TransactionPayload {
  userId: string;
  amountKr: number;
  provider: string;
  accountName: string;
  accountDetails: any;
  currency: string;
  timestamp: number;
  nonce: string;
}

class TransactionSigner {
  // Create signature
  sign(payload: TransactionPayload): string {
    const canonicalString = this.createCanonicalString(payload);
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(canonicalString);
    return hmac.digest('hex');
  }

  // Verify signature
  verify(payload: TransactionPayload, signature: string): {
    valid: boolean;
    error?: string;
  } {
    // Check timestamp (prevent replay)
    if (Date.now() - payload.timestamp > 5 * 60 * 1000) {
      return { valid: false, error: 'Signature expired' };
    }

    // Verify signature
    const expected = this.sign(payload);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );

    return { valid: isValid };
  }
}
```

#### 2. Nonce Service

```typescript
// services/nonce.service.ts
class NonceService {
  // Check if nonce is fresh (not used)
  async isNonceFresh(nonce: string, userId: string): Promise<boolean> {
    const existing = await prisma.transactionNonce.findUnique({
      where: { nonce }
    });
    return !existing;
  }

  // Mark nonce as used
  async markNonceUsed(nonce: string, userId: string): Promise<void> {
    await prisma.transactionNonce.create({
      data: {
        nonce,
        userId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
      }
    });
  }
}
```

#### 3. Withdrawal Service Integration

```typescript
// modules/kyc/withdrawal.service.ts
async requestWithdrawal(
  userId: string,
  amountKr: number,
  provider: string,
  accountName: string,
  accountDetails: any,
  currency: string,
  signature: string,
  timestamp: number,
  nonce: string
) {
  // Step 1: Verify signature
  const payload = {
    userId, amountKr, provider, accountName,
    accountDetails, currency, timestamp, nonce
  };
  
  const verification = transactionSigner.verify(payload, signature);
  if (!verification.valid) {
    throw new Error(verification.error);
  }

  // Step 2: Check nonce (prevent replay)
  const isNonceFresh = await nonceService.isNonceFresh(nonce, userId);
  if (!isNonceFresh) {
    throw new Error('Transaction already processed');
  }

  // Step 3: Mark nonce as used
  await nonceService.markNonceUsed(nonce, userId);

  // Step 4: Process withdrawal...
}
```

### Frontend (Mobile/Web)

#### 1. Generate Nonce

```typescript
// utils/crypto.ts
function generateNonce(): string {
  // Generate cryptographically secure random string
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

#### 2. Create Signature

```typescript
// utils/transactionSigner.ts
async function signTransaction(payload: TransactionPayload): Promise<string> {
  // Create canonical string (order matters!)
  const canonicalString = [
    payload.userId,
    payload.amountKr.toString(),
    payload.provider,
    payload.accountName,
    JSON.stringify(payload.accountDetails),
    payload.currency,
    payload.timestamp.toString(),
    payload.nonce
  ].join('|');

  // Create HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(TRANSACTION_SIGNING_SECRET);
  const messageData = encoder.encode(canonicalString);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  
  // Convert to hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

#### 3. Request Withdrawal

```typescript
// api/withdrawal.ts
async function requestWithdrawal(
  amountKr: number,
  provider: string,
  accountName: string,
  accountDetails: any,
  currency: string = 'KES'
) {
  // Generate nonce and timestamp
  const nonce = generateNonce();
  const timestamp = Date.now();

  // Create payload
  const payload = {
    userId: currentUser.id,
    amountKr,
    provider,
    accountName,
    accountDetails,
    currency,
    timestamp,
    nonce
  };

  // Sign transaction
  const signature = await signTransaction(payload);

  // Send request with signature
  const response = await fetch('/api/v1/kyc/withdrawal/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      amountKr,
      provider,
      accountName,
      accountDetails,
      currency,
      signature,
      timestamp,
      nonce
    })
  });

  if (!response.ok) {
    const error = await response.json();
    if (error.code === 'INVALID_SIGNATURE') {
      throw new Error('Transaction verification failed. Please try again.');
    }
    throw new Error(error.error);
  }

  return await response.json();
}
```

## Security Features

### 1. **Tamper Protection**
- Any modification to transaction data breaks the signature
- Backend rejects requests with invalid signatures
- Prevents amount manipulation

### 2. **Replay Attack Prevention**
- Each transaction has unique nonce
- Nonces are single-use only
- Prevents reusing captured requests

### 3. **Time-Based Expiry**
- Signatures valid for 5 minutes only
- Prevents old requests from being replayed
- Protects against delayed attacks

### 4. **Constant-Time Comparison**
- Uses `crypto.timingSafeEqual()` to prevent timing attacks
- Attackers can't guess signature by measuring response time

### 5. **Cryptographically Secure Nonces**
- Generated using `crypto.randomBytes(16)`
- 128-bit entropy ensures uniqueness
- Impossible to predict or forge

## Configuration

### Environment Variables

```bash
# Backend .env
TRANSACTION_SIGNING_SECRET=your-secret-key-min-32-chars
```

**CRITICAL**: Use a strong, random secret key:
```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Constants

```typescript
// transactionSigner.ts
const SIGNATURE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const SIGNATURE_ALGORITHM = 'sha256';

// nonce.service.ts
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
```

## Database Schema

```prisma
model TransactionNonce {
  id        String   @id @default(uuid())
  nonce     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([expiresAt])
  @@index([userId])
  @@map("transaction_nonces")
}
```

## API Changes

### Withdrawal Request Endpoint

**Before**:
```http
POST /api/v1/kyc/withdrawal/request
{
  "amountKr": 1000,
  "provider": "mpesa",
  "accountName": "John Doe",
  "accountDetails": { "phoneNumber": "+254712345678" },
  "currency": "KES"
}
```

**After** (with signing):
```http
POST /api/v1/kyc/withdrawal/request
{
  "amountKr": 1000,
  "provider": "mpesa",
  "accountName": "John Doe",
  "accountDetails": { "phoneNumber": "+254712345678" },
  "currency": "KES",
  "signature": "a3f5b2c8d9e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  "timestamp": 1705843200000,
  "nonce": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

### Error Responses

```json
// Invalid signature
{
  "error": "Invalid transaction signature. Request may have been tampered with.",
  "code": "INVALID_SIGNATURE"
}

// Expired signature
{
  "error": "Transaction signature expired. Please try again.",
  "code": "INVALID_SIGNATURE"
}

// Replay attack detected
{
  "error": "Transaction already processed. This request has been used before.",
  "code": "INVALID_SIGNATURE"
}
```

## Testing

### Test Signature Generation

```bash
# Backend test
npm run test -- transactionSigner.test.ts
```

### Test Replay Attack Prevention

```bash
curl -X POST http://localhost:3000/api/v1/kyc/withdrawal/request \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amountKr": 1000,
    "provider": "mpesa",
    "accountName": "John Doe",
    "accountDetails": {"phoneNumber": "+254712345678"},
    "currency": "KES",
    "signature": "SIGNATURE",
    "timestamp": 1705843200000,
    "nonce": "NONCE"
  }'

# Try same request again - should fail with "Transaction already processed"
```

### Test Tampering Detection

```javascript
// Create valid signature
const payload = { amountKr: 100, ... };
const signature = await signTransaction(payload);

// Tamper with amount
payload.amountKr = 10000;

// Send request - should fail with "Invalid signature"
```

## Deployment Checklist

- [ ] Generate strong `TRANSACTION_SIGNING_SECRET` (32+ chars)
- [ ] Add secret to environment variables
- [ ] Run database migration: `npx prisma db push`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Update frontend to include signature generation
- [ ] Test signature verification
- [ ] Test replay attack prevention
- [ ] Test tampering detection
- [ ] Monitor nonce cleanup worker logs

## Monitoring

### Key Metrics

- **Invalid signature attempts**: Track failed verifications
- **Replay attack attempts**: Track duplicate nonce usage
- **Expired signatures**: Track timestamp violations
- **Nonce cleanup**: Monitor hourly cleanup job

### Database Queries

```sql
-- Check recent nonces
SELECT * FROM transaction_nonces 
ORDER BY created_at DESC 
LIMIT 10;

-- Count active nonces
SELECT COUNT(*) FROM transaction_nonces 
WHERE expires_at > NOW();

-- Find potential replay attacks
SELECT nonce, user_id, COUNT(*) as attempts
FROM transaction_nonces
GROUP BY nonce, user_id
HAVING COUNT(*) > 1;
```

## Troubleshooting

### "Invalid signature" errors
- Check `TRANSACTION_SIGNING_SECRET` matches on frontend and backend
- Verify canonical string order is identical
- Ensure timestamp is in milliseconds

### "Transaction already processed" errors
- User may have clicked submit multiple times
- Check if nonce is being regenerated for each request
- Verify nonce cleanup worker is running

### "Signature expired" errors
- Check system clocks are synchronized
- Verify timestamp is current (not cached)
- Consider increasing `SIGNATURE_EXPIRY_MS` if needed

---

**Status**: ✅ Production Ready  
**Security Level**: High  
**Last Updated**: 2025-04-26  
**Version**: 1.0.0
