import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../config/database.js';

/**
 * Middleware to block tip functionality in direct/private chats
 * 
 * This middleware enforces compliance requirement 2.2.2:
 * - Block CHAT_TIP transactions in direct chats
 * - Allow tips only for public content (posts, shorts, videos)
 * 
 * @throws Error if attempting to tip in a direct chat
 */
export async function blockDirectChatTips(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const chatId = String(req.params.chatId || req.params.chat_id);

    if (!chatId) {
      res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
      return;
    }

    // Fetch the chat to check its type
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      select: { type: true },
    });

    if (!chat) {
      res.status(404).json({
        success: false,
        error: 'Chat not found',
      });
      return;
    }

    // Block tips in DIRECT chats (compliance requirement)
    if (chat.type === 'DIRECT') {
      res.status(403).json({
        success: false,
        error: 'Direct chat tips are not allowed for compliance. You can tip creators on their public content (posts, shorts, videos) instead.',
        code: 'DIRECT_CHAT_TIP_BLOCKED',
      });
      return;
    }

    // Allow tips in GROUP chats (not considered direct/private)
    next();
  } catch (error) {
    next(error);
  }
}
