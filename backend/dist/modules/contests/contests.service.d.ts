export declare class ContestService {
    /**
     * Creates contest with escrowed prize + 15% platform fee.
     * Atomically deducts from creator wallet.
     */
    static createContest(data: {
        creatorId: string;
        title: string;
        description: string;
        mediaType: string;
        category: string;
        prizeKr: number;
        requiredActions: {
            type: string;
            targetUrl?: string;
            label: string;
        }[];
        maxWinners: number;
        prizeDistribution: {
            rank: number;
            percentage: number;
        }[];
        judgingCriteria: string;
        sponsorName?: string;
        sponsorUrl?: string;
        deadline: Date;
        coverMediaUrl?: string;
        entryFeeKr?: number;
        publicVoteWeight?: number;
        allowDailyPrizes?: boolean;
        dailyPrizeKr?: number;
        targetAges?: number[];
        targetGeos?: string[];
        airdropKr?: number;
        airdropLimit?: number;
        judges?: string[];
    }): Promise<{
        prizeKr: import("@prisma/client-runtime-utils").Decimal;
        platformFeeKr: import("@prisma/client-runtime-utils").Decimal;
        totalChargedKr: import("@prisma/client-runtime-utils").Decimal;
        participantsCount: number;
        submissionsCount: number;
        createdAt: string;
        creator: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        actions: {
            id: string;
            contestId: string;
            actionType: import("../../generated/enums.js").RequirementType;
            targetUrl: string | null;
            label: string;
            isVerifiable: boolean;
            requiresUpload: boolean;
            sortOrder: number;
        }[];
        distributions: {
            id: string;
            contestId: string;
            rank: number;
            percentage: import("@prisma/client-runtime-utils").Decimal;
        }[];
        status: import("../../generated/enums.js").ContestStatus;
        description: string | null;
        id: string;
        title: string;
        category: string;
        mediaType: import("../../generated/enums.js").ContestMediaType;
        coverMediaUrl: string | null;
        prizeTotalKr: import("@prisma/client-runtime-utils").Decimal;
        entryFeeKr: import("@prisma/client-runtime-utils").Decimal | null;
        publicVoteWeight: number | null;
        targetAges: number[];
        targetGeos: string[];
        airdropKr: import("@prisma/client-runtime-utils").Decimal | null;
        airdropLimit: number | null;
        allowDailyPrizes: boolean;
        dailyPrizeKr: import("@prisma/client-runtime-utils").Decimal | null;
        maxWinners: number;
        judgingCriteria: import("../../generated/enums.js").JudgingCriteria;
        sponsorName: string | null;
        sponsorUrl: string | null;
        deadline: Date;
        totalParticipants: number;
        totalSubmissions: number;
        creatorId: string;
    }>;
    static listContests(params: {
        status?: string;
        cursor?: string;
        limit: number;
        userId?: string;
    }): Promise<{
        items: {
            id: any;
            creator: any;
            title: any;
            description: any;
            mediaType: any;
            contestCategory: any;
            prizeKr: number;
            platformFeeKr: number;
            totalChargedKr: number;
            maxWinners: any;
            judgingCriteria: any;
            sponsorName: any;
            sponsorUrl: any;
            deadline: any;
            coverMediaUrl: any;
            status: any;
            participantsCount: any;
            submissionsCount: any;
            isJoined: boolean;
            createdAt: any;
        }[];
        nextCursor: string | null;
    }>;
    static getContestById(contestId: string, userId?: string): Promise<{
        id: string;
        creator: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        title: string;
        description: string | null;
        mediaType: import("../../generated/enums.js").ContestMediaType;
        contestCategory: string;
        prizeKr: number;
        platformFeeKr: number;
        totalChargedKr: number;
        rules: any[];
        requiredActions: {
            type: any;
            targetUrl: any;
            label: any;
        }[];
        maxWinners: number;
        judgingCriteria: import("../../generated/enums.js").JudgingCriteria;
        sponsorName: string | null;
        sponsorUrl: string | null;
        deadline: string;
        coverMediaUrl: string | null;
        status: import("../../generated/enums.js").ContestStatus;
        participantsCount: number;
        submissionsCount: number;
        isJoined: boolean;
        createdAt: string;
    }>;
    static joinContest(userId: string, contestId: string): Promise<{
        id: string;
        userId: string;
        contestId: string;
        joinedAt: Date;
    }>;
    static submitEntry(data: {
        userId: string;
        contestId: string;
        mediaUrl: string;
        mediaType: string;
        proofUrls?: string[];
    }): Promise<{
        votes: number;
        proofScreenshots: string[];
        createdAt: string;
        user: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        id: string;
        userId: string;
        contestId: string;
        mediaType: string;
        rank: number | null;
        mediaUrl: string;
        proofUrls: string[];
        votesCount: number;
        judgeScore: import("@prisma/client-runtime-utils").Decimal | null;
        finalScore: import("@prisma/client-runtime-utils").Decimal | null;
        submittedAt: Date;
    }>;
    static getSubmissions(contestId: string, cursor?: string, limit?: number): Promise<{
        items: {
            id: string;
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
            };
            contestId: string;
            mediaUrl: string;
            mediaType: string;
            proofScreenshots: string[];
            votes: number;
            rank: number | null;
            createdAt: string;
        }[];
        nextCursor: string | null;
    }>;
    static getLeaderboard(contestId: string): Promise<{
        id: string;
        user: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        contestId: string;
        mediaUrl: string;
        mediaType: string;
        proofScreenshots: string[];
        votes: number;
        rank: number | null;
        createdAt: string;
    }[]>;
    /**
     * Get all contest submissions feed from active contests
     */
    static getSubmissionsFeed(cursor?: string, limit?: number, userId?: string): Promise<{
        items: {
            id: string;
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                isVerified: boolean;
            };
            contestId: string;
            contest: {
                id: string;
                title: string;
                prizeKr: number;
                status: import("../../generated/enums.js").ContestStatus;
            };
            mediaUrl: string;
            mediaType: string;
            caption: string;
            proofScreenshots: string[];
            votes: number;
            rank: number | null;
            createdAt: string;
        }[];
        nextCursor: string | null;
    }>;
    /**
     * Vote on a contest submission
     */
    static voteOnSubmission(userId: string, submissionId: string, voteType: 'UPVOTE' | 'DOWNVOTE'): Promise<{
        success: boolean;
        newVoteCount: number;
    }>;
    /**
     * Distributes prizes to winners atomically.
     * Uses prize distribution percentages from the contest.
     */
    static distributeContestPrizes(contestId: string, winnerIds: string[]): Promise<void>;
}
//# sourceMappingURL=contests.service.d.ts.map