import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

export class ShopAnalyticsService {

  // Record a daily analytic event (upsert by product+date)
  static async recordEvent(productId: string, event: {
    views?: number; clicks?: number; addToCart?: number; purchases?: number; revenue?: number;
  }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.product_analytics.upsert({
      where: { product_id_date: { product_id: productId, date: today } },
      create: {
        product_id: productId,
        date: today,
        views: event.views || 0,
        clicks: event.clicks || 0,
        add_to_cart: event.addToCart || 0,
        purchases: event.purchases || 0,
        revenue: event.revenue ? new Prisma.Decimal(event.revenue) : 0,
      },
      update: {
        views: event.views ? { increment: event.views } : undefined,
        clicks: event.clicks ? { increment: event.clicks } : undefined,
        add_to_cart: event.addToCart ? { increment: event.addToCart } : undefined,
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

    const rows = await prisma.product_analytics.findMany({
      where: { product_id: productId, date: { gte: from } },
      orderBy: { date: 'asc' },
    });

    const totals = rows.reduce(
      (acc: any, r: any) => ({
        views: acc.views + r.views,
        clicks: acc.clicks + r.clicks,
        addToCart: acc.addToCart + r.add_to_cart,
        purchases: acc.purchases + r.purchases,
        revenue: acc.revenue + Number(r.revenue),
      }),
      { views: 0, clicks: 0, addToCart: 0, purchases: 0, revenue: 0 }
    );

    const conversionRate = totals.views > 0
      ? ((totals.purchases / totals.views) * 100).toFixed(2)
      : '0.00';

    return {
      product_id: productId,
      days,
      totals: { ...totals, conversionRate: parseFloat(conversionRate) },
      daily: rows.map((r: any) => ({
        date: r.date.toISOString().split('T')[0],
        views: r.views,
        clicks: r.clicks,
        addToCart: r.add_to_cart,
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
    const products = await prisma.products.findMany({
      where: { seller_id: sellerId, status: { not: 'removed' } },
      select: { id: true, title: true, category: true, avg_rating: true, view_count: true, sales_count: true },
    });

    const productIds = products.map((p: any) => p.id);

    // Aggregate analytics across all products
    const analytics = await prisma.product_analytics.groupBy({
      by: ['date'],
      where: { product_id: { in: productIds }, date: { gte: from } },
      _sum: { views: true, clicks: true, add_to_cart: true, purchases: true, revenue: true },
      orderBy: { date: 'asc' },
    });

    // Total orders for seller
    const orderItems = await prisma.order_items.findMany({
      where: { seller_id: sellerId, orders: { created_at: { gte: from } } },
      select: { total_price_kr: true, escrow_status: true, orders: { select: { status: true } } },
    });

    const totalRevenue = orderItems.reduce((s: number, i: any) => s + Number(i.total_price_kr), 0);
    const platformFee = totalRevenue * 0.025;
    const netRevenue = totalRevenue - platformFee;

    // Reviews aggregate
    const reviewAgg = await prisma.product_reviews.aggregate({
      where: { product_id: { in: productIds } },
      _avg: { rating: true },
      _count: true,
    });

    return {
      seller_id: sellerId,
      days,
      products: products.map((p: any) => ({
        ...p,
        avgRating: Number(p.avg_rating),
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
        addToCart: a._sum.add_to_cart || 0,
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

    const categories = await prisma.products.groupBy({
      by: ['category'],
      where: { status: 'active' },
      _count: { id: true },
      _avg: { price_kr: true, avg_rating: true },
      _sum: { view_count: true, sales_count: true },
    });

    return categories.map((c: any) => ({
      category: c.category,
      totalProducts: c._count.id,
      avgPrice: c._avg.price_kr ? Number(Number(c._avg.price_kr).toFixed(2)) : 0,
      avgRating: c._avg.avg_rating ? Number(Number(c._avg.avg_rating).toFixed(2)) : 0,
      total_views: c._sum.view_count || 0,
      totalSales: c._sum.sales_count || 0,
    }));
  }
}
