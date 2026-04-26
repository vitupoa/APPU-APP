import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { CallService } from './calls.service.js';
import { initiateCallSchema } from './calls.validation.js';

export class CallController {
  static async initiateCall(req: AuthRequest, res: Response) {
    try {
      const data = initiateCallSchema.parse(req.body);
      const result = await CallService.initiateCall(req.userId!, data.chatId, data.type);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async answerCall(req: AuthRequest, res: Response) {
    try {
      const result = await CallService.answerCall(req.params.callId, req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async declineCall(req: AuthRequest, res: Response) {
    try {
      const result = await CallService.declineCall(req.params.callId, req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async endCall(req: AuthRequest, res: Response) {
    try {
      const result = await CallService.endCall(req.params.callId, req.userId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCallHistory(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const history = await CallService.getCallHistory(req.userId!, req.params.chatId, page, limit);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
