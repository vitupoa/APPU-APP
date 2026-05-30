import { Request, Response, NextFunction } from 'express';
import { riskScoringService } from '../services/compliance/riskScoring.service.js';
import { riskMitigationService } from '../services/compliance/riskMitigation.service.js';
import { selfTippingDetectionService } from '../services/compliance/selfTippingDetection.service.js';
import { velocityCheckerService } from '../services/compliance/velocityChecker.service.js';
import { transactionContextService } from '../services/compliance/transactionContext.service.js';
import { VelocityCheckResult, RiskAnalysisResult } from '../types/compliance.types.js';

export async function integratedComplianceCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    const { type, amount_kr, context_ref_id, context_desc, counterparty_id } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Step 1: Validate transaction context
    if (type && type !== 'topup' && type !== 'withdrawal') {
      const contextValidation = await transactionContextService.validateContext({
        type: type,
        reference_id: context_ref_id,
        description: context_desc
      });

      if (!contextValidation.valid) {
        res.status(400).json({
          error: 'Invalid transaction context',
          details: contextValidation.errors
        });
        return;
      }
    }

    // Step 2: Check velocity limits
    if (amount_kr) {
      const velocityCheck: VelocityCheckResult = await velocityCheckerService.checkVelocity(userId, type, amount_kr);

      if (!velocityCheck.allowed) {
        res.status(429).json({
          error: 'Transaction velocity limit exceeded',
          reason: velocityCheck.reason,
          retryAfter: velocityCheck.waitTimeSeconds || 0
        });
        return;
      }
    }

    // Step 3: Detect self-tipping patterns (for tip transactions)
    if (type === 'tip_sent' || type === 'CONTENT_TIP') {
      if (counterparty_id) {
        const selfTippingResult = await selfTippingDetectionService.detectSelfTipping(userId, counterparty_id);

        if (selfTippingResult.score > 70) {
          res.status(403).json({
            error: 'Suspicious tipping pattern detected',
            message: 'Your account has been flagged for review',
            score: selfTippingResult.score
          });
          return;
        }
      }
    }

    // Step 4: Calculate and update risk score
    const riskData = await riskScoringService.calculateUserRiskScore(userId);

    // Step 5: Apply risk mitigation
    await riskMitigationService.applyRiskMitigation(userId, riskData.score, riskData.level);

    // Step 6: Check if user is blocked
    const riskProfile = await riskScoringService.getUserRiskProfile(userId);

    if (riskProfile?.withdrawal_blocked && (type === 'withdrawal' || type === 'WITHDRAWAL')) {
      res.status(403).json({
        error: 'Withdrawals blocked due to compliance concerns',
        risk_level: riskProfile.risk_level,
        message: 'Please contact support for assistance'
      });
      return;
    }

    if (riskProfile?.transaction_limited && amount_kr && amount_kr > 10000) {
      res.status(403).json({
        error: 'Transaction amount exceeds limit for your risk level',
        limit: 10000,
        risk_level: riskProfile.risk_level,
        message: 'Complete KYC verification to increase limits'
      });
      return;
    }

    // Step 7: Record transaction for velocity tracking
    if (amount_kr) {
      await velocityCheckerService.recordTransaction(userId, type, amount_kr);
    }

    // All checks passed
    next();
  } catch (error: any) {
    console.error('Integrated compliance check error:', error);
    res.status(500).json({
      error: 'Compliance check failed',
      message: error.message
    });
  }
}
