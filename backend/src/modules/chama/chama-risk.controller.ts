import { Response } from 'express';
import { ChamaRiskService } from './chama-risk.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export class ChamaRiskController {
  static async checkDefaults(req: AuthRequest, res: Response) {
    try {
      // Typically this would be a CRON job, but we'll expose an endpoint for testing/manual triggers
      const result = await ChamaRiskService.checkDefaults();
      res.json({ success: true, result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async flagDefaulter(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const { targetUserId, amountOwed } = req.body;
      const result = await ChamaRiskService.flagDefaulter(req.userId!, chamaId, targetUserId, Number(amountOwed));
      res.json({ success: true, defaulter: result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async sendReminder(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const { userId, cycleNumber } = req.body;
      const result = await ChamaRiskService.sendReminder(chamaId, userId, Number(cycleNumber));
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async applyPenalty(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const { targetUserId } = req.body;
      const result = await ChamaRiskService.applyPenalty(req.userId!, chamaId, targetUserId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getUserDefaultStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.query.userId ? String(req.query.userId) : req.userId!;
      const result = await ChamaRiskService.getUserDefaultStatus(userId);
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }
}
