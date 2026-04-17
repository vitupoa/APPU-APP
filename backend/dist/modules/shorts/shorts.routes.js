import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../../middleware/auth.js';
import { ShortsService } from './shorts.service.js';
import { z } from 'zod';
import { SubscriptionTierType } from '../../generated/client.js';
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
router.get('/feed', optionalAuth, async (req, res) => {
    try {
        const type = req.query.type || 'discover';
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        if (!['discover', 'admiring'].includes(type)) {
            return res.status(400).json({ error: 'Invalid feed type. Must be "discover" or "admiring"' });
        }
        const result = await ShortsService.getFeed(type, cursor, limit, req.userId);
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/shorts
router.post('/', authMiddleware, async (req, res) => {
    try {
        const data = createShortSchema.parse(req.body);
        const short = await ShortsService.createShort({
            creatorId: req.userId,
            ...data
        });
        return res.status(201).json(short);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            return res.status(400).json({ error: error.message });
        }
    }
});
// POST /api/v1/shorts/:id/like
router.post('/:id/like', authMiddleware, async (req, res) => {
    try {
        const result = await ShortsService.toggleLike(req.userId, String(req.params.id));
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(400).json({ error: error.message });
    }
});
// POST /api/v1/shorts/:id/view
router.post('/:id/view', optionalAuth, async (req, res) => {
    try {
        await ShortsService.incrementView(String(req.params.id), req.userId);
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=shorts.routes.js.map