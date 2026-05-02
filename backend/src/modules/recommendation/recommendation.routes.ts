import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { contentDistributionService } from './services/contentDistribution.service.js';
import { feedGenerationService } from './services/feedGeneration.service.js';


// Helper to safely extract string from query parameter
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}
const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply stricter rate limiting for interaction tracking (prevent spam)
const interactionRateLimiter = rateLimit({ windowMs: 10000, max: 100, standardHeaders: true, legacyHeaders: false }); // 100 requests per 10 seconds

// Generate Discover feed
router.get('/feed/discover', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;

    const feed = await feedGenerationService.generateDiscoverFeed(userId, limit, cursor);
    
    res.json(feed); return;
  } catch (error: any) {
    res.status(500).json({ error: error.message }); return;
  }
});

// Generate Admiring feed
router.get('/feed/admiring', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 20;

    const feed = await feedGenerationService.generateAdmiringFeed(userId, limit);
    
    res.json(feed); return;
  } catch (error: any) {
    res.status(500).json({ error: error.message }); return;
  }
});

// Track user interaction (with rate limiting)
router.post('/interactions/track', authenticate, interactionRateLimiter, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { contentId, contentType, signalType, watchDuration, totalDuration } = req.body;

    // Input validation
    if (!contentId || !contentType || !signalType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const validSignalTypes = ['VIEW', 'LIKE', 'SHARE', 'COMMENT', 'REWATCH', 'SKIP', 'NOT_INTERESTED', 'HIDE', 'ADMIRE', 'UNADMIRE'];
    if (!validSignalTypes.includes(signalType)) {
      res.status(400).json({ error: 'Invalid signal type' });
      return;
    }

    const validContentTypes = ['SHORT', 'POST'];
    if (!validContentTypes.includes(contentType)) {
      res.status(400).json({ error: 'Invalid content type' });
      return;
    }

    await feedGenerationService.trackInteraction(userId, contentId, contentType, {
      signalType,
      watchDuration,
      totalDuration
    });

    res.json({ success: true }); return;
  } catch (error: any) {
    res.status(500).json({ error: error.message }); return;
  }
});

// Initialize content distribution (called when content is uploaded)
router.post('/distribution/initialize', authenticate, async (req: AuthRequest, res) => {
  try {
    const { contentId, contentType, hashtags, location } = req.body;
    const creatorId = req.userId!;

    // Input validation
    if (!contentId || !contentType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const validContentTypes = ['SHORT', 'POST'];
    if (!validContentTypes.includes(contentType)) {
      res.status(400).json({ error: 'Invalid content type' });
      return;
    }

    const result = await contentDistributionService.initializeDistribution(
      contentId,
      contentType,
      creatorId,
      { hashtags, location }
    );

    res.json(result); return;
  } catch (error: any) {
    res.status(500).json({ error: error.message }); return;
  }
});

// Evaluate content performance
router.post('/distribution/evaluate', authenticate, async (req, res) => {
  try {
    const { contentId, contentType } = req.body;

    const result = await contentDistributionService.evaluatePerformance(contentId, contentType);

    res.json(result); return;
  } catch (error: any) {
    res.status(500).json({ error: error.message }); return;
  }
});

export default router;
