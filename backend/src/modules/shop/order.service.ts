import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { ShopAnalyticsService } from './analytics.service.js';
import { ShopNotificationService } from './notifications.service.js';
import crypto from 'crypto';

const PLATFORM_FEE_RATE = 0.025; // 2.5%

export class OrderService {

  // Create order from cart items
  static async createOrder(buyerId: string, notes?: string) {
    const cartItems = await prisma.cart_items.findMany({
      where: { user_id: buyerId },
      include: {
        products: {
          select: {
            id: true, title: true, price_kr: true, wholesale_price: true,
            wholesale_min_qty: true, stock: true, status: true, seller_id: true,
          }
        }
      }
    });

    if (!cartItems.length) throw new Error('Cart is empty');

    // Validate all products are active and in stock
    for (const item of cartItems) {
      if (item.products.status !== 'active') {
        throw new Error(`Product "${item.products.title}" is no longer available`);
      }
      if (item.products.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${item.products.title}"`);
      }
    }

    // Calculate totals
    const lineItems = cartItems.map((item: any) => {
      const unitPrice = item.bargain_price
        ? Number(item.bargain_price)
        : (item.products.wholesale_price && item.quantity >= (item.products.wholesale_min_qty || 999))
          ? Number(item.products.wholesale_price)
          : Number(item.products.price_kr);
      return {
        product_id: item.product_id,
        seller_id: item.products.seller_id,
        quantity: item.quantity,
        unitPriceKr: unitPrice,
        totalPriceKr: unitPrice * item.quantity,
        title: item.products.title,
      };
    });

    const totalKr = lineItems.reduce((s: number, i: any) => s + i.totalPriceKr, 0);
    const platformFeeKr = totalKr * PLATFORM_FEE_RATE;

    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.orders.create({
        data: {
          buyer_id: buyerId,
          total_kr: new Prisma.Decimal(totalKr),
          platform_fee_kr: new Prisma.Decimal(platformFeeKr),
          status: 'PENDING',
          notes,
          updated_at: new Date(),
          order_items: {
            create: lineItems.map((i: any) => ({
              product_id: i.product_id,
              seller_id: i.seller_id,
              quantity: i.quantity,
              unit_price_kr: new Prisma.Decimal(i.unitPriceKr),
              total_price_kr: new Prisma.Decimal(i.totalPriceKr),
              escrow_status: 'held',
            }))
          }
        },
        include: {
          order_items: { include: { products: { select: { id: true, title: true, image_urls: true } } } }
        }
      });

      // Clear cart
      await tx.cart_items.deleteMany({ where: { user_id: buyerId } });

      // Record analytics per product
      for (const item of lineItems) {
        await tx.products.update({
          where: { id: item.product_id },
          data: { sales_count: { increment: item.quantity } }
        });
      }

      return o;
    });

    // Fire analytics events (outside transaction)
    for (const item of lineItems) {
      await ShopAnalyticsService.recordEvent(item.product_id, {
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
    const orders = await prisma.orders.findMany({
      where: { buyer_id: buyerId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: {
        order_items: {
          include: { products: { select: { id: true, title: true, image_urls: true } } }
        }
      }
    });

    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, limit) : orders;
    return { items: items.map(formatOrder), nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  // Get seller's incoming orders
  static async getSellerOrders(sellerId: string, cursor?: string, limit = 20) {
    const orderItems = await prisma.order_items.findMany({
      where: { seller_id: sellerId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { orders: { created_at: 'desc' } },
      include: {
        orders: { include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } } },
        products: { select: { id: true, title: true, image_urls: true } },
      }
    });

    const hasMore = orderItems.length > limit;
    const items = hasMore ? orderItems.slice(0, limit) : orderItems;
    return { items: items.map(formatOrderItem), nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  // Update order status (seller confirms/ships)
  static async updateOrderStatus(orderId: string, sellerId: string, status: string) {
    // Verify seller has items in this order
    const item = await prisma.order_items.findFirst({ where: { order_id: orderId, seller_id: sellerId } });
    if (!item) throw new Error('No items in this order belong to you');

    const order = await prisma.orders.update({
      where: { id: orderId },
      data: { status: status as any },
      include: { user: { select: { id: true } } }
    });

    // Notify buyer of status change
    await ShopNotificationService.notifyOrderStatusUpdate(
      order.user.id, orderId, status
    ).catch(() => {});

    return formatOrder(order);
  }

  // Confirm delivery & release escrow for a specific order item
  static async confirmDelivery(orderId: string, orderItemId: string, sellerId: string) {
    const item = await prisma.order_items.findUniqueOrThrow({ where: { id: orderItemId } });
    if (item.seller_id !== sellerId) throw new Error('Not your order item');
    if (item.escrow_status !== 'held') throw new Error('Escrow already processed');

    const sellerPayout = Number(item.total_price_kr) * (1 - PLATFORM_FEE_RATE);

    await prisma.$transaction([
      prisma.order_items.update({
        where: { id: orderItemId },
        data: { escrow_status: 'released', delivered_at: new Date() }
      }),
      // Credit seller wallet
      prisma.wallets.upsert({
        where: { user_id: sellerId },
        create: { user_id: sellerId, kr_balance: new Prisma.Decimal(sellerPayout), updated_at: new Date() },
        update: { kr_balance: { increment: new Prisma.Decimal(sellerPayout) }, updated_at: new Date() }
      }),
      prisma.transactions.create({
        data: {
          user_id: sellerId,
          type: 'shop_sale',
          amount_kr: new Prisma.Decimal(sellerPayout),
          status: 'completed',
          reference: orderItemId,
          metadata: { order_id: orderId, platformFee: Number(item.total_price_kr) * PLATFORM_FEE_RATE },
        }
      }),
    ]);

    // Check if all items delivered → mark order DELIVERED
    const remaining = await prisma.order_items.count({
      where: { order_id: orderId, escrow_status: 'held' }
    });
    if (remaining === 0) {
      await prisma.orders.update({ where: { id: orderId }, data: { status: 'DELIVERED' } });
    }

    return { success: true, sellerPayout };
  }

  // Get single order
  static async getOrder(orderId: string, userId: string) {
    const order = await prisma.orders.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        order_items: {
          include: { products: { select: { id: true, title: true, image_urls: true } } }
        },
        User: { select: { id: true, username: true, display_name: true, avatar_url: true } }
      }
    });

    // Only buyer or a seller with items in this order can view
    const isBuyer = order.buyer_id === userId;
    const isSeller = order.order_items.some((i: any) => i.seller_id === userId);
    if (!isBuyer && !isSeller) throw new Error('Access denied');

    return formatOrder(order);
  }
}

export class DiscountService {

  static async createDiscount(sellerId: string, productId: string, data: {
    discountType: string; discountValue: number; minQuantity?: number;
    startDate: string; endDate: string;
  }) {
    const product = await prisma.products.findUniqueOrThrow({ where: { id: productId } });
    if (product.seller_id !== sellerId) throw new Error('Not your product');

    return prisma.product_discounts.create({ data: {
        product_id: productId,
        discount_type: data.discountType,
        discount_value: new Prisma.Decimal(data.discountValue),
        min_quantity: data.minQuantity || 1,
        start_date: new Date(data.startDate),
        end_date: new Date(data.endDate),
        is_active: true,
      }} as any));
  }

  static async getProductDiscounts(productId: string) {
    return prisma.product_discounts.findMany({
      where: { product_id: productId, is_active: true, end_date: { gte: new Date() } },
      orderBy: { start_date: 'asc' }
    });
  }

  static async deleteDiscount(discountId: string, sellerId: string) {
    const discount = await prisma.product_discounts.findUniqueOrThrow({
      where: { id: discountId },
      include: { products: { select: { seller_id: true } } }
    });
    if (discount.products.seller_id !== sellerId) throw new Error('Not your product');
    await prisma.product_discounts.update({ where: { id: discountId }, data: { is_active: false } });
  }
}

function formatOrder(o: any) {
  return {
    id: o.id,
    buyer_id: o.buyer_id,
    buyer: o.user,
    totalKr: Number(o.total_kr),
    platformFeeKr: Number(o.platform_fee_kr),
    status: o.status,
    notes: o.notes,
    created_at: o.created_at?.toISOString(),
    updated_at: o.updated_at?.toISOString(),
    items: o.order_items?.map(formatOrderItem) || [],
  };
}

function formatOrderItem(i: any) {
  return {
    id: i.id,
    order_id: i.order_id,
    product_id: i.product_id,
    product: i.products,
    seller_id: i.seller_id,
    quantity: i.quantity,
    unitPriceKr: Number(i.unit_price_kr),
    totalPriceKr: Number(i.total_price_kr),
    escrowStatus: i.escrow_status,
    deliveredAt: i.delivered_at?.toISOString() || null,
    order: i.orders ? {
      id: i.orders.id,
      status: i.orders.status,
      created_at: i.orders.created_at?.toISOString(),
      buyer: i.orders.user,
    } : undefined,
  };
}
