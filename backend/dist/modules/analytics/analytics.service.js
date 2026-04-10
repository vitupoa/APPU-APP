"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const database_1 = require("../../config/database");
class AnalyticsService {
    /**
     * Get aggregated analytics for a creator over a date range.
     * Returns daily stats + totals.
     */
    static async getCreatorAnalytics(userId, params) {
        const days = params.days ?? 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        const dailyStats = await database_1.prisma.dailyStat.findMany({
            where: {
                userId,
                date: { gte: since }
            },
            orderBy: { date: 'asc' }
        });
        // Aggregate totals
        const totals = dailyStats.reduce((acc, stat) => ({
            totalViews: acc.totalViews + stat.views,
            totalLikes: acc.totalLikes + stat.likes,
            totalNewAdmirers: acc.totalNewAdmirers + stat.newAdmirers,
            totalKrEarned: acc.totalKrEarned + Number(stat.krEarned),
            totalKrSpent: acc.totalKrSpent + Number(stat.krSpent)
        }), { totalViews: 0, totalLikes: 0, totalNewAdmirers: 0, totalKrEarned: 0, totalKrSpent: 0 });
        // Earnings breakdown from completed transactions in the period
        const earningsBreakdown = await database_1.prisma.transaction.groupBy({
            by: ['type'],
            where: {
                userId,
                status: 'completed',
                createdAt: { gte: since },
                amountKr: { gt: 0 },
                type: {
                    in: [
                        'tip_received',
                        'contest_prize',
                        'subscription_earned',
                        'shop_sale',
                        'ad_revenue'
                    ]
                }
            },
            _sum: { amountKr: true },
            _count: true
        });
        // Current follower counts
        const admirerCount = await database_1.prisma.admire.count({
            where: { admiredId: userId }
        });
        const admiringCount = await database_1.prisma.admire.count({
            where: { admirerId: userId }
        });
        return {
            period: { days, since: since.toISOString() },
            totals: {
                views: totals.totalViews,
                likes: totals.totalLikes,
                newAdmirers: totals.totalNewAdmirers,
                krEarned: totals.totalKrEarned,
                krSpent: totals.totalKrSpent
            },
            currentFollowers: {
                admirers: admirerCount,
                admiring: admiringCount
            },
            earningsBreakdown: earningsBreakdown.map((e) => ({
                type: e.type,
                totalKr: Number(e._sum.amountKr ?? 0),
                count: e._count
            })),
            dailyStats: dailyStats.map((s) => ({
                date: s.date.toISOString().split('T')[0],
                views: s.views,
                likes: s.likes,
                newAdmirers: s.newAdmirers,
                krEarned: Number(s.krEarned),
                krSpent: Number(s.krSpent)
            }))
        };
    }
    /**
     * Record or increment daily stats (called by other services).
     * Uses upsert to create or update the record for today.
     */
    static async recordStat(userId, update) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await database_1.prisma.dailyStat.upsert({
            where: { userId_date: { userId, date: today } },
            create: {
                userId,
                date: today,
                views: update.views ?? 0,
                likes: update.likes ?? 0,
                newAdmirers: update.newAdmirers ?? 0,
                krEarned: update.krEarned ?? 0,
                krSpent: update.krSpent ?? 0
            },
            update: {
                ...(update.views && { views: { increment: update.views } }),
                ...(update.likes && { likes: { increment: update.likes } }),
                ...(update.newAdmirers && { newAdmirers: { increment: update.newAdmirers } }),
                ...(update.krEarned && { krEarned: { increment: update.krEarned } }),
                ...(update.krSpent && { krSpent: { increment: update.krSpent } })
            }
        });
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map