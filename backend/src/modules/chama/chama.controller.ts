import { Request, Response } from 'express';
import { ChamaService } from './chama.service.js';
import { AuthRequest } from '../../middleware/auth.js';
import {
  createChamaSchema,
  updateChamaSchema,
  joinChamaSchema,
  removeMemberSchema,
} from './chama.validation.js';

export class ChamaController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const parsed = createChamaSchema.parse(req.body);
      const chama = await ChamaService.createChama(req.userId!, parsed);
      res.status(201).json({ success: true, chama });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getMyChamas(req: AuthRequest, res: Response) {
    try {
      const chamas = await ChamaService.getMyChamas(req.userId!);
      res.json({ success: true, chamas });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async discover(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const chamas = await ChamaService.discoverChamas(req.userId!, page, limit);
      res.json({ success: true, chamas });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const chama = await ChamaService.getChamaById(chamaId);
      if (!chama) return res.status(404).json({ success: false, error: 'Chama not found' });
      return res.json({ success: true, chama });
    } catch (e: any) {
      return res.status(400).json({ success: false, error: e.message });
    }
  }

  static async update(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const parsed = updateChamaSchema.parse(req.body);
      const chama = await ChamaService.updateChama(req.userId!, chamaId, parsed);
      res.json({ success: true, chama });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async join(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const chama = await ChamaService.joinChama(req.userId!, chamaId);
      res.json({ success: true, chama });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async leave(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const result = await ChamaService.leaveChama(req.userId!, chamaId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async removeMember(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const targetUserId = String(req.params.uid);
      const parsed = removeMemberSchema.parse(req.body);
      const result = await ChamaService.removeMember(req.userId!, chamaId, targetUserId, parsed.reason);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async activate(req: AuthRequest, res: Response) {
    try {
      const chamaId = String(req.params.id);
      const chama = await ChamaService.activateChama(req.userId!, chamaId);
      res.json({ success: true, chama });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async getDefaulters(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const defaulters = await ChamaService.getDefaultersList(page, limit);
      res.json({ success: true, defaulters });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }

  static async resolveDefault(req: AuthRequest, res: Response) {
    try {
      const defaultId = String(req.params.defaultId);
      const result = await ChamaService.resolveDefault(req.userId!, defaultId);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  }
}
