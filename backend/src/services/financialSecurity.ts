// Complete Server Implementation for Secure Financial Transactions
// This file includes all security features: session secrets, signature verification,
// nonce tracking, rate limiting, and transaction processing

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ============================================================================
// 1. SESSION SECRET MANAGEMENT
// ============================================================================

/**
 * Generate a cryptographically secure 256-bit session secret
 * Called on login/register
 */
export async function generateSessionSecret(userId: string, device_id: string) {
  // Generate 256-bit (32 bytes) cryptographically secure secret
  const secret = crypto.randomBytes(32);
  
  // Set expiration (24 hours)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  // Deactivate old secrets for this user
  await prisma.user_session_secrets.updateMany({
    where: { user_id: userId, is_active: true },
    data: { is_active: false }
  });
  
  // Store new secret
  await prisma.user_session_secrets.create({ data: {
      user_id: userId,
      secret,
      expires_at: expiresAt,
      device_id,
      is_active: true
    }} as any));
  
  console.log(`✅ Generated session secret for user ${userId}`);
  
  // Return base64-encoded secret for client
  return {
    sessionSecret: secret.toString('base64'),
    secretExpiresAt: expiresAt.getTime()
  };
}

/**
 * Get user's active session secret
 */
async function getUserSessionSecret(userId: string): Promise<Buffer | null> {
  const sessionSecret = await prisma.user_session_secrets.findFirst({
    where: {
      user_id: userId,
      is_active: true,
      expires_at: { gt: new Date() }
    },
    orderBy: { created_at: 'desc' }
  });
  
  if (!sessionSecret) {
    console.log(`❌ No active session secret for user ${userId}`);
    return null;
  }
  
  return Buffer.from(sessionSecret.secret);
}

/**
 * Cleanup expired session secrets (run periodically)
 */
export async function cleanupExpiredSecrets() {
  const result = await prisma.user_session_secrets.deleteMany({
    where: {
      expires_at: { lt: new Date() }
    }
  });
  
  console.log(`🧹 Cleaned up ${result.count} expired session secrets`);
}

// ============================================================================
// 2. SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify HMAC-SHA256 signature
 * Uses constant-time comparison to prevent timing attacks
 */
function verifySignature(message: string, signature: string, secret: Buffer): boolean {
  try {
    // Generate expected signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    const expectedSignature = hmac.digest('base64');
    
    // Constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

/**
 * Verify tip transaction signature
 */
async function verifyTipSignature(data: {
  sender_id: string;
  recipientId: string;
  krAmount: number;
  nonce: string;
  timestamp: number;
  signature: string;
}): Promise<boolean> {
  // Get user's session secret
  const secret = await getUserSessionSecret(data.sender_id);
  if (!secret) {
    throw new Error('Session expired or invalid');
  }
  
  // Reconstruct canonical string (MUST match client exactly)
  const canonical = `TIP|senderId=${data.sender_id}&recipientId=${data.recipientId}&krAmount=${data.krAmount}&nonce=${data.nonce}&timestamp=${data.timestamp}`;
  
  // Verify signature
  return verifySignature(canonical, data.signature, secret);
}

/**
 * Verify withdrawal transaction signature
 */
async function verifyWithdrawalSignature(data: {
  user_id: string;
  krAmount: number;
  provider: string;
  currency: string;
  nonce: string;
  timestamp: number;
  signature: string;
}): Promise<boolean> {
  const secret = await getUserSessionSecret(data.user_id);
  if (!secret) {
    throw new Error('Session expired or invalid');
  }
  
  const canonical = `WITHDRAW|userId=${data.user_id}&krAmount=${data.krAmount}&provider=${data.provider}&currency=${data.currency}&nonce=${data.nonce}&timestamp=${data.timestamp}`;
  
  return verifySignature(canonical, data.signature, secret);
}

/**
 * Verify top-up transaction signature
 */
async function verifyTopUpSignature(data: {
  user_id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  nonce: string;
  timestamp: number;
  signature: string;
}): Promise<boolean> {
  const secret = await getUserSessionSecret(data.user_id);
  if (!secret) {
    throw new Error('Session expired or invalid');
  }
  
  const canonical = `TOPUP|userId=${data.user_id}&amount=${data.amount}&currency=${data.currency}&paymentMethod=${data.paymentMethod}&nonce=${data.nonce}&timestamp=${data.timestamp}`;
  
  return verifySignature(canonical, data.signature, secret);
}

// ============================================================================
// 3. REPLAY ATTACK PREVENTION
// ============================================================================

/**
 * Check if nonce has been used
 */
async function isNonceUsed(nonce: string): Promise<boolean> {
  const existing = await prisma.transaction_nonces.findUnique({
    where: { nonce }
  });
  
  return existing !== null;
}

/**
 * Store nonce to prevent replay
 */
async function storeNonce(
  nonce: string,
  userId: string,
  transactionType: string,
  timestamp: number
) {
  // Nonces expire after 10 minutes
  const expiresAt = new Date(timestamp + 10 * 60 * 1000);
  
  await prisma.transaction_nonces.create({ data: {
      nonce,
      user_id: userId,
      transactionType,
      expires_at: expiresAt
    }} as any));
  
  console.log(`✅ Stored nonce ${nonce} for ${transactionType}`);
}

/**
 * Validate timestamp (max 5 minutes old)
 */
function isTimestampValid(timestamp: number): boolean {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  const isValid = (now - timestamp) <= maxAge && timestamp <= now;
  
  if (!isValid) {
    console.log(`❌ Invalid timestamp: ${timestamp}, now: ${now}, diff: ${now - timestamp}ms`);
  }
  
  return isValid;
}

/**
 * Cleanup expired nonces (run periodically)
 */
export async function cleanupExpiredNonces() {
  const result = await prisma.transaction_nonces.deleteMany({
    where: {
      expires_at: { lt: new Date() }
    }
  });
  
  console.log(`🧹 Cleaned up ${result.count} expired nonces`);
}

// ============================================================================
// 4. TRANSACTION LOGGING
// ============================================================================

/**
 * Log financial transaction for audit trail
 */
async function logFinancialTransaction(data: {
  transactionId: string;
  userId: string;
  transactionType: string;
  amountKr: number;
  amountFiat?: number;
  currency?: string;
  provider?: string;
  counterpartyId?: string;
  signature: string;
  nonce: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  status: string;
  errorMessage?: string;
}) {
  await prisma.financial_transaction_logs.create({ data: {
      transaction_id: data.transactionId,
      user_id: data.userId,
      transactionType: data.transactionType,
      amount_kr: data.amountKr,
      amount_fiat: data.amountFiat,
      currency: data.currency,
      provider: data.provider,
      counterpartyId: data.counterpartyId,
      signature: data.signature,
      nonce: data.nonce,
      timestamp: BigInt(data.timestamp),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      device_id: data.deviceId,
      status: data.status,
      errorMessage: data.errorMessage
    }} as any));
  
  console.log(`📝 Logged transaction ${data.transactionId} - ${data.status}`);
}

// ============================================================================
// 5. RATE LIMITING
// ============================================================================

/**
 * Check rate limit for user action
 */
async function checkRateLimit(
  userId: string,
  action: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<void> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000);
  
  // Count recent attempts
  const recentAttempts = await prisma.financial_transaction_logs.count({
    where: {
      user_id: userId,
      transactionType: action.toUpperCase(),
      created_at: { gte: windowStart }
    }
  });
  
  if (recentAttempts >= maxAttempts) {
    throw new Error(`Rate limit exceeded. Maximum ${maxAttempts} ${action}s per ${windowSeconds} seconds`);
  }
  
  console.log(`✅ Rate limit check passed: ${recentAttempts}/${maxAttempts} for ${action}`);
}

// ============================================================================
// 6. SUSPICIOUS ACTIVITY DETECTION
// ============================================================================

/**
 * Detect suspicious activity patterns
 */
async function detectSuspiciousActivity(userId: string) {
  // Check for rapid transactions (>20 in 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentCount = await prisma.financial_transaction_logs.count({
    where: {
      user_id: userId,
      created_at: { gte: fiveMinutesAgo }
    }
  });
  
  if (recentCount > 20) {
    await prisma.suspicious_activity_logs.create({
      data: {
        user_id: userId,
        activityType: 'RAPID_TRANSACTIONS',
        description: `${recentCount} transactions in 5 minutes`,
        severity: 'HIGH',
        metadata: { count: recentCount }
      }
    });
    
    console.log(`🚨 ALERT: Rapid transactions detected for user ${userId}`);
  }
  
  // Check for large amounts (>50,000 Kr in 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const result = await prisma.financial_transaction_logs.aggregate({
    where: {
      user_id: userId,
      created_at: { gte: oneHourAgo },
      status: 'COMPLETED'
    },
    _sum: { amount_kr: true }
  });
  
  const totalAmount = result._sum.amount_kr || 0;
  if (Number(totalAmount) > 50000) {
    await prisma.suspicious_activity_logs.create({
      data: {
        user_id: userId,
        activityType: 'LARGE_AMOUNT',
        description: `${totalAmount} Kr in 1 hour`,
        severity: 'MEDIUM',
        metadata: { amount: totalAmount.toString() }
      }
    });
    
    console.log(`🚨 ALERT: Large amount detected for user ${userId}`);
  }
}

// ============================================================================
// 7. PROCESS TIP TRANSACTION (COMPLETE FLOW)
// ============================================================================

/**
 * Process tip transaction with full security checks
 */
export async function processTipTransaction(data: {
  sender_id: string;
  recipientId: string;
  krAmount: number;
  currency: string;
  signature: string;
  nonce: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
}) {
  const transactionId = crypto.randomUUID();
  
  try {
    console.log(`🔄 Processing tip transaction ${transactionId}`);
    
    // 1. Verify signature
    console.log('1️⃣ Verifying signature...');
    const isValidSignature = await verifyTipSignature({
      sender_id: data.sender_id,
      recipientId: data.recipientId,
      krAmount: data.krAmount,
      nonce: data.nonce,
      timestamp: data.timestamp,
      signature: data.signature
    });
    
    if (!isValidSignature) {
      throw new Error('Invalid signature');
    }
    console.log('✅ Signature valid');
    
    // 2. Check nonce uniqueness
    console.log('2️⃣ Checking nonce uniqueness...');
    if (await isNonceUsed(data.nonce)) {
      throw new Error('Duplicate request - nonce already used');
    }
    console.log('✅ Nonce unique');
    
    // 3. Validate timestamp
    console.log('3️⃣ Validating timestamp...');
    if (!isTimestampValid(data.timestamp)) {
      throw new Error('Request expired - timestamp too old');
    }
    console.log('✅ Timestamp valid');
    
    // 4. Check rate limit (10 tips per minute)
    console.log('4️⃣ Checking rate limit...');
    await checkRateLimit(data.sender_id, 'tip', 10, 60);
    console.log('✅ Rate limit OK');
    
    // 5. Validate amount
    console.log('5️⃣ Validating amount...');
    if (data.krAmount < 1 || data.krAmount > 10000) {
      throw new Error('Invalid amount - must be between 1 and 10,000 Kr');
    }
    console.log('✅ Amount valid');
    
    // 6. Check sender balance
    console.log('6️⃣ Checking sender balance...');
    const senderWallet = await prisma.wallets.findUnique({
      where: { user_id: data.sender_id }
    });
    
    if (!senderWallet || Number(senderWallet.kr_balance) < data.krAmount) {
      throw new Error('Insufficient balance');
    }
    console.log('✅ Balance sufficient');
    
    // 7. Process transaction atomically
    console.log('7️⃣ Processing transaction...');
    await prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.wallets.update({
        where: { user_id: data.sender_id },
        data: { kr_balance: { decrement: data.krAmount } }
      });
      
      // Add to recipient
      await tx.wallets.update({
        where: { user_id: data.recipientId },
        data: { kr_balance: { increment: data.krAmount } }
      });
      
      // Record transaction
      await tx.transactions.create({
        data: {
          id: transactionId,
          user_id: data.sender_id,
          type: 'TIP',
          amount_kr: data.krAmount,
          currency: data.currency,
          counterparty_id: data.recipientId,
          status: 'COMPLETED'
        }
      });
      
      // Store nonce
      await tx.transaction_nonces.create({
        data: {
          nonce: data.nonce,
          user_id: data.sender_id,
          transactionType: 'TIP',
          expires_at: new Date(data.timestamp + 10 * 60 * 1000)
        }
      });
    });
    console.log('✅ Transaction completed');
    
    // 8. Log transaction
    await logFinancialTransaction({
      transactionId,
      userId: data.sender_id,
      transactionType: 'TIP',
      amountKr: data.krAmount,
      currency: data.currency,
      counterpartyId: data.recipientId,
      signature: data.signature,
      nonce: data.nonce,
      timestamp: data.timestamp,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceId: data.deviceId,
      status: 'COMPLETED'
    });
    
    // 9. Check for suspicious activity
    await detectSuspiciousActivity(data.sender_id);
    
    console.log(`✅ Tip transaction ${transactionId} completed successfully`);
    
    return {
      success: true,
      transactionId,
      krTipped: data.krAmount
    };
    
  } catch (error: any) {
    console.error(`❌ Tip transaction ${transactionId} failed:`, error.message);
    
    // Log failed transaction
    await logFinancialTransaction({
      transactionId,
      userId: data.sender_id,
      transactionType: 'TIP',
      amountKr: data.krAmount,
      currency: data.currency,
      counterpartyId: data.recipientId,
      signature: data.signature,
      nonce: data.nonce,
      timestamp: data.timestamp,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceId: data.deviceId,
      status: 'FAILED',
      errorMessage: error.message
    });
    
    throw error;
  }
}

// ============================================================================
// 8. SCHEDULED CLEANUP JOBS
// ============================================================================

/**
 * Run cleanup jobs periodically
 * Call this every hour using a cron job or scheduler
 */
export async function runCleanupJobs() {
  console.log('🧹 Running cleanup jobs...');
  
  await cleanupExpiredSecrets();
  await cleanupExpiredNonces();
  
  console.log('✅ Cleanup jobs completed');
}

// ============================================================================
// 9. EXPORT ALL FUNCTIONS
// ============================================================================

export {
  // Session management
  getUserSessionSecret,
  
  // Signature verification
  verifyTipSignature,
  verifyWithdrawalSignature,
  verifyTopUpSignature,
  
  // Replay prevention
  isNonceUsed,
  storeNonce,
  isTimestampValid,
  
  // Logging
  logFinancialTransaction,
  
  // Rate limiting
  checkRateLimit,
  
  // Monitoring
  detectSuspiciousActivity
};
