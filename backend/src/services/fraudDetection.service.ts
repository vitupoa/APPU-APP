import { prisma } from '../config/database.js';
import crypto from 'crypto';

type Decimal = {
  toNumber(): number;
  toString(): string;
};

interface FraudCheckResult {
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
  shouldBlock: boolean;
}

export class FraudDetectionService {
  static async checkUnlockFraud(userId: string, contentId: string, contentType: string, amountKr: number): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check 1: Rapid unlock velocity
    const recentResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count FROM content_unlocks
      WHERE user_id = ${userId} AND created_at >= ${new Date(Date.now() - 60000)}
    `;
    const recentUnlocks = Number(recentResult[0]?.count ?? 0);

    if (recentUnlocks >= 10) { reasons.push('Excessive unlock velocity (10+ in 1 minute)'); riskScore += 40; }
    else if (recentUnlocks >= 5) { reasons.push('High unlock velocity (5+ in 1 minute)'); riskScore += 20; }

    // Check 2: Duplicate unlock
    const dupResult = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM content_unlocks
      WHERE user_id = ${userId} AND content_id = ${contentId} AND content_type = ${contentType} LIMIT 1
    `;
    if (dupResult.length > 0) { reasons.push('Duplicate unlock attempt'); riskScore += 50; }

    // Check 3: Unusual amount
    const prevUnlocks = await prisma.$queryRaw<{ amount_kr: string }[]>`
      SELECT amount_kr FROM content_unlocks WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT 10
    `;
    if (prevUnlocks.length > 0) {
      const avg = prevUnlocks.reduce((s: number, u: { amount_kr: string }) => s + Number(u.amount_kr), 0) / prevUnlocks.length;
      if (amountKr > avg * 5) { reasons.push('Unusual unlock amount (5x average)'); riskScore += 15; }
    }

    // Check 4: New account
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { created_at: true } });
    if (user && Date.now() - user.created_at.getTime() < 86400000 && recentUnlocks >= 3) {
      reasons.push('New account with high unlock activity'); riskScore += 25;
    }

    // Check 5: Failed transactions
    const failedTx = await prisma.transactions.count({
      where: { user_id: userId, type: 'content_unlock_paid', status: 'failed', created_at: { gte: new Date(Date.now() - 3600000) } },
    });
    if (failedTx >= 5) { reasons.push('Multiple failed unlock attempts (5+ in 1 hour)'); riskScore += 30; }

    // Check 6: Refund patterns
    const refunds = await prisma.transactions.count({
      where: { user_id: userId, type: 'refund', created_at: { gte: new Date(Date.now() - 86400000) } },
    });
    if (refunds >= 3) { reasons.push('High refund activity (3+ in 24 hours)'); riskScore += 35; }

    return { isSuspicious: riskScore >= 40, reasons, riskScore, shouldBlock: riskScore >= 70 };
  }

  static async checkSubscriptionFraud(subscriberId: string, creatorId: string, tierType: string, amountKr: number): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    if (subscriberId === creatorId) {
      return { isSuspicious: true, reasons: ['Self-subscription attempt'], riskScore: 100, shouldBlock: true };
    }

    const recentCancellations = await prisma.subscriptions.count({
      where: { subscriber_id: subscriberId, creator_id: creatorId, status: 'cancelled', cancelled_at: { gte: new Date(Date.now() - 86400000) } },
    });
    if (recentCancellations >= 3) { reasons.push('Rapid subscribe-unsubscribe pattern'); riskScore += 50; }

    const recentSubs = await prisma.subscriptions.count({
      where: { subscriber_id: subscriberId, started_at: { gte: new Date(Date.now() - 3600000) } },
    });
    if (recentSubs >= 5) { reasons.push('Excessive subscription velocity (5+ in 1 hour)'); riskScore += 40; }

    const failedAttempts = await prisma.transactions.count({
      where: { user_id: subscriberId, type: 'subscription_paid', status: 'failed', created_at: { gte: new Date(Date.now() - 3600000) } },
    });
    if (failedAttempts >= 5) { reasons.push('Multiple failed subscription attempts'); riskScore += 35; }

    const user = await prisma.user.findUnique({ where: { id: subscriberId }, select: { created_at: true } });
    if (user && Date.now() - user.created_at.getTime() < 86400000 && recentSubs >= 3) {
      reasons.push('New account with high subscription activity'); riskScore += 30;
    }

    const prevSubs = await prisma.subscriptions.findMany({ where: { subscriber_id: subscriberId }, select: { kr_amount: true }, take: 10, orderBy: { started_at: 'desc' } });
    if (prevSubs.length > 0) {
      const avg = prevSubs.reduce((s: number, sub: { kr_amount: Decimal }) => s + Number(sub.kr_amount), 0) / prevSubs.length;
      if (amountKr > avg * 5) { reasons.push('Unusual subscription amount (5x average)'); riskScore += 20; }
    }

    return { isSuspicious: riskScore >= 40, reasons, riskScore, shouldBlock: riskScore >= 70 };
  }

  static async logSuspiciousActivity(userId: string, activityType: string, description: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: any): Promise<void> {
    await prisma.suspicious_activities.create({ data: { user_id: userId, activity_type: activityType, description, severity, metadata: metadata || {}, resolved: false } });
    if (severity === 'critical') console.error(`[SECURITY ALERT] User ${userId} - ${activityType}: ${description}`);
  }

  static async shouldBlockUser(userId: string): Promise<boolean> {
    const critical = await prisma.suspicious_activities.count({
      where: { user_id: userId, severity: 'critical', resolved: false, created_at: { gte: new Date(Date.now() - 86400000) } },
    });
    return critical > 0;
  }

  static async checkWalletFraud(userId: string): Promise<FraudCheckResult> {
    const reasons: string[] = [];
    let riskScore = 0;

    const recentTx = await prisma.transactions.count({ where: { user_id: userId, created_at: { gte: new Date(Date.now() - 3600000) } } });
    if (recentTx >= 50) { reasons.push('Excessive transaction velocity (50+ in 1 hour)'); riskScore += 40; }

    const withdrawals = await prisma.withdrawal_requests.findMany({
      where: { user_id: userId, created_at: { gte: new Date(Date.now() - 86400000) } },
      select: { amount_kr: true, status: true },
    });
    const totalWithdrawal = withdrawals.reduce((s: number, w: { amount_kr: Decimal; status: string }) => s + Number(w.amount_kr), 0);
    if (totalWithdrawal > 100000) { reasons.push('Large withdrawal amount (>100,000 Kr in 24 hours)'); riskScore += 35; }
    if (withdrawals.filter((w: { status: string }) => w.status === 'FAILED').length >= 5) { reasons.push('Multiple failed withdrawal attempts'); riskScore += 30; }

    const txList = await prisma.transactions.findMany({ where: { user_id: userId, created_at: { gte: new Date(Date.now() - 86400000) } }, select: { type: true, amount_kr: true } });
    const typeCount: Record<string, number> = {};
    txList.forEach((t: { type: string }) => { typeCount[t.type] = (typeCount[t.type] || 0) + 1; });
    const maxCount = Math.max(...Object.values(typeCount));
    if (maxCount > txList.length * 0.8 && txList.length > 10) { reasons.push('Unusual transaction pattern'); riskScore += 25; }

    return { isSuspicious: riskScore >= 40, reasons, riskScore, shouldBlock: riskScore >= 70 };
  }

  static async comprehensiveFraudCheck(userId: string, operationType: 'unlock' | 'subscription' | 'wallet', metadata: any): Promise<FraudCheckResult> {
    if (await this.shouldBlockUser(userId)) {
      return { isSuspicious: true, reasons: ['User account is blocked or suspended'], riskScore: 100, shouldBlock: true };
    }

    let result: FraudCheckResult;
    switch (operationType) {
      case 'unlock': result = await this.checkUnlockFraud(userId, metadata.contentId, metadata.contentType, metadata.amountKr); break;
      case 'subscription': result = await this.checkSubscriptionFraud(userId, metadata.creatorId, metadata.tierType, metadata.amountKr); break;
      case 'wallet': result = await this.checkWalletFraud(userId); break;
      default: result = { isSuspicious: false, reasons: [], riskScore: 0, shouldBlock: false };
    }

    if (result.isSuspicious) {
      const severity = result.riskScore >= 70 ? 'critical' : result.riskScore >= 50 ? 'high' : result.riskScore >= 30 ? 'medium' : 'low';
      await this.logSuspiciousActivity(userId, operationType, result.reasons.join('; '), severity, metadata);
    }

    return result;
  }
}
