import { prisma } from '../../config/database.js';
import { io } from '../../shared/gateway/socket.js';

export class CallService {
  /**
   * Initiate a call (voice or video)
   */
  static async initiateCall(callerId: string, chatId: string, type: 'VOICE' | 'VIDEO') {
    // Verify caller is participant
    const callerParticipant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chat_id: chatId, user_id: callerId } },
    });
    if (!callerParticipant) throw new Error('Not a participant in this chat');

    // Check for existing active call in this chat
    const existingCall = await prisma.call.findFirst({
      where: { chat_id: chatId, status: { in: ['RINGING', 'ACTIVE'] } },
    });
    if (existingCall) throw new Error('There is already an active call in this chat');

    // Get all participants in the chat
    const chatParticipants = await prisma.chatParticipant.findMany({
      where: { chat_id: chatId },
      select: { user_id: true },
    });

    // Create call record
    const call = await prisma.call.create({
      data: {
        chat_id: chatId,
        caller_id: callerId,
        type,
        status: 'RINGING',
        participants: {
          create: chatParticipants.map((p) => ({
            user_id: p.user_id,
            status: p.user_id === callerId ? 'joined' : 'invited',
            joined_at: p.user_id === callerId ? new Date() : null,
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
      select: { id: true, username: true, display_name: true, avatar_url: true },
    });

    // Get chat info for display
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
          },
        },
      },
    });

    // Notify all other participants via WebSocket
    chatParticipants
      .filter((p) => p.user_id !== callerId)
      .forEach((p) => {
        io.to(`user:${p.user_id}`).emit('call:incoming', {
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

    const participant = call.participants.find(p => p.user_id === userId);
    if (!participant) throw new Error('Not a participant in this call');

    // Update participant status
    await prisma.call_participants.update({
      where: { id: participant.id },
      data: { status: 'joined', joined_at: new Date() },
    });

    // If first person to answer, update call status to ACTIVE
    if (call.status === 'RINGING') {
      await prisma.call.update({
        where: { id: callId },
        data: { status: 'ACTIVE', started_at: new Date() },
      });
    }

    // Notify all participants
    call.participants.forEach((p) => {
      io.to(`user:${p.user_id}`).emit('call:participant_joined', {
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

    const participant = call.participants.find(p => p.user_id === userId);
    if (!participant) throw new Error('Not a participant');

    await prisma.call_participants.update({
      where: { id: participant.id },
      data: { status: 'declined' },
    });

    // Check if all non-caller participants declined
    const otherParticipants = call.participants.filter((p) => p.user_id !== call.caller_id);
    const allDeclined = otherParticipants.every(
      p => p.user_id === userId ? true : p.status === 'declined'
    );

    if (allDeclined) {
      await prisma.call.update({
        where: { id: callId },
        data: { status: 'DECLINED', ended_at: new Date() },
      });
    }

    // Notify caller
    io.to(`user:${call.caller_id}`).emit('call:declined', { callId, userId });

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
    const durationSecs = call.started_at
      ? Math.floor((now.getTime() - call.started_at.getTime()) / 1000)
      : 0;

    await prisma.call.update({
      where: { id: callId },
      data: { status: 'ENDED', ended_at: now, duration_secs: durationSecs },
    });

    // Update all participants
    await prisma.call_participants.updateMany({
      where: { call_id: callId, status: 'joined' },
      data: { left_at: now },
    });

    // Mark invited-but-not-joined as missed
    await prisma.call_participants.updateMany({
      where: { call_id: callId, status: 'invited' },
      data: { status: 'missed' },
    });

    // Notify all participants
    call.participants.forEach((p) => {
      io.to(`user:${p.user_id}`).emit('call:ended', {
        callId,
        endedBy: userId,
        durationSecs,
      });
    });

    // Create system message in chat
    const durationStr = durationSecs > 0
      ? `${Math.floor(durationSecs / 60)}:${String(durationSecs % 60).padStart(2, '0')}`
      : 'missed';

    await prisma.messages.create({
      data: {
        chat_id: call.chat_id,
        sender_id: userId,
        payload: `📞 ${call.type === 'VIDEO' ? 'Video' : 'Voice'} call ended (${durationStr})`,
        is_system_event: true,
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
      where: { chatId_userId: { chat_id: chatId, user_id: userId } },
    });
    if (!isParticipant) throw new Error('Not authorized');

    const skip = (page - 1) * limit;

    return prisma.call.findMany({
      where: { chat_id: chatId },
      include: {
        participants: true,
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    });
  }
}
