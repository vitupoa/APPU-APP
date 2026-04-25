import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';
import { ShopNotificationService } from './notifications.service.js';

export class FlashSaleService {

  static async createFlashSale(data: {
    title: string; description?: string; type: string;
    startTime: string; endTime: string;
    products: { productId: string; salePrice: number; stockLimit?: number; perUserLimit?: number }[];
  }) {
    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.flashSale.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type as any,
          status: 'SCHEDULED',
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
        }
      });

      await tx.flashSaleProduct.createMany({
        data: data.products.map(p => ({
          flashSaleId: s.id,
          productId: p.productId,
          salePrice: new Prisma.Decimal(p.salePrice),
          stockLimit: p.stockLimit,
          perUserLimit: p.perUserLimit,
        }))
      });

      return tx.flashSale.findUnique({
        where: { id: s.id },
        include: { products: { include: { product: { select: { id: true, title: true, imageUrls: true, priceKr: true } } } } }
      });
    });

    // Notify deal alert users and wishlist holders (outside transaction)
    const productIds = data.products.map(p => p.productId);
    await ShopNotificationService.notifyFlashSaleStarted(productIds, data.title).catch(() => {});
    for (const p of data.products) {
      const product = await prisma.product.findUnique({ where: { id: p.productId }, select: { title: true } });
      if (product) {
        await ShopNotificationService.notifyWishlistItemOnSale(p.productId, product.title, p.salePrice).catch(() => {});
      }
    }

    return sale;
  }

  static async getActiveFlashSales() {
    const now = new Date();
    const sales = await prisma.flashSale.findMany({
      where: {
        status: 'ACTIVE',
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        products: {
          include: {
            product: { select: { id: true, title: true, imageUrls: true, priceKr: true, stock: true } }
          }
        }
      },
      orderBy: { endTime: 'asc' }
    });

    return sales.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      type: s.type,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      timeRemaining: Math.max(0, s.endTime.getTime() - now.getTime()),
      products: s.products.map(p => ({
        productId: p.productId,
        salePrice: Number(p.salePrice),
        originalPrice: Number(p.product.priceKr),
        discount: Math.round((1 - Number(p.salePrice) / Number(p.product.priceKr)) * 100),
        stockLimit: p.stockLimit,
        soldCount: p.soldCount,
        perUserLimit: p.perUserLimit,
        product: { ...p.product, priceKr: Number(p.product.priceKr) },
      }))
    }));
  }

  static async getUpcomingFlashSales() {
    const now = new Date();
    return prisma.flashSale.findMany({
      where: { status: 'SCHEDULED', startTime: { gt: now } },
      include: { products: { include: { product: { select: { id: true, title: true, imageUrls: true, priceKr: true } } } } },
      orderBy: { startTime: 'asc' },
      take: 10
    });
  }
}

export class GroupBuyService {

  static async createGroupBuy(organizerId: string, data: {
    productId: string; title: string; description?: string;
    targetParticipants: number; discountPercent: number; expiresAt: string;
  }) {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: data.productId } });
    if (product.status !== 'active') throw new Error('Product not available');

    const groupBuy = await prisma.groupBuy.create({
      data: {
        productId: data.productId,
        organizerId,
        title: data.title,
        description: data.description,
        targetParticipants: data.targetParticipants,
        discountPercent: new Prisma.Decimal(data.discountPercent),
        expiresAt: new Date(data.expiresAt),
        status: 'OPEN',
      },
      include: {
        product: { select: { id: true, title: true, imageUrls: true, priceKr: true } },
        participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } }
      }
    });

    await prisma.groupBuyParticipant.create({
      data: { groupBuyId: groupBuy.id, userId: organizerId }
    });

    return formatGroupBuy(groupBuy);
  }

  static async joinGroupBuy(groupBuyId: string, userId: string) {
    const groupBuy = await prisma.groupBuy.findUniqueOrThrow({ where: { id: groupBuyId } });
    if (groupBuy.status !== 'OPEN') throw new Error('Group buy is not open');
    if (new Date() > groupBuy.expiresAt) throw new Error('Group buy has expired');

    await prisma.groupBuyParticipant.create({ data: { groupBuyId, userId } });

    const newCount = groupBuy.currentCount + 1;
    const status = newCount >= groupBuy.targetParticipants ? 'THRESHOLD_MET' : 'OPEN';

    await prisma.groupBuy.update({
      where: { id: groupBuyId },
      data: { currentCount: newCount, status: status as any }
    });

    return { joined: true, currentCount: newCount, targetParticipants: groupBuy.targetParticipants, status };
  }

  static async getActiveGroupBuys(cursor?: string, limit = 20) {
    const groupBuys = await prisma.groupBuy.findMany({
      where: { status: 'OPEN', expiresAt: { gt: new Date() } },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, title: true, imageUrls: true, priceKr: true } },
        participants: { include: { user: { select: { id: true, username: true, avatarUrl: true } } }, take: 5 }
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
    return prisma.dealAlert.create({
      data: {
        userId,
        productId: data.productId,
        category: data.category as any,
        maxPriceKr: data.maxPriceKr ? new Prisma.Decimal(data.maxPriceKr) : undefined,
        keywords: data.keywords || [],
        isActive: true,
      }
    });
  }

  static async getUserAlerts(userId: string) {
    return prisma.dealAlert.findMany({
      where: { userId, isActive: true },
      include: { product: { select: { id: true, title: true, imageUrls: true, priceKr: true } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async deleteAlert(alertId: string, userId: string) {
    const alert = await prisma.dealAlert.findUniqueOrThrow({ where: { id: alertId } });
    if (alert.userId !== userId) throw new Error('Not your alert');
    await prisma.dealAlert.update({ where: { id: alertId }, data: { isActive: false } });
  }
}

function formatGroupBuy(gb: any) {
  return {
    id: gb.id,
    title: gb.title,
    description: gb.description,
    targetParticipants: gb.targetParticipants,
    currentCount: gb.currentCount,
    discountPercent: Number(gb.discountPercent),
    status: gb.status,
    expiresAt: gb.expiresAt?.toISOString(),
    timeRemaining: Math.max(0, new Date(gb.expiresAt).getTime() - Date.now()),
    product: gb.product ? { ...gb.product, priceKr: Number(gb.product.priceKr) } : null,
    participants: gb.participants?.map((p: any) => p.user) || [],
    createdAt: gb.createdAt?.toISOString(),
  };
}
