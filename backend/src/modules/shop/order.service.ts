import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { ShopAnalyticsService } from './analytics.service.js';
import { ShopNotificationService } from './notifications.service.js';

const PLATFORM_FEE_RATE = 0.025; // 2.5%

export class OrderService {

  // Create order from cart items
  static async createOrder(buyerId: string, notes?: string) {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: buyerId },
      include: {
        product: {
          select: {
            id: true, title: true, priceKr: true, wholesalePrice: true,
            wholesaleMinQty: true, stock: true, status: true, sellerId: true,
          }
        }
      }
    });

    if (!cartItems.length) throw new Error('Cart is empty');

    // Validate all products are active and in stock
    for (const item of cartItems) {
      if (item.product.status !== 'active') {
        throw new Error(`Product "${item.product.title}" is no longer available`);
      }
      if (item.product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${item.product.title}"`);
      }
    }

    // Calculate totals
    const lineItems = cartItems.map((item: any) => {
      const unitPrice = item.bargainPrice
        ? Number(item.bargainPrice)
        : (item.product.wholesalePrice && item.quantity >= (item.product.wholesaleMinQty || 999))
          ? Number(item.product.wholesalePrice)
          : Number(item.product.priceKr);
      return {
        productId: item.productId,
        sellerId: item.product.sellerId,
        quantity: item.quantity,
        unitPriceKr: unitPrice,
        totalPriceKr: unitPrice * item.quantity,
        title: item.product.title,
      };
    });

    const totalKr = lineItems.reduce((s, i) => s + i.totalPriceKr, 0);
    const platformFeeKr = totalKr * PLATFORM_FEE_RATE;

    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          buyerId,
          totalKr: new Prisma.Decimal(totalKr),
          platformFeeKr: new Prisma.Decimal(platformFeeKr),
          status: 'PENDING',
          notes,
          items: {
            create: lineItems.map((i: any) => ({
              productId: i.productId,
              sellerId: i.sellerId,
              quantity: i.quantity,
              unitPriceKr: new Prisma.Decimal(i.unitPriceKr),
              totalPriceKr: new Prisma.Decimal(i.totalPriceKr),
              escrowStatus: 'held',
            }))
          }
        },
        include: {
          items: { include: { product: { select: { id: true, title: true, imageUrls: true } } } }
        }
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId: buyerId } });

      // Record analytics per product
      for (const item of lineItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { salesCount: { increment: item.quantity } }
        });
      }

      return o;
    });

    // Fire analytics events (outside transaction)
    for (const item of lineItems) {
      await ShopAnalyticsService.recordEvent(item.productId, {
        purchases: item.quantity,
        revenue: item.totalPriceKr,
      }).catch(() => {});
    }

    // Notify buyer
    await ShopNotificationService.notifyOrderPlaced(buyerId, order.id, totalKr).catch(() => {});

    return formatOrder(order);
  }

  // Get buyer's orders
  static async getMyOrders(buyerId: string, cursor?: string, limit = 20) {
    const orders = await prisma.order.findMany({
      where: { buyerId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { id: true, title: true, imageUrls: true } } }
        }
      }
    });

    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, limit) : orders;
    return { items: items.map(formatOrder), nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  // Get seller's incoming orders
  static async getSellerOrders(sellerId: string, cursor?: string, limit = 20) {
    const orderItems = await prisma.orderItem.findMany({
      where: { sellerId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { order: { createdAt: 'desc' } },
      include: {
        order: { include: { buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
        product: { select: { id: true, title: true, imageUrls: true } },
      }
    });

    const hasMore = orderItems.length > limit;
    const items = hasMore ? orderItems.slice(0, limit) : orderItems;
    return { items: items.map(formatOrderItem), nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  // Update order status (seller confirms/ships)
  static async updateOrderStatus(orderId: string, sellerId: string, status: string) {
    // Verify seller has items in this order
    const item = await prisma.orderItem.findFirst({ where: { orderId, sellerId } });
    if (!item) throw new Error('No items in this order belong to you');

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
      include: { buyer: { select: { id: true } } }
    });

    // Notify buyer of status change
    await ShopNotificationService.notifyOrderStatusUpdate(
      order.buyer.id, orderId, status
    ).catch(() => {});

    return formatOrder(order);
  }

  // Confirm delivery & release escrow for a specific order item
  static async confirmDelivery(orderId: string, orderItemId: string, sellerId: string) {
    const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: orderItemId } });
    if (item.sellerId !== sellerId) throw new Error('Not your order item');
    if (item.escrowStatus !== 'held') throw new Error('Escrow already processed');

    const sellerPayout = Number(item.totalPriceKr) * (1 - PLATFORM_FEE_RATE);

    await prisma.$transaction([
      prisma.orderItem.update({
        where: { id: orderItemId },
        data: { escrowStatus: 'released', deliveredAt: new Date() }
      }),
      // Credit seller wallet
      prisma.wallet.upsert({
        where: { userId: sellerId },
        create: { userId: sellerId, krBalance: new Prisma.Decimal(sellerPayout) },
        update: { krBalance: { increment: new Prisma.Decimal(sellerPayout) } }
      }),
      prisma.transaction.create({
        data: {
          userId: sellerId,
          type: 'shop_sale',
          amountKr: new Prisma.Decimal(sellerPayout),
          status: 'completed',
          reference: orderItemId,
          metadata: { orderId, platformFee: Number(item.totalPriceKr) * PLATFORM_FEE_RATE },
        }
      }),
    ]);

    // Check if all items delivered → mark order DELIVERED
    const remaining = await prisma.orderItem.count({
      where: { orderId, escrowStatus: 'held' }
    });
    if (remaining === 0) {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'DELIVERED' } });
    }

    return { success: true, sellerPayout };
  }

  // Get single order
  static async getOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: {
          include: { product: { select: { id: true, title: true, imageUrls: true } } }
        },
        buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
      }
    });

    // Only buyer or a seller with items in this order can view
    const isBuyer = order.buyerId === userId;
    const isSeller = order.items.some(i => i.sellerId === userId);
    if (!isBuyer && !isSeller) throw new Error('Access denied');

    return formatOrder(order);
  }
}

export class DiscountService {

  static async createDiscount(sellerId: string, productId: string, data: {
    discountType: string; discountValue: number; minQuantity?: number;
    startDate: string; endDate: string;
  }) {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    if (product.sellerId !== sellerId) throw new Error('Not your product');

    return prisma.productDiscount.create({
      data: {
        productId,
        discountType: data.discountType,
        discountValue: new Prisma.Decimal(data.discountValue),
        minQuantity: data.minQuantity || 1,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: true,
      }
    });
  }

  static async getProductDiscounts(productId: string) {
    return prisma.productDiscount.findMany({
      where: { productId, isActive: true, endDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' }
    });
  }

  static async deleteDiscount(discountId: string, sellerId: string) {
    const discount = await prisma.productDiscount.findUniqueOrThrow({
      where: { id: discountId },
      include: { product: { select: { sellerId: true } } }
    });
    if (discount.product.sellerId !== sellerId) throw new Error('Not your product');
    await prisma.productDiscount.update({ where: { id: discountId }, data: { isActive: false } });
  }
}

function formatOrder(o: any) {
  return {
    id: o.id,
    buyerId: o.buyerId,
    buyer: o.buyer,
    totalKr: Number(o.totalKr),
    platformFeeKr: Number(o.platformFeeKr),
    status: o.status,
    notes: o.notes,
    createdAt: o.createdAt?.toISOString(),
    updatedAt: o.updatedAt?.toISOString(),
    items: o.items?.map(formatOrderItem) || [],
  };
}

function formatOrderItem(i: any) {
  return {
    id: i.id,
    orderId: i.orderId,
    productId: i.productId,
    product: i.product,
    sellerId: i.sellerId,
    quantity: i.quantity,
    unitPriceKr: Number(i.unitPriceKr),
    totalPriceKr: Number(i.totalPriceKr),
    escrowStatus: i.escrowStatus,
    deliveredAt: i.deliveredAt?.toISOString() || null,
    order: i.order ? {
      id: i.order.id,
      status: i.order.status,
      createdAt: i.order.createdAt?.toISOString(),
      buyer: i.order.buyer,
    } : undefined,
  };
}
