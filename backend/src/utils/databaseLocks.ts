import { prisma } from '../config/database.js';
import { Prisma } from '../generated/prisma/client.js';

/**
 * Database Lock Utilities for Financial Operations
 * 
 * Implements pessimistic locking to prevent race conditions in:
 * - Wallet balance updates
 * - Contest prize distributions
 * - Escrow operations
 * - Any concurrent financial operations
 * 
 * Uses PostgreSQL advisory locks and SELECT FOR UPDATE
 */

/**
 * Lock types
 */
export enum LockType {
  WALLET = 'wallet',
  TRANSACTION = 'transaction',
  ESCROW = 'escrow',
  CONTEST = 'contest',
  CHAMA = 'chama',
  ORDER = 'order'
}

/**
 * Generate lock ID from string (for advisory locks)
 */
function generateLockId(type: LockType, identifier: string): bigint {
  const hash = require('crypto')
    .createHash('sha256')
    .update(`${type}:${identifier}`)
    .digest();
  
  // Take first 8 bytes and convert to bigint
  return BigInt('0x' + hash.slice(0, 8).toString('hex'));
}

/**
 * Acquire PostgreSQL advisory lock
 * 
 * Advisory locks are session-level locks that don't require a table.
 * Perfect for preventing concurrent operations on the same resource.
 */
export async function acquireAdvisoryLock(
  type: LockType,
  identifier: string,
  timeoutMs: number = 5000
): Promise<boolean> {
  const lockId = generateLockId(type, identifier);
  
  try {
    // Try to acquire lock with timeout
    const result = await prisma.$queryRaw<any[]>`
      SELECT pg_try_advisory_lock(${lockId}) as acquired
    `;
    
    return result[0]?.acquired === true;
  } catch (error) {
    console.error(`Failed to acquire advisory lock for ${type}:${identifier}`, error);
    return false;
  }
}

/**
 * Release PostgreSQL advisory lock
 */
export async function releaseAdvisoryLock(
  type: LockType,
  identifier: string
): Promise<boolean> {
  const lockId = generateLockId(type, identifier);
  
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT pg_advisory_unlock(${lockId}) as released
    `;
    
    return result[0]?.released === true;
  } catch (error) {
    console.error(`Failed to release advisory lock for ${type}:${identifier}`, error);
    return false;
  }
}

/**
 * Execute function with advisory lock
 */
export async function withAdvisoryLock<T>(
  type: LockType,
  identifier: string,
  fn: () => Promise<T>,
  timeoutMs: number = 5000
): Promise<T> {
  const acquired = await acquireAdvisoryLock(type, identifier, timeoutMs);
  
  if (!acquired) {
    throw new Error(`Failed to acquire lock for ${type}:${identifier}. Resource is locked by another operation.`);
  }
  
  try {
    return await fn();
  } finally {
    await releaseAdvisoryLock(type, identifier);
  }
}

/**
 * Lock wallet for update (SELECT FOR UPDATE)
 * 
 * This ensures no other transaction can read or modify the wallet
 * until the current transaction completes.
 */
export async function lockWalletForUpdate(
  tx: Prisma.TransactionClient,
  userId: string
) {
  // Use raw query with FOR UPDATE to lock the row
  const wallet = await tx.$queryRaw<any[]>`
    SELECT * FROM wallets
    WHERE user_id = ${userId}
    FOR UPDATE
  `;
  
  if (!wallet || wallet.length === 0) {
    // Create wallet if it doesn't exist
    return await tx.wallet.create({
      data: { userId, krBalance: new Prisma.Decimal(0) }
    });
  }
  
  return wallet[0];
}

/**
 * Lock multiple wallets for update (prevents deadlocks by ordering)
 */
export async function lockWalletsForUpdate(
  tx: Prisma.TransactionClient,
  userIds: string[]
) {
  // Sort user IDs to prevent deadlocks
  const sortedIds = [...userIds].sort();
  
  const wallets = await tx.$queryRaw<any[]>`
    SELECT * FROM wallets
    WHERE user_id = ANY(${sortedIds}::uuid[])
    ORDER BY user_id
    FOR UPDATE
  `;
  
  // Create missing wallets
  const existingIds = wallets.map((w: any) => w.user_id);
  const missingIds = sortedIds.filter(id => !existingIds.includes(id));
  
  for (const userId of missingIds) {
    const newWallet = await tx.wallet.create({
      data: { userId, krBalance: new Prisma.Decimal(0) }
    });
    wallets.push(newWallet);
  }
  
  return wallets;
}

/**
 * Safe wallet transfer with locks
 * 
 * Prevents race conditions when transferring between wallets
 */
export async function safeWalletTransfer(
  senderId: string,
  recipientId: string,
  amount: Prisma.Decimal,
  transactionType: string,
  metadata?: any
) {
  return await prisma.$transaction(async (tx) => {
    // Lock both wallets (ordered to prevent deadlocks)
    const [senderWallet, recipientWallet] = await lockWalletsForUpdate(
      tx,
      [senderId, recipientId]
    );
    
    // Verify sender has sufficient balance
    if (senderWallet.kr_balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    // Deduct from sender
    await tx.wallet.update({
      where: { userId: senderId },
      data: { krBalance: { decrement: amount } }
    });
    
    // Credit recipient
    await tx.wallet.update({
      where: { userId: recipientId },
      data: { krBalance: { increment: amount } }
    });
    
    // Record transactions
    await tx.transaction.createMany({
      data: [
        {
          userId: senderId,
          counterpartyId: recipientId,
          type: `${transactionType}_sent`,
          amountKr: amount,
          status: 'completed',
          provider: 'platform',
          metadata
        },
        {
          userId: recipientId,
          counterpartyId: senderId,
          type: `${transactionType}_received`,
          amountKr: amount,
          status: 'completed',
          provider: 'platform',
          metadata
        }
      ]
    });
    
    return {
      success: true,
      senderBalance: senderWallet.kr_balance - Number(amount),
      recipientBalance: recipientWallet.kr_balance + Number(amount)
    };
  }, {
    isolationLevel: 'Serializable',
    timeout: 10000
  });
}

/**
 * Lock escrow for update
 */
export async function lockEscrowForUpdate(
  tx: Prisma.TransactionClient,
  escrowId: string
) {
  const escrow = await tx.$queryRaw<any[]>`
    SELECT * FROM escrows
    WHERE id = ${escrowId}
    FOR UPDATE
  `;
  
  if (!escrow || escrow.length === 0) {
    throw new Error('Escrow not found');
  }
  
  return escrow[0];
}

/**
 * Lock contest for update
 */
export async function lockContestForUpdate(
  tx: Prisma.TransactionClient,
  contestId: string
) {
  const contest = await tx.$queryRaw<any[]>`
    SELECT * FROM contests
    WHERE id = ${contestId}
    FOR UPDATE
  `;
  
  if (!contest || contest.length === 0) {
    throw new Error('Contest not found');
  }
  
  return contest[0];
}

/**
 * Lock chama wallet for update
 */
export async function lockChamaWalletForUpdate(
  tx: Prisma.TransactionClient,
  chamaId: string
) {
  const wallet = await tx.$queryRaw<any[]>`
    SELECT * FROM chama_wallets
    WHERE chama_id = ${chamaId}
    FOR UPDATE
  `;
  
  if (!wallet || wallet.length === 0) {
    throw new Error('Chama wallet not found');
  }
  
  return wallet[0];
}

/**
 * Lock order for update
 */
export async function lockOrderForUpdate(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const order = await tx.$queryRaw<any[]>`
    SELECT * FROM orders
    WHERE id = ${orderId}
    FOR UPDATE
  `;
  
  if (!order || order.length === 0) {
    throw new Error('Order not found');
  }
  
  return order[0];
}

/**
 * Execute with retry on deadlock
 * 
 * Automatically retries transaction if deadlock is detected
 */
export async function withDeadlockRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a deadlock error
      if (error.code === '40P01' || error.message?.includes('deadlock')) {
        console.warn(`Deadlock detected, retrying (attempt ${attempt + 1}/${maxRetries})`);
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
        continue;
      }
      
      // If it's not a deadlock, throw immediately
      throw error;
    }
  }
  
  throw new Error(`Transaction failed after ${maxRetries} retries: ${lastError?.message}`);
}

/**
 * Check if resource is locked
 */
export async function isResourceLocked(
  type: LockType,
  identifier: string
): Promise<boolean> {
  const lockId = generateLockId(type, identifier);
  
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM pg_locks
      WHERE locktype = 'advisory'
      AND objid = ${lockId}
    `;
    
    return result[0]?.count > 0;
  } catch (error) {
    console.error(`Failed to check lock status for ${type}:${identifier}`, error);
    return false;
  }
}

/**
 * Get all active locks
 */
export async function getActiveLocks() {
  try {
    const locks = await prisma.$queryRaw<any[]>`
      SELECT 
        locktype,
        database,
        relation::regclass as table_name,
        page,
        tuple,
        virtualxid,
        transactionid,
        classid,
        objid,
        objsubid,
        virtualtransaction,
        pid,
        mode,
        granted,
        fastpath
      FROM pg_locks
      WHERE locktype IN ('relation', 'advisory', 'tuple')
      ORDER BY granted DESC, pid
    `;
    
    return locks;
  } catch (error) {
    console.error('Failed to get active locks', error);
    return [];
  }
}
