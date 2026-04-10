import { Prisma } from '@prisma/client';
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
    }): Promise<{
        prizeKr: Prisma.Decimal;
        platformFeeKr: Prisma.Decimal;
        totalChargedKr: Prisma.Decimal;
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
            label: string;
            sortOrder: number;
            contestId: string;
            actionType: string;
            targetUrl: string;
            isVerifiable: boolean;
        }[];
        distributions: {
            id: string;
            contestId: string;
            rank: number;
            percentage: Prisma.Decimal;
        }[];
        status: import(".prisma/client").$Enums.ContestStatus;
        id: string;
        creatorId: string;
        title: string;
        description: string | null;
        mediaType: import(".prisma/client").$Enums.ContestMediaType;
        category: string;
        coverMediaUrl: string | null;
        prizeTotalKr: Prisma.Decimal;
        maxWinners: number;
        judgingCriteria: import(".prisma/client").$Enums.JudgingCriteria;
        sponsorName: string | null;
        sponsorUrl: string | null;
        deadline: Date;
        totalParticipants: number;
        totalSubmissions: number;
    }>;
    static listContests(params: {
        status?: string;
        cursor?: string;
        limit: number;
        userId?: string;
    }): Promise<{
        items: {
            id: string;
            creator: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
            };
            title: string;
            description: string | null;
            mediaType: import(".prisma/client").$Enums.ContestMediaType;
            contestCategory: string;
            prizeKr: number;
            platformFeeKr: number;
            totalChargedKr: number;
            maxWinners: number;
            judgingCriteria: import(".prisma/client").$Enums.JudgingCriteria;
            sponsorName: string | null;
            sponsorUrl: string | null;
            deadline: string;
            coverMediaUrl: string | null;
            status: import(".prisma/client").$Enums.ContestStatus;
            participantsCount: number;
            submissionsCount: number;
            isJoined: boolean;
            createdAt: string;
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
        mediaType: import(".prisma/client").$Enums.ContestMediaType;
        contestCategory: string;
        prizeKr: number;
        platformFeeKr: number;
        totalChargedKr: number;
        rules: string[];
        requiredActions: {
            type: string;
            targetUrl: string;
            label: string;
        }[];
        maxWinners: number;
        judgingCriteria: import(".prisma/client").$Enums.JudgingCriteria;
        sponsorName: string | null;
        sponsorUrl: string | null;
        deadline: string;
        coverMediaUrl: string | null;
        status: import(".prisma/client").$Enums.ContestStatus;
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
        mediaUrl: string;
        proofUrls: string[];
        votesCount: number;
        rank: number | null;
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
     * Distributes prizes to winners atomically.
     * Uses prize distribution percentages from the contest.
     */
    static distributeContestPrizes(contestId: string, winnerIds: string[]): Promise<void>;
}
//# sourceMappingURL=contests.service.d.ts.map