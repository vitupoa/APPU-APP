import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { BookmarkService } from './bookmarks.service.js';

const router = Router();

// POST /api/v1/bookmarks/toggle
router.post('/toggle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { contentId, contentType } = req.body;
    
    if (!contentId || !contentType) {
      return res.status(400).json({ error: 'contentId and contentType are required' });
    }

    const result = await BookmarkService.toggleBookmark(req.userId!, contentId, contentType);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/bookmarks
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const contentType = typeof req.query.contentType === 'string' ? req.query.contentType : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    
    const result = await BookmarkService.getUserBookmarks(req.userId!, contentType, cursor);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/bookmarks/check/:contentId/:contentType
router.get('/check/:contentId/:contentType', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { contentId, contentType } = req.params;
    const isBookmarked = await BookmarkService.isBookmarked(req.userId!, contentId, contentType);
    res.status(200).json({ isBookmarked });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
