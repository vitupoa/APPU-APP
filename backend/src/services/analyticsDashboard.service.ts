import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  totalTransactions: number;
  contestsActive: number;
  chamasActive: number;
  productsListed: number;
  kycPending: number;
}

export class AnalyticsDashboardService {
  /**
   * Get overview metrics for dashboard
   */
  static async getOverviewMetrics(startDate?: Date, endDate?: Date): Promise<DashboardMetrics> {
    const dateFilter = startDate && endDate ? {
      created_at: {
        gte: startDate,
        lte: endDate
      }
    } : {};

    const [
      totalUsers,
      activeUsers,
      revenueData,
      totalTransactions,
      contestsActive,
      chamasActive,
      productsListed,
      kycPending
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          updated_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.transactions.aggregate({
        where: {
          status: 'completed',
          ...dateFilter
        },
        _sum: { amount_kr: true }
      }),
      prisma.transactions.count({
        where: {
          status: 'completed',
          ...dateFilter
        }
      }),
      prisma.contest.count({ where: { status: 'ACTIVE' } }),
      prisma.chama.count({ where: { status: 'ACTIVE' } }),
      prisma.products.count({ where: { status: 'active' } }),
      prisma.kyc_documents.count({ where: { status: 'PENDING' } })
    ]);

    return {
      totalUsers,
      activeUsers,
      totalRevenue: Number(revenueData._sum.amount_kr || 0),
      totalTransactions,
      contestsActive,
      chamasActive,
      productsListed,
      kycPending
    };
  }

  /**
   * Get revenue chart data (daily, weekly, monthly)
   */
  static async getRevenueChart(period: 'daily' | 'weekly' | 'monthly', days: number = 30): Promise<ChartData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(created_at) as date,
        SUM(amount_kr) as revenue,
        COUNT(*) as count
      FROM transactions
      WHERE status = 'completed'
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const labels = transactions.map(t => new Date(t.date).toLocaleDateString());
    const revenueData = transactions.map(t => Number(t.revenue));
    const countData = transactions.map(t => Number(t.count));

    return {
      labels,
      datasets: [
        {
          label: 'Revenue (KR)',
          data: revenueData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)'
        },
        {
          label: 'Transactions',
          data: countData,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)'
        }
      ]
    };
  }

  /**
   * Get user growth chart data
   */
  static async getUserGrowthChart(days: number = 30): Promise<ChartData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM "user"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const labels = users.map(u => new Date(u.date).toLocaleDateString());
    const data = users.map(u => Number(u.new_users));

    // Calculate cumulative
    const cumulative: number[] = [];
    let sum = 0;
    for (const count of data) {
      sum += count;
      cumulative.push(sum);
    }

    return {
      labels,
      datasets: [
        {
          label: 'New Users',
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)'
        },
        {
          label: 'Total Users',
          data: cumulative,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)'
        }
      ]
    };
  }

  /**
   * Get transaction type breakdown chart
   */
  static async getTransactionTypeChart(days: number = 30): Promise<ChartData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.$queryRaw<any[]>`
      SELECT 
        transaction_type,
        COUNT(*) as count,
        SUM(amount_kr) as total_amount
      FROM transactions
      WHERE created_at >= ${startDate}
        AND status = 'completed'
      GROUP BY transaction_type
      ORDER BY count DESC
    `;

    const labels = transactions.map(t => t.transaction_type || 'UNKNOWN');
    const counts = transactions.map(t => Number(t.count));
    const amounts = transactions.map(t => Number(t.total_amount));

    return {
      labels,
      datasets: [
        {
          label: 'Transaction Count',
          data: counts,
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderColor: 'rgba(255, 159, 64, 1)'
        },
        {
          label: 'Total Amount (KR)',
          data: amounts,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)'
        }
      ]
    };
  }

  /**
   * Get contest analytics chart
   */
  static async getContestAnalyticsChart(days: number = 30): Promise<ChartData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const contests = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as contests_created,
        SUM(total_participants) as total_participants,
        SUM(prize_total_kr) as total_prizes
      FROM contest
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const labels = contests.map(c => new Date(c.date).toLocaleDateString());
    const contestsData = contests.map(c => Number(c.contests_created));
    const participantsData = contests.map(c => Number(c.total_participants));
    const prizesData = contests.map(c => Number(c.total_prizes));

    return {
      labels,
      datasets: [
        {
          label: 'Contests Created',
          data: contestsData,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)'
        },
        {
          label: 'Total Participants',
          data: participantsData,
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          borderColor: 'rgba(255, 206, 86, 1)'
        },
        {
          label: 'Total Prizes (KR)',
          data: prizesData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)'
        }
      ]
    };
  }

  /**
   * Get shop analytics chart
   */
  static async getShopAnalyticsChart(days: number = 30): Promise<ChartData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const products = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as products_listed,
        SUM(view_count) as total_views,
        SUM(sales_count) as total_sales
      FROM products
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const labels = products.map(p => new Date(p.date).toLocaleDateString());
    const productsData = products.map(p => Number(p.products_listed));
    const viewsData = products.map(p => Number(p.total_views));
    const salesData = products.map(p => Number(p.total_sales));

    return {
      labels,
      datasets: [
        {
          label: 'Products Listed',
          data: productsData,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)'
        },
        {
          label: 'Total Views',
          data: viewsData,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)'
        },
        {
          label: 'Total Sales',
          data: salesData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)'
        }
      ]
    };
  }

  /**
   * Get chama analytics chart
   */
  static async getChamaAnalyticsChart(days: number = 30): Promise<ChartData> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const chamas = await prisma.$queryRaw<any[]>`
      SELECT 
        DATE(c.created_at) as date,
        COUNT(DISTINCT c.id) as chamas_created,
        COUNT(DISTINCT cm.id) as total_members,
        SUM(cw.kr_balance) as total_balance
      FROM chama c
      LEFT JOIN chama_member cm ON c.id = cm.chama_id
      LEFT JOIN chama_wallet cw ON c.id = cw.chama_id
      WHERE c.created_at >= ${startDate}
      GROUP BY DATE(c.created_at)
      ORDER BY date ASC
    `;

    const labels = chamas.map(c => new Date(c.date).toLocaleDateString());
    const chamasData = chamas.map(c => Number(c.chamas_created));
    const membersData = chamas.map(c => Number(c.total_members));
    const balanceData = chamas.map(c => Number(c.total_balance));

    return {
      labels,
      datasets: [
        {
          label: 'Chamas Created',
          data: chamasData,
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderColor: 'rgba(255, 159, 64, 1)'
        },
        {
          label: 'Total Members',
          data: membersData,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)'
        },
        {
          label: 'Total Balance (KR)',
          data: balanceData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)'
        }
      ]
    };
  }

  /**
   * Get top performing content
   */
  static async getTopContent(limit: number = 10) {
    const [topShorts, topPosts, topProducts] = await Promise.all([
      prisma.shorts.findMany({
        take: limit,
        orderBy: { views: 'desc' },
        include: { user: {
            select: { username: true, avatar_url: true }
          }
        }
      }),
      prisma.post.findMany({
        take: limit,
        orderBy: { likes_count: 'desc' },
        include: { user: {
            select: { username: true, avatar_url: true }
          }
        }
      }),
      prisma.products.findMany({
        take: limit,
        orderBy: { sales_count: 'desc' },
        include: { user: {
            select: { username: true, avatar_url: true }
          }
        }
      })
    ]);

    return {
      topShorts,
      topPosts,
      topProducts
    };
  }

  /**
   * Get platform health metrics
   */
  static async getPlatformHealth() {
    const [
      errorRate,
      avgResponseTime,
      activeConnections,
      queuedJobs
    ] = await Promise.all([
      // Calculate error rate from audit logs
      prisma.audit_logs.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          action_details: {
            path: ['success'],
            equals: false
          }
        }
      }),
      // Get average response time (mock data - implement with APM tool)
      Promise.resolve(250),
      // Get active connections (mock data - implement with Redis)
      Promise.resolve(1250),
      // Get queued jobs (mock data - implement with BullMQ)
      Promise.resolve(45)
    ]);

    return {
      errorRate,
      avgResponseTime,
      activeConnections,
      queuedJobs,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * Get real-time statistics
   */
  static async getRealTimeStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      activeUsers,
      recentTransactions,
      recentSignups,
      onlineUsers
    ] = await Promise.all([
      prisma.user.count({
        where: {
          updated_at: {
            gte: oneHourAgo
          }
        }
      }),
      prisma.transactions.count({
        where: {
          created_at: {
            gte: oneHourAgo
          }
        }
      }),
      prisma.user.count({
        where: {
          created_at: {
            gte: oneHourAgo
          }
        }
      }),
      // Mock online users - implement with Redis presence tracking
      Promise.resolve(850)
    ]);

    return {
      activeUsers,
      recentTransactions,
      recentSignups,
      onlineUsers,
      timestamp: now
    };
  }
}
