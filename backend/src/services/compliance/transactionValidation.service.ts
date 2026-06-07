import { prisma } from '../../config/database.js';
import { riskScoringService } from './riskScoring.service.js';
import { Logger } from '../../utils/logger.js';
import crypto from 'crypto';

const logger = new Logger('TransactionValidation');

export class TransactionValidationService {
  /**
   * Validate transaction before processing
   */
  async validateTransaction(data: {
    user_id: string;
    type: string;
    amount_kr: number;
    counterparty_id?: string;
    context_type?: string;
    context_ref_id?: string;
    context_desc?: string;
  }): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    riskScore: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate transaction context (MANDATORY)
    if (!data.context_type) {
      errors.push('Transaction context type is required');
    }

    if (!data.context_desc) {
      errors.push('Transaction description is required');
    }

    // 2. Validate transaction type
    const validTypes = [
      'CONTENT_TIP',
      'LOCKED_CHAT_TASK',
      'SUBSCRIPTION',
      'CONTENT_UNLOCK',
      'CONTEST_ENTRY',
      'CONTEST_VOTE',
      'CONTEST_PRIZE',
      'CHAMA_CONTRIBUTION',
      'CHAMA_PAYOUT',
      'PLATFORM_REWARD',
      'WITHDRAWAL',
      'TOP_UP',
      'SHOP_LISTING_FEE'
    ];

    if (!validTypes.includes(data.type)) {
      errors.push(`Invalid transaction type: ${data.type}`);
    }

    // 3. Block wallet transfers and chat tips (COMPLIANCE)
    if (data.type === 'WALLET_TRANSFER') {
      errors.push('Direct wallet transfers are not allowed for compliance');
    }

    if (data.type === 'CHAT_TIP') {
      errors.push('Direct chat tips are not allowed for compliance');
    }

    // 4. Validate amount
    if (data.amount_kr <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (data.amount_kr > 1000000) {
      warnings.push('Large transaction amount');
    }

    // 5. Check user risk profile
    const riskProfile = await riskScoringService.getUserRiskProfile(data.user_id);
    let riskScore = riskProfile?.risk_score || 0;

    if (riskProfile) {
      if (riskProfile.withdrawal_blocked && data.type === 'WITHDRAWAL') {
        errors.push('Withdrawals are blocked due to high risk score');
      }

      if (riskProfile.transaction_limited && data.amount_kr > 10000) {
        errors.push('Transaction amount exceeds limit for your risk level');
      }

      if (riskProfile.requires_manual_review) {
        warnings.push('Transaction requires manual review');
      }
    }

    // 6. Check velocity limits
    const velocityCheck = await this.checkVelocityLimits(data.user_id, data.type);
    if (!velocityCheck.allowed) {
      errors.push(velocityCheck.reason!);
    }

    // 7. Check balance (for outgoing transactions)
    if (['CONTENT_TIP', 'LOCKED_CHAT_TASK', 'SUBSCRIPTION', 'WITHDRAWAL'].includes(data.type)) {
      const wallet = await prisma.wallets.findUnique({
        where: { user_id: data.user_id }
      });

      if (!wallet || Number(wallet.kr_balance) < data.amount_kr) {
        errors.push('Insufficient balance');
      }
    }

    // 8. Context-specific validation
    const contextValidation = await this.validateContext(data);
    errors.push(...contextValidation.errors);
    warnings.push(...contextValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskScore
    };
  }

  /**
   * Check velocity limits
   */
  private async checkVelocityLimits(userId: string, type: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Tips: Max 10 per minute
    if (type === 'CONTENT_TIP') {
      const recentTips = await prisma.transactions.count({
        where: {
          user_id: userId,
          type: 'CONTENT_TIP',
          created_at: { gte: oneMinuteAgo }
        }
      });

      if (recentTips >= 10) {
        return {
          allowed: false,
          reason: 'Rate limit exceeded: Maximum 10 tips per minute'
        };
      }
    }

    // All transactions: Max 50 per hour
    const recentTransactions = await prisma.transactions.count({
      where: {
        user_id: userId,
        created_at: { gte: oneHourAgo }
      }
    });

    if (recentTransactions >= 50) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded: Maximum 50 transactions per hour'
      };
    }

    return { allowed: true };
  }

  /**
   * Validate transaction context
   */
  private async validateContext(data: {
    type: string;
    context_type?: string;
    context_ref_id?: string;
    counterparty_id?: string;
  }): Promise<{
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (data.type) {
      case 'CONTENT_TIP':
        if (!data.context_ref_id) {
          errors.push('Content ID is required for content tips');
        }
        if (!data.counterparty_id) {
          errors.push('Creator ID is required for content tips');
        }
        break;

      case 'LOCKED_CHAT_TASK':
        if (!data.context_ref_id) {
          errors.push('Task ID is required for locked chat tasks');
        }
        if (!data.counterparty_id) {
          errors.push('Creator ID is required for locked chat tasks');
        }
        break;

      case 'SUBSCRIPTION':
        if (!data.counterparty_id) {
          errors.push('Creator ID is required for subscriptions');
        }
        break;

      case 'CONTEST_ENTRY':
      case 'CONTEST_VOTE':
        if (!data.context_ref_id) {
          errors.push('Contest ID is required');
        }
        break;

      case 'CHAMA_CONTRIBUTION':
      case 'CHAMA_PAYOUT':
        if (!data.context_ref_id) {
          errors.push('Chama ID is required');
        }
        break;
    }

    return { errors, warnings };
  }

  /**
   * Flag suspicious transaction
   */
  async flagTransaction(
    transactionId: string,
    userId: string,
    flagType: string,
    reason: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    riskScore: number = 0
  ): Promise<void> {
    await prisma.flagged_transactions.create({ data: {
        transaction_id: transactionId,
        user_id: userId,
        flag_type: flagType,
        flag_reason: reason,
        severity: severity,
        risk_score: riskScore,
        status: 'PENDING'
      }} as any));

    // Also log as suspicious activity
    await prisma.suspicious_activity_logs.create({ data: {
        user_id: userId,
        activityType: flagType,
        description: reason,
        severity: severity,
        metadata: { transaction_id: transactionId }} as any)
    });

    logger.warn(`Transaction flagged: ${transactionId} - ${reason}`);
  }
}

export const transactionValidationService = new TransactionValidationService();
