import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

export class ShopAnalyticsService {

  // Record a daily analytic event (upsert by product+date)
  static async recordEvent(productId: string, event: {
    views?: number; clicks?: number; addToCart?: number; purchases?: number; revenue?: number;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.productAnalytic.upsert({
      where: { productId_date: { productId, date: today } },
      create: {
        productId,
        date: today,
        views: event.views || 0,
        clicks: event.clicks || 0,
        addToCart: event.addToCart || 0,
        purchases: event.purchases || 0,
        revenue: event.revenue ? new Prisma.Decimal(event.revenue) : 0,
      },
      update: {
        views: event.views ? { increment: event.views } : undefined,
        clicks: event.clicks ? { increment: event.clicks } : undefined,
        addToCart: event.addToCart ? { increment: event.addToCart } : undefined,
        purchases: event.purchases ? { increment: event.purchases } : undefined,
        revenue: event.revenue
          ? { increment: new Prisma.Decimal(event.revenue) }
          : undefined,
      },
    });
  }

  // Per-product analytics (last N days)
  static async getProductAnalytics(productId: string, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const rows = await prisma.productAnalytic.findMany({
      where: { productId, date: { gte: from } },
      orderBy: { date: 'asc' },
    });

    const totals = rows.reduce(
      (acc, r) => ({
        views: acc.views + r.views,
        clicks: acc.clicks + r.clicks,
        addToCart: acc.addToCart + r.addToCart,
        purchases: acc.purchases + r.purchases,
        revenue: acc.revenue + Number(r.revenue),
      }),
      { views: 0, clicks: 0, addToCart: 0, purchases: 0, revenue: 0 }
    );

    const conversionRate = totals.views > 0
      ? ((totals.purchases / totals.views) * 100).toFixed(2)
      : '0.00';

    return {
      productId,
      days,
      totals: { ...totals, conversionRate: parseFloat(conversionRate) },
      daily: rows.map((r: any) => ({
        date: r.date.toISOString().split('T')[0],
        views: r.views,
        clicks: r.clicks,
        addToCart: r.addToCart,
        purchases: r.purchases,
        revenue: Number(r.revenue),
      })),
    };
  }

  // Seller dashboard analytics
  static async getSellerAnalytics(sellerId: string, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    // Get all seller products
    const products = await prisma.product.findMany({
      where: { sellerId, status: { not: 'removed' } },
      select: { id: true, title: true, category: true, avgRating: true, viewCount: true, salesCount: true },
    });

    const productIds = products.map((p: any) => p.id);

    // Aggregate analytics across all products
    const analytics = await prisma.productAnalytic.groupBy({
      by: ['date'],
      where: { productId: { in: productIds }, date: { gte: from } },
      _sum: { views: true, clicks: true, addToCart: true, purchases: true, revenue: true },
      orderBy: { date: 'asc' },
    });

    // Total orders for seller
    const orderItems = await prisma.orderItem.findMany({
      where: { sellerId, order: { createdAt: { gte: from } } },
      select: { totalPriceKr: true, escrowStatus: true, order: { select: { status: true } } },
    });

    const totalRevenue = orderItems.reduce((s, i) => s + Number(i.totalPriceKr), 0);
    const platformFee = totalRevenue * 0.025;
    const netRevenue = totalRevenue - platformFee;

    // Reviews aggregate
    const reviewAgg = await prisma.productReview.aggregate({
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: true,
    });

    return {
      sellerId,
      days,
      products: products.map((p: any) => ({
        ...p,
        avgRating: Number(p.avgRating),
      })),
      totals: {
        totalRevenue,
        platformFee,
        netRevenue,
        totalOrders: orderItems.length,
        avgRating: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(2)) : 0,
        totalReviews: reviewAgg._count,
      },
      daily: analytics.map((a: any) => ({
        date: a.date.toISOString().split('T')[0],
        views: a._sum.views || 0,
        clicks: a._sum.clicks || 0,
        addToCart: a._sum.addToCart || 0,
        purchases: a._sum.purchases || 0,
        revenue: Number(a._sum.revenue || 0),
      })),
    };
  }

  // Category-level analytics
  static async getCategoryAnalytics(days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: { status: 'active' },
      _count: { id: true },
      _avg: { priceKr: true, avgRating: true },
      _sum: { viewCount: true, salesCount: true },
    });

    return categories.map((c: any) => ({
      category: c.category,
      totalProducts: c._count.id,
      avgPrice: c._avg.priceKr ? Number(Number(c._avg.priceKr).toFixed(2)) : 0,
      avgRating: c._avg.avgRating ? Number(Number(c._avg.avgRating).toFixed(2)) : 0,
      totalViews: c._sum.viewCount || 0,
      totalSales: c._sum.salesCount || 0,
    }));
  }
}
