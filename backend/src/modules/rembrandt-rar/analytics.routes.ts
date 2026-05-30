import { Router } from 'express';
import { AnalyticsDashboardService } from '../../services/analyticsDashboard.service.js';
import { authMiddleware } from '../../middleware/auth.js';
import { requireRembrandtRar } from '../../middleware/rembrandtRar.js';

const router = Router();

/**
 * GET /api/v1/rar/analytics/overview
 * Get dashboard overview metrics
 */
router.get('/overview', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const metrics = await AnalyticsDashboardService.getOverviewMetrics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/rar/analytics/charts/revenue
 * Get revenue chart data
 */
router.get('/charts/revenue', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const { period = 'daily', days = '30' } = req.query;
    
    const chart = await AnalyticsDashboardService.getRevenueChart(
      period as 'daily' | 'weekly' | 'monthly',
      parseInt(days as string)
    );
    
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/rar/analytics/charts/users
 * Get user growth chart data
 */
router.get('/charts/users', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const { days = '30' } = req.query;
    
    const chart = await AnalyticsDashboardService.getUserGrowthChart(
      parseInt(days as string)
    );
    
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/rar/analytics/charts/transactions
 * Get transaction type breakdown chart
 */
router.get('/charts/transactions', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const { days = '30' } = req.query;
    
    const chart = await AnalyticsDashboardService.getTransactionTypeChart(
      parseInt(days as string)
    );
    
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/rar/analytics/charts/contests
 * Get contest analytics chart
 */
router.get('/charts/contests', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const { days = '30' } = req.query;
    
    const chart = await AnalyticsDashboardService.getContestAnalyticsChart(
      parseInt(days as string)
    );
    
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/rar/analytics/charts/shop
 * Get shop analytics chart
 */
router.get('/charts/shop', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const { days = '30' } = req.query;
    
    const chart = await AnalyticsDashboardService.getShopAnalyticsChart(
      parseInt(days as string)
    );
    
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/rar/analytics/charts/chamas
 * Get chama analytics chart
 */
router.get('/charts/chamas', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const { days = '30' } = req.query;
    
    const chart = await AnalyticsDashboardService.getChamaAnalyticsChart(
      parseInt(days as string)
    );
    
    res.json(chart);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/rar/analytics/top-content
 * Get top performing content
 */
router.get('/top-content', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    
    const content = await AnalyticsDashboardService.getTopContent(
      parseInt(limit as string)
    );
    
    res.json(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/rar/analytics/health
 * Get platform health metrics
 */
router.get('/health', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const health = await AnalyticsDashboardService.getPlatformHealth();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/rar/analytics/realtime
 * Get real-time statistics
 */
router.get('/realtime', authMiddleware, requireRembrandtRar, async (req, res) => {
  try {
    const stats = await AnalyticsDashboardService.getRealTimeStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
