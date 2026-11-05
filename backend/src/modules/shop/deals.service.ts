import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { ShopNotificationService } from './notifications.service.js';
import crypto from 'crypto';

export class FlashSaleService {

  static async createFlashSale(data: {
    title: string; description?: string; type: string;
    startTime: string; endTime: string;
    products: { product_id: string; salePrice: number; stockLimit?: number; perUserLimit?: number }[];
  }) {
    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.flash_sales.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type as any,
          status: 'SCHEDULED',
          start_time: new Date(data.startTime),
          end_time: new Date(data.endTime),
        }
      });

      await tx.flash_sale_products.createMany({
        data: data.products.map((p: any) => ({
          flash_sale_id: s.id,
          product_id: p.product_id,
          sale_price: new Prisma.Decimal(p.salePrice),
          stock_limit: p.stockLimit,
          per_user_limit: p.perUserLimit,
        }))
      });

      return tx.flash_sales.findUnique({
        where: { id: s.id },
        include: { flash_sale_products: { include: { products: { select: { id: true, title: true, image_urls: true, price_kr: true } } } } }
      });
    });

    // Notify deal alert users and wishlist holders (outside transaction)
    const productIds = data.products.map((p: any) => p.product_id);
    await ShopNotificationService.notifyFlashSaleStarted(productIds, data.title).catch(() => {});
    for (const p of data.products) {
      const product = await prisma.products.findUnique({ where: { id: p.product_id }, select: { title: true } });
      if (product) {
        await ShopNotificationService.notifyWishlistItemOnSale(p.product_id, product.title, p.salePrice).catch(() => {});
      }
    }

    return sale;
  }

  static async getActiveFlashSales() {
    const now = new Date();
    const sales = await prisma.flash_sales.findMany({
      where: {
        status: 'ACTIVE',
        start_time: { lte: now },
        end_time: { gte: now },
      },
      include: {
        flash_sale_products: {
          include: {
            products: { select: { id: true, title: true, image_urls: true, price_kr: true, stock: true } }
          }
        }
      },
      orderBy: { end_time: 'asc' }
    });

    return sales.map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      type: s.type,
      start_time: s.start_time.toISOString(),
      end_time: s.end_time.toISOString(),
      timeRemaining: Math.max(0, s.end_time.getTime() - now.getTime()),
      products: s.flash_sale_products.map((p: any) => ({
        product_id: p.product_id,
        salePrice: Number(p.sale_price),
        originalPrice: Number(p.products.price_kr),
        discount: Math.round((1 - Number(p.sale_price) / Number(p.products.price_kr)) * 100),
        stockLimit: p.stock_limit,
        soldCount: p.sold_count,
        perUserLimit: p.per_user_limit,
        product: { ...p.products, price_kr: Number(p.products.price_kr) },
      }))
    }));
  }

  static async getUpcomingFlashSales() {
    const now = new Date();
    return prisma.flash_sales.findMany({
      where: { status: 'SCHEDULED', start_time: { gt: now } },
      include: { flash_sale_products: { include: { products: { select: { id: true, title: true, image_urls: true, price_kr: true } } } } },
      orderBy: { start_time: 'asc' },
      take: 10
    });
  }
}

export class GroupBuyService {

  static async createGroupBuy(organizerId: string, data: {
    product_id: string; title: string; description?: string;
    targetParticipants: number; discountPercent: number; expiresAt: string;
  }) {
    const product = await prisma.products.findUniqueOrThrow({ where: { id: data.product_id } });
    if (product.status !== 'active') throw new Error('Product not available');

    const groupBuy = await prisma.group_buys.create({
      data: {
        product_id: data.product_id,
        organizer_id: organizerId,
        title: data.title,
        description: data.description,
        target_participants: data.targetParticipants,
        discount_percent: new Prisma.Decimal(data.discountPercent),
        expires_at: new Date(data.expiresAt),
        status: 'OPEN',
      },
      include: {
        products: { select: { id: true, title: true, image_urls: true, price_kr: true } },
        group_buy_participants: { include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } } }
      }
    });

    await prisma.group_buy_participants.create({
      data: { group_buy_id: groupBuy.id, user_id: organizerId }
    } as any);

    return formatGroupBuy(groupBuy);
  }

  static async joinGroupBuy(groupBuyId: string, userId: string) {
    const groupBuy = await prisma.group_buys.findUniqueOrThrow({ where: { id: groupBuyId } });
    if (groupBuy.status !== 'OPEN') throw new Error('Group buy is not open');
    if (new Date() > groupBuy.expires_at) throw new Error('Group buy has expired');

    await prisma.group_buy_participants.create({
      data: { group_buy_id: groupBuyId, user_id: userId }
    } as any);

    const newCount = groupBuy.current_count + 1;
    const status = newCount >= groupBuy.target_participants ? 'THRESHOLD_MET' : 'OPEN';

    await prisma.group_buys.update({
      where: { id: groupBuyId },
      data: { current_count: newCount, status: status as any }
    });

    return { joined: true, currentCount: newCount, targetParticipants: groupBuy.target_participants, status };
  }

  static async getActiveGroupBuys(cursor?: string, limit = 20) {
    const groupBuys = await prisma.group_buys.findMany({
      where: { status: 'OPEN', expires_at: { gt: new Date() } },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: {
        products: { select: { id: true, title: true, image_urls: true, price_kr: true } },
        group_buy_participants: { include: { user: { select: { id: true, username: true, avatar_url: true } } }, take: 5 }
      }
    });

    const hasMore = groupBuys.length > limit;
    const items = hasMore ? groupBuys.slice(0, limit) : groupBuys;
    return { items: items.map(formatGroupBuy), nextCursor: hasMore ? items[items.length - 1].id : null };
  }
}

export class DealAlertService {

  static async createAlert(userId: string, data: {
    productId?: string; category?: string; maxPriceKr?: number; keywords?: string[];
  }) {
    return prisma.deal_alerts.create({
      data: {
        user_id: userId,
        product_id: data.productId,
        category: data.category as any,
        max_price_kr: data.maxPriceRc ? new Prisma.Decimal(data.maxPriceKr) : undefined,
        keywords: data.keywords || [],
        is_active: true,
      }
    });
  }

  static async getUserAlerts(userId: string) {
    return prisma.deal_alerts.findMany({
      where: { user_id: userId, is_active: true },
      include: { products: { select: { id: true, title: true, image_urls: true, price_kr: true } } },
      orderBy: { created_at: 'desc' }
    });
  }

  static async deleteAlert(alertId: string, userId: string) {
    const alert = await prisma.deal_alerts.findUniqueOrThrow({ where: { id: alertId } });
    if (alert.user_id !== userId) throw new Error('Not your alert');
    await prisma.deal_alerts.update({ where: { id: alertId }, data: { is_active: false } });
  }
}

function formatGroupBuy(gb: any) {
  return {
    id: gb.id,
    title: gb.title,
    description: gb.description,
    targetParticipants: gb.target_participants,
    currentCount: gb.current_count,
    discountPercent: Number(gb.discount_percent),
    status: gb.status,
    expires_at: gb.expires_at?.toISOString(),
    timeRemaining: Math.max(0, new Date(gb.expires_at).getTime() - Date.now()),
    product: gb.products ? { ...gb.products, price_kr: Number(gb.products.price_kr) } : null,
    participants: gb.group_buy_participants?.map((p: any) => p.user) || [],
    created_at: gb.created_at?.toISOString(),
  };
}
