import { prisma } from '../config/database.js';
import { Prisma } from '../generated/prisma/client.js';

interface FraudCheckResult {
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number; // 0-100
  shouldBlock: boolean;
}

export class FraudDetectionService {
  /**
   * Check for suspicious unlock patterns
   */
  static async checkUnlockFraud(
    userId: string,
    contentId: string,
    contentType: string,
    amountKr: number
  ): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check 1: Rapid unlock attempts (velocity check)
    const recentUnlocks = await prisma.contentUnlock.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 60000) }, // Last minute
      },
    });

    if (recentUnlocks >= 10) {
      reasons.push('Excessive unlock velocity (10+ in 1 minute)');
      riskScore += 40;
    } else if (recentUnlocks >= 5) {
      reasons.push('High unlock velocity (5+ in 1 minute)');
      riskScore += 20;
    }

    // Check 2: Duplicate unlock attempt
    const existingUnlock = await prisma.contentUnlock.findFirst({
      where: { userId, contentId, contentType },
    });

    if (existingUnlock) {
      reasons.push('Duplicate unlock attempt');
      riskScore += 50;
    }

    // Check 3: Unusual amount pattern
    const userUnlocks = await prisma.contentUnlock.findMany({
      where: { userId },
      select: { amountKr: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    if (userUnlocks.length > 0) {
      const avgAmount =
        userUnlocks.reduce((sum, u) => sum + Number(u.amountKr), 0) /
        userUnlocks.length;
      if (amountKr > avgAmount * 5) {
        reasons.push('Unusual unlock amount (5x average)');
        riskScore += 15;
      }
    }

    // Check 4: New account with high activity
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (user) {
      const accountAge = Date.now() - user.createdAt.getTime();
      const isNewAccount = accountAge < 24 * 60 * 60 * 1000; // Less than 24 hours

      if (isNewAccount && recentUnlocks >= 3) {
        reasons.push('New account with high unlock activity');
        riskScore += 25;
      }
    }

    // Check 5: Failed transaction history
    const failedTransactions = await prisma.transaction.count({
      where: {
        userId,
        type: 'content_unlock_paid',
        status: 'failed',
        createdAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
      },
    });

    if (failedTransactions >= 5) {
      reasons.push('Multiple failed unlock attempts (5+ in 1 hour)');
      riskScore += 30;
    }

    // Check 6: Suspicious refund patterns
    const recentRefunds = await prisma.transaction.count({
      where: {
        userId,
        type: 'refund',
        createdAt: { gte: new Date(Date.now() - 86400000) }, // Last 24 hours
      },
    });

    if (recentRefunds >= 3) {
      reasons.push('High refund activity (3+ in 24 hours)');
      riskScore += 35;
    }

    const shouldBlock = riskScore >= 70;

    return {
      isSuspicious: riskScore >= 40,
      reasons,
      riskScore,
      shouldBlock,
    };
  }

  /**
   * Check for suspicious subscription patterns
   */
  static async checkSubscriptionFraud(
    subscriberId: string,
    creatorId: string,
    tierType: string,
    amountKr: number
  ): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check 1: Self-subscription attempt
    if (subscriberId === creatorId) {
      reasons.push('Self-subscription attempt');
      riskScore += 100;
      return { isSuspicious: true, reasons, riskScore, shouldBlock: true };
    }

    // Check 2: Rapid subscribe-unsubscribe pattern
    const recentCancellations = await prisma.subscription.count({
      where: {
        subscriberId,
        creatorId,
        status: 'cancelled',
        cancelledAt: { gte: new Date(Date.now() - 86400000) }, // Last 24 hours
      },
    });

    if (recentCancellations >= 3) {
      reasons.push('Rapid subscribe-unsubscribe pattern (3+ in 24 hours)');
      riskScore += 50;
    }

    // Check 3: Multiple subscription attempts in short time
    const recentSubscriptions = await prisma.subscription.count({
      where: {
        subscriberId,
        startedAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
      },
    });

    if (recentSubscriptions >= 5) {
      reasons.push('Excessive subscription velocity (5+ in 1 hour)');
      riskScore += 40;
    }

    // Check 4: Failed subscription attempts
    const failedAttempts = await prisma.transaction.count({
      where: {
        userId: subscriberId,
        type: 'subscription_paid',
        status: 'failed',
        createdAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
      },
    });

    if (failedAttempts >= 5) {
      reasons.push('Multiple failed subscription attempts (5+ in 1 hour)');
      riskScore += 35;
    }

    // Check 5: New account subscribing to multiple creators rapidly
    const user = await prisma.user.findUnique({
      where: { id: subscriberId },
      select: { createdAt: true },
    });

    if (user) {
      const accountAge = Date.now() - user.createdAt.getTime();
      const isNewAccount = accountAge < 24 * 60 * 60 * 1000;

      if (isNewAccount && recentSubscriptions >= 3) {
        reasons.push('New account with high subscription activity');
        riskScore += 30;
      }
    }

    // Check 6: Unusual subscription amount
    const userSubscriptions = await prisma.subscription.findMany({
      where: { subscriberId },
      select: { krAmount: true },
      take: 10,
      orderBy: { startedAt: 'desc' },
    });

    if (userSubscriptions.length > 0) {
      const avgAmount =
        userSubscriptions.reduce((sum, s) => sum + Number(s.krAmount), 0) /
        userSubscriptions.length;
      if (amountKr > avgAmount * 5) {
        reasons.push('Unusual subscription amount (5x average)');
        riskScore += 20;
      }
    }

    const shouldBlock = riskScore >= 70;

    return {
      isSuspicious: riskScore >= 40,
      reasons,
      riskScore,
      shouldBlock,
    };
  }

  /**
   * Log suspicious activity for review
   */
  static async logSuspiciousActivity(
    userId: string,
    activityType: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: any
  ): Promise<void> {
    await prisma.suspiciousActivity.create({
      data: {
        userId,
        activityType,
        description,
        severity,
        metadata: metadata || {},
        isResolved: false,
      },
    });

    // If critical, also create an alert
    if (severity === 'critical') {
      await this.createSecurityAlert(userId, activityType, description);
    }
  }

  /**
   * Create security alert for admin review
   */
  private static async createSecurityAlert(
    userId: string,
    type: string,
    description: string
  ): Promise<void> {
    // TODO: Implement alert system (email, Slack, etc.)
    console.error(`[SECURITY ALERT] User ${userId} - ${type}: ${description}`);
  }

  /**
   * Check if user should be blocked from operations
   */
  static async shouldBlockUser(userId: string): Promise<boolean> {
    // Check for unresolved critical suspicious activities
    const criticalActivities = await prisma.suspiciousActivity.count({
      where: {
        userId,
        severity: 'critical',
        isResolved: false,
        createdAt: { gte: new Date(Date.now() - 86400000) }, // Last 24 hours
      },
    });

    if (criticalActivities > 0) {
      return true;
    }

    // Check for account suspension
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSuspended: true },
    });

    return user?.isSuspended || false;
  }

  /**
   * Analyze wallet activity for fraud patterns
   */
  static async checkWalletFraud(userId: string): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check 1: Rapid balance changes
    const recentTransactions = await prisma.transaction.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 3600000) }, // Last hour
      },
    });

    if (recentTransactions >= 50) {
      reasons.push('Excessive transaction velocity (50+ in 1 hour)');
      riskScore += 40;
    }

    // Check 2: Large withdrawal attempts
    const recentWithdrawals = await prisma.withdrawalRequest.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 86400000) }, // Last 24 hours
      },
      select: { amountKr: true, status: true },
    });

    const totalWithdrawalAmount = recentWithdrawals.reduce(
      (sum, w) => sum + Number(w.amountKr),
      0
    );

    if (totalWithdrawalAmount > 100000) {
      // 100,000 Kr
      reasons.push('Large withdrawal amount (>100,000 Kr in 24 hours)');
      riskScore += 35;
    }

    // Check 3: Failed withdrawal patterns
    const failedWithdrawals = recentWithdrawals.filter(
      (w) => w.status === 'FAILED'
    ).length;

    if (failedWithdrawals >= 5) {
      reasons.push('Multiple failed withdrawal attempts');
      riskScore += 30;
    }

    // Check 4: Unusual transaction patterns
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 86400000) },
      },
      select: { type: true, amountKr: true },
    });

    const typeCount: Record<string, number> = {};
    transactions.forEach((t) => {
      typeCount[t.type] = (typeCount[t.type] || 0) + 1;
    });

    // If one type dominates (>80% of transactions), it's suspicious
    const maxTypeCount = Math.max(...Object.values(typeCount));
    if (maxTypeCount > transactions.length * 0.8 && transactions.length > 10) {
      reasons.push('Unusual transaction pattern (single type dominance)');
      riskScore += 25;
    }

    const shouldBlock = riskScore >= 70;

    return {
      isSuspicious: riskScore >= 40,
      reasons,
      riskScore,
      shouldBlock,
    };
  }

  /**
   * Comprehensive fraud check combining all checks
   */
  static async comprehensiveFraudCheck(
    userId: string,
    operationType: 'unlock' | 'subscription' | 'wallet',
    metadata: any
  ): Promise<FraudCheckResult> {
    // Check if user is already blocked
    const isBlocked = await this.shouldBlockUser(userId);
    if (isBlocked) {
      return {
        isSuspicious: true,
        reasons: ['User account is blocked or suspended'],
        riskScore: 100,
        shouldBlock: true,
      };
    }

    // Perform operation-specific checks
    let result: FraudCheckResult;

    switch (operationType) {
      case 'unlock':
        result = await this.checkUnlockFraud(
          userId,
          metadata.contentId,
          metadata.contentType,
          metadata.amountKr
        );
        break;
      case 'subscription':
        result = await this.checkSubscriptionFraud(
          userId,
          metadata.creatorId,
          metadata.tierType,
          metadata.amountKr
        );
        break;
      case 'wallet':
        result = await this.checkWalletFraud(userId);
        break;
      default:
        result = {
          isSuspicious: false,
          reasons: [],
          riskScore: 0,
          shouldBlock: false,
        };
    }

    // Log if suspicious
    if (result.isSuspicious) {
      const severity =
        result.riskScore >= 70
          ? 'critical'
          : result.riskScore >= 50
          ? 'high'
          : result.riskScore >= 30
          ? 'medium'
          : 'low';

      await this.logSuspiciousActivity(
        userId,
        operationType,
        result.reasons.join('; '),
        severity,
        metadata
      );
    }

    return result;
  }
}
