import { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service.js';

export class ChatController {
  static async createDirectChat(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { recipientId } = req.body;
      const chat = await ChatService.createDirectChat(userId, recipientId);
      res.status(201).json({ success: true, chat });
    } catch (error) {
      next(error);
    }
  }

  static async createGroupChat(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, description, participantIds } = req.body;
      const chat = await ChatService.createGroupChat(userId, name, description, participantIds);
      res.status(201).json({ success: true, chat });
    } catch (error) {
      next(error);
    }
  }

  static async getChats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const chats = await ChatService.getChats(userId, page, limit);
      res.json({ success: true, chats });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const senderId = req.user!.id;
      const { chatId } = req.params;
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

  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { chatId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const messages = await ChatService.getMessages(userId, chatId, page, limit);
      res.json({ success: true, messages });
    } catch (error) {
      next(error);
    }
  }
}
