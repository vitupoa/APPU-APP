import { io } from './socket.js';
/**
 * Emit vote update to all connected clients
 */
export function emitVoteUpdate(submissionId, votes, userId) {
    if (!io)
        return;
    io.emit('vote_update', {
        submissionId,
        votes,
        userId
    });
}
/**
 * Emit contest update to all connected clients
 */
export function emitContestUpdate(contestId, status, participantsCount) {
    if (!io)
        return;
    io.emit('contest_update', {
        contestId,
        status,
        participantsCount
    });
}
/**
 * Emit like update to all connected clients
 */
export function emitLikeUpdate(contentId, contentType, likesCount) {
    if (!io)
        return;
    io.emit('like_update', {
        contentId,
        contentType,
        likesCount
    });
}
/**
 * Emit notification to specific user
 */
export function emitNotification(userId, notification) {
    if (!io)
        return;
    io.to(`user:${userId}`).emit('notification_received', notification);
}
/**
 * Emit wallet update to specific user
 */
export function emitWalletUpdate(userId, balance) {
    if (!io)
        return;
    io.to(`user:${userId}`).emit('wallet_updated', { balance });
}
/**
 * Emit milestone completion to specific user
 */
export function emitMilestoneCompleted(userId, milestone) {
    if (!io)
        return;
    io.to(`user:${userId}`).emit('milestone_completed', milestone);
}
//# sourceMappingURL=events.js.map