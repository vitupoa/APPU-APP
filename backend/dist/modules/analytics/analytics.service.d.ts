export declare class AnalyticsService {
    /**
     * Get aggregated analytics for a creator over a date range.
     * Returns daily stats + totals.
     */
    static getCreatorAnalytics(userId: string, params: {
        days?: number;
    }): Promise<{
        period: {
            days: number;
            since: string;
        };
        totals: {
            views: number;
            likes: number;
            newAdmirers: number;
            krEarned: number;
            krSpent: number;
        };
        currentFollowers: {
            admirers: number;
            admiring: number;
        };
        earningsBreakdown: {
            type: string;
            totalKr: number;
            count: number;
        }[];
        dailyStats: {
            date: string;
            views: number;
            likes: number;
            newAdmirers: number;
            krEarned: number;
            krSpent: number;
        }[];
    }>;
    /**
     * Record or increment daily stats (called by other services).
     * Uses upsert to create or update the record for today.
     */
    static recordStat(userId: string, update: {
        views?: number;
        likes?: number;
        newAdmirers?: number;
        krEarned?: number;
        krSpent?: number;
    }): Promise<void>;
}
//# sourceMappingURL=analytics.service.d.ts.map