import { Request, Response, NextFunction } from 'express';
import { riskScoringService } from '../services/compliance/riskScoring.service.js';
import { riskMitigationService } from '../services/compliance/riskMitigation.service.js';
import { selfTippingDetectionService } from '../services/compliance/selfTippingDetection.service.js';
import { velocityCheckerService } from '../services/compliance/velocityChecker.service.js';
import { transactionContextService } from '../services/compliance/transactionContext.service.js';

export async function integratedComplianceCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const { type, amount_kr, context_type, context_ref_id, context_desc, counterparty_id } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Step 1: Validate transaction context
    if (type && type !== 'topup' && type !== 'withdrawal') {
      const contextValidation = await transactionContextService.validateContext({
        transaction_type: type,
        context_type,
        context_ref_id,
        context_desc
      });

      if (!contextValidation.isValid) {
        return res.status(400).json({
          error: 'Invalid transaction context',
          details: contextValidation.errors
        });
      }
    }

    // Step 2: Check velocity limits
    if (amount_kr) {
      const velocityCheck = await velocityCheckerService.checkVelocity(userId, type, amount_kr);

      if (!velocityCheck.allowed) {
        return res.status(429).json({
          error: 'Transaction velocity limit exceeded',
          reason: velocityCheck.reason,
          retryAfter: velocityCheck.retryAfter
        });
      }
    }

    // Step 3: Detect self-tipping patterns (for tip transactions)
    if (type === 'tip_sent' || type === 'CONTENT_TIP') {
      if (counterparty_id) {
        const selfTippingScore = await selfTippingDetectionService.detectSelfTipping(userId, counterparty_id);

        if (selfTippingScore.score > 70) {
          return res.status(403).json({
            error: 'Suspicious tipping pattern detected',
            message: 'Your account has been flagged for review',
            score: selfTippingScore.score
          });
        }
      }
    }

    // Step 4: Calculate and update risk score
    const riskData = await riskScoringService.calculateUserRiskScore(userId);

    // Step 5: Apply risk mitigation
    await riskMitigationService.applyRiskMitigation(userId, riskData.riskScore, riskData.riskLevel);

    // Step 6: Check if user is blocked
    const riskProfile = await riskScoringService.getUserRiskProfile(userId);

    if (riskProfile?.withdrawal_blocked && (type === 'withdrawal' || type === 'WITHDRAWAL')) {
      return res.status(403).json({
        error: 'Withdrawals blocked due to compliance concerns',
        risk_level: riskProfile.risk_level,
        message: 'Please contact support for assistance'
      });
    }

    if (riskProfile?.transaction_limited && amount_kr && amount_kr > 10000) {
      return res.status(403).json({
        error: 'Transaction amount exceeds limit for your risk level',
        limit: 10000,
        risk_level: riskProfile.risk_level,
        message: 'Complete KYC verification to increase limits'
      });
    }

    // Step 7: Record transaction for velocity tracking
    if (amount_kr) {
      await velocityCheckerService.recordTransaction(userId, type, amount_kr);
    }

    // All checks passed
    next();
  } catch (error: any) {
    console.error('Integrated compliance check error:', error);
    return res.status(500).json({
      error: 'Compliance check failed',
      message: error.message
    });
  }
}
