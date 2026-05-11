import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';
import { io } from '../../shared/gateway/socket.js';
import { WalletService } from '../wallet/wallet.service.js';

export class ChatService {
  /**
   * Create or fetch existing Direct Chat
   */
  static async createDirectChat(userId: string, recipientId: string) {
    // Allow self-chat
    // if (userId === recipientId) {
    //   throw new Error('Cannot create chat with yourself');
    // }

    // Check if a direct chat already exists between these two users (or self-chat)
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

    // Create new direct chat (including self-chat)
    const participantIds = userId === recipientId ? [userId] : [userId, recipientId];
    
    const newChat = await prisma.chat.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: participantIds.map(id => ({ userId: id, role: 'member' })),
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    // Broadcast new chat to user(s) in real-time
    io.to(`user:${userId}`).emit('chat:new_chat', newChat);
    if (userId !== recipientId) {
      io.to(`user:${recipientId}`).emit('chat:new_chat', newChat);
    }

    return newChat;
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
          create: allParticipantIds.map((id: any) => ({
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
    allParticipantIds.forEach((pid: any) => {
      io.to(`user:${pid}`).emit('chat:new_chat', chat);
    });

    return chat;
  }

  /**
   * Fetch all chats for a user
   */
  static async getChats(userId: string, page: number = 1, limit: number = 20, unreadOnly: boolean = false) {
    const skip = (page - 1) * limit;

    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });

    if (!unreadOnly) return chats;

    // Filter for unread chats
    const unreadChats = [];
    for (const chat of chats) {
      const participant = await prisma.chatParticipant.findUnique({
        where: { chatId_userId: { chatId: chat.id, userId } },
      });

      if (!participant) continue;

      const unreadCount = await prisma.message.count({
        where: {
          chatId: chat.id,
          senderId: { not: userId },
          createdAt: { gt: participant.lastRead },
        },
      });

      if (unreadCount > 0) {
        unreadChats.push(chat);
      }
    }

    return unreadChats;
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
    thumbnailUrl?: string,
    replyToId?: string,
    forwardedFromId?: string
  ) {
    // Ensure sender is participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: senderId } },
    });

    if (!isParticipant) {
      throw new Error('Not authorized to send message in this chat');
    }

    // Sanitize payload
    const sanitizedPayload = payload.trim().substring(0, 10000);

    // Validate media URL if provided
    if (mediaUrl) {
      const { validateMediaUrl } = await import('../../utils/media-validator.js');
      const validation = validateMediaUrl(mediaUrl);
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid media URL');
      }
      
      // Use sanitized URL
      mediaUrl = validation.sanitizedUrl;
    }

    const message = await (prisma.message.create as any)({
      data: {
        chatId,
        senderId,
        payload: sanitizedPayload,
        mediaUrl,
        mediaType,
        thumbnailUrl,
        replyToId,
        forwardedFromId,
        status: 'sent',
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        replyTo: { 
          include: { 
            sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            replyTo: {
              include: {
                sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
              }
            }
          } 
        },
        forwardedFrom: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Update replies count if this is a reply
    if (replyToId) {
      await prisma.message.update({
        where: { id: replyToId },
        data: { repliesCount: { increment: 1 } }
      });
    }

    // Update chat's updatedAt for sorting and fetch updated chat with latest message
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
      include: {
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    // Find all participants to broadcast message via WebSocket
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
      select: { userId: true },
    });

    participants.forEach((p: any) => {
      // Emit new message to each user's secure channel
      io.to(`user:${p.userId}`).emit('chat:new_message', message);
      
      // Emit updated chat to refresh chat list in real-time
      io.to(`user:${p.userId}`).emit('chat:updated', updatedChat);
    });

    return message;
  }

  /**
   * Delete a message (only sender can delete)
   */
  static async deleteMessage(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: { include: { participants: true } } },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Only the sender can delete this message');
    }

    await prisma.message.delete({ where: { id: messageId } });

    // Broadcast deletion to all participants
    message.chat.participants.forEach((p: any) => {
      io.to(`user:${p.userId}`).emit('chat:message_deleted', {
        chatId: message.chatId,
        messageId,
      });
    });

    return { success: true, message: 'Message deleted' };
  }

  /**
   * Forward a message to another chat
   */
  static async forwardMessage(
    userId: string,
    messageId: string,
    targetChatId: string
  ) {
    // Get original message
    const originalMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    if (!originalMessage) {
      throw new Error('Message not found');
    }

    // Verify user is participant in target chat
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: targetChatId, userId } },
    });

    if (!isParticipant) {
      throw new Error('Not authorized to send message in this chat');
    }

    // Create forwarded message
    const forwardedMessage = await (prisma.message.create as any)({
      data: {
        chatId: targetChatId,
        senderId: userId,
        payload: originalMessage.payload,
        mediaUrl: originalMessage.mediaUrl,
        mediaType: originalMessage.mediaType,
        forwardedFromId: originalMessage.senderId,
        status: 'sent',
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        forwardedFrom: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    });

    // Update chat's updatedAt
    const updatedChat = await prisma.chat.update({
      where: { id: targetChatId },
      data: { updatedAt: new Date() },
      include: {
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    // Broadcast to target chat participants
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId: targetChatId },
      select: { userId: true },
    });

    participants.forEach((p: any) => {
      io.to(`user:${p.userId}`).emit('chat:new_message', forwardedMessage);
      io.to(`user:${p.userId}`).emit('chat:updated', updatedChat);
    });

    return forwardedMessage;
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

    return (prisma.message.findMany as any)({
      where: { chatId },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        replyTo: { 
          include: { 
            sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            replyTo: {
              include: {
                sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
              }
            }
          } 
        },
        forwardedFrom: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
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

    participants.forEach((p: any) => {
      io.to(`user:${p.userId}`).emit('chat:tip_sent', {
        message,
        tipAmount: amountKr,
        senderId,
        recipientId,
      });
    });

    return { success: true, tipResult, message };
  }

  /**
   * Update group chat details (name, description, avatarUrl)
   * Only admins can update
   */
  static async updateGroupChat(
    userId: string,
    chatId: string,
    updates: { name?: string; description?: string; avatarUrl?: string | null }
  ) {
    // Verify chat exists and is a group
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.type !== 'GROUP') {
      throw new Error('Can only update group chats');
    }

    // Verify user is admin
    const participant = chat.participants.find(p => p.userId === userId);
    if (!participant || participant.role !== 'admin') {
      throw new Error('Only admins can update group details');
    }

    // Update chat
    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: updates,
      include: {
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
      },
    });

    // Broadcast update to all participants
    chat.participants.forEach((p: any) => {
      io.to(`user:${p.userId}`).emit('chat:updated', updatedChat);
    });

    return updatedChat;
  }

  /**
   * Manage group member (promote, demote, kick)
   * Only admins can manage members
   */
  static async manageMember(
    userId: string,
    chatId: string,
    targetUserId: string,
    action: 'promote' | 'demote' | 'kick'
  ) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('Group not found');
    }

    const requester = chat.participants.find(p => p.userId === userId);
    if (!requester || requester.role !== 'admin') {
      throw new Error('Only admins can manage members');
    }

    const target = chat.participants.find(p => p.userId === targetUserId);
    if (!target) {
      throw new Error('User is not a member of this group');
    }

    if (action === 'kick') {
      await prisma.chatParticipant.delete({
        where: { chatId_userId: { chatId, userId: targetUserId } },
      });

      // Broadcast member removed
      chat.participants.forEach((p: any) => {
        io.to(`user:${p.userId}`).emit('chat:member_removed', {
          chatId,
          userId: targetUserId,
        });
      });

      return { success: true, message: 'Member removed' };
    }

    const newRole = action === 'promote' ? 'admin' : 'member';
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId: targetUserId } },
      data: { role: newRole },
    });

    // Broadcast role change
    chat.participants.forEach((p: any) => {
      io.to(`user:${p.userId}`).emit('chat:member_role_changed', {
        chatId,
        userId: targetUserId,
        newRole,
      });
    });

    return { success: true, message: `Member ${action}d successfully` };
  }

  /**
   * Transfer group ownership
   * Only current admin can transfer
   */
  static async transferOwnership(
    userId: string,
    chatId: string,
    newOwnerId: string
  ) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('Group not found');
    }

    const currentOwner = chat.participants.find(p => p.userId === userId);
    if (!currentOwner || currentOwner.role !== 'admin') {
      throw new Error('Only the owner can transfer ownership');
    }

    const newOwner = chat.participants.find(p => p.userId === newOwnerId);
    if (!newOwner) {
      throw new Error('New owner is not a member of this group');
    }

    // Demote current owner to member
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { role: 'member' },
    });

    // Promote new owner to admin
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId: newOwnerId } },
      data: { role: 'admin' },
    });

    // Broadcast ownership transfer
    chat.participants.forEach((p: any) => {
      io.to(`user:${p.userId}`).emit('chat:ownership_transferred', {
        chatId,
        oldOwnerId: userId,
        newOwnerId,
      });
    });

    return { success: true, message: 'Ownership transferred successfully' };
  }

  /**
   * Leave group
   */
  static async leaveGroup(userId: string, chatId: string) {
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('Group not found');
    }

    const participant = chat.participants.find(p => p.userId === userId);
    if (!participant) {
      throw new Error('You are not a member of this group');
    }

    // If user is the only admin, prevent leaving
    const admins = chat.participants.filter((p: any) => p.role === 'admin');
    if (admins.length === 1 && participant.role === 'admin') {
      throw new Error('Transfer ownership before leaving the group');
    }

    await prisma.chatParticipant.delete({
      where: { chatId_userId: { chatId, userId } },
    });

    // Broadcast member left
    chat.participants.forEach((p: any) => {
      if (p.userId !== userId) {
        io.to(`user:${p.userId}`).emit('chat:member_left', {
          chatId,
          userId,
        });
      }
    });

    return { success: true, message: 'You have left the group' };
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(userId: string, chatId: string) {
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!participant) {
      throw new Error('Not a participant in this chat');
    }

    await prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastRead: new Date() },
    });

    return { success: true, message: 'Messages marked as read' };
  }

  /**
   * Send typing indicator
   */
  static async sendTypingIndicator(userId: string, chatId: string, isTyping: boolean) {
    // Verify user is participant
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });

    if (!participant) {
      throw new Error('Not a participant in this chat');
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    // Get all participants except the sender
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId, userId: { not: userId } },
      select: { userId: true },
    });

    // Broadcast typing indicator to other participants (not to self)
    participants.forEach((p: any) => {
      io.to(`user:${p.userId}`).emit('chat:typing', {
        chatId,
        userId,
        user,
        isTyping,
      });
    });

    return { success: true };
  }
}
