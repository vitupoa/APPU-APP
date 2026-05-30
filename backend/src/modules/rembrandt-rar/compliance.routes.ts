import { Router, Request, Response } from 'express';
import { complianceReviewService } from '../../services/compliance/complianceReview.service.js';
import { sarService } from '../../services/compliance/sar.service.js';
import { AuditLogService } from '../../services/auditLog.service.js';
import { authenticateToken } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/admin.js';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// ═══════════════════════════════════════════════════════════
// COMPLIANCE REVIEWS ENDPOINTS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/v1/compliance/reviews
 * Get all compliance reviews with filters
 */
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const { status, review_type, user_id, reviewer_id, limit, offset } = req.query;

    const result = await complianceReviewService.getReviews({
      status: status as string,
      review_type: review_type as string,
      user_id: user_id as string,
      reviewer_id: reviewer_id as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.reviews,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch reviews'
    });
  }
});

/**
 * GET /api/v1/compliance/reviews/:id
 * Get review by ID
 */
router.get('/reviews/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await complianceReviewService.getReviewById(id);

    res.json({
      success: true,
      data: review
    });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch review'
    });
  }
});

/**
 * POST /api/v1/compliance/reviews
 * Create a new compliance review
 */
router.post('/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transaction_id, user_id, review_type, notes } = req.body;
    const reviewerId = req.user?.id;

    if (!transaction_id || !user_id || !review_type) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: transaction_id, user_id, review_type'
      });
      return;
    }

    const review = await complianceReviewService.createReview(
      { transaction_id, user_id, review_type, notes },
      reviewerId
    );

    // Log audit
    await AuditLogService.log({
      action: 'COMPLIANCE_REVIEW_CREATED',
      userId: reviewerId,
      targetType: 'COMPLIANCE_REVIEW',
      targetId: review.id,
      details: { review_type, user_id, transaction_id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create review'
    });
  }
});

/**
 * PUT /api/v1/compliance/reviews/:id/assign
 * Assign reviewer to a review
 */
router.put('/reviews/:id/assign', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reviewer_id } = req.body;
    const adminId = req.user?.id;

    if (!reviewer_id) {
      res.status(400).json({
        success: false,
        message: 'Missing required field: reviewer_id'
      });
      return;
    }

    const review = await complianceReviewService.assignReviewer(id, reviewer_id);

    // Log audit
    await AuditLogService.log({
      action: 'COMPLIANCE_REVIEW_ASSIGNED',
      userId: adminId,
      targetType: 'COMPLIANCE_REVIEW',
      targetId: id,
      details: { reviewer_id },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      data: review
    });
  } catch (error: any) {
    console.error('Error assigning reviewer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to assign reviewer'
    });
  }
});

/**
 * PUT /api/v1/compliance/reviews/:id/decision
 * Submit review decision
 */
router.put('/reviews/:id/decision', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body;
    const reviewerId = req.user?.id;

    if (!decision || !['APPROVE', 'REJECT', 'REQUEST_INFO', 'ESCALATE'].includes(decision)) {
      res.status(400).json({
        success: false,
        message: 'Invalid decision. Must be APPROVE, REJECT, REQUEST_INFO, or ESCALATE'
      });
      return;
    }

    const review = await complianceReviewService.submitDecision(
      id,
      reviewerId!,
      { decision, notes }
    );

    // Log audit
    await AuditLogService.log({
      action: 'COMPLIANCE_REVIEW_DECISION',
      userId: reviewerId,
      targetType: 'COMPLIANCE_REVIEW',
      targetId: id,
      details: { decision, notes },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      data: review
    });
  } catch (error: any) {
    console.error('Error submitting decision:', error);
    res.status(error.message.includes('Unauthorized') ? 403 : 500).json({
      success: false,
      message: error.message || 'Failed to submit decision'
    });
  }
});

/**
 * GET /api/v1/compliance/reviews/stats
 * Get review statistics
 */
router.get('/reviews/stats', async (req: Request, res: Response) => {
  try {
    const { reviewer_id, date_from, date_to } = req.query;

    const stats = await complianceReviewService.getStatistics({
      reviewer_id: reviewer_id as string,
      date_from: date_from ? new Date(date_from as string) : undefined,
      date_to: date_to ? new Date(date_to as string) : undefined
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch statistics'
    });
  }
});

// ═══════════════════════════════════════════════════════════
// SUSPICIOUS ACTIVITY REPORTS (SAR) ENDPOINTS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/v1/compliance/sars
 * Get all SARs with filters
 */
router.get('/sars', async (req: Request, res: Response) => {
  try {
    const { status, severity, activity_type, user_id, limit, offset } = req.query;

    const result = await sarService.getSARs({
      status: status as string,
      severity: severity as string,
      activity_type: activity_type as string,
      user_id: user_id as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.sars,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching SARs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch SARs'
    });
  }
});

/**
 * GET /api/v1/compliance/sars/:id
 * Get SAR by ID
 */
router.get('/sars/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sar = await sarService.getSARById(id);

    res.json({
      success: true,
      data: sar
    });
  } catch (error: any) {
    console.error('Error fetching SAR:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch SAR'
    });
  }
});

/**
 * POST /api/v1/compliance/sars
 * Create a new SAR
 */
router.post('/sars', async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id, activity_type, description, severity, related_transactions, evidence_urls, metadata } = req.body;
    const adminId = req.user?.id;

    if (!user_id || !activity_type || !description || !severity) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: user_id, activity_type, description, severity'
      });
      return;
    }

    const sar = await sarService.createSAR({
      user_id,
      activity_type,
      description,
      severity,
      related_transactions,
      evidence_urls,
      metadata
    });

    // Log audit
    await AuditLogService.log({
      action: 'SAR_CREATED',
      userId: adminId,
      targetType: 'SAR',
      targetId: sar.id,
      details: { user_id, activity_type, severity },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.status(201).json({
      success: true,
      data: sar
    });
  } catch (error: any) {
    console.error('Error creating SAR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create SAR'
    });
  }
});

/**
 * PUT /api/v1/compliance/sars/:id/status
 * Update SAR status
 */
router.put('/sars/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, regulatory_body } = req.body;
    const adminId = req.user?.id;

    if (!status || !['DRAFT', 'FILED', 'ACKNOWLEDGED', 'CLOSED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be DRAFT, FILED, ACKNOWLEDGED, or CLOSED'
      });
      return;
    }

    const sar = await sarService.updateSARStatus(id, status, adminId, regulatory_body);

    // Log audit
    await AuditLogService.log({
      action: 'SAR_STATUS_UPDATED',
      userId: adminId,
      targetType: 'SAR',
      targetId: id,
      details: { status, regulatory_body },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });

    res.json({
      success: true,
      data: sar
    });
  } catch (error: any) {
    console.error('Error updating SAR status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update SAR status'
    });
  }
});

/**
 * GET /api/v1/compliance/sars/:id/template
 * Generate SAR template
 */
router.get('/sars/:id/template', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await sarService.generateSAR(id);

    res.json({
      success: true,
      data: template
    });
  } catch (error: any) {
    console.error('Error generating SAR template:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate SAR template'
    });
  }
});

/**
 * GET /api/v1/compliance/sars/export
 * Export SARs to CSV or PDF
 */
router.get('/sars/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { format, status, severity, activity_type, date_from, date_to } = req.query;

    if (!format || !['CSV', 'PDF'].includes(format as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Must be CSV or PDF'
      });
      return;
    }

    const options = {
      format: format as 'CSV' | 'PDF',
      status: Array.isArray(status) ? status[0] : status as string,
      severity: Array.isArray(severity) ? severity[0] : severity as string,
      activity_type: Array.isArray(activity_type) ? activity_type[0] : activity_type as string,
      date_from: date_from ? new Date(Array.isArray(date_from) ? date_from[0] : date_from as string) : undefined,
      date_to: date_to ? new Date(Array.isArray(date_to) ? date_to[0] : date_to as string) : undefined
    };

    if (format === 'CSV') {
      const csv = await sarService.exportToCSV(options);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=sars-${Date.now()}.csv`);
      res.send(csv);
    } else {
      const pdf = await sarService.exportToPDF(options);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=sars-${Date.now()}.pdf`);
      res.send(pdf);
    }
  } catch (error: any) {
    console.error('Error exporting SARs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export SARs'
    });
  }
});

// ═══════════════════════════════════════════════════════════
// AUDIT LOGS ENDPOINTS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/v1/compliance/audit-logs
 * Get audit logs with filters
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { userId, action, targetType, startDate, endDate, success, limit, offset } = req.query;

    const result = await AuditLogService.queryLogs({
      userId: userId as string,
      action: action as string,
      targetType: targetType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      success: success ? success === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0
      }
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch audit logs'
    });
  }
});

/**
 * GET /api/v1/compliance/audit-logs/stats
 * Get audit log statistics
 */
router.get('/audit-logs/stats', async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const stats = await AuditLogService.getStatistics({
      userId: userId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch audit log statistics'
    });
  }
});

export default router;
