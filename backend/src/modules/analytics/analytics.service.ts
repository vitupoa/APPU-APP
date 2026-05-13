import { prisma } from '../../config/database.js';

export class AnalyticsService {
  /**
   * Get aggregated analytics for a creator over a date range.
   * Returns daily stats + totals.
   */
  static async getCreatorAnalytics(userId: string, params: {
    days?: number;
  }) {
    const days = params.days ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const dailyStats = await prisma.daily_stats.findMany({
      where: {
        user_id: userId,
        date: { gte: since }
      },
      orderBy: { date: 'asc' }
    });

    // Aggregate totals
    const totals = dailyStats.reduce(
      (acc, stat) => ({
        totalViews: acc.totalViews + stat.views,
        totalLikes: acc.totalLikes + stat.likes,
        totalNewAdmirers: acc.totalNewAdmirers + stat.new_admirers,
        totalKrEarned: acc.totalKrEarned + Number(stat.kr_earned),
        totalKrSpent: acc.totalKrSpent + Number(stat.kr_spent)
      }),
      { totalViews: 0, totalLikes: 0, totalNewAdmirers: 0, totalKrEarned: 0, totalKrSpent: 0 }
    );

    // Earnings breakdown from completed transactions in the period
    const earningsBreakdown = await prisma.transactions.groupBy({
      by: ['type'],
      where: {
        user_id: userId,
        status: 'completed',
        created_at: { gte: since },
        amount_kr: { gt: 0 },
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
      _sum: { amount_kr: true },
      _count: true
    });

    // Current follower counts
    const admirerCount = await prisma.admires.count({
      where: { admired_id: userId }
    });
    const admiringCount = await prisma.admires.count({
      where: { admirer_id: userId }
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
        totalKr: Number(e._sum.amount_kr ?? 0),
        count: e._count
      })),
      dailyStats: dailyStats.map((s) => ({
        date: s.date.toISOString().split('T')[0],
        views: s.views,
        likes: s.likes,
        newAdmirers: s.new_admirers,
        krEarned: Number(s.kr_earned),
        krSpent: Number(s.kr_spent)
      }))
    };
  }

  /**
   * Record or increment daily stats (called by other services).
   * Uses upsert to create or update the record for today.
   */
  static async recordStat(userId: string, update: {
    views?: number;
    likes?: number;
    newAdmirers?: number;
    krEarned?: number;
    krSpent?: number;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.daily_stats.upsert({
      where: { user_id_date: { user_id: userId, date: today } },
      create: {
        user_id: userId,
        date: today,
        views: update.views ?? 0,
        likes: update.likes ?? 0,
        new_admirers: update.newAdmirers ?? 0,
        kr_earned: update.krEarned ?? 0,
        kr_spent: update.krSpent ?? 0
      },
      update: {
        ...(update.views && { views: { increment: update.views } }),
        ...(update.likes && { likes: { increment: update.likes } }),
        ...(update.newAdmirers && { new_admirers: { increment: update.newAdmirers } }),
        ...(update.krEarned && { kr_earned: { increment: update.krEarned } }),
        ...(update.krSpent && { kr_spent: { increment: update.krSpent } })
      }
    });
  }
}
