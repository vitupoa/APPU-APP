import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { ChatService } from './chat.service.js';

export class ChatController {
  static async createDirectChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { recipient_id } = req.body;
      const chat = await ChatService.createDirectChat(userId, recipient_id);
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
      const unreadOnly = req.query.unreadOnly === 'true';
      const chats = await ChatService.getChats(userId, page, limit, unreadOnly);
      res.json({ success: true, chats });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const senderId = req.userId!;
      const chatId = String(req.params.chatId);
      const { payload, media_url, media_type, replyToId, forwarded_from_id } = req.body;

      const message = await ChatService.sendMessage(
        senderId,
        chatId,
        payload,
        media_url,
        media_type,
        replyToId,
        forwarded_from_id
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
      const { recipient_id, amount_kr, currency } = req.body;

      const result = await ChatService.sendTipInChat(
        senderId,
        chatId,
        recipient_id,
        Number(amount_kr),
        currency
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateGroupChat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const chatId = String(req.params.chatId);
      const { name, description, avatar_url } = req.body;

      const chat = await ChatService.updateGroupChat(userId, chatId, {
        name,
        description,
        avatarUrl: avatar_url,
      });

      res.json({ success: true, chat });
    } catch (error) {
      next(error);
    }
  }

  static async manageMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const chatId = String(req.params.chatId);
      const { user_id: targetUserId, action } = req.body;

      const result = await ChatService.manageMember(userId, chatId, targetUserId, action);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async transferOwnership(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const chatId = String(req.params.chatId);
      const { newOwnerId } = req.body;

      const result = await ChatService.transferOwnership(userId, chatId, newOwnerId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async leaveGroup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const chatId = String(req.params.chatId);

      const result = await ChatService.leaveGroup(userId, chatId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const messageId = String(req.params.messageId);

      const result = await ChatService.deleteMessage(userId, messageId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async forwardMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const messageId = String(req.params.messageId);
      const { targetChatId } = req.body;

      const message = await ChatService.forwardMessage(userId, messageId, targetChatId);
      res.json({ success: true, message });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const chatId = String(req.params.chatId);

      const result = await ChatService.markAsRead(userId, chatId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async sendTypingIndicator(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const chatId = String(req.params.chatId);
      const { isTyping } = req.body;

      const result = await ChatService.sendTypingIndicator(userId, chatId, isTyping);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = String(req.query.query || '');
      const users = await ChatService.searchUsers(query);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  static async searchGroups(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = String(req.query.query || '');
      const groups = await ChatService.searchGroups(query);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  }
}

