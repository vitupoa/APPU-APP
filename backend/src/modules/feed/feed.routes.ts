import { Router, Response } from 'express';
import { authMiddleware, optionalAuth, AuthRequest } from '../../middleware/auth';
import { FeedService } from './feed.service';
import { z } from 'zod';

const router = Router();

const createPostSchema = z.object({
  imageUrls: z.array(z.string().url()).min(1).max(10),
  caption: z.string().max(2200).default(''),
  isLocked: z.boolean().default(false),
  requiredTier: z.enum(['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN']).optional()
});

const addCommentSchema = z.object({
  text: z.string().min(1).max(500)
});

// GET /api/v1/feed
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await FeedService.getFeed({ userId: req.userId, cursor, limit });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/feed
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createPostSchema.parse(req.body);
    const post = await FeedService.createPost({ userId: req.userId!, ...data });
    res.status(201).json(post);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /api/v1/feed/:id/like
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await FeedService.toggleLike(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/feed/:id/like
router.delete('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await FeedService.toggleLike(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/feed/:id/comment
router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = addCommentSchema.parse(req.body);
    const comment = await FeedService.addComment(req.userId!, String(req.params.id), text);
    res.status(201).json(comment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
