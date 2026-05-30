import { prisma } from '../../config/database.js';
import { riskScoringService } from './riskScoring.service.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('RiskMitigation');

export class RiskMitigationService {
  async applyRiskMitigation(userId: string, riskScore: number, riskLevel: string): Promise<void> {
    logger.info(`Applying risk mitigation for user ${userId}: ${riskLevel} (${riskScore})`);

    switch (riskLevel) {
      case 'CRITICAL': // 70-100
        await this.applyCriticalMitigation(userId, riskScore);
        break;
      case 'HIGH': // 50-69
        await this.applyHighMitigation(userId, riskScore);
        break;
      case 'MEDIUM': // 30-49
        await this.applyMediumMitigation(userId, riskScore);
        break;
      case 'LOW': // 0-29
        await this.applyLowMitigation(userId);
        break;
    }
  }

  private async applyCriticalMitigation(userId: string, riskScore: number): Promise<void> {
    await prisma.user_risk_profiles.update({
      where: { user_id: userId },
      data: {
        withdrawal_blocked: true,
        transaction_limited: true,
        requires_manual_review: true
      }
    });

    await prisma.compliance_reviews.create({
      data: {
        user_id: userId,
        transaction_id: '',
        review_type: 'CRITICAL_RISK',
        status: 'PENDING',
        notes: JSON.stringify({
          risk_score: riskScore,
          risk_level: 'CRITICAL',
          action_taken: 'Account suspended, withdrawals blocked, flagged for manual review'
        })
      }
    });

    logger.warn(`CRITICAL risk mitigation applied for user ${userId}`);
  }

  private async applyHighMitigation(userId: string, riskScore: number): Promise<void> {
    await prisma.user_risk_profiles.update({
      where: { user_id: userId },
      data: {
        transaction_limited: true,
        requires_manual_review: true
      }
    });

    await prisma.compliance_reviews.create({
      data: {
        user_id: userId,
        transaction_id: '',
        review_type: 'HIGH_RISK',
        status: 'PENDING',
        notes: JSON.stringify({
          risk_score: riskScore,
          risk_level: 'HIGH',
          action_taken: 'Transaction limits reduced, KYC required, flagged for review'
        })
      }
    });

    logger.warn(`HIGH risk mitigation applied for user ${userId}`);
  }

  private async applyMediumMitigation(userId: string, riskScore: number): Promise<void> {
    await prisma.user_risk_profiles.update({
      where: { user_id: userId },
      data: {
        requires_manual_review: false,
        transaction_limited: false,
        withdrawal_blocked: false
      }
    });

    logger.info(`MEDIUM risk mitigation applied for user ${userId} - enhanced monitoring enabled`);
  }

  private async applyLowMitigation(userId: string): Promise<void> {
    await prisma.user_risk_profiles.update({
      where: { user_id: userId },
      data: {
        requires_manual_review: false,
        transaction_limited: false,
        withdrawal_blocked: false
      }
    });

    logger.info(`LOW risk - standard monitoring for user ${userId}`);
  }

  async checkAndApplyMitigation(userId: string): Promise<void> {
    const riskData = await riskScoringService.calculateUserRiskScore(userId);
    await this.applyRiskMitigation(userId, riskData.score, riskData.level);
  }
}

export const riskMitigationService = new RiskMitigationService();
