import { Router, Response } from 'express';
import { authMiddleware, optionalAuth, AuthRequest } from '../../middleware/auth';
import { ShortsService } from './shorts.service';
import {
  createShortSchema,
  addCommentSchema,
  feedQuerySchema,
  createCollectionSchema
} from './shorts.validation';

const router = Router();

// GET /api/v1/shorts/feed — paginated feed (optional auth for personalization)
router.get('/feed', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const query = feedQuerySchema.parse(req.query);
    const result = await ShortsService.getFeed({
      userId: req.userId || 'anonymous',
      tab: query.tab,
      cursor: query.cursor,
      limit: query.limit
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/shorts — create short
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createShortSchema.parse(req.body);
    const short = await ShortsService.createShort({ userId: req.userId!, ...data });
    res.status(201).json(short);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /api/v1/shorts/:id/like — toggle like
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ShortsService.toggleLike(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/v1/shorts/:id/like — alias (same toggle logic)
router.delete('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ShortsService.toggleLike(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/shorts/:id/comment
router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = addCommentSchema.parse(req.body);
    const comment = await ShortsService.addComment(req.userId!, String(req.params.id), text);
    res.status(201).json(comment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /api/v1/shorts/:id/comments
router.get('/:id/comments', async (req: AuthRequest, res: Response) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await ShortsService.getComments(String(req.params.id), cursor, limit);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/shorts/:id/view — increment view counter (fire-and-forget)
router.post('/:id/view', async (req: AuthRequest, res: Response) => {
  ShortsService.incrementView(String(req.params.id));
  res.status(204).send();
});

// GET /api/v1/shorts/collections/:userId
router.get('/collections/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const collections = await ShortsService.getCollections(String(req.params.userId));
    res.status(200).json(collections);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/shorts/collections
router.post('/collections', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = createCollectionSchema.parse(req.body);
    const collection = await ShortsService.createCollection(req.userId!, name);
    res.status(201).json(collection);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
