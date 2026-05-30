import { Request, Response } from 'express';
import { riskScoringService } from '../../services/compliance/riskScoring.service.js';
import { deviceFingerprintService } from '../../services/compliance/deviceFingerprint.service.js';
import { ofacScreeningService } from '../../services/compliance/ofacScreening.service.js';
import { transactionValidationService } from '../../services/compliance/transactionValidation.service.js';
import { lockedChatTaskService } from '../../services/compliance/lockedChatTask.service.js';
import { contestValidationService } from '../../services/compliance/contestValidation.service.js';
import { sarService } from '../../services/compliance/sar.service.js';
import { kycTierService } from '../../services/compliance/kycTier.service.js';
import { prisma } from '../../config/database.js';

// Helper to convert query param to string
const toStringParam = (param: string | string[] | undefined): string | undefined => {
  if (Array.isArray(param)) return param[0];
  return param;
};

export class ComplianceController {
  /**
   * Get user's risk profile
   */
  static async getUserRiskProfile(req: Request, res: Response) {
    try {
      const userId = toStringParam(req.params.userId) || req.user?.id;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const riskProfile = await riskScoringService.getUserRiskProfile(userId);

      return res.json({
        success: true,
        riskProfile
      });
    } catch (error: any) {
      console.error('Error getting risk profile:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Recalculate user's risk score
   */
  static async recalculateRiskScore(req: Request, res: Response) {
    try {
      const userId = toStringParam(req.params.userId) || req.user?.id;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const riskData = await riskScoringService.calculateUserRiskScore(userId);

      return res.json({
        success: true,
        ...riskData
      });
    } catch (error: any) {
      console.error('Error recalculating risk score:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Check if user can message creator (locked chat)
   */
  static async checkChatAccess(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const creatorId = toStringParam(req.params.creatorId);

      if (!userId || !creatorId) {
        return res.status(400).json({ error: 'User ID and Creator ID are required' });
      }

      const access = await lockedChatTaskService.canUserMessageCreator(userId, creatorId);

      return res.json({
        success: true,
        ...access
      });
    } catch (error: any) {
      console.error('Error checking chat access:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Unlock chat for a task
   */
  static async unlockChatForTask(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { creator_id, task_description, amount_kr, deadline_hours } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!creator_id || !task_description || !amount_kr) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await lockedChatTaskService.unlockChatForTask({
        user_id: userId,
        creator_id,
        task_description,
        amount_kr,
        deadline_hours: deadline_hours || 24
      });

      return res.json({
        success: true,
        task: result.task,
        transaction: result.transaction
      });
    } catch (error: any) {
      console.error('Error unlocking chat:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Complete a task
   */
  static async completeTask(req: Request, res: Response) {
    try {
      const creatorId = req.user?.id;
      const taskId = toStringParam(req.params.taskId);
      const { deliverable_url } = req.body;

      if (!creatorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!taskId) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      await lockedChatTaskService.completeTask(taskId, creatorId, deliverable_url);

      return res.json({
        success: true,
        message: 'Task completed successfully'
      });
    } catch (error: any) {
      console.error('Error completing task:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get creator's locked chat settings
   */
  static async getLockedChatSettings(req: Request, res: Response) {
    try {
      const creatorId = toStringParam(req.params.creatorId) || req.user?.id;

      if (!creatorId) {
        return res.status(400).json({ error: 'Creator ID is required' });
      }

      const settings = await lockedChatTaskService.getCreatorSettings(creatorId);

      return res.json({
        success: true,
        settings
      });
    } catch (error: any) {
      console.error('Error getting locked chat settings:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update creator's locked chat settings
   */
  static async updateLockedChatSettings(req: Request, res: Response) {
    try {
      const creatorId = req.user?.id;
      const { is_locked, task_fee_kr, typical_delivery_time } = req.body;

      if (!creatorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const settings = await lockedChatTaskService.updateCreatorSettings(creatorId, {
        is_locked,
        task_fee_kr,
        typical_delivery_time
      });

      return res.json({
        success: true,
        settings
      });
    } catch (error: any) {
      console.error('Error updating locked chat settings:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user's active tasks
   */
  static async getUserActiveTasks(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const tasks = await lockedChatTaskService.getUserActiveTasks(userId);

      return res.json({
        success: true,
        tasks
      });
    } catch (error: any) {
      console.error('Error getting user tasks:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get creator's pending tasks
   */
  static async getCreatorPendingTasks(req: Request, res: Response) {
    try {
      const creatorId = req.user?.id;

      if (!creatorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const tasks = await lockedChatTaskService.getCreatorPendingTasks(creatorId);

      return res.json({
        success: true,
        tasks
      });
    } catch (error: any) {
      console.error('Error getting creator tasks:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Validate contest configuration
   */
  static async validateContest(req: Request, res: Response) {
    try {
      const contestData = req.body;

      const validation = await contestValidationService.validateContestCreation(contestData);

      return res.json({
        success: true,
        ...validation
      });
    } catch (error: any) {
      console.error('Error validating contest:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get contest validation status
   */
  static async getContestValidationStatus(req: Request, res: Response) {
    try {
      const contestId = toStringParam(req.params.contestId);

      if (!contestId) {
        return res.status(400).json({ error: 'Contest ID is required' });
      }

      const validation = await contestValidationService.getContestValidationStatus(contestId);

      return res.json({
        success: true,
        ...validation
      });
    } catch (error: any) {
      console.error('Error getting contest validation:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get flagged transactions (admin only)
   */
  static async getFlaggedTransactions(req: Request, res: Response) {
    try {
      const { status, severity, flag_type, limit = 50, offset = 0 } = req.query;

      const where: Record<string, any> = {};
      if (status) where.status = toStringParam(status as any);
      if (severity) where.severity = toStringParam(severity as any);
      if (flag_type) where.flag_type = toStringParam(flag_type as any);

      const transactions = await prisma.flagged_transactions.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      });

      const total = await prisma.flagged_transactions.count({ where });

      return res.json({
        success: true,
        transactions,
        total,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error: any) {
      console.error('Error getting flagged transactions:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Review flagged transaction (admin only)
   */
  static async reviewFlaggedTransaction(req: Request, res: Response) {
    try {
      const flagId = toStringParam(req.params.flagId);
      const { status, review_note, action_taken } = req.body;
      const reviewerId = req.user?.id;

      if (!reviewerId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!flagId) {
        return res.status(400).json({ error: 'Flag ID is required' });
      }

      const updated = await prisma.flagged_transactions.update({
        where: { id: flagId },
        data: {
          status,
          review_note,
          action_taken,
          reviewed_by: reviewerId,
          reviewed_at: new Date()
        }
      });

      return res.json({
        success: true,
        transaction: updated
      });
    } catch (error: any) {
      console.error('Error reviewing transaction:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get suspicious activity logs (admin only)
   */
  static async getSuspiciousActivityLogs(req: Request, res: Response) {
    try {
      const { severity, activityType, limit = 50, offset = 0 } = req.query;

      const where: Record<string, any> = {};
      if (severity) where.severity = toStringParam(severity as any);
      if (activityType) where.activityType = toStringParam(activityType as any);

      const logs = await prisma.suspicious_activity_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      });

      const total = await prisma.suspicious_activity_logs.count({ where });

      return res.json({
        success: true,
        logs,
        total,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error: any) {
      console.error('Error getting suspicious activity logs:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Screen user against OFAC list (admin only)
   */
  static async screenUser(req: Request, res: Response) {
    try {
      const userId = toStringParam(req.params.userId);

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await ofacScreeningService.screenUser(userId);

      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Error screening user:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Track device fingerprint (middleware)
   */
  static async trackDevice(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await deviceFingerprintService.trackDevice(userId, req);

      return res.json({
        success: true,
        message: 'Device tracked'
      });
    } catch (error: any) {
      console.error('Error tracking device:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new SAR (Suspicious Activity Report)
   */
  static async createSAR(req: Request, res: Response) {
    try {
      const { user_id, activity_type, description, severity, related_transactions, evidence_urls, metadata } = req.body;

      if (!user_id || !activity_type || !description || !severity) {
        return res.status(400).json({ error: 'Missing required fields' });
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

      return res.json({
        success: true,
        sar
      });
    } catch (error: any) {
      console.error('Error creating SAR:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Generate SAR template
   */
  static async generateSAR(req: Request, res: Response) {
    try {
      const sarId = toStringParam(req.params.sarId);

      if (!sarId) {
        return res.status(400).json({ error: 'SAR ID is required' });
      }

      const template = await sarService.generateSAR(sarId);

      return res.json({
        success: true,
        template
      });
    } catch (error: any) {
      console.error('Error generating SAR:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Export SARs to CSV
   */
  static async exportSARsToCSV(req: Request, res: Response) {
    try {
      const { status, severity, activity_type, date_from, date_to } = req.query;

      const dateFromStr = toStringParam(date_from as any);
      const dateToStr = toStringParam(date_to as any);

      const csv = await sarService.exportToCSV({
        format: 'CSV',
        status: toStringParam(status as any),
        severity: toStringParam(severity as any),
        activity_type: toStringParam(activity_type as any),
        date_from: dateFromStr ? new Date(dateFromStr) : undefined,
        date_to: dateToStr ? new Date(dateToStr) : undefined
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=suspicious-activity-reports-${Date.now()}.csv`);
      return res.send(csv);
    } catch (error: any) {
      console.error('Error exporting SARs to CSV:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Export SARs to PDF
   */
  static async exportSARsToPDF(req: Request, res: Response) {
    try {
      const { status, severity, activity_type, date_from, date_to } = req.query;

      const dateFromStr = toStringParam(date_from as any);
      const dateToStr = toStringParam(date_to as any);

      const pdf = await sarService.exportToPDF({
        format: 'PDF',
        status: toStringParam(status as any),
        severity: toStringParam(severity as any),
        activity_type: toStringParam(activity_type as any),
        date_from: dateFromStr ? new Date(dateFromStr) : undefined,
        date_to: dateToStr ? new Date(dateToStr) : undefined
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=suspicious-activity-reports-${Date.now()}.pdf`);
      return res.send(pdf);
    } catch (error: any) {
      console.error('Error exporting SARs to PDF:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update SAR status
   */
  static async updateSARStatus(req: Request, res: Response) {
    try {
      const sarId = toStringParam(req.params.sarId);
      const { status, filed_by, regulatory_body } = req.body;
      const adminId = req.user?.id;

      if (!sarId) {
        return res.status(400).json({ error: 'SAR ID is required' });
      }

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      const validStatuses = ['DRAFT', 'FILED', 'ACKNOWLEDGED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const sar = await sarService.updateSARStatus(
        sarId,
        status,
        filed_by || adminId,
        regulatory_body
      );

      return res.json({
        success: true,
        sar
      });
    } catch (error: any) {
      console.error('Error updating SAR status:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get SAR by ID
   */
  static async getSARById(req: Request, res: Response) {
    try {
      const sarId = toStringParam(req.params.sarId);

      if (!sarId) {
        return res.status(400).json({ error: 'SAR ID is required' });
      }

      const sar = await sarService.getSARById(sarId);

      return res.json({
        success: true,
        sar
      });
    } catch (error: any) {
      console.error('Error getting SAR:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all SARs with filters
   */
  static async getSARs(req: Request, res: Response) {
    try {
      const { status, severity, activity_type, user_id, limit = 50, offset = 0 } = req.query;

      const result = await sarService.getSARs({
        status: toStringParam(status as any),
        severity: toStringParam(severity as any),
        activity_type: toStringParam(activity_type as any),
        user_id: toStringParam(user_id as any),
        limit: Number(limit),
        offset: Number(offset)
      });

      return res.json({
        success: true,
        sars: result.sars,
        total: result.total,
        limit: Number(limit),
        offset: Number(offset)
      });
    } catch (error: any) {
      console.error('Error getting SARs:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mark activity as reported
   */
  static async markActivityAsReported(req: Request, res: Response) {
    try {
      const { user_id, activity_type, transaction_ids } = req.body;

      if (!user_id || !activity_type) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await sarService.markActivityAsReported(
        user_id,
        activity_type,
        transaction_ids || []
      );

      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('Error marking activity as reported:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get compliance dashboard overview (admin only)
   */
  static async getComplianceDashboard(req: Request, res: Response) {
    try {
      const [flaggedCount, sarCount, highRiskUsers, pendingReviews] = await Promise.all([
        prisma.flagged_transactions.count({ where: { status: 'PENDING' } }),
        prisma.suspicious_activity_reports.count({ where: { status: 'DRAFT' } }),
        prisma.user_risk_profiles.count({ where: { risk_level: { in: ['HIGH', 'CRITICAL'] } } }),
        prisma.compliance_reviews.count({ where: { status: 'PENDING' } })
      ]);

      const recentFlags = await prisma.flagged_transactions.findMany({
        where: { status: 'PENDING' },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      const recentSARs = await prisma.suspicious_activity_reports.findMany({
        where: { status: 'DRAFT' },
        orderBy: { created_at: 'desc' },
        take: 10
      });

      return res.json({
        success: true,
        overview: {
          flaggedTransactions: flaggedCount,
          pendingSARs: sarCount,
          highRiskUsers,
          pendingReviews
        },
        recentFlags,
        recentSARs
      });
    } catch (error: any) {
      console.error('Error getting compliance dashboard:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get high-risk users (admin only)
   */
  static async getHighRiskUsers(req: Request, res: Response) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const users = await prisma.user_risk_profiles.findMany({
        where: { risk_level: { in: ['HIGH', 'CRITICAL'] } },
        orderBy: { risk_score: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      });

      const total = await prisma.user_risk_profiles.count({
        where: { risk_level: { in: ['HIGH', 'CRITICAL'] } }
      });

      return res.json({
        success: true,
        users,
        total
      });
    } catch (error: any) {
      console.error('Error getting high-risk users:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get user KYC tier and limits
   */
  static async getUserKYCTier(req: Request, res: Response) {
    try {
      const userId = toStringParam(req.params.userId) || req.user?.id;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const tier = await kycTierService.getUserKYCTier(userId);
      const limits = await kycTierService.getUserLimits(userId);

      return res.json({
        success: true,
        tier,
        limits
      });
    } catch (error: any) {
      console.error('Error getting KYC tier:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all KYC tiers
   */
  static async getAllKYCTiers(req: Request, res: Response) {
    try {
      const tiers = kycTierService.getAllTiers();

      return res.json({
        success: true,
        tiers
      });
    } catch (error: any) {
      console.error('Error getting KYC tiers:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get audit logs (admin only)
   */
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const { action_type, target_user_id, limit = 50, offset = 0 } = req.query;

      const where: Record<string, any> = {};
      if (action_type) where.action_type = toStringParam(action_type as any);
      if (target_user_id) where.target_user_id = toStringParam(target_user_id as any);

      const logs = await prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      });

      const total = await prisma.audit_logs.count({ where });

      return res.json({
        success: true,
        logs,
        total
      });
    } catch (error: any) {
      console.error('Error getting audit logs:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}


