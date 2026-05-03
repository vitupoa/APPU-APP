import { Router } from 'express';
import { SubscriptionService } from './subscription.service.js';
import { authenticate } from '../../middleware/auth.js';
import { setRLSContext } from '../../middleware/rls.js';
import { subscriptionRateLimiter } from '../../middleware/rateLimiting.js';
import { FraudDetectionService } from '../../services/fraudDetection.service.js';
import { AuditLogService } from '../../services/auditLog.service.js';

const router = Router();

// Apply RLS context to all routes
router.use(authenticate, setRLSContext);

/**
 * GET /api/subscriptions/tiers/:creatorId
 * Get available subscription tiers for a creator
 */
router.get('/tiers/:creatorId', async (req, res, next) => {
  try {
    const { creatorId } = req.params;
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
router.get('/my-tiers', async (req, res, next) => {
  try {
    const creatorId = req.user!.id;
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
router.put('/tiers', subscriptionRateLimiter, async (req, res, next) => {
  try {
    const creatorId = req.user!.id;
    const { tiers } = req.body;

    if (!Array.isArray(tiers)) {
      return res.status(400).json({ error: 'tiers must be an array' });
    }

    const result = await SubscriptionService.updateTiers(creatorId, tiers);

    // Log tier update
    await AuditLogService.logAdminAction(req, {
      adminId: creatorId,
      action: 'UPDATE_SUBSCRIPTION_TIERS',
      targetType: 'SUBSCRIPTION_TIER',
      targetId: creatorId,
      details: { tiers },
    });

    res.json(result);
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/subscriptions/subscribe
 * Subscribe to a creator
 */
router.post('/subscribe', subscriptionRateLimiter, async (req, res, next) => {
  const subscriberId = req.user!.id;
  const { creatorId, tierType } = req.body;

  try {
    if (!creatorId || !tierType) {
      return res.status(400).json({ error: 'creatorId and tierType are required' });
    }

    // Get tier details for fraud check
    const tier = await req.prisma.subscriptionTier.findUnique({
      where: { creatorId_tier: { creatorId, tier: tierType } },
      select: { krAmount: true },
    });

    if (!tier) {
      return res.status(404).json({ error: 'Subscription tier not found' });
    }

    const amountKr = Number(tier.krAmount);

    // Fraud detection check
    const fraudCheck = await FraudDetectionService.comprehensiveFraudCheck(
      subscriberId,
      'subscription',
      { creatorId, tierType, amountKr }
    );

    if (fraudCheck.shouldBlock) {
      await AuditLogService.logFraudDetection(req, {
        userId: subscriberId,
        operationType: 'subscription',
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

    // Proceed with subscription
    const subscription = await SubscriptionService.subscribe(
      subscriberId,
      creatorId,
      tierType
    );

    // Log successful subscription
    await AuditLogService.logSubscription(req, {
      subscriberId,
      creatorId,
      tierType,
      amountKr,
      operation: 'SUBSCRIBE',
      success: true,
      fraudCheckResult: fraudCheck,
    });

    res.json(subscription);
  } catch (error: any) {
    // Log failed subscription
    await AuditLogService.logSubscription(req, {
      subscriberId,
      creatorId,
      tierType,
      amountKr: 0,
      operation: 'SUBSCRIBE',
      success: false,
      error: error.message,
    });

    next(error);
  }
});

/**
 * POST /api/subscriptions/unsubscribe
 * Unsubscribe from a creator
 */
router.post('/unsubscribe', subscriptionRateLimiter, async (req, res, next) => {
  const subscriberId = req.user!.id;
  const { creatorId } = req.body;

  try {
    if (!creatorId) {
      return res.status(400).json({ error: 'creatorId is required' });
    }

    const result = await SubscriptionService.unsubscribe(subscriberId, creatorId);

    // Log unsubscribe
    await AuditLogService.logSubscription(req, {
      subscriberId,
      creatorId,
      tierType: 'N/A',
      amountKr: 0,
      operation: 'UNSUBSCRIBE',
      success: true,
    });

    res.json(result);
  } catch (error: any) {
    await AuditLogService.logSubscription(req, {
      subscriberId,
      creatorId,
      tierType: 'N/A',
      amountKr: 0,
      operation: 'UNSUBSCRIBE',
      success: false,
      error: error.message,
    });

    next(error);
  }
});

/**
 * GET /api/subscriptions/my-subscriptions
 * Get user's active subscriptions
 */
router.get('/my-subscriptions', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const subscriptions = await req.prisma.subscription.findMany({
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
router.get('/my-subscribers', async (req, res, next) => {
  try {
    const creatorId = req.user!.id;
    const subscribers = await req.prisma.subscription.findMany({
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
router.get('/check-access/:creatorId/:tier', async (req, res, next) => {
  try {
    const subscriberId = req.user!.id;
    const { creatorId, tier } = req.params;

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
