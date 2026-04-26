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
      const streamId = String(req.params.streamId);
      const stream = await LiveService.endStream(streamId, req.userId!);
      res.json(stream);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getActiveStreams(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(String(req.query.page || '1'));
      const limit = parseInt(String(req.query.limit || '20'));
      const chamaId = req.query.chamaId ? String(req.query.chamaId) : undefined;
      const result = await LiveService.getActiveStreams(page, limit, chamaId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStream(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const stream = await LiveService.getStream(streamId);
      res.json(stream);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  static async sendTip(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const data = liveTipSchema.parse(req.body);
      const user = await (await import('../../config/database.js')).prisma.user.findUnique({
        where: { id: req.userId! },
        select: { currency: true },
      });
      const result = await LiveService.sendTip(
        streamId, req.userId!, data.recipientId,
        data.amountKr, data.giftType, data.message, user?.currency || 'USD'
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async sendLikes(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const data = likeSchema.parse(req.body);
      const result = await LiveService.sendLikes(streamId, req.userId!, data.count);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const limit = parseInt(String(req.query.limit || '5'));
      const streamId = String(req.params.streamId);
      const leaderboard = await LiveService.getLeaderboard(streamId, limit);
      res.json(leaderboard);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async pinProduct(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const data = pinProductSchema.parse(req.body);
      const result = await LiveService.pinProduct(
        streamId, req.userId!, data.productId, data.salePrice
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async unpinProduct(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const productId = String(req.params.productId);
      await LiveService.unpinProduct(streamId, req.userId!, productId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async setGiftGoal(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const data = giftGoalSchema.parse(req.body);
      const result = await LiveService.setGiftGoal(streamId, req.userId!, data.title, data.targetKr);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async banViewer(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const data = banViewerSchema.parse(req.body);
      const result = await LiveService.banViewer(streamId, req.userId!, data.userId, data.reason);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async muteViewer(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const data = banViewerSchema.parse(req.body);
      const result = await LiveService.muteViewer(streamId, req.userId!, data.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async startBattle(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const data = battleSchema.parse(req.body);
      const result = await LiveService.startBattle(
        streamId, req.userId!,
        data.opponentStreamId, data.contestId, data.durationSecs
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async acceptBattle(req: AuthRequest, res: Response) {
    try {
      const battleId = String(req.params.battleId);
      const result = await LiveService.acceptBattle(battleId, req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async inviteCoHost(req: AuthRequest, res: Response) {
    try {
      const streamId = String(req.params.streamId);
      const { userId } = req.body;
      const result = await LiveService.inviteCoHost(streamId, req.userId!, userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
