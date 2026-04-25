import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';
import { io } from '../../shared/gateway/socket.js';
import { WalletService } from '../wallet/wallet.service.js';

export class ChatService {
  /**
   * Create or fetch existing Direct Chat
   */
  static async createDirectChat(userId: string, recipientId: string) {
    if (userId === recipientId) {
      throw new Error('Cannot create chat with yourself');
    }

    // Check if a direct chat already exists between these two users
    const existingChat = await prisma.chat.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: userId } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
      include: {
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (existingChat) return existingChat;

    // Create new direct chat
    return prisma.chat.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [
            { userId: userId, role: 'member' },
            { userId: recipientId, role: 'member' },
          ],
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  /**
   * Create a Group Chat
   */
  static async createGroupChat(userId: string, name: string, description?: string, participantIds: string[] = []) {
    const allParticipantIds = Array.from(new Set([userId, ...participantIds]));

    const chat = await prisma.chat.create({
      data: {
        type: 'GROUP',
        name,
        description,
        participants: {
          create: allParticipantIds.map(id => ({
            userId: id,
            role: id === userId ? 'admin' : 'member',
          })),
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
      },
    });

    // Optionally broadcast via Socket that these users were added
    allParticipantIds.forEach(pid => {
      io.to(`user:${pid}`).emit('chat:new_chat', chat);
    });

    return chat;
  }

  /**
   * Fetch all chats for a user
   */
  static async getChats(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    return prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }, // Latest message
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });
  }

  /**
   * Send a message
   */
  static async sendMessage(
    senderId: string,
    chatId: string,
    payload: string,
    mediaUrl?: string,
    mediaType?: string,
    replyToId?: string
  ) {
    // Ensure sender is participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: senderId } },
    });

    if (!isParticipant) {
      throw new Error('Not authorized to send message in this chat');
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        payload,
        mediaUrl,
        mediaType,
        replyToId,
        status: 'sent',
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Update chat's updatedAt for sorting
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Find all participants to broadcast message via WebSocket
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
      select: { userId: true },
    });

    participants.forEach(p => {
      // Emit to each user's secure channel
      io.to(`user:${p.userId}`).emit('chat:new_message', message);
    });

    return message;
  }

  /**
   * Fetch messages for a chat
   */
  static async getMessages(userId: string, chatId: string, page: number = 1, limit: number = 50) {
    // Ensure user is participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!isParticipant) {
      throw new Error('Not authorized to view messages in this chat');
    }

    const skip = (page - 1) * limit;

    return prisma.message.findMany({
      where: { chatId },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        replyTo: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  /**
   * Send a tip in a chat (direct or group).
   */
  static async sendTipInChat(
    senderId: string,
    chatId: string,
    recipientId: string,
    amountKr: number,
    currency: string
  ) {
    // Verify sender is participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: senderId } },
    });
    if (!isParticipant) {
      throw new Error('Not authorized to send tips in this chat');
    }

    // Verify recipient is participant
    const recipientParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: recipientId } },
    });
    if (!recipientParticipant) {
      throw new Error('Recipient is not in this chat');
    }

    // Execute tip via WalletService
    const tipResult = await WalletService.sendTip(senderId, recipientId, amountKr, currency);

    // Send system message about the tip
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { displayName: true },
    });
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { displayName: true },
    });

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        payload: `💸 ${sender?.displayName} tipped ${recipient?.displayName} ${amountKr} Kr!`,
        isSystemEvent: true,
        status: 'sent',
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Broadcast to chat participants
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
      select: { userId: true },
    });

    participants.forEach(p => {
      io.to(`user:${p.userId}`).emit('chat:tip_sent', {
        message,
        tipAmount: amountKr,
        senderId,
        recipientId,
      });
    });

    return { success: true, tipResult, message };
  }
}
