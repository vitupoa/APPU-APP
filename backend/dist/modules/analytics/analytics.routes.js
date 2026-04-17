import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { AnalyticsService } from './analytics.service.js';
const router = Router();
// GET /api/v1/analytics — Creator analytics dashboard data
router.get('/', authMiddleware, async (req, res) => {
    try {
        const days = req.query.days ? parseInt(req.query.days) : 30;
        const analytics = await AnalyticsService.getCreatorAnalytics(req.userId, { days });
        res.status(200).json(analytics);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=analytics.routes.js.map