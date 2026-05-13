import { Response } from 'express';
import { ChamaFinanceService } from './chama-finance.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import { contributeSchema, requestPayoutSchema, approvePayoutSchema } from './chama.validation.js';

export class ChamaFinanceController {
  static async contribute(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const parsed = contributeSchema.parse(req.body);
      const result = await ChamaFinanceService.contribute(req.userId!, chamaId, parsed.amount_kr);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async requestPayout(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const parsed = requestPayoutSchema.parse(req.body);
      const result = await ChamaFinanceService.requestPayout(
        req.userId!, chamaId, parsed.recipientUserId, parsed.amount_kr, parsed.cycle_id
      );
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async approvePayout(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const payoutId = String(req.params.pid);
      const parsed = approvePayoutSchema.parse(req.body);
      const result = await ChamaFinanceService.approvePayout(
        req.userId!, chamaId, payoutId, parsed.decision as 'APPROVED' | 'REJECTED', parsed.reason
      );
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getBalance(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const result = await ChamaFinanceService.getBalance(chamaId);
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getTransactions(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await ChamaFinanceService.getTransactions(chamaId, page, limit);
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async uploadReceipt(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const { description, receipt_url, amount_kr } = req.body;
      const result = await ChamaFinanceService.uploadReceipt(
        req.userId!, chamaId, description, receipt_url, amount_kr
      );
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }
}
