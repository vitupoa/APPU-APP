import { io } from './socket.js';

/**
 * Emit vote update to all connected clients
 */
export function emitVoteUpdate(submissionId: string, votes: number, userId: string) {
  if (!io) return;
  
  io.emit('vote_update', {
    submissionId,
    votes,
    userId
  });
}

/**
 * Emit contest update to all connected clients
 */
export function emitContestUpdate(contestId: string, status: string, participantsCount: number) {
  if (!io) return;
  
  io.emit('contest_update', {
    contestId,
    status,
    participantsCount
  });
}

/**
 * Emit like update to all connected clients
 */
export function emitLikeUpdate(contentId: string, contentType: string, likesCount: number) {
  if (!io) return;
  
  io.emit('like_update', {
    contentId,
    contentType,
    likesCount
  });
}

/**
 * Emit notification to specific user
 */
export function emitNotification(userId: string, notification: any) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('notification_received', notification);
}

/**
 * Emit wallet update to specific user
 */
export function emitWalletUpdate(userId: string, balance: number) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('wallet_updated', { balance });
}

/**
 * Emit milestone completion to specific user
 */
export function emitMilestoneCompleted(userId: string, milestone: any) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('milestone_completed', milestone);
}

// ─── CHAT EVENTS ──────────────────────────────────────────

/**
 * Emit new message to all chat participants
 */
export function emitChatMessage(participantUserIds: string[], message: any) {
  if (!io) return;

  participantUserIds.forEach(uid => {
    io.to(`user:${uid}`).emit('chat:new_message', message);
  });
}

/**
 * Emit typing indicator to chat participants
 */
export function emitChatTyping(participantUserIds: string[], data: { chatId: string; userId: string; username: string; isTyping: boolean }) {
  if (!io) return;

  participantUserIds.forEach(uid => {
    if (uid !== data.userId) {
      io.to(`user:${uid}`).emit('chat:typing', data);
    }
  });
}

/**
 * Emit read receipt to chat participants
 */
export function emitChatReadReceipt(participantUserIds: string[], data: { chatId: string; userId: string; lastRead: string }) {
  if (!io) return;

  participantUserIds.forEach(uid => {
    if (uid !== data.userId) {
      io.to(`user:${uid}`).emit('chat:read_receipt', data);
    }
  });
}

/**
 * Emit new chat creation notification to all participants
 */
export function emitNewChat(participantUserIds: string[], chat: any) {
  if (!io) return;

  participantUserIds.forEach(uid => {
    io.to(`user:${uid}`).emit('chat:new_chat', chat);
  });
}
