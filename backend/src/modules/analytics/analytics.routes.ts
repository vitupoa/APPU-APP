import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { AnalyticsService } from './analytics.service';

const router = Router();

// GET /api/v1/analytics — Creator analytics dashboard data
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const analytics = await AnalyticsService.getCreatorAnalytics(req.userId!, { days });
    res.status(200).json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
