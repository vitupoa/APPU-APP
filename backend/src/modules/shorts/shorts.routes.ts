import { Router, Response } from 'express';
import { authMiddleware, optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { ShortsService } from './shorts.service.js';
import { z } from 'zod';
import { SubscriptionTierType } from '@prisma/client';


// Helper to safely extract string from query parameter
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}
const router = Router();

const createShortSchema = z.object({
  videoUrl: z.string().url(),
  caption: z.string().max(500).optional(),
  musicTrack: z.string().max(200).optional(),
  linkedProductId: z.string().uuid().optional(),
  isLocked: z.boolean().optional(),
  requiredTier: z.nativeEnum(SubscriptionTierType).optional()
});

// GET /api/v1/shorts/feed
router.get('/feed', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const type = (req.query.type || req.query.tab) as string || 'discover';
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    if (!['discover', 'admiring'].includes(type)) {
      return res.status(400).json({ error: 'Invalid feed type. Must be "discover" or "admiring"' });
    }

    const result = await ShortsService.getFeed(type, cursor, limit, req.userId);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/shorts
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createShortSchema.parse(req.body);
    const short = await ShortsService.createShort({
      creator_id: req.userId!,
      ...(data as any)
    });
    return res.status(201).json(short);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      return res.status(400).json({ error: error.message });
    }
  }
});

// POST /api/v1/shorts/:id/like
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ShortsService.toggleLike(req.userId!, String(req.params.id));
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/shorts/:id/view
router.post('/:id/view', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    await ShortsService.incrementView(String(req.params.id), req.userId);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
