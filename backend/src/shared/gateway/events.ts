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
