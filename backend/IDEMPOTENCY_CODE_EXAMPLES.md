# Idempotency & Locks - Code Examples

## Quick Reference for Developers

### 1. Add Idempotency to a Route

```typescript
import { idempotencyMiddleware } from '../../middleware/idempotency.js';

// Financial operation (24 hour TTL)
router.post('/contest/distribute-prizes', 
  authMiddleware,
  idempotencyMiddleware({ ttlSeconds: 86400, autoGenerate: true }),
  ContestController.distributePrizes
);

// Payment operation (1 hour TTL)
router.post('/order/checkout', 
  authMiddleware,
  idempotencyMiddleware({ ttlSeconds: 3600, autoGenerate: true }),
  OrderController.checkout
);

// Require client to send key
router.post('/withdrawal', 
  authMiddleware,
  idempotencyMiddleware({ ttlSeconds: 86400, autoGenerate: false }),
  WalletController.withdraw
);
```

### 2. Lock a Single Wallet

```typescript
import { lockWalletForUpdate, withDeadlockRetry } from '../../utils/databaseLocks.js';
import { Prisma } from '../../generated/prisma/client.js';

async function creditWallet(userId: string, amount: number) {
  return withDeadlockRetry(async () => {
    return prisma.$transaction(async (tx) => {
      // Lock wallet
      await lockWalletForUpdate(tx, userId);
      
      // Update balance
      await tx.wallet.update({
        where: { userId },
        data: { krBalance: { increment: new Prisma.Decimal(amount) } }
      });
      
      // Record transaction
      await tx.transaction.create({
        data: {
          userId,
          type: 'credit',
          amountKr: new Prisma.Decimal(amount),
          status: 'completed',
          provider: 'platform'
        }
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });
  });
}
```

### 3. Lock Multiple Wallets (Transfer)

```typescript
import { lockWalletsForUpdate, withDeadlockRetry } from '../../utils/databaseLocks.js';
import { Prisma } from '../../generated/prisma/client.js';

async function transferBetweenWallets(
  senderId: string, 
  recipientId: string, 
  amount: number
) {
  return withDeadlockRetry(async () => {
    return prisma.$transaction(async (tx) => {
      // Lock both wallets (ordered to prevent deadlocks)
      const wallets = await lockWalletsForUpdate(tx, [senderId, recipientId]);
      const senderWallet = wallets.find((w: any) => w.user_id === senderId);
      
      // Check balance
      if (senderWallet.kr_balance < amount) {
        throw new Error('Insufficient balance');
      }
      
      // Deduct from sender
      await tx.wallet.update({
        where: { userId: senderId },
        data: { krBalance: { decrement: new Prisma.Decimal(amount) } }
      });
      
      // Credit recipient
      await tx.wallet.update({
        where: { userId: recipientId },
        data: { krBalance: { increment: new Prisma.Decimal(amount) } }
      });
      
      // Record transactions
      await tx.transaction.createMany({
        data: [
          {
            userId: senderId,
            counterpartyId: recipientId,
            type: 'transfer_sent',
            amountKr: new Prisma.Decimal(amount),
            status: 'completed',
            provider: 'platform'
          },
          {
            userId: recipientId,
            counterpartyId: senderId,
            type: 'transfer_received',
            amountKr: new Prisma.Decimal(amount),
            status: 'completed',
            provider: 'platform'
          }
        ]
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });
  });
}
```

### 4. Lock Contest for Prize Distribution

```typescript
import { lockContestForUpdate, lockWalletsForUpdate, withDeadlockRetry } from '../../utils/databaseLocks.js';
import { Prisma } from '../../generated/prisma/client.js';

async function distributePrizes(contestId: string, winners: Array<{ userId: string, prizeKr: number }>) {
  return withDeadlockRetry(async () => {
    return prisma.$transaction(async (tx) => {
      // Lock contest
      await lockContestForUpdate(tx, contestId);
      
      // Lock all winner wallets
      const winnerIds = winners.map(w => w.userId);
      await lockWalletsForUpdate(tx, winnerIds);
      
      // Distribute prizes
      for (const winner of winners) {
        await tx.wallet.update({
          where: { userId: winner.userId },
          data: { krBalance: { increment: new Prisma.Decimal(winner.prizeKr) } }
        });
        
        await tx.transaction.create({
          data: {
            userId: winner.userId,
            type: 'contest_prize',
            amountKr: new Prisma.Decimal(winner.prizeKr),
            status: 'completed',
            provider: 'platform',
            metadata: { contestId }
          }
        });
      }
      
      // Update contest status
      await tx.contest.update({
        where: { id: contestId },
        data: { status: 'COMPLETED' }
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 15000 // Longer timeout for multiple operations
    });
  });
}
```

### 5. Lock Escrow for Release

```typescript
import { lockEscrowForUpdate, lockWalletForUpdate, withDeadlockRetry } from '../../utils/databaseLocks.js';
import { Prisma } from '../../generated/prisma/client.js';

async function releaseEscrow(escrowId: string, recipientId: string) {
  return withDeadlockRetry(async () => {
    return prisma.$transaction(async (tx) => {
      // Lock escrow
      const escrow = await lockEscrowForUpdate(tx, escrowId);
      
      if (escrow.status !== 'held') {
        throw new Error('Escrow already released or refunded');
      }
      
      // Lock recipient wallet
      await lockWalletForUpdate(tx, recipientId);
      
      // Release escrow
      await tx.escrow.update({
        where: { id: escrowId },
        data: { status: 'released' }
      });
      
      // Credit recipient
      await tx.wallet.update({
        where: { userId: recipientId },
        data: { krBalance: { increment: escrow.prize_amount_kr } }
      });
      
      // Record transaction
      await tx.transaction.create({
        data: {
          userId: recipientId,
          type: 'escrow_release',
          amountKr: escrow.prize_amount_kr,
          status: 'completed',
          provider: 'platform',
          metadata: { escrowId }
        }
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });
  });
}
```

### 6. Lock Chama Wallet for Contribution

```typescript
import { lockChamaWalletForUpdate, lockWalletForUpdate, withDeadlockRetry } from '../../utils/databaseLocks.js';
import { Prisma } from '../../generated/prisma/client.js';

async function contributeToCham(chamaId: string, userId: string, amount: number) {
  return withDeadlockRetry(async () => {
    return prisma.$transaction(async (tx) => {
      // Lock user wallet
      await lockWalletForUpdate(tx, userId);
      
      // Lock chama wallet
      await lockChamaWalletForUpdate(tx, chamaId);
      
      // Deduct from user
      await tx.wallet.update({
        where: { userId },
        data: { krBalance: { decrement: new Prisma.Decimal(amount) } }
      });
      
      // Credit chama
      await tx.chamaWallet.update({
        where: { chamaId },
        data: { krBalance: { increment: new Prisma.Decimal(amount) } }
      });
      
      // Record contribution
      await tx.chamaContribution.create({
        data: {
          chamaId,
          userId,
          amountKr: new Prisma.Decimal(amount),
          cycleNumber: 1 // Get from chama
        }
      });
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });
  });
}
```

### 7. Use Advisory Locks (Alternative)

```typescript
import { withAdvisoryLock, LockType } from '../../utils/databaseLocks.js';

// Lock a resource without transaction
async function processOrder(orderId: string) {
  return withAdvisoryLock(
    LockType.ORDER,
    orderId,
    async () => {
      // Process order
      // Only one process can do this at a time
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      
      if (order.status !== 'PENDING') {
        throw new Error('Order already processed');
      }
      
      // Update order
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' }
      });
      
      // ... more processing
    },
    5000 // 5 second timeout
  );
}
```

### 8. Frontend - Generate Idempotency Key

```typescript
// React/Vue/Angular
import { v4 as uuidv4 } from 'uuid';

function TipButton({ recipientId, amount }) {
  const [idempotencyKey, setIdempotencyKey] = useState(null);
  
  const handleTip = async () => {
    // Generate key once per user action
    const key = idempotencyKey || uuidv4();
    setIdempotencyKey(key);
    
    try {
      const response = await fetch('/api/v1/wallet/tip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Idempotency-Key': key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipientId, amount })
      });
      
      if (response.ok) {
        // Success - reset key for next action
        setIdempotencyKey(null);
      } else {
        // Error - keep key for retry
        console.error('Tip failed, retry with same key');
      }
    } catch (error) {
      // Network error - keep key for retry
      console.error('Network error, retry with same key');
    }
  };
  
  return <button onClick={handleTip}>Send Tip</button>;
}
```

### 9. Check if Resource is Locked

```typescript
import { isResourceLocked, LockType } from '../../utils/databaseLocks.js';

async function canProcessOrder(orderId: string) {
  const locked = await isResourceLocked(LockType.ORDER, orderId);
  
  if (locked) {
    return {
      canProcess: false,
      message: 'Order is currently being processed by another operation'
    };
  }
  
  return {
    canProcess: true,
    message: 'Order can be processed'
  };
}
```

### 10. Monitor Active Locks

```typescript
import { getActiveLocks } from '../../utils/databaseLocks.js';

// Admin endpoint to monitor locks
router.get('/admin/locks', authMiddleware, async (req, res) => {
  const locks = await getActiveLocks();
  
  res.json({
    total: locks.length,
    locks: locks.map(lock => ({
      type: lock.locktype,
      table: lock.table_name,
      mode: lock.mode,
      granted: lock.granted,
      pid: lock.pid
    }))
  });
});
```

---

## Common Patterns

### Pattern 1: Financial Operation
```typescript
// Always use: Idempotency + Locks + Deadlock Retry + Serializable
router.post('/financial-op', 
  authMiddleware,
  idempotencyMiddleware({ ttlSeconds: 86400, autoGenerate: true }),
  async (req, res) => {
    await withDeadlockRetry(async () => {
      return prisma.$transaction(async (tx) => {
        await lockWalletForUpdate(tx, userId);
        // ... operations
      }, {
        isolationLevel: 'Serializable',
        timeout: 10000
      });
    });
  }
);
```

### Pattern 2: Multi-Wallet Operation
```typescript
// Always lock in sorted order
const userIds = [user1, user2, user3].sort();
await lockWalletsForUpdate(tx, userIds);
```

### Pattern 3: Contest/Escrow Operation
```typescript
// Lock contest/escrow first, then wallets
await lockContestForUpdate(tx, contestId);
await lockWalletsForUpdate(tx, winnerIds);
```

---

## Error Handling

```typescript
try {
  await transferBetweenWallets(senderId, recipientId, amount);
} catch (error) {
  if (error.message.includes('Insufficient balance')) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  if (error.message.includes('Failed to acquire lock')) {
    return res.status(409).json({ error: 'Resource is locked, please try again' });
  }
  
  if (error.message.includes('deadlock')) {
    return res.status(500).json({ error: 'Transaction failed due to high concurrency, please retry' });
  }
  
  return res.status(500).json({ error: 'Internal server error' });
}
```

---

## Testing

```typescript
// Test concurrent operations
describe('Wallet Transfer', () => {
  it('should handle concurrent transfers without race conditions', async () => {
    // Send 10 concurrent transfers
    const promises = Array.from({ length: 10 }, (_, i) =>
      transferBetweenWallets(sender, recipient, 1)
    );
    
    await Promise.all(promises);
    
    // Check balances
    const senderWallet = await prisma.wallet.findUnique({ where: { userId: sender } });
    const recipientWallet = await prisma.wallet.findUnique({ where: { userId: recipient } });
    
    expect(senderWallet.krBalance).toBe(initialBalance - 10);
    expect(recipientWallet.krBalance).toBe(10);
  });
});
```

---

**Use these patterns for all financial operations! 🚀**
