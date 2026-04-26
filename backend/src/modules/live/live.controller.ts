import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { LiveService } from './live.service.js';
import {
  startLiveSchema, liveTipSchema, liveMessageSchema,
  pinProductSchema, giftGoalSchema, battleSchema,
  banViewerSchema, likeSchema,
} from './live.validation.js';

export class LiveController {
  static async startStream(req: AuthRequest, res: Response) {
    try {
      const data = startLiveSchema.parse(req.body);
      const stream = await LiveService.startStream(req.userId!, data);
      res.status(201).json(stream);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async endStream(req: AuthRequest, res: Response) {
    try {
      const stream = await LiveService.endStream(req.params.streamId, req.userId!);
      res.json(stream);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getActiveStreams(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const chamaId = req.query.chamaId as string | undefined;
      const result = await LiveService.getActiveStreams(page, limit, chamaId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStream(req: AuthRequest, res: Response) {
    try {
      const stream = await LiveService.getStream(req.params.streamId);
      res.json(stream);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async sendTip(req: AuthRequest, res: Response) {
    try {
      const data = liveTipSchema.parse(req.body);
      const user = await (await import('../../config/database.js')).prisma.user.findUnique({
        where: { id: req.userId! },
        select: { currency: true },
      });
      const result = await LiveService.sendTip(
        req.params.streamId, req.userId!, data.recipientId,
        data.amountKr, data.giftType, data.message, user?.currency || 'USD'
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async sendLikes(req: AuthRequest, res: Response) {
    try {
      const data = likeSchema.parse(req.body);
      const result = await LiveService.sendLikes(req.params.streamId, req.userId!, data.count);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const leaderboard = await LiveService.getLeaderboard(req.params.streamId, limit);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async pinProduct(req: AuthRequest, res: Response) {
    try {
      const data = pinProductSchema.parse(req.body);
      const result = await LiveService.pinProduct(
        req.params.streamId, req.userId!, data.productId, data.salePrice
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async unpinProduct(req: AuthRequest, res: Response) {
    try {
      await LiveService.unpinProduct(req.params.streamId, req.userId!, req.params.productId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async setGiftGoal(req: AuthRequest, res: Response) {
    try {
      const data = giftGoalSchema.parse(req.body);
      const result = await LiveService.setGiftGoal(req.params.streamId, req.userId!, data.title, data.targetKr);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async banViewer(req: AuthRequest, res: Response) {
    try {
      const data = banViewerSchema.parse(req.body);
      const result = await LiveService.banViewer(req.params.streamId, req.userId!, data.userId, data.reason);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async muteViewer(req: AuthRequest, res: Response) {
    try {
      const data = banViewerSchema.parse(req.body);
      const result = await LiveService.muteViewer(req.params.streamId, req.userId!, data.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async startBattle(req: AuthRequest, res: Response) {
    try {
      const data = battleSchema.parse(req.body);
      const result = await LiveService.startBattle(
        req.params.streamId, req.userId!,
        data.opponentStreamId, data.contestId, data.durationSecs
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async acceptBattle(req: AuthRequest, res: Response) {
    try {
      const result = await LiveService.acceptBattle(req.params.battleId, req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async inviteCoHost(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.body;
      const result = await LiveService.inviteCoHost(req.params.streamId, req.userId!, userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
