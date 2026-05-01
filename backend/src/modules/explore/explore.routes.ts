import { Router, Response } from 'express';
import { optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { ExploreService } from './explore.service.js';


// Helper to safely extract string from query parameter
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}
const router = Router();

// GET /api/v1/explore/trending/hashtags
router.get('/trending/hashtags', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const hashtags = await ExploreService.getTrendingHashtags(limit);
    res.status(200).json(hashtags);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/explore/trending/shorts
router.get('/trending/shorts', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const shorts = await ExploreService.getTrendingShorts(category, limit);
    res.status(200).json(shorts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/explore/trending/contests
router.get('/trending/contests', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const contests = await ExploreService.getTrendingContests(limit);
    res.status(200).json(contests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/explore/trending/creators
router.get('/trending/creators', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const creators = await ExploreService.getTrendingCreators(limit);
    res.status(200).json(creators);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/explore/live
router.get('/live', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const streams = await ExploreService.getLiveStreams(limit);
    res.status(200).json(streams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/explore/hashtag/:tag
router.get('/hashtag/:tag', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tag = req.params.tag;
    const contentType = req.query.contentType as string | undefined;
    const limitQuery = req.query.limit;
    const limit = limitQuery ? parseInt(Array.isArray(limitQuery) ? limitQuery[0] : limitQuery) : 20;
    const cursorQuery = req.query.cursor;
    const cursor = cursorQuery ? (Array.isArray(cursorQuery) ? cursorQuery[0] : cursorQuery) : undefined;
    const content = await ExploreService.getHashtagContent(tag, contentType, limit, cursor);
    res.status(200).json(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
