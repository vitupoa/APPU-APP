/**
 * Emit vote update to all connected clients
 */
export declare function emitVoteUpdate(submissionId: string, votes: number, userId: string): void;
/**
 * Emit contest update to all connected clients
 */
export declare function emitContestUpdate(contestId: string, status: string, participantsCount: number): void;
/**
 * Emit like update to all connected clients
 */
export declare function emitLikeUpdate(contentId: string, contentType: string, likesCount: number): void;
/**
 * Emit notification to specific user
 */
export declare function emitNotification(userId: string, notification: any): void;
/**
 * Emit wallet update to specific user
 */
export declare function emitWalletUpdate(userId: string, balance: number): void;
/**
 * Emit milestone completion to specific user
 */
export declare function emitMilestoneCompleted(userId: string, milestone: any): void;
//# sourceMappingURL=events.d.ts.map