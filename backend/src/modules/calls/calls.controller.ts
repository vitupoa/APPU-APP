import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { CallService } from './calls.service.js';
import { initiateCallSchema } from './calls.validation.js';

export class CallController {
  static async initiateCall(req: AuthRequest, res: Response) {
    try {
      const data = initiateCallSchema.parse(req.body);
      const result = await CallService.initiateCall(req.user_id!, data.chat_id, data.type);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async answerCall(req: AuthRequest, res: Response) {
    try {
      const callId = String(req.params.callId);
      const result = await CallService.answerCall(callId, req.user_id!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async declineCall(req: AuthRequest, res: Response) {
    try {
      const callId = String(req.params.callId);
      const result = await CallService.declineCall(callId, req.user_id!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async endCall(req: AuthRequest, res: Response) {
    try {
      const callId = String(req.params.callId);
      const result = await CallService.endCall(callId, req.user_id!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCallHistory(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(String(req.query.page || '1'));
      const limit = parseInt(String(req.query.limit || '20'));
      const chatId = String(req.params.chat_id);
      const history = await CallService.getCallHistory(req.user_id!, chatId, page, limit);
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
