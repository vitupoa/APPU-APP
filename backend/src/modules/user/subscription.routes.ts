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
  const { creator_id, tierType } = req.body;
  try {
    if (!creator_id || !tierType) return res.status(400).json({ error: 'creator_id and tierType are required' });
    const tier = await prisma.subscription_tier.findUnique({ where: { creator_id_tier: { creator_id, tier: tierType } }, select: { kr_amount: true } });
    if (!tier) return res.status(404).json({ error: 'Subscription tier not found' });
    const amountRc = Number(tier.kr_amount);
    const fraudCheck = await FraudDetectionService.comprehensiveFraudCheck(subscriberId, 'subscription', { creator_id, tierType, amount_kr: amountRc });
    if (fraudCheck.shouldBlock) {
      await AuditLogService.logFraudDetection(req, { userId: subscriberId, operationType: 'subscription', riskScore: fraudCheck.riskScore, reasons: fraudCheck.reasons, blocked: true });
      return res.status(403).json({ error: 'Operation blocked', message: 'Suspicious activity detected.', reasons: fraudCheck.reasons });
    }
    const subscription = await SubscriptionService.subscribe(subscriberId, creator_id, tierType);
    await AuditLogService.logSubscription(req, { subscriberId: subscriberId, creatorId: creator_id, tierType, amountKr, operation: 'SUBSCRIBE', success: true, fraudCheckResult: fraudCheck });
    return res.json(subscription);
  } catch (error: any) {
    await AuditLogService.logSubscription(req, { subscriberId: subscriberId, creatorId: creator_id, tierType, amountKr: 0, operation: 'SUBSCRIBE', success: false, error: error.message });
    return next(error);
  }
});

/**
 * POST /api/subscriptions/unsubscribe
 * Unsubscribe from a creator
 */
router.post('/unsubscribe', subscriptionRateLimiter, async (req: AuthRequest, res, next) => {
  const subscriberId = req.userId!;
  const { creator_id } = req.body;
  try {
    if (!creator_id) return res.status(400).json({ error: 'creator_id is required' });
    const result = await SubscriptionService.unsubscribe(subscriberId, creator_id);
    await AuditLogService.logSubscription(req, { subscriberId: subscriberId, creatorId: creator_id, tierType: 'N/A', amountKr: 0, operation: 'UNSUBSCRIBE', success: true });
    return res.json(result);
  } catch (error: any) {
    await AuditLogService.logSubscription(req, { subscriberId: subscriberId, creatorId: creator_id, tierType: 'N/A', amountKr: 0, operation: 'UNSUBSCRIBE', success: false, error: error.message });
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
    const subscriptions = await prisma.subscriptions.findMany({
      where: {
        subscriber_id: userId,
        status: 'active',
      },
      include: {
        User_subscriptions_creator_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
        SubscriptionTier: true,
      },
      orderBy: { started_at: 'desc' },
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
    const subscribers = await prisma.subscriptions.findMany({
      where: {
        creator_id: creatorId,
        status: 'active',
      },
      include: {
        User_subscriptions_subscriber_idToUser: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
        SubscriptionTier: true,
      },
      orderBy: { started_at: 'desc' },
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
