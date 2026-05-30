import { prisma } from '../../config/database.js';
import { io } from '../../shared/gateway/socket.js';
import { WalletService } from '../wallet/wallet.service.js';
import { v4 as uuidv4 } from 'uuid';
import { lockedChatTaskService } from '../../services/compliance/lockedChatTask.service.js';

export class ChatService {
  /**
   * Create or fetch existing Direct Chat
   */
  static async createDirectChat(userId: string, recipient_id: string) {
    // Allow self-chat
    // if (userId === recipientId) {
    //   throw new Error('Cannot create chat with yourself');
    // }

    // Check if a direct chat already exists between these two users (or self-chat)
    const existingChat = await prisma.chat.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { user_id: userId } } },
          { participants: { some: { user_id: recipient_id } } },
        ],
      },
      include: {
        participants: { include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } } },
        messages: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    if (existingChat) return existingChat;

    // Create new direct chat (including self-chat)
    const participantIds = userId === recipient_id ? [userId] : [userId, recipient_id];
    
    const newChat = await prisma.chat.create({
      data: {
        id: uuidv4(),
        type: 'DIRECT',
        participants: {
          createMany: {
            data: participantIds.map(id => ({ 
              id: uuidv4(),
              user_id: id,
              role: 'member' 
            })),
          },
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } } },
        messages: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    // Broadcast new chat to user(s) in real-time
    io.to(`user:${userId}`).emit('chat:new_chat', newChat);
    if (userId !== recipient_id) {
      io.to(`user:${recipient_id}`).emit('chat:new_chat', newChat);
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
        id: uuidv4(),
        type: 'GROUP',
        name,
        description,
        participants: {
          createMany: {
            data: allParticipantIds.map((id: any) => ({
              id: uuidv4(),
              user_id: id,
              role: id === userId ? 'admin' : 'member',
            })),
          },
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } } },
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
      where: { participants: { some: { user_id: userId } } },
      include: {
        participants: { include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } } },
        messages: { orderBy: { created_at: 'desc' }, take: 1 },
      },
      orderBy: { updated_at: 'desc' },
      skip,
      take: limit,
    });

    if (!unreadOnly) return chats;

    // Filter for unread chats
    const unreadChats = [];
    for (const chat of chats) {
      const participant = await prisma.chatParticipant.findUnique({
        where: { chatId_userId: { chat_id: chat.id, user_id: userId } },
      });

      if (!participant) continue;

      const unreadCount = await prisma.messages.count({
        where: {
          chat_id: chat.id,
          sender_id: { not: userId },
          created_at: { gt: participant.lastRead },
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
   * Wave 3 Task 6.4: Check locked chat access before allowing messages
   */
  static async sendMessage(
    senderId: string,
    chat_id: string,
    payload: string,
    mediaUrl?: string,
    mediaType?: string,
    thumbnailUrl?: string,
    replyToId?: string,
    forwardedFromId?: string
  ) {
    // Ensure sender is participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chat_id, user_id: senderId } },
    });

    if (!isParticipant) {
      throw new Error('Not authorized to send message in this chat');
    }

    // Wave 3 Task 6.4: Check locked chat access for DIRECT chats
    const chat = await prisma.chat.findUnique({
      where: { id: chat_id },
      include: { participants: true }
    });

    if (chat && chat.type === 'DIRECT' && chat.participants.length === 2) {
      // Find the other participant (potential creator)
      const otherParticipant = chat.participants.find(p => p.user_id !== senderId);

      if (otherParticipant) {
        const accessCheck = await lockedChatTaskService.canUserMessageCreator(senderId, otherParticipant.user_id);

        if (!accessCheck.canMessage) {
          throw new Error(
            `Chat is locked. Unlock fee: ${accessCheck.unlockFeeKr} Kr. Please unlock chat with a task to message this creator.`
          );
        }
      }
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

    const message = await prisma.messages.create({
      data: {
        id: uuidv4(),
        chat_id,
        sender_id: senderId,
        payload: sanitizedPayload,
        media_url: mediaUrl,
        media_type: mediaType,
        ...(replyToId && { reply_to_id: replyToId }),
        ...(forwardedFromId && { forwarded_from_id: forwardedFromId }),
        status: 'sent',
      },
      include: {
        User_messages_sender_idToUser: { select: { id: true, username: true, display_name: true, avatar_url: true } },
        User_messages_forwarded_from_idToUser: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      },
    });

    // Update replies count if this is a reply
    if (replyToId) {
      await prisma.messages.update({
        where: { id: replyToId },
        data: { replies_count: { increment: 1 } }
      });
    }

    // Update chat's updatedAt for sorting and fetch updated chat with latest message
    const updatedChat = await prisma.chat.update({
      where: { id: chat_id },
      data: { updated_at: new Date() },
      include: {
        participants: { include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } } },
        messages: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    // Find all participants to broadcast message via WebSocket
    const participants = await prisma.chatParticipant.findMany({
      where: { chat_id },
      select: { user_id: true },
    });

    participants.forEach((p: any) => {
      // Emit new message to each user's secure channel
      io.to(`user:${p.user_id}`).emit('chat:new_message', message);
      
      // Emit updated chat to refresh chat list in real-time
      io.to(`user:${p.user_id}`).emit('chat:updated', updatedChat);
    });

    return message;
  }

  /**
   * Delete a message (only sender can delete)
   */
  static async deleteMessage(userId: string, messageId: string) {
    const message = await prisma.messages.findUnique({
      where: { id: messageId },
      include: { chat: { include: { participants: true } } },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.sender_id !== userId) {
      throw new Error('Only the sender can delete this message');
    }

    await prisma.messages.delete({ where: { id: messageId } });

    // Broadcast deletion to all participants
    if (message.chat) {
      message.chat.participants.forEach((p: any) => {
        io.to(`user:${p.user_id}`).emit('chat:message_deleted', {
          chat_id: message.chat_id,
          messageId,
        });
      });
    }

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
    const originalMessage = await prisma.messages.findUnique({
      where: { id: messageId },
      include: {
        User_messages_sender_idToUser: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      },
    });

    if (!originalMessage) {
      throw new Error('Message not found');
    }

    // Verify user is participant in target chat
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chat_id: targetChatId, user_id: userId } },
    });

    if (!isParticipant) {
      throw new Error('Not authorized to send message in this chat');
    }

    // Create forwarded message
    const forwardedMessage = await prisma.messages.create({
      data: {
        id: uuidv4(),
        chat_id: targetChatId,
        sender_id: userId,
        payload: originalMessage.payload,
        media_url: originalMessage.media_url,
        media_type: originalMessage.media_type,
        forwarded_from_id: originalMessage.sender_id,
        status: 'sent',
      },
      include: {
        User_messages_sender_idToUser: { select: { id: true, username: true, display_name: true, avatar_url: true } },
        User_messages_forwarded_from_idToUser: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      },
    });

    // Update chat's updatedAt
    const updatedChat = await prisma.chat.update({
      where: { id: targetChatId },
      data: { updated_at: new Date() },
      include: {
        participants: { include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } } },
        messages: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    });

    // Broadcast to target chat participants
    const participants = await prisma.chatParticipant.findMany({
      where: { chat_id: targetChatId },
      select: { user_id: true },
    });

    participants.forEach((p: any) => {
      io.to(`user:${p.user_id}`).emit('chat:new_message', forwardedMessage);
      io.to(`user:${p.user_id}`).emit('chat:updated', updatedChat);
    });

    return forwardedMessage;
  }

  /**
   * Fetch messages for a chat
   */
  static async getMessages(userId: string, chat_id: string, page: number = 1, limit: number = 50) {
    // Ensure user is participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chat_id, user_id: userId } },
    });

    if (!isParticipant) {
      throw new Error('Not authorized to view messages in this chat');
    }

    const skip = (page - 1) * limit;

    return prisma.messages.findMany({
      where: { chat_id },
      include: {
        User_messages_sender_idToUser: { select: { id: true, username: true, display_name: true, avatar_url: true } },
        User_messages_forwarded_from_idToUser: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    });
  }

  /**
   * Send a tip in a chat (direct or group).
   */
  static async sendTipInChat(
    senderId: string,
    chat_id: string,
    recipient_id: string,
    amount_kr: number,
    currency: string
  ) {
    // Verify sender is participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chat_id, user_id: senderId } },
    });
    if (!isParticipant) {
      throw new Error('Not authorized to send tips in this chat');
    }

    // Verify recipient is participant
    const recipientParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chat_id, user_id: recipient_id } },
    });
    if (!recipientParticipant) {
      throw new Error('Recipient is not in this chat');
    }

    // Execute tip via WalletService
    const tipResult = await WalletService.sendTip(senderId, recipient_id, amount_kr, currency);

    // Send system message about the tip
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { display_name: true },
    });
    const recipient = await prisma.user.findUnique({
      where: { id: recipient_id },
      select: { display_name: true },
    });

    const message = await prisma.messages.create({
      data: {
        id: uuidv4(),
        chat_id,
        sender_id: senderId,
        payload: `💸 ${sender?.display_name} tipped ${recipient?.display_name} ${amount_kr} Kr!`,
        is_system_event: true,
        status: 'sent',
      },
      include: {
        User_messages_sender_idToUser: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      },
    });

    // Broadcast to chat participants
    const participants = await prisma.chatParticipant.findMany({
      where: { chat_id },
      select: { user_id: true },
    });

    participants.forEach((p: any) => {
      io.to(`user:${p.user_id}`).emit('chat:tip_sent', {
        message,
        tip_amount: amount_kr,
        sender_id: senderId,
        recipient_id,
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
    chat_id: string,
    updates: { name?: string; description?: string; avatarUrl?: string | null }
  ) {
    // Verify chat exists and is a group
    const chat = await prisma.chat.findUnique({
      where: { id: chat_id },
      include: { participants: true },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    if (chat.type !== 'GROUP') {
      throw new Error('Can only update group chats');
    }

    // Verify user is admin
    const participant = chat.participants.find(p => p.user_id === userId);
    if (!participant || participant.role !== 'admin') {
      throw new Error('Only admins can update group details');
    }

    // Update chat
    const updatedChat = await prisma.chat.update({
      where: { id: chat_id },
      data: updates,
      include: {
        participants: { include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } } },
      },
    });

    // Broadcast update to all participants
    chat.participants.forEach((p: any) => {
      io.to(`user:${p.user_id}`).emit('chat:updated', updatedChat);
    });

    return updatedChat;
  }

  /**
   * Manage group member (promote, demote, kick)
   * Only admins can manage members
   */
  static async manageMember(
    userId: string,
    chat_id: string,
    targetUserId: string,
    action: 'promote' | 'demote' | 'kick'
  ) {
    const chat = await prisma.chat.findUnique({
      where: { id: chat_id },
      include: { participants: true },
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('Group not found');
    }

    const requester = chat.participants.find(p => p.user_id === userId);
    if (!requester || requester.role !== 'admin') {
      throw new Error('Only admins can manage members');
    }

    const target = chat.participants.find(p => p.user_id === targetUserId);
    if (!target) {
      throw new Error('User is not a member of this group');
    }

    if (action === 'kick') {
      await prisma.chatParticipant.delete({
        where: { chatId_userId: { chat_id, user_id: targetUserId } },
      });

      // Broadcast member removed
      chat.participants.forEach((p: any) => {
        io.to(`user:${p.user_id}`).emit('chat:member_removed', {
          chat_id,
          user_id: targetUserId,
        });
      });

      return { success: true, message: 'Member removed' };
    }

    const newRole = action === 'promote' ? 'admin' : 'member';
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chat_id, user_id: targetUserId } },
      data: { role: newRole },
    });

    // Broadcast role change
    chat.participants.forEach((p: any) => {
      io.to(`user:${p.user_id}`).emit('chat:member_role_changed', {
        chat_id,
        user_id: targetUserId,
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
    chat_id: string,
    newOwnerId: string
  ) {
    const chat = await prisma.chat.findUnique({
      where: { id: chat_id },
      include: { participants: true },
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('Group not found');
    }

    const currentOwner = chat.participants.find(p => p.user_id === userId);
    if (!currentOwner || currentOwner.role !== 'admin') {
      throw new Error('Only the owner can transfer ownership');
    }

    const newOwner = chat.participants.find(p => p.user_id === newOwnerId);
    if (!newOwner) {
      throw new Error('New owner is not a member of this group');
    }

    // Demote current owner to member
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chat_id, user_id: userId } },
      data: { role: 'member' },
    });

    // Promote new owner to admin
    await prisma.chatParticipant.update({
      where: { chatId_userId: { chat_id, user_id: newOwnerId } },
      data: { role: 'admin' },
    });

    // Broadcast ownership transfer
    chat.participants.forEach((p: any) => {
      io.to(`user:${p.user_id}`).emit('chat:ownership_transferred', {
        chat_id,
        oldOwnerId: userId,
        newOwnerId,
      });
    });

    return { success: true, message: 'Ownership transferred successfully' };
  }

  /**
   * Leave group
   */
  static async leaveGroup(userId: string, chat_id: string) {
    const chat = await prisma.chat.findUnique({
      where: { id: chat_id },
      include: { participants: true },
    });

    if (!chat || chat.type !== 'GROUP') {
      throw new Error('Group not found');
    }

    const participant = chat.participants.find(p => p.user_id === userId);
    if (!participant) {
      throw new Error('You are not a member of this group');
    }

    // If user is the only admin, prevent leaving
    const admins = chat.participants.filter((p: any) => p.role === 'admin');
    if (admins.length === 1 && participant.role === 'admin') {
      throw new Error('Transfer ownership before leaving the group');
    }

    await prisma.chatParticipant.delete({
      where: { chatId_userId: { chat_id, user_id: userId } },
    });

    // Broadcast member left
    chat.participants.forEach((p: any) => {
      if (p.user_id !== userId) {
        io.to(`user:${p.user_id}`).emit('chat:member_left', {
          chat_id,
          user_id: userId,
        });
      }
    });

    return { success: true, message: 'You have left the group' };
  }

  /**
   * Mark messages as read
   */
  static async markAsRead(userId: string, chat_id: string) {
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chat_id, user_id: userId } },
    });

    if (!participant) {
      throw new Error('Not a participant in this chat');
    }

    await prisma.chatParticipant.update({
      where: { chatId_userId: { chat_id, user_id: userId } },
      data: { lastRead: new Date() },
    });

    return { success: true, message: 'Messages marked as read' };
  }

  /**
   * Send typing indicator
   */
  static async sendTypingIndicator(userId: string, chat_id: string, isTyping: boolean) {
    // Verify user is participant
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chat_id, user_id: userId } },
    });

    if (!participant) {
      throw new Error('Not a participant in this chat');
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, display_name: true, avatar_url: true },
    });

    // Get all participants except the sender
    const participants = await prisma.chatParticipant.findMany({
      where: { chat_id, user_id: { not: userId } },
      select: { user_id: true },
    });

    // Broadcast typing indicator to other participants (not to self)
    participants.forEach((p: any) => {
      io.to(`user:${p.user_id}`).emit('chat:typing', {
        chat_id,
        user_id: userId,
        user,
        isTyping,
      });
    });

    return { success: true };
  }
}
