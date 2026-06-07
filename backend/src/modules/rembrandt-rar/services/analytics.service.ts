import { prisma } from '../../../config/database.js';

export class AnalyticsService {
  static async getDashboardOverview() {
    const [
      totalUsers, totalCreators, totalBusinesses,
      totalShorts, totalPosts, totalContests, totalStories,
      activeContests, totalTransactions,
      suspendedUsers, verifiedUsers,
      pendingWithdrawals, totalProducts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { account_type: 'CREATOR' } }),
      prisma.user.count({ where: { account_type: 'BUSINESS' } }),
      prisma.shorts.count(),
      prisma.post.count(),
      prisma.contest.count(),
      prisma.story.count(),
      prisma.contest.count({ where: { status: 'ACTIVE' } }),
      prisma.transactions.count(),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.count({ where: { is_verified: true } }),
      prisma.withdrawal_requests.count({ where: { status: 'PENDING' } }),
      prisma.products.count(),
    ]);

    // Revenue: sum of platform_fee transactions
    const revenueResult = await prisma.transactions.aggregate({
      where: { type: 'platform_fee', status: 'completed' },
      _sum: { amount_kr: true },
    });

    // Platform wallet balance
    const platformWallet = await prisma.platform_wallet.findFirst({ where: { label: 'main' } });

    // Users created in last 24h, 7d, 30d
    const now = new Date();
    const [usersToday, usersWeek, usersMonth] = await Promise.all([
      prisma.user.count({ where: { created_at: { gte: new Date(now.getTime() - 86400000) } } }),
      prisma.user.count({ where: { created_at: { gte: new Date(now.getTime() - 7 * 86400000) } } }),
      prisma.user.count({ where: { created_at: { gte: new Date(now.getTime() - 30 * 86400000) } } }),
    ]);

    return {
      users: {
        total: totalUsers,
        creators: totalCreators,
        businesses: totalBusinesses,
        suspended: suspendedUsers,
        verified: verifiedUsers,
        growth: { today: usersToday, week: usersWeek, month: usersMonth },
      },
      content: {
        shorts: totalShorts,
        posts: totalPosts,
        contests: { total: totalContests, active: activeContests },
        stories: totalStories,
        products: totalProducts,
      },
      financial: {
        totalTransactions,
        platformRevenue: revenueResult._sum.amount_kr?.toString() ?? '0',
        platformWalletBalance: platformWallet?.kr_balance?.toString() ?? '0',
        pendingWithdrawals,
      },
    };
  }

  static async getUserGrowthChart(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const users = await prisma.user.findMany({
      where: { created_at: { gte: since } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    for (const u of users) {
      const date = u.created_at.toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    }

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  static async getRevenueChart(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const txns = await prisma.transactions.findMany({
      where: { type: 'platform_fee', status: 'completed', created_at: { gte: since } },
      select: { amount_kr: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });

    const grouped: Record<string, number> = {};
    for (const t of txns) {
      const date = t.created_at.toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + Number(t.amount_kr);
    }

    return Object.entries(grouped).map(([date, amount]) => ({ date, amount_kr: amount }));
  }

  static async getContentStats() {
    const now = new Date();
    const today = new Date(now.getTime() - 86400000);
    const week = new Date(now.getTime() - 7 * 86400000);

    const [shortsToday, shortsWeek, postsToday, postsWeek, contestsToday] = await Promise.all([
      prisma.shorts.count({ where: { created_at: { gte: today } } }),
      prisma.shorts.count({ where: { created_at: { gte: week } } }),
      prisma.post.count({ where: { created_at: { gte: today } } }),
      prisma.post.count({ where: { created_at: { gte: week } } }),
      prisma.contest.count({ where: { created_at: { gte: today } } }),
    ]);

    return {
      shorts: { today: shortsToday, week: shortsWeek },
      posts: { today: postsToday, week: postsWeek },
      contests: { today: contestsToday },
    };
  }

  static async getTopCreators(limit = 10) {
    return prisma.user.findMany({
      where: { account_type: 'CREATOR' },
      orderBy: { admirers_count: 'desc' },
      take: limit,
      select: {
        id: true, username: true, display_name: true, avatar_url: true, is_verified: true,
        admirers_count: true,
        _count: { select: { shorts: true, Contest: true } },
      },
    });
  }

  static async getAdminList() {
    return prisma.admin_profile.findMany({
      include: {
        user: {
          select: { id: true, username: true, display_name: true, avatar_url: true, email: true }
        }
      },
      orderBy: { created_at: 'asc' },
    });
  }
}
