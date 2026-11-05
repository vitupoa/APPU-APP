import { Request, Response, NextFunction } from 'express';
import { deviceFingerprintService } from '../services/compliance/deviceFingerprint.service.js';
import { riskScoringService } from '../services/compliance/riskScoring.service.js';

/**
 * Middleware to automatically track device fingerprints for authenticated users
 */
export async function trackDeviceFingerprint(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (userId) {
      // Track device in background (don't block request)
      deviceFingerprintService.trackDevice(userId, req).catch(error => {
        console.error('Error tracking device fingerprint:', error);
      });
    }

    next();
  } catch (error) {
    // Don't block request on fingerprint errors
    console.error('Device fingerprint middleware error:', error);
    next();
  }
}

/**
 * Middleware to check user risk level before sensitive operations
 */
export async function checkRiskLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const riskProfile = await riskScoringService.getUserRiskProfile(userId);

    if (!riskProfile) {
      // No risk profile yet, allow but calculate in background
      riskScoringService.calculateUserRiskScore(userId).catch(error => {
        console.error('Error calculating risk score:', error);
      });
      return next();
    }

    // Block critical risk users
    if (riskProfile.risk_level === 'CRITICAL') {
      return res.status(403).json({
        error: 'Account restricted due to high risk score',
        risk_level: 'CRITICAL',
        requires_manual_review: true
      });
    }

    // Attach risk profile to request for downstream use
    (req as any).riskProfile = riskProfile;

    return next();
  } catch (error) {
    console.error('Risk check middleware error:', error);
    // Don't block on errors, but log them
    return next();
  }
}

/**
 * Middleware to validate withdrawal requests
 */
export async function validateWithdrawal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const riskProfile = await riskScoringService.getUserRiskProfile(userId);

    if (riskProfile?.withdrawal_blocked) {
      return res.status(403).json({
        error: 'Withdrawals are blocked due to compliance concerns',
        risk_level: riskProfile.risk_level,
        requires_manual_review: true,
        contact_support: true
      });
    }

    return next();
  } catch (error) {
    console.error('Withdrawal validation error:', error);
    return res.status(500).json({ error: 'Error validating withdrawal request' });
  }
}

/**
 * Middleware to enforce transaction limits based on risk level
 */
export async function enforceTransactionLimits(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    const amount = req.body.amount_kr || req.body.amount;

    if (!userId || !amount) {
      return next();
    }

    const riskProfile = await riskScoringService.getUserRiskProfile(userId);

    if (riskProfile?.transaction_limited) {
      const limit = 10000; // Rc limit for high-risk users

      if (amount > limit) {
        return res.status(403).json({
          error: `Transaction amount exceeds limit for your risk level`,
          limit,
          risk_level: riskProfile.risk_level,
          message: 'Complete KYC verification to increase limits'
        });
      }
    }

    return next();
  } catch (error) {
    console.error('Transaction limit enforcement error:', error);
    // Don't block on errors
    return next();
  }
}
