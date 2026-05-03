import { Router, Response } from 'express';
import { authMiddleware, optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { validateProfileOwnership, preventSensitiveFieldModification } from '../../middleware/ownership.js';
import { sanitizeProfileUpdate, sanitizeSearchQuery } from '../../middleware/sanitization.js';
import { getQueryString } from '../../utils/queryParams.js';
import { UserService } from './user.service.js';
import { SubscriptionService } from './subscription.service.js';
import { z } from 'zod';


// Helper to safely extract string from query parameter
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}
const router = Router();

const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  displayName: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
  coverPhotoUrl: z.string().url().optional()
});

const bioLinksSchema = z.array(z.object({
  label: z.string().min(1).max(30),
  url: z.string().url(),
  icon: z.string().optional()
})).max(5);

const updateTiersSchema = z.array(z.object({
  tier: z.enum(['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN']),
  krAmount: z.number().positive(),
  benefits: z.string().min(1).max(500),
  isEnabled: z.boolean()
})).min(1).max(4);

const subscribeSchema = z.object({
  tier: z.enum(['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN'])
});

// ─── PROFILE ──────────────────────────────────────

// GET /api/v1/users/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await UserService.getProfile(req.userId!, req.userId!);
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/users/me
router.put('/me', authMiddleware, preventSensitiveFieldModification, sanitizeProfileUpdate, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const updated = await UserService.updateProfile(req.userId!, data);
    res.status(200).json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// PUT /api/v1/users/me/bio-links
router.put('/me/bio-links', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const links = bioLinksSchema.parse(req.body);
    const result = await UserService.updateBioLinks(req.userId!, links);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /api/v1/users/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await UserService.getProfile(String(req.params.id), req.userId);
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(404).json({ error: 'User not found' });
  }
});

// ─── ADMIRE / LOVER ───────────────────────────────

// POST /api/v1/users/:id/admire
router.post('/:id/admire', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await UserService.admire(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/v1/users/:id/admire
router.delete('/:id/admire', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await UserService.unadmire(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/v1/users/:id/love — Unlove: remove mutual Lovers status but keep Admiring
router.delete('/:id/love', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await UserService.unlove(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/users/:id/admirers
router.get('/:id/admirers', async (req: AuthRequest, res: Response) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await UserService.getAdmirers(String(req.params.id), cursor);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/users/:id/admiring
router.get('/:id/admiring', async (req: AuthRequest, res: Response) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await UserService.getAdmiring(String(req.params.id), cursor);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/users/:id/lovers
router.get('/:id/lovers', async (req: AuthRequest, res: Response) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await UserService.getLovers(String(req.params.id), cursor);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/users/search/creators
router.get('/search/creators', sanitizeSearchQuery, async (req: AuthRequest, res: Response) => {
  try {
    const minAdmirers = req.query.minAdmirers ? parseInt(getQueryString(req.query.minAdmirers) || '') : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const result = await UserService.searchCreatorsByAdmireCount(minAdmirers, cursor);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── MILESTONES ───────────────────────────────────

// GET /api/v1/users/me/milestones
router.get('/me/milestones', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const progress = await UserService.getUserMilestoneProgress(req.userId!);
    res.status(200).json(progress);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/milestones (mounted separately or here)
router.get('/milestones', async (_req: AuthRequest, res: Response) => {
  try {
    const milestones = await UserService.getMilestones();
    res.status(200).json(milestones);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── SUBSCRIPTIONS ────────────────────────────────

// GET /api/v1/users/me/subscription-tiers
router.get('/me/subscription-tiers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tiers = await SubscriptionService.getCreatorTiers(req.userId!);
    res.status(200).json(tiers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/users/me/subscription-tiers
router.put('/me/subscription-tiers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tiers = updateTiersSchema.parse(req.body);
    const result = await SubscriptionService.updateTiers(req.userId!, tiers);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /api/v1/users/:id/subscription-tiers
router.get('/:id/subscription-tiers', async (req: AuthRequest, res: Response) => {
  try {
    const tiers = await SubscriptionService.getAvailableTiers(String(req.params.id));
    res.status(200).json(tiers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/users/:id/subscribe
router.post('/:id/subscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tier } = subscribeSchema.parse(req.body);
    const subscription = await SubscriptionService.subscribe(req.userId!, String(req.params.id), tier);
    res.status(200).json(subscription);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// DELETE /api/v1/users/:id/subscribe
router.delete('/:id/subscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await SubscriptionService.unsubscribe(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
