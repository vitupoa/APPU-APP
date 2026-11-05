# Idempotency Keys & Database Locks Implementation ✅

## Overview
Implemented comprehensive protection against duplicate financial transactions and race conditions using idempotency keys and database locks.

---

## ✅ Implemented Features

### 1. Idempotency Keys
**Status:** ✅ Implemented

**What it does:**
- Prevents duplicate financial transactions
- Stores request/response pairs for 24 hours
- Automatically returns cached response for duplicate requests
- Protects against network retries and user double-clicks

**Files:**
- `src/middleware/idempotency.ts` - Idempotency middleware
- `prisma/migrations/add_idempotency_keys.sql` - Database table
- `src/workers/idempotencyCleanup.worker.ts` - Cleanup worker

**Protected operations:**
- ✅ Wallet top-ups
- ✅ Wallet tips
- ✅ Withdrawals
- ✅ Contest prize distributions
- ✅ Any financial operation

**How it works:**
```typescript
// Client sends idempotency key in header
POST /api/v1/wallet/tip
Headers:
  Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
  Authorization: Bearer <token>
Body:
  { recipientId: "...", amount: 100 }

// First request: Processes normally
// Duplicate request: Returns cached response (same status code and body)
```

**Auto-generation:**
If client doesn't provide an idempotency key, the middleware automatically generates one from:
- User ID
- Request method
- Request path
- Request body

This ensures identical requests get the same idempotency key.

---

### 2. Database Locks
**Status:** ✅ Implemented

**What it does:**
- Prevents race conditions in concurrent financial operations
- Uses PostgreSQL advisory locks and SELECT FOR UPDATE
- Automatically retries on deadlock detection
- Orders locks to prevent deadlocks

**Files:**
- `src/utils/databaseLocks.ts` - Lock utilities

**Lock types:**
```typescript
enum LockType {
  WALLET = 'wallet',
  TRANSACTION = 'transaction',
  ESCROW = 'escrow',
  CONTEST = 'contest',
  CHAMA = 'chama',
  ORDER = 'order'
}
```

**Protected operations:**
- ✅ Wallet balance updates
- ✅ Tips between users
- ✅ Top-up confirmations
- ✅ Escrow operations
- ✅ Contest prize distributions
- ✅ Chama contributions
- ✅ Order processing

**How it works:**
```typescript
// Lock wallet before updating balance
await prisma.$transaction(async (tx) => {
  // Lock wallet row (prevents other transactions from reading/writing)
  await lockWalletForUpdate(tx, userId);
  
  // Perform operations
  await tx.wallet.update({
    where: { userId },
    data: { krBalance: { increment: amount } }
  });
}, {
  isolationLevel: 'Serializable',
  timeout: 10000
});
```

**Deadlock prevention:**
- Locks are acquired in consistent order (sorted by ID)
- Automatic retry on deadlock detection (up to 3 times)
- Exponential backoff between retries

---

## 🔒 Security Benefits

### Prevents Double-Spending
**Before:**
```
User clicks "Send Tip" twice rapidly
→ Two requests sent
→ Balance deducted twice
→ User loses money
```

**After:**
```
User clicks "Send Tip" twice rapidly
→ Two requests sent with same idempotency key
→ First request processes
→ Second request returns cached response
→ Balance deducted only once ✅
```

### Prevents Race Conditions
**Before:**
```
Request A: Read balance (100 Rc)
Request B: Read balance (100 Rc)
Request A: Deduct 50 Rc → Balance = 50 Rc
Request B: Deduct 50 Rc → Balance = 50 Rc (should be 0!)
```

**After:**
```
Request A: Lock wallet → Read balance (100 Rc)
Request B: Wait for lock...
Request A: Deduct 50 Rc → Balance = 50 Rc → Release lock
Request B: Acquire lock → Read balance (50 Rc)
Request B: Deduct 50 Rc → Balance = 0 Rc ✅
```

### Prevents Duplicate Webhooks
**Before:**
```
PayPal sends webhook
→ Credit wallet with 100 Rc
PayPal retries webhook (network issue)
→ Credit wallet with 100 Rc again
→ User gets 200 Rc instead of 100 Rc
```

**After:**
```
PayPal sends webhook (idempotency key: webhook_id_123)
→ Credit wallet with 100 Rc
→ Store response in idempotency_keys table
PayPal retries webhook (same idempotency key)
→ Return cached response
→ Wallet not credited again ✅
```

---

## 📊 Database Schema

### idempotency_keys Table
```sql
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  request_path VARCHAR(500) NOT NULL,
  request_method VARCHAR(10) NOT NULL,
  request_body JSONB,
  response_code INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
CREATE INDEX idx_idempotency_keys_user_created ON idempotency_keys(user_id, created_at);
CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(key) WHERE expires_at > NOW();
```

**Cleanup:**
- Expired keys are automatically deleted every hour
- Cleanup function: `cleanup_expired_idempotency_keys()`
- Worker: `idempotencyCleanup.worker.ts`

---

## 🚀 Usage Examples

### 1. Wallet Tip with Idempotency
```typescript
// Frontend
const idempotencyKey = uuidv4(); // Generate once per user action

fetch('/api/v1/wallet/tip', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Idempotency-Key': idempotencyKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipientId: 'user-123',
    amount: 100,
    currency: 'KES'
  })
});

// If user clicks again, use the SAME idempotency key
// The second request will return the cached response
```

### 2. Top-up with Idempotency
```typescript
// Backend automatically generates idempotency key from request
// No need to send Idempotency-Key header

POST /api/v1/wallet/topup/initiate
{
  "fiatAmount": 1000,
  "currency": "KES",
  "provider": "mpesa",
  "phoneNumber": "254712345678"
}

// If webhook is received twice, only first one processes
```

### 3. Safe Wallet Transfer with Locks
```typescript
import { safeWalletTransfer } from './utils/databaseLocks.js';

// Transfer 100 Rc from sender to recipient
await safeWalletTransfer(
  senderId,
  recipientId,
  new Prisma.Decimal(100),
  'tip',
  { message: 'Great content!' }
);

// Locks are automatically acquired and released
// Deadlocks are automatically retried
```

### 4. Custom Lock Usage
```typescript
import { withAdvisoryLock, LockType } from './utils/databaseLocks.js';

// Execute function with lock
await withAdvisoryLock(
  LockType.CONTEST,
  contestId,
  async () => {
    // Distribute prizes
    // Only one process can do this at a time
  },
  5000 // 5 second timeout
);
```

---

## 🔧 Configuration

### Idempotency TTL
```typescript
// Default: 24 hours
idempotencyMiddleware({ ttlSeconds: 86400 })

// Custom: 1 hour for top-ups
idempotencyMiddleware({ ttlSeconds: 3600 })
```

### Auto-generation
```typescript
// Enable auto-generation (default)
idempotencyMiddleware({ autoGenerate: true })

// Require client to send key
idempotencyMiddleware({ autoGenerate: false })
```

### Lock Timeout
```typescript
// Default: 5 seconds
await acquireAdvisoryLock(LockType.WALLET, userId, 5000);

// Custom: 10 seconds
await acquireAdvisoryLock(LockType.WALLET, userId, 10000);
```

### Deadlock Retries
```typescript
// Default: 3 retries with exponential backoff
await withDeadlockRetry(async () => {
  // Your transaction
});

// Custom: 5 retries
await withDeadlockRetry(async () => {
  // Your transaction
}, 5);
```

---

## 📈 Monitoring

### Check Idempotency Stats
```typescript
import { getIdempotencyStats } from './middleware/idempotency.js';

const stats = await getIdempotencyStats();
console.log(stats);
// {
//   total_keys: 1000,
//   active_keys: 500,
//   expired_keys: 500,
//   oldest_key: '2024-01-01T00:00:00Z',
//   newest_key: '2024-01-02T00:00:00Z'
// }
```

### Check Active Locks
```typescript
import { getActiveLocks } from './utils/databaseLocks.js';

const locks = await getActiveLocks();
console.log(locks);
// [
//   {
//     locktype: 'advisory',
//     objid: 123456789,
//     pid: 12345,
//     mode: 'ExclusiveLock',
//     granted: true
//   }
// ]
```

### Check if Resource is Locked
```typescript
import { isResourceLocked, LockType } from './utils/databaseLocks.js';

const locked = await isResourceLocked(LockType.WALLET, userId);
if (locked) {
  console.log('Wallet is currently locked by another operation');
}
```

---

## 🧪 Testing

### Test Idempotency
```bash
# Send same request twice with same idempotency key
curl -X POST http://localhost:3000/api/v1/wallet/tip \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"user-123","amount":100}'

# Second request should return cached response
curl -X POST http://localhost:3000/api/v1/wallet/tip \
  -H "Authorization: Bearer <token>" \
  -H "Idempotency-Key: test-key-123" \
  -H "Content-Type: application/json" \
  -d '{"recipientId":"user-123","amount":100}'
```

### Test Race Conditions
```bash
# Send 10 concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/v1/wallet/tip \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"recipientId":"user-123","amount":1}' &
done
wait

# Check wallet balance - should only be deducted once per unique request
```

### Test Deadlock Retry
```typescript
// Simulate deadlock scenario
await Promise.all([
  safeWalletTransfer(user1, user2, 100, 'tip'),
  safeWalletTransfer(user2, user1, 50, 'tip')
]);

// Should complete successfully with automatic retry
```

---

## 🚨 Error Handling

### Idempotency Errors
```typescript
// Missing idempotency key (when autoGenerate=false)
{
  "error": "Idempotency-Key header required for this operation",
  "code": "IDEMPOTENCY_KEY_REQUIRED"
}

// Invalid idempotency key format
{
  "error": "Invalid Idempotency-Key format. Must be UUID or 64-char hex string",
  "code": "INVALID_IDEMPOTENCY_KEY"
}
```

### Lock Errors
```typescript
// Failed to acquire lock
{
  "error": "Failed to acquire lock for wallet:user-123. Resource is locked by another operation."
}

// Transaction timeout
{
  "error": "Transaction timeout after 10000ms"
}

// Deadlock (automatically retried)
{
  "error": "Transaction failed after 3 retries: deadlock detected"
}
```

---

## 🔄 Migration Guide

### 1. Run Database Migration
```bash
# Apply idempotency_keys table
psql $DATABASE_URL < prisma/migrations/add_idempotency_keys.sql
```

### 2. Update Existing Routes
```typescript
// Before
router.post('/tip', authMiddleware, WalletController.sendTip);

// After
router.post('/tip', 
  authMiddleware,
  idempotencyMiddleware({ ttlSeconds: 86400, autoGenerate: true }),
  WalletController.sendTip
);
```

### 3. Update Existing Services
```typescript
// Before
await prisma.$transaction(async (tx) => {
  await tx.wallet.update({ ... });
});

// After
await withDeadlockRetry(async () => {
  return prisma.$transaction(async (tx) => {
    await lockWalletForUpdate(tx, userId);
    await tx.wallet.update({ ... });
  }, {
    isolationLevel: 'Serializable',
    timeout: 10000
  });
});
```

---

## 📚 Best Practices

### 1. Always Use Idempotency for Financial Operations
```typescript
// ✅ Good
router.post('/payment', idempotencyMiddleware(), handlePayment);

// ❌ Bad
router.post('/payment', handlePayment);
```

### 2. Lock Resources in Consistent Order
```typescript
// ✅ Good - Sorted to prevent deadlocks
const userIds = [user1, user2].sort();
await lockWalletsForUpdate(tx, userIds);

// ❌ Bad - Can cause deadlocks
await lockWalletForUpdate(tx, user1);
await lockWalletForUpdate(tx, user2);
```

### 3. Use Appropriate Isolation Levels
```typescript
// ✅ Good - Serializable for financial operations
await prisma.$transaction(async (tx) => {
  // ...
}, { isolationLevel: 'Serializable' });

// ❌ Bad - Default isolation level
await prisma.$transaction(async (tx) => {
  // ...
});
```

### 4. Set Reasonable Timeouts
```typescript
// ✅ Good - 10 second timeout
await prisma.$transaction(async (tx) => {
  // ...
}, { timeout: 10000 });

// ❌ Bad - No timeout (can hang forever)
await prisma.$transaction(async (tx) => {
  // ...
});
```

---

## ✅ Summary

**All financial operations are now protected:**
1. ✅ Idempotency keys prevent duplicate transactions
2. ✅ Database locks prevent race conditions
3. ✅ Automatic deadlock retry
4. ✅ Consistent lock ordering prevents deadlocks
5. ✅ Serializable isolation level ensures consistency
6. ✅ Automatic cleanup of expired keys
7. ✅ Comprehensive error handling
8. ✅ Monitoring and debugging tools

**Your financial operations are now bulletproof! 🚀**

---

## 🔗 Related Documentation

- [SECURITY_COMPLETE.md](./SECURITY_COMPLETE.md) - Overall security implementation
- [PRODUCTION_SECURITY_CHECKLIST.md](./PRODUCTION_SECURITY_CHECKLIST.md) - Pre-launch checklist
- [PostgreSQL Advisory Locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
- [Transaction Isolation Levels](https://www.postgresql.org/docs/current/transaction-iso.html)
