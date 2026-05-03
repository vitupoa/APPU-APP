import { Router } from 'express';
import { SubscriptionService } from './subscription.service.js';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { setRLSContext } from '../../middleware/rls.js';
import { subscriptionRateLimiter } from '../../middleware/rateLimiting.js';
import { FraudDetectionService } from '../../services/fraudDetection.service.js';
import { AuditLogService } from '../../services/auditLog.service.js';
import { prisma } from '../../config/database.js';

const router = Router();

// Apply RLS context to all routes
router.use(authMiddleware, setRLSContext);

/**
 * GET /api/subscriptions/tiers/:creatorId
 * Get available subscription tiers for a creator
 */
router.get('/tiers/:creatorId', async (req: AuthRequest, res, next) => {
  try {
    const creatorId = req.params['creatorId'] as string;
    const tiers = await SubscriptionService.getAvailableTiers(creatorId);
    res.json(tiers);
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/subscriptions/my-tiers
 * Get creator's own subscription tiers
 */
router.get('/my-tiers', async (req: AuthRequest, res, next) => {
  try {
    const creatorId = req.userId!;
    const tiers = await SubscriptionService.getCreatorTiers(creatorId);
    res.json(tiers);
  } catch (error: any) {
    next(error);
  }
});

/**
 * PUT /api/subscriptions/tiers
 * Update creator's subscription tiers
 */
router.put('/tiers', subscriptionRateLimiter, async (req: AuthRequest, res, next) => {
  try {
    const creatorId = req.userId!;
    const { tiers } = req.body;
    if (!Array.isArray(tiers)) return res.status(400).json({ error: 'tiers must be an array' });
    const result = await SubscriptionService.updateTiers(creatorId, tiers);
    await AuditLogService.logAdminAction(req, { adminId: creatorId, action: 'UPDATE_SUBSCRIPTION_TIERS', targetType: 'SUBSCRIPTION_TIER', targetId: creatorId, details: { tiers } });
    return res.json(result);
  } catch (error: any) { return next(error); }
});

/**
 * POST /api/subscriptions/subscribe
 * Subscribe to a creator
 */
router.post('/subscribe', subscriptionRateLimiter, async (req: AuthRequest, res, next) => {
  const subscriberId = req.userId!;
  const { creatorId, tierType } = req.body;
  try {
    if (!creatorId || !tierType) return res.status(400).json({ error: 'creatorId and tierType are required' });
    const tier = await prisma.subscriptionTier.findUnique({ where: { creatorId_tier: { creatorId, tier: tierType } }, select: { krAmount: true } });
    if (!tier) return res.status(404).json({ error: 'Subscription tier not found' });
    const amountKr = Number(tier.krAmount);
    const fraudCheck = await FraudDetectionService.comprehensiveFraudCheck(subscriberId, 'subscription', { creatorId, tierType, amountKr });
    if (fraudCheck.shouldBlock) {
      await AuditLogService.logFraudDetection(req, { userId: subscriberId, operationType: 'subscription', riskScore: fraudCheck.riskScore, reasons: fraudCheck.reasons, blocked: true });
      return res.status(403).json({ error: 'Operation blocked', message: 'Suspicious activity detected.', reasons: fraudCheck.reasons });
    }
    const subscription = await SubscriptionService.subscribe(subscriberId, creatorId, tierType);
    await AuditLogService.logSubscription(req, { subscriberId, creatorId, tierType, amountKr, operation: 'SUBSCRIBE', success: true, fraudCheckResult: fraudCheck });
    return res.json(subscription);
  } catch (error: any) {
    await AuditLogService.logSubscription(req, { subscriberId, creatorId, tierType, amountKr: 0, operation: 'SUBSCRIBE', success: false, error: error.message });
    return next(error);
  }
});

/**
 * POST /api/subscriptions/unsubscribe
 * Unsubscribe from a creator
 */
router.post('/unsubscribe', subscriptionRateLimiter, async (req: AuthRequest, res, next) => {
  const subscriberId = req.userId!;
  const { creatorId } = req.body;
  try {
    if (!creatorId) return res.status(400).json({ error: 'creatorId is required' });
    const result = await SubscriptionService.unsubscribe(subscriberId, creatorId);
    await AuditLogService.logSubscription(req, { subscriberId, creatorId, tierType: 'N/A', amountKr: 0, operation: 'UNSUBSCRIBE', success: true });
    return res.json(result);
  } catch (error: any) {
    await AuditLogService.logSubscription(req, { subscriberId, creatorId, tierType: 'N/A', amountKr: 0, operation: 'UNSUBSCRIBE', success: false, error: error.message });
    return next(error);
  }
});

/**
 * GET /api/subscriptions/my-subscriptions
 * Get user's active subscriptions
 */
router.get('/my-subscriptions', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;
    const subscriptions = await prisma.subscription.findMany({
      where: {
        subscriberId: userId,
        status: 'active',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        subscriptionTier: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    res.json(subscriptions);
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/subscriptions/my-subscribers
 * Get creator's subscribers
 */
router.get('/my-subscribers', async (req: AuthRequest, res, next) => {
  try {
    const creatorId = req.userId!;
    const subscribers = await prisma.subscription.findMany({
      where: {
        creatorId,
        status: 'active',
      },
      include: {
        subscriber: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        subscriptionTier: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    res.json(subscribers);
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/subscriptions/check-access/:creatorId/:tier
 * Check if user has subscription access to creator content
 */
router.get('/check-access/:creatorId/:tier', async (req: AuthRequest, res, next) => {
  try {
    const subscriberId = req.userId!;
    const creatorId = req.params['creatorId'] as string;
    const tier = req.params['tier'] as string;

    const hasAccess = await SubscriptionService.hasAccess(
      subscriberId,
      creatorId,
      tier
    );

    res.json({ hasAccess });
  } catch (error: any) {
    next(error);
  }
});

export default router;
