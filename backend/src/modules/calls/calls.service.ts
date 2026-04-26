import { prisma } from '../../config/database.js';
import { io } from '../../shared/gateway/socket.js';

export class CallService {
  /**
   * Initiate a call (voice or video)
   */
  static async initiateCall(callerId: string, chatId: string, type: 'VOICE' | 'VIDEO') {
    // Verify caller is participant
    const callerParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: callerId } },
    });
    if (!callerParticipant) throw new Error('Not a participant in this chat');

    // Check for existing active call in this chat
    const existingCall = await prisma.call.findFirst({
      where: { chatId, status: { in: ['RINGING', 'ACTIVE'] } },
    });
    if (existingCall) throw new Error('There is already an active call in this chat');

    // Get all participants in the chat
    const chatParticipants = await prisma.chatParticipant.findMany({
      where: { chatId },
      select: { userId: true },
    });

    // Create call record
    const call = await prisma.call.create({
      data: {
        chatId,
        callerId,
        type,
        status: 'RINGING',
        participants: {
          create: chatParticipants.map(p => ({
            userId: p.userId,
            status: p.userId === callerId ? 'joined' : 'invited',
            joinedAt: p.userId === callerId ? new Date() : null,
          })),
        },
      },
      include: {
        participants: true,
      },
    });

    // Get caller info
    const caller = await prisma.user.findUnique({
      where: { id: callerId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    // Get chat info for display
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    // Notify all other participants via WebSocket
    chatParticipants
      .filter(p => p.userId !== callerId)
      .forEach(p => {
        io.to(`user:${p.userId}`).emit('call:incoming', {
          call,
          caller,
          chat,
          type,
        });
      });

    return { call, caller };
  }

  /**
   * Answer a call
   */
  static async answerCall(callId: string, userId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { participants: true },
    });
    if (!call) throw new Error('Call not found');

    const participant = call.participants.find(p => p.userId === userId);
    if (!participant) throw new Error('Not a participant in this call');

    // Update participant status
    await prisma.callParticipant.update({
      where: { id: participant.id },
      data: { status: 'joined', joinedAt: new Date() },
    });

    // If first person to answer, update call status to ACTIVE
    if (call.status === 'RINGING') {
      await prisma.call.update({
        where: { id: callId },
        data: { status: 'ACTIVE', startedAt: new Date() },
      });
    }

    // Notify all participants
    call.participants.forEach(p => {
      io.to(`user:${p.userId}`).emit('call:participant_joined', {
        callId,
        userId,
      });
    });

    return { success: true };
  }

  /**
   * Decline a call
   */
  static async declineCall(callId: string, userId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { participants: true },
    });
    if (!call) throw new Error('Call not found');

    const participant = call.participants.find(p => p.userId === userId);
    if (!participant) throw new Error('Not a participant');

    await prisma.callParticipant.update({
      where: { id: participant.id },
      data: { status: 'declined' },
    });

    // Check if all non-caller participants declined
    const otherParticipants = call.participants.filter(p => p.userId !== call.callerId);
    const allDeclined = otherParticipants.every(
      p => p.userId === userId ? true : p.status === 'declined'
    );

    if (allDeclined) {
      await prisma.call.update({
        where: { id: callId },
        data: { status: 'DECLINED', endedAt: new Date() },
      });
    }

    // Notify caller
    io.to(`user:${call.callerId}`).emit('call:declined', { callId, userId });

    return { success: true };
  }

  /**
   * End a call
   */
  static async endCall(callId: string, userId: string) {
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: { participants: true },
    });
    if (!call) throw new Error('Call not found');

    const now = new Date();
    const durationSecs = call.startedAt
      ? Math.floor((now.getTime() - call.startedAt.getTime()) / 1000)
      : 0;

    await prisma.call.update({
      where: { id: callId },
      data: { status: 'ENDED', endedAt: now, durationSecs },
    });

    // Update all participants
    await prisma.callParticipant.updateMany({
      where: { callId, status: 'joined' },
      data: { leftAt: now },
    });

    // Mark invited-but-not-joined as missed
    await prisma.callParticipant.updateMany({
      where: { callId, status: 'invited' },
      data: { status: 'missed' },
    });

    // Notify all participants
    call.participants.forEach(p => {
      io.to(`user:${p.userId}`).emit('call:ended', {
        callId,
        endedBy: userId,
        durationSecs,
      });
    });

    // Create system message in chat
    const ender = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });

    const durationStr = durationSecs > 0
      ? `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`
      : 'missed';

    await prisma.message.create({
      data: {
        chatId: call.chatId,
        senderId: userId,
        payload: `📞 ${call.type === 'VIDEO' ? 'Video' : 'Voice'} call ended (${durationStr})`,
        isSystemEvent: true,
        status: 'sent',
      },
    });

    return { success: true, durationSecs };
  }

  /**
   * Get call history for a chat
   */
  static async getCallHistory(userId: string, chatId: string, page: number = 1, limit: number = 20) {
    // Verify user is participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!isParticipant) throw new Error('Not authorized');

    const skip = (page - 1) * limit;

    return prisma.call.findMany({
      where: { chatId },
      include: {
        participants: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }
}
