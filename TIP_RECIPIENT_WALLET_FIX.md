# Tip Recipient Wallet Credit Fix

## Problem
When users send tips, recipients don't receive the Kr in their wallets. The balance doesn't update.

## Root Cause
The issue was in the wallet credit logic in `sendTip` method:

1. `lockWalletsForUpdate()` creates wallets if they don't exist
2. But then the code was doing `upsert()` which can cause conflicts
3. The `upsert` with `increment` wasn't properly crediting when the wallet already existed from the lock

## The Fix

### Changed From (BROKEN):
```typescript
const recipientWallet = await tx.wallets.upsert({
  where: { user_id: recipientId },
  create: { 
    kr_balance: recipientReceiveAmount,
    updated_at: new Date()
  },
  update: { 
    kr_balance: { increment: recipientReceiveAmount },
    updated_at: new Date()
  }
});
```

**Problem**: The `increment` operation wasn't being applied correctly after the wallet was locked/created.

### Changed To (FIXED):
```typescript
// Get recipient wallet from locked wallets
const recipientWallet = wallets.find((w: any) => w.user_id === recipientId);

// Calculate new balance explicitly
const currentRecipientBalance = Number(recipientWallet.kr_balance);
const newRecipientBalance = currentRecipientBalance + Number(recipientReceiveAmount);

// Direct update with explicit new balance
await tx.wallets.update({
  where: { user_id: recipientId },
  data: { 
    kr_balance: new Prisma.Decimal(newRecipientBalance),
    updated_at: new Date()
  }
});
```

**Solution**: 
- Get the wallet that was already locked (and created if needed)
- Calculate the new balance explicitly
- Use direct `update()` with the calculated balance
- This ensures the recipient gets credited properly

## How It Works Now

### Step-by-Step Flow

1. **Lock Both Wallets**:
   ```typescript
   const wallets = await lockWalletsForUpdate(tx, [senderId, recipientId]);
   ```
   - Locks sender's wallet
   - Locks (or creates) recipient's wallet
   - Prevents race conditions

2. **Find Wallets**:
   ```typescript
   const senderWallet = wallets.find((w: any) => w.user_id === senderId);
   const recipientWallet = wallets.find((w: any) => w.user_id === recipientId);
   ```

3. **Validate Sender Balance**:
   ```typescript
   if (Number(senderWallet.kr_balance) < roundedKrAmount) {
     throw new Error("Insufficient Kr balance");
   }
   ```

4. **Deduct from Sender**:
   ```typescript
   await tx.wallets.update({
     where: { user_id: senderId },
     data: { 
       kr_balance: { decrement: krDecimal },
       updated_at: new Date()
     }
   });
   ```

5. **Credit Recipient** (THE FIX):
   ```typescript
   const currentBalance = Number(recipientWallet.kr_balance);
   const newBalance = currentBalance + Number(recipientReceiveAmount);
   
   await tx.wallets.update({
     where: { user_id: recipientId },
     data: { 
       kr_balance: new Prisma.Decimal(newBalance),
       updated_at: new Date()
     }
   });
   ```

6. **Log Details**:
   ```typescript
   console.log(`💰 Tip completed: ${senderId} → ${recipientId}`);
   console.log(`   Recipient old balance: Kr. ${currentBalance}`);
   console.log(`   Recipient new balance: Kr. ${newBalance}`);
   ```

## Example Scenarios

### Scenario 1: New Recipient (No Wallet)
```
Initial: Recipient has NO wallet
Tip: Kr. 10 sent

Flow:
1. lockWalletsForUpdate creates wallet with Kr. 0
2. Calculate: 0 + 8 (80% of 10) = Kr. 8
3. Update wallet to Kr. 8
4. Recipient now has Kr. 8 ✓
```

### Scenario 2: Existing Recipient
```
Initial: Recipient has Kr. 50
Tip: Kr. 10 sent

Flow:
1. lockWalletsForUpdate finds existing wallet (Kr. 50)
2. Calculate: 50 + 8 (80% of 10) = Kr. 58
3. Update wallet to Kr. 58
4. Recipient now has Kr. 58 ✓
```

### Scenario 3: Small Fractional Tip
```
Initial: Recipient has Kr. 100
Tip: Kr. 3.85 sent (KES 5)

Flow:
1. Locked wallet shows Kr. 100
2. Platform fee: Kr. 0.77 (20%)
3. Recipient gets: Kr. 3.08 (80%)
4. Calculate: 100 + 3.08 = Kr. 103.08
5. Update wallet to Kr. 103.08
6. Recipient now has Kr. 103.08 ✓
```

## Testing Instructions

### 1. Check Backend Logs
After sending a tip, you should see:
```
💰 Tip completed: abc-123 → def-456
   Sender paid: Kr. 10.0
   Recipient gets: Kr. 8.0
   Platform fee: Kr. 2.0
   Recipient old balance: Kr. 50.0
   Recipient new balance: Kr. 58.0
```

### 2. Verify in Database
```sql
-- Check recipient's wallet
SELECT user_id, kr_balance, updated_at 
FROM wallets 
WHERE user_id = 'RECIPIENT_USER_ID';

-- Should show new balance: Kr. 58.0

-- Check transactions
SELECT user_id, type, amount_kr, status, created_at
FROM transactions 
WHERE user_id = 'RECIPIENT_USER_ID' 
  AND type = 'tip_received'
ORDER BY created_at DESC 
LIMIT 1;

-- Should show: amount_kr = 8.0, status = 'completed'
```

### 3. Test End-to-End

**User A (Sender)**:
1. Balance before: Kr. 100
2. Send tip to User B: Kr. 10
3. Balance after: Kr. 90 ✓

**User B (Recipient)**:
1. Balance before: Kr. 50
2. Receive tip from User A
3. **Refresh wallet balance**
4. Balance after: Kr. 58 (50 + 8) ✓

## Money Flow Verification

### Complete Transaction
```
Sender: Kr. 100
Recipient: Kr. 50

Action: Sender tips Kr. 10

Calculations:
- Platform fee: Kr. 2 (20% of 10)
- Recipient gets: Kr. 8 (80% of 10)

Database Operations:
1. UPDATE wallets SET kr_balance = 90 WHERE user_id = sender_id
2. UPDATE wallets SET kr_balance = 58 WHERE user_id = recipient_id

Final State:
- Sender: Kr. 90 (-10) ✓
- Recipient: Kr. 58 (+8) ✓
- Platform: +Kr. 2 revenue ✓

Transaction Records:
- tip_sent: sender_id, -Kr. 10
- tip_received: recipient_id, +Kr. 8
- platform_fee: PLATFORM_REVENUE, +Kr. 2
```

## Why the Previous Code Failed

### Issue with `upsert` + `increment`
```typescript
// ❌ BROKEN CODE
await tx.wallets.upsert({
  where: { user_id: recipientId },
  create: { kr_balance: recipientReceiveAmount }, // Works for new wallets
  update: { kr_balance: { increment: recipientReceiveAmount } } // FAILS
});
```

**Problem**: 
- When `lockWalletsForUpdate` creates the wallet, it's created with Kr. 0
- The `upsert` then tries to execute the `update` path
- But the `increment` operation may not be applied correctly in certain race conditions
- Or the wallet object returned doesn't reflect the updated balance

### Why Direct Update Works
```typescript
// ✅ WORKING CODE
const currentBalance = Number(recipientWallet.kr_balance); // From locked wallet
const newBalance = currentBalance + Number(recipientReceiveAmount);

await tx.wallets.update({
  where: { user_id: recipientId },
  data: { kr_balance: new Prisma.Decimal(newBalance) }
});
```

**Solution**:
- We already have the wallet object from `lockWalletsForUpdate`
- We explicitly calculate the new balance
- We use a direct `update` operation
- No ambiguity, no race conditions

## Additional Improvements

### 1. Detailed Logging
Added comprehensive logging to track:
- Sender ID and Recipient ID
- Amount sent and received
- Platform fee taken
- Old and new balances

### 2. Updated Timestamp
Always set `updated_at` on wallet updates to:
- Track when balance last changed
- Trigger frontend refresh logic
- Audit trail

### 3. Explicit Balance Calculation
Calculate balance explicitly instead of relying on database increment:
- More transparent
- Easier to debug
- Less prone to database-specific quirks

## Files Changed
- `backend/src/modules/wallet/wallet.service.ts` - Fixed `sendTip` method

## Related Files
- `backend/src/utils/databaseLocks.ts` - Wallet locking logic
- `composeApp/.../wallet/data/repository/WalletRepositoryImpl.kt` - Frontend tip API

## Rollback Plan
If issues occur, revert to previous upsert logic:
```typescript
const recipientWallet = await tx.wallets.upsert({
  where: { user_id: recipientId },
  create: { 
    id: crypto.randomUUID(),
    user: { connect: { id: recipientId } },
    kr_balance: recipientReceiveAmount,
    updated_at: new Date()
  },
  update: { 
    kr_balance: { increment: recipientReceiveAmount },
    updated_at: new Date()
  }
});
```

But ensure `lockWalletsForUpdate` doesn't create wallets first.

## Monitoring

### Key Metrics to Watch
1. **Tip Success Rate**: Should be ~100%
2. **Balance Discrepancies**: Should be 0
3. **Failed Tips**: Monitor error logs
4. **Wallet Update Failures**: Check database logs

### SQL Query for Balance Integrity
```sql
-- Verify all tips were credited correctly
SELECT 
  t.user_id as recipient_id,
  SUM(CASE WHEN t.type = 'tip_received' THEN t.amount_kr ELSE 0 END) as total_tips_received,
  w.kr_balance as current_balance
FROM transactions t
JOIN wallets w ON w.user_id = t.user_id
WHERE t.type = 'tip_received'
  AND t.status = 'completed'
GROUP BY t.user_id, w.kr_balance;
```

## Next Steps
1. Deploy the fix
2. Monitor logs for "💰 Tip completed" messages
3. Verify recipient balances are updated
4. Check for any errors in production
5. Consider adding real-time balance notifications
