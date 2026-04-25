import { Response } from 'express';
import { ChamaCycleService } from './chama-cycle.service.js';
import { AuthRequest } from '../../middleware/auth.js';

export class ChamaCycleController {
  static async openCycle(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const cycle = await ChamaCycleService.openCycle(req.userId!, chamaId);
      res.json({ success: true, cycle });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async disburseCycle(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const cycleId = String(req.params.cid);
      const cycle = await ChamaCycleService.disburseCycle(req.userId!, chamaId, cycleId);
      res.json({ success: true, cycle });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getCycles(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const cycles = await ChamaCycleService.getCycles(chamaId);
      res.json({ success: true, cycles });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }
}
