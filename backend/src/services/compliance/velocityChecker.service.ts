import { redis } from '../../config/redis.js';
import { prisma } from '../../config/database.js';

/**
 * Velocity Checker Service
 * 
 * Implements real-time transaction velocity checks using Redis to prevent:
 * - Rapid tipping (max 10 tips per minute)
 * - High transaction frequency (max 50 transactions per hour)
 * - Excessive daily volume (100K Kr for non-KYC, 500K Kr for KYC users)
 * - Premature withdrawals (24-hour cooling-off period for new accounts)
 * 
 * Requirements: 2.4.2 (Velocity Checks)
 * Task: 4.2 (Implement velocity checks)
 */

export interface VelocityCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  currentAmount?: number;
  limit?: number;
  resetAt?: Date;
}

export interface VelocityMetrics {
  count_1_minute: number;
  count_1_hour: number;
  count_24_hours: number;
  amount_24_hours: number;
  tips_1_minute: number;
  is_blocked: boolean;
  cooling_off_active: boolean;
}

export class VelocityCheckerService {
  // Velocity limits
  private readonly LIMITS = {
    TIPS_PER_MINUTE: 10,
    TRANSACTIONS_PER_HOUR: 50,
    AMOUNT_24H_NON_KYC: 100000, // Kr
    AMOUNT_24H_KYC: 500000, // Kr
    COOLING_OFF_HOURS: 24,
  };

  // Redis key patterns
  private readonly KEYS = {
    TIP_COUNT: (userId: string) => `velocity:tips:${userId}:1_MINUTE`,
    TX_COUNT_1MIN: (userId: string) => `velocity:count:${userId}:1_MINUTE`,
    TX_COUNT_1HOUR: (userId: string) => `velocity:count:${userId}:1_HOUR`,
    TX_COUNT_24H: (userId: string) => `velocity:count:${userId}:24_HOURS`,
    AMOUNT_24H: (userId: string) => `velocity:amount:${userId}:24_HOURS`,
    COOLING_OFF: (userId: string) => `velocity:cooling_off:${userId}`,
    BLOCKED: (userId: string) => `velocity:blocked:${userId}`,
    SUMMARY: (userId: string) => `velocity:summary:${userId}`,
  };

  // TTL values in seconds
  private readonly TTL = {
    ONE_MINUTE: 60,
    ONE_HOUR: 3600,
    TWENTY_FOUR_HOURS: 86400,
  };

  /**
   * Check if a transaction is allowed based on velocity limits
   * 
   * @param userId - User ID
   * @param transactionType - Type of transaction (CONTENT_TIP, WITHDRAWAL, etc.)
   * @param amountKr - Transaction amount in Kr
   * @returns VelocityCheckResult indicating if transaction is allowed
   */
  async checkVelocity(
    userId: string,
    transactionType: string,
    amountKr: number
  ): Promise<VelocityCheckResult> {
    try {
      // 1. Check if user is temporarily blocked
      const isBlocked = await redis.exists(this.KEYS.BLOCKED(userId));
      if (isBlocked) {
        const blockReason = await redis.get(this.KEYS.BLOCKED(userId));
        const ttl = await redis.ttl(this.KEYS.BLOCKED(userId));
        return {
          allowed: false,
          reason: blockReason || 'User temporarily blocked due to velocity limits',
          resetAt: new Date(Date.now() + ttl * 1000),
        };
      }

      // 2. Check cooling-off period for withdrawals
      if (transactionType === 'WITHDRAWAL') {
        const coolingOffCheck = await this.checkCoolingOff(userId);
        if (!coolingOffCheck.allowed) {
          return coolingOffCheck;
        }
      }

      // 3. Check tip-specific velocity (10 tips per minute)
      if (transactionType === 'CONTENT_TIP') {
        const tipCheck = await this.checkTipVelocity(userId);
        if (!tipCheck.allowed) {
          return tipCheck;
        }
      }

      // 4. Check general transaction velocity (50 transactions per hour)
      const txVelocityCheck = await this.checkTransactionVelocity(userId);
      if (!txVelocityCheck.allowed) {
        return txVelocityCheck;
      }

      // 5. Check 24-hour amount limit (KYC-dependent)
      const amountCheck = await this.checkAmountLimit(userId, amountKr);
      if (!amountCheck.allowed) {
        return amountCheck;
      }

      // All checks passed
      return { allowed: true };
    } catch (error) {
      console.error('[VelocityChecker] Error checking velocity:', error);
      // Fail open: allow transaction if Redis is down (log for monitoring)
      return { allowed: true };
    }
  }

  /**
   * Record a successful transaction in velocity cache
   * 
   * @param userId - User ID
   * @param transactionType - Type of transaction
   * @param amountKr - Transaction amount in Kr
   */
  async recordTransaction(
    userId: string,
    transactionType: string,
    amountKr: number
  ): Promise<void> {
    try {
      const pipeline = redis.pipeline();

      // 1. Increment tip count if it's a tip
      if (transactionType === 'CONTENT_TIP') {
        pipeline.incr(this.KEYS.TIP_COUNT(userId));
        pipeline.expire(this.KEYS.TIP_COUNT(userId), this.TTL.ONE_MINUTE);
      }

      // 2. Increment transaction counts for all time windows
      pipeline.incr(this.KEYS.TX_COUNT_1MIN(userId));
      pipeline.expire(this.KEYS.TX_COUNT_1MIN(userId), this.TTL.ONE_MINUTE);

      pipeline.incr(this.KEYS.TX_COUNT_1HOUR(userId));
      pipeline.expire(this.KEYS.TX_COUNT_1HOUR(userId), this.TTL.ONE_HOUR);

      pipeline.incr(this.KEYS.TX_COUNT_24H(userId));
      pipeline.expire(this.KEYS.TX_COUNT_24H(userId), this.TTL.TWENTY_FOUR_HOURS);

      // 3. Add to 24-hour amount
      pipeline.incrbyfloat(this.KEYS.AMOUNT_24H(userId), amountKr);
      pipeline.expire(this.KEYS.AMOUNT_24H(userId), this.TTL.TWENTY_FOUR_HOURS);

      // 4. Update summary hash
      pipeline.hset(this.KEYS.SUMMARY(userId), 'last_transaction_at', new Date().toISOString());
      pipeline.expire(this.KEYS.SUMMARY(userId), this.TTL.TWENTY_FOUR_HOURS);

      await pipeline.exec();
    } catch (error) {
      console.error('[VelocityChecker] Error recording transaction:', error);
      // Don't throw - transaction already succeeded
    }
  }

  /**
   * Get current velocity metrics for a user
   * 
   * @param userId - User ID
   * @returns VelocityMetrics with current counts and amounts
   */
  async getVelocityMetrics(userId: string): Promise<VelocityMetrics> {
    try {
      const [
        tips1Min,
        count1Min,
        count1Hour,
        count24H,
        amount24H,
        isBlocked,
        coolingOff,
      ] = await Promise.all([
        redis.get(this.KEYS.TIP_COUNT(userId)),
        redis.get(this.KEYS.TX_COUNT_1MIN(userId)),
        redis.get(this.KEYS.TX_COUNT_1HOUR(userId)),
        redis.get(this.KEYS.TX_COUNT_24H(userId)),
        redis.get(this.KEYS.AMOUNT_24H(userId)),
        redis.exists(this.KEYS.BLOCKED(userId)),
        redis.exists(this.KEYS.COOLING_OFF(userId)),
      ]);

      return {
        tips_1_minute: parseInt(tips1Min || '0'),
        count_1_minute: parseInt(count1Min || '0'),
        count_1_hour: parseInt(count1Hour || '0'),
        count_24_hours: parseInt(count24H || '0'),
        amount_24_hours: parseFloat(amount24H || '0'),
        is_blocked: isBlocked === 1,
        cooling_off_active: coolingOff === 1,
      };
    } catch (error) {
      console.error('[VelocityChecker] Error getting velocity metrics:', error);
      return {
        tips_1_minute: 0,
        count_1_minute: 0,
        count_1_hour: 0,
        count_24_hours: 0,
        amount_24_hours: 0,
        is_blocked: false,
        cooling_off_active: false,
      };
    }
  }

  /**
   * Initialize cooling-off period for a new account
   * 
   * @param userId - User ID
   * @param accountCreatedAt - Account creation timestamp
   */
  async initializeCoolingOff(userId: string, accountCreatedAt: Date): Promise<void> {
    try {
      const coolingOffSeconds = this.LIMITS.COOLING_OFF_HOURS * 3600;
      const accountAgeSeconds = Math.floor((Date.now() - accountCreatedAt.getTime()) / 1000);
      const remainingSeconds = Math.max(0, coolingOffSeconds - accountAgeSeconds);

      if (remainingSeconds > 0) {
        await redis.setex(
          this.KEYS.COOLING_OFF(userId),
          remainingSeconds,
          accountCreatedAt.toISOString()
        );
      }
    } catch (error) {
      console.error('[VelocityChecker] Error initializing cooling-off:', error);
    }
  }

  /**
   * Block a user temporarily
   * 
   * @param userId - User ID
   * @param reason - Reason for blocking
   * @param durationSeconds - Block duration in seconds
   */
  async blockUser(userId: string, reason: string, durationSeconds: number): Promise<void> {
    try {
      await redis.setex(this.KEYS.BLOCKED(userId), durationSeconds, reason);
    } catch (error) {
      console.error('[VelocityChecker] Error blocking user:', error);
    }
  }

  /**
   * Unblock a user
   * 
   * @param userId - User ID
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      await redis.del(this.KEYS.BLOCKED(userId));
    } catch (error) {
      console.error('[VelocityChecker] Error unblocking user:', error);
    }
  }

  /**
   * Clear all velocity data for a user (for testing or admin purposes)
   * 
   * @param userId - User ID
   */
  async clearVelocityData(userId: string): Promise<void> {
    try {
      const keys = [
        this.KEYS.TIP_COUNT(userId),
        this.KEYS.TX_COUNT_1MIN(userId),
        this.KEYS.TX_COUNT_1HOUR(userId),
        this.KEYS.TX_COUNT_24H(userId),
        this.KEYS.AMOUNT_24H(userId),
        this.KEYS.COOLING_OFF(userId),
        this.KEYS.BLOCKED(userId),
        this.KEYS.SUMMARY(userId),
      ];
      await redis.del(...keys);
    } catch (error) {
      console.error('[VelocityChecker] Error clearing velocity data:', error);
    }
  }

  // ==================== Private Helper Methods ====================

  /**
   * Check cooling-off period for withdrawals
   */
  private async checkCoolingOff(userId: string): Promise<VelocityCheckResult> {
    const coolingOffActive = await redis.exists(this.KEYS.COOLING_OFF(userId));
    
    if (coolingOffActive) {
      const ttl = await redis.ttl(this.KEYS.COOLING_OFF(userId));
      const resetAt = new Date(Date.now() + ttl * 1000);
      const hoursRemaining = Math.ceil(ttl / 3600);

      return {
        allowed: false,
        reason: `New accounts must wait 24 hours before first withdrawal. ${hoursRemaining} hours remaining.`,
        resetAt,
      };
    }

    return { allowed: true };
  }

  /**
   * Check tip velocity (max 10 tips per minute)
   */
  private async checkTipVelocity(userId: string): Promise<VelocityCheckResult> {
    const tipCount = parseInt((await redis.get(this.KEYS.TIP_COUNT(userId))) || '0');

    if (tipCount >= this.LIMITS.TIPS_PER_MINUTE) {
      const ttl = await redis.ttl(this.KEYS.TIP_COUNT(userId));
      return {
        allowed: false,
        reason: `Maximum ${this.LIMITS.TIPS_PER_MINUTE} tips per minute exceeded. Please wait ${ttl} seconds.`,
        currentCount: tipCount,
        limit: this.LIMITS.TIPS_PER_MINUTE,
        resetAt: new Date(Date.now() + ttl * 1000),
      };
    }

    return { allowed: true };
  }

  /**
   * Check transaction velocity (max 50 transactions per hour)
   */
  private async checkTransactionVelocity(userId: string): Promise<VelocityCheckResult> {
    const txCount = parseInt((await redis.get(this.KEYS.TX_COUNT_1HOUR(userId))) || '0');

    if (txCount >= this.LIMITS.TRANSACTIONS_PER_HOUR) {
      const ttl = await redis.ttl(this.KEYS.TX_COUNT_1HOUR(userId));
      const minutesRemaining = Math.ceil(ttl / 60);

      return {
        allowed: false,
        reason: `Maximum ${this.LIMITS.TRANSACTIONS_PER_HOUR} transactions per hour exceeded. Please wait ${minutesRemaining} minutes.`,
        currentCount: txCount,
        limit: this.LIMITS.TRANSACTIONS_PER_HOUR,
        resetAt: new Date(Date.now() + ttl * 1000),
      };
    }

    return { allowed: true };
  }

  /**
   * Check 24-hour amount limit (KYC-dependent)
   */
  private async checkAmountLimit(userId: string, amountKr: number): Promise<VelocityCheckResult> {
    // Get user's KYC status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kyc_status: true },
    });

    if (!user) {
      return {
        allowed: false,
        reason: 'User not found',
      };
    }

    // Determine limit based on KYC status
    const isKYCApproved = user.kyc_status === 'APPROVED';
    const limit = isKYCApproved
      ? this.LIMITS.AMOUNT_24H_KYC
      : this.LIMITS.AMOUNT_24H_NON_KYC;

    // Get current 24-hour amount
    const currentAmount = parseFloat((await redis.get(this.KEYS.AMOUNT_24H(userId))) || '0');
    const newTotal = currentAmount + amountKr;

    if (newTotal > limit) {
      const ttl = await redis.ttl(this.KEYS.AMOUNT_24H(userId));
      const hoursRemaining = Math.ceil(ttl / 3600);

      return {
        allowed: false,
        reason: isKYCApproved
          ? `Maximum ${limit.toLocaleString()} Kr per 24 hours exceeded. ${hoursRemaining} hours until reset.`
          : `Maximum ${limit.toLocaleString()} Kr per 24 hours for non-KYC users exceeded. Complete KYC verification to increase limit to ${this.LIMITS.AMOUNT_24H_KYC.toLocaleString()} Kr. ${hoursRemaining} hours until reset.`,
        currentAmount,
        limit,
        resetAt: new Date(Date.now() + ttl * 1000),
      };
    }

    return { allowed: true };
  }
}

export const velocityCheckerService = new VelocityCheckerService();
