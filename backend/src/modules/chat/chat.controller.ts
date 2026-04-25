import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { ChatService } from './chat.service.js';

export class ChatController {
  static async createDirectChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { recipientId } = req.body;
      const chat = await ChatService.createDirectChat(userId, recipientId);
      res.status(201).json({ success: true, chat });
    } catch (error) {
      next(error);
    }
  }

  static async createGroupChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { name, description, participantIds } = req.body;
      const chat = await ChatService.createGroupChat(userId, name, description, participantIds);
      res.status(201).json({ success: true, chat });
    } catch (error) {
      next(error);
    }
  }

  static async getChats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const chats = await ChatService.getChats(userId, page, limit);
      res.json({ success: true, chats });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const senderId = req.userId!;
      const chatId = String(req.params.chatId);
      const { payload, mediaUrl, mediaType, replyToId } = req.body;

      const message = await ChatService.sendMessage(
        senderId,
        chatId,
        payload,
        mediaUrl,
        mediaType,
        replyToId
      );

      res.status(201).json({ success: true, message });
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const chatId = String(req.params.chatId);
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;

      const messages = await ChatService.getMessages(userId, chatId, page, limit);
      res.json({ success: true, messages });
    } catch (error) {
      next(error);
    }
  }

  static async sendTip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const senderId = req.userId!;
      const chatId = String(req.params.chatId);
      const { recipientId, amountKr, currency } = req.body;

      const result = await ChatService.sendTipInChat(
        senderId,
        chatId,
        recipientId,
        Number(amountKr),
        currency
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

