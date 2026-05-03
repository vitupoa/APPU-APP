import { Router } from 'express';
import { ContentLockService } from './contentLock.service.js';
import { authenticate } from '../../middleware/auth.js';
import { setRLSContext } from '../../middleware/rls.js';
import {
  unlockRateLimiter,
  conversionRateLimiter,
  accessCheckRateLimiter,
  failedUnlockRateLimiter,
} from '../../middleware/rateLimiting.js';
import { FraudDetectionService } from '../../services/fraudDetection.service.js';
import { AuditLogService } from '../../services/auditLog.service.js';

const router = Router();

// Apply RLS context to all routes
router.use(authenticate, setRLSContext);

/**
 * POST /api/content-lock/unlock
 * Unlock content by paying the unlock amount
 */
router.post(
  '/unlock',
  unlockRateLimiter,
  failedUnlockRateLimiter,
  async (req, res, next) => {
    const userId = req.user!.id;
    const { contentId, contentType } = req.body;

    try {
      if (!contentId || !contentType) {
        return res.status(400).json({ error: 'contentId and contentType are required' });
      }

      if (!['SHORT', 'POST', 'LIVE'].includes(contentType)) {
        return res.status(400).json({ error: 'Invalid contentType' });
      }

      const user = await req.prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true },
      });

      // Get content details for fraud check
      let content: any;
      switch (contentType) {
        case 'SHORT':
          content = await req.prisma.short.findUnique({
            where: { id: contentId },
            select: { unlockAmountKr: true },
          });
          break;
        case 'POST':
          content = await req.prisma.post.findUnique({
            where: { id: contentId },
            select: { unlockAmountKr: true },
          });
          break;
        case 'LIVE':
          content = await req.prisma.liveStream.findUnique({
            where: { id: contentId },
            select: { unlockAmountKr: true },
          });
          break;
      }

      const amountKr = content?.unlockAmountKr ? Number(content.unlockAmountKr) : 0;

      // Fraud detection check
      const fraudCheck = await FraudDetectionService.comprehensiveFraudCheck(
        userId,
        'unlock',
        { contentId, contentType, amountKr }
      );

      if (fraudCheck.shouldBlock) {
        await AuditLogService.logFraudDetection(req, {
          userId,
          operationType: 'unlock',
          riskScore: fraudCheck.riskScore,
          reasons: fraudCheck.reasons,
          blocked: true,
        });

        return res.status(403).json({
          error: 'Operation blocked',
          message: 'Suspicious activity detected. Please contact support.',
          reasons: fraudCheck.reasons,
        });
      }

      // Proceed with unlock
      const result = await ContentLockService.unlockContent(
        userId,
        contentId,
        contentType as any,
        user?.currency || 'USD'
      );

      // Log successful unlock
      await AuditLogService.logUnlock(req, {
        userId,
        contentId,
        contentType,
        amountKr: result.unlockAmountKr,
        success: true,
        fraudCheckResult: fraudCheck,
      });

      res.json(result);
    } catch (error: any) {
      // Log failed unlock
      await AuditLogService.logUnlock(req, {
        userId,
        contentId,
        contentType,
        amountKr: 0,
        success: false,
        error: error.message,
      });

      next(error);
    }
  }
);

/**
 * GET /api/content-lock/price
 * Get unlock price in user's currency
 */
router.get('/price', conversionRateLimiter, async (req, res, next) => {
  try {
    const { unlockAmountKr, currency } = req.query;

    if (!unlockAmountKr) {
      return res.status(400).json({ error: 'unlockAmountKr is required' });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { currency: true }
    });

    const userCurrency = (currency as string) || user?.currency || 'USD';
    const price = await ContentLockService.getUnlockPrice(
      Number(unlockAmountKr),
      userCurrency
    );

    res.json(price);
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/content-lock/convert-fiat
 * Convert fiat amount to Kr for creator
 */
router.post('/convert-fiat', conversionRateLimiter, async (req, res, next) => {
  try {
    const { fiatAmount, currency } = req.body;

    if (!fiatAmount) {
      return res.status(400).json({ error: 'fiatAmount is required' });
    }

    const user = await req.prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { currency: true }
    });

    const creatorCurrency = currency || user?.currency || 'USD';
    const krAmount = await ContentLockService.convertFiatToKr(
      Number(fiatAmount),
      creatorCurrency
    );

    res.json({ krAmount, fiatAmount: Number(fiatAmount), currency: creatorCurrency });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/content-lock/check-access
 * Check if user has access to locked content
 */
router.get('/check-access', accessCheckRateLimiter, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { contentId, contentType } = req.query;

    if (!contentId || !contentType) {
      return res.status(400).json({ error: 'contentId and contentType are required' });
    }

    let content: any;
    let creatorId: string;
    let isLocked: boolean;
    let requiredTier: string | undefined;
    let unlockAmountKr: number | undefined;

    switch (contentType) {
      case 'SHORT':
        content = await req.prisma.short.findUnique({
          where: { id: contentId as string },
          select: { userId: true, isLocked: true, requiredTier: true, unlockAmountKr: true }
        });
        creatorId = content?.userId;
        isLocked = content?.isLocked;
        requiredTier = content?.requiredTier;
        unlockAmountKr = content?.unlockAmountKr ? Number(content.unlockAmountKr) : undefined;
        break;
      case 'POST':
        content = await req.prisma.post.findUnique({
          where: { id: contentId as string },
          select: { userId: true, isLocked: true, requiredTier: true, unlockAmountKr: true }
        });
        creatorId = content?.userId;
        isLocked = content?.isLocked;
        requiredTier = content?.requiredTier;
        unlockAmountKr = content?.unlockAmountKr ? Number(content.unlockAmountKr) : undefined;
        break;
      case 'LIVE':
        content = await req.prisma.liveStream.findUnique({
          where: { id: contentId as string },
          select: { hostId: true, unlockAmountKr: true }
        });
        creatorId = content?.hostId;
        isLocked = !!content?.unlockAmountKr;
        unlockAmountKr = content?.unlockAmountKr ? Number(content.unlockAmountKr) : undefined;
        break;
      default:
        return res.status(400).json({ error: 'Invalid contentType' });
    }

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const access = await ContentLockService.checkAccess(
      userId,
      contentId as string,
      contentType as any,
      creatorId,
      isLocked,
      requiredTier,
      unlockAmountKr
    );

    // Log access check
    await AuditLogService.logAccessCheck(req, {
      userId,
      contentId: contentId as string,
      contentType: contentType as string,
      hasAccess: access.hasAccess,
      accessReason: access.reason,
    });

    res.json(access);
  } catch (error: any) {
    next(error);
  }
});

export default router;
