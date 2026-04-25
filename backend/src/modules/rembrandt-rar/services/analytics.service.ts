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
      prisma.user.count({ where: { accountType: 'CREATOR' } }),
      prisma.user.count({ where: { accountType: 'BUSINESS' } }),
      prisma.short.count(),
      prisma.post.count(),
      prisma.contest.count(),
      prisma.story.count(),
      prisma.contest.count({ where: { status: 'ACTIVE' } }),
      prisma.transaction.count(),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.withdrawalRequest.count({ where: { status: 'PENDING' } }),
      prisma.product.count(),
    ]);

    // Revenue: sum of platform_fee transactions
    const revenueResult = await prisma.transaction.aggregate({
      where: { type: 'platform_fee', status: 'completed' },
      _sum: { amountKr: true },
    });

    // Platform wallet balance
    const platformWallet = await prisma.platformWallet.findFirst({ where: { label: 'main' } });

    // Users created in last 24h, 7d, 30d
    const now = new Date();
    const [usersToday, usersWeek, usersMonth] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: new Date(now.getTime() - 86400000) } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(now.getTime() - 7 * 86400000) } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(now.getTime() - 30 * 86400000) } } }),
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
        platformRevenue: revenueResult._sum.amountKr?.toString() ?? '0',
        platformWalletBalance: platformWallet?.krBalance?.toString() ?? '0',
        pendingWithdrawals,
      },
    };
  }

  static async getUserGrowthChart(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const users = await prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped: Record<string, number> = {};
    for (const u of users) {
      const date = u.createdAt.toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    }

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  static async getRevenueChart(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const txns = await prisma.transaction.findMany({
      where: { type: 'platform_fee', status: 'completed', createdAt: { gte: since } },
      select: { amountKr: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    for (const t of txns) {
      const date = t.createdAt.toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + Number(t.amountKr);
    }

    return Object.entries(grouped).map(([date, amount]) => ({ date, amountKr: amount }));
  }

  static async getContentStats() {
    const now = new Date();
    const today = new Date(now.getTime() - 86400000);
    const week = new Date(now.getTime() - 7 * 86400000);

    const [shortsToday, shortsWeek, postsToday, postsWeek, contestsToday] = await Promise.all([
      prisma.short.count({ where: { createdAt: { gte: today } } }),
      prisma.short.count({ where: { createdAt: { gte: week } } }),
      prisma.post.count({ where: { createdAt: { gte: today } } }),
      prisma.post.count({ where: { createdAt: { gte: week } } }),
      prisma.contest.count({ where: { createdAt: { gte: today } } }),
    ]);

    return {
      shorts: { today: shortsToday, week: shortsWeek },
      posts: { today: postsToday, week: postsWeek },
      contests: { today: contestsToday },
    };
  }

  static async getTopCreators(limit = 10) {
    return prisma.user.findMany({
      where: { accountType: 'CREATOR' },
      orderBy: { admirers: { _count: 'desc' } },
      take: limit,
      select: {
        id: true, username: true, displayName: true, avatarUrl: true, isVerified: true,
        _count: { select: { admirers: true, shorts: true, contestsCreated: true } },
      },
    });
  }

  static async getAdminList() {
    return prisma.adminProfile.findMany({
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, email: true }
        }
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
