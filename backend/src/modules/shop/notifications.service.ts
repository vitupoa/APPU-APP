import { prisma } from '../../config/database.js';
import { FCMService } from '../../services/fcm.service.js';

async function getToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmToken: true } as any,
  });
  return (user as any)?.fcmToken || null;
}

async function send(userId: string, title: string, body: string, data: Record<string, string> = {}) {
  try {
    const token = await getToken(userId);
    if (!token) return;
    const fcm = FCMService.getInstance();
    await fcm.sendToDevice(token, { title, body, data });
  } catch {
    // Notifications are non-critical — swallow errors
  }
}

export class ShopNotificationService {

  static async notifyGiftReceived(recipientId: string, senderName: string, productTitle: string, message?: string) {
    await send(
      recipientId,
      '🎁 You received a gift!',
      `${senderName} sent you "${productTitle}"${message ? `: "${message}"` : ''}`,
      { type: 'gift_received', senderName, productTitle }
    );
  }

  static async notifyOrderPlaced(buyerId: string, order_id: string, totalKr: number) {
    await send(
      buyerId,
      '🛍️ Order placed!',
      `Your order of Kr ${totalKr.toFixed(2)} has been placed successfully.`,
      { type: 'order_placed', order_id }
    );
  }

  static async notifyOrderStatusUpdate(buyerId: string, order_id: string, status: string) {
    const messages: Record<string, string> = {
      CONFIRMED: 'Your order has been confirmed by the seller.',
      SHIPPED: 'Your order is on its way!',
      DELIVERED: 'Your order has been delivered.',
      CANCELLED: 'Your order has been cancelled.',
    };
    const body = messages[status] || `Your order status updated to ${status}.`;
    await send(buyerId, '📦 Order Update', body, { type: 'order_status', order_id, status });
  }

  static async notifyFlashSaleStarted(productIds: string[], saleTitle: string) {
    // Notify users who have deal alerts matching these products
    const alerts = await prisma.deal_alerts.findMany({
      where: {
        is_active: true,
        OR: [
          { product_id: { in: productIds } },
          { product_id: null }, // category/keyword alerts
        ]
      },
      select: { user_id: true, product_id: true }
    });

    const userIds = [...new Set(alerts.map((a: any) => a.user_id))];
    for (const userId of userIds) {
      await send(
        userId as string,
        '⚡ Flash Sale Started!',
        `"${saleTitle}" is now live — limited time only!`,
        { type: 'flash_sale_started', saleTitle }
      );
    }
  }

  static async notifyWishlistItemOnSale(productId: string, productTitle: string, salePrice: number) {
    // Find all users who have this product in a wishlist
    const wishlistItems = await prisma.wishlist_items.findMany({
      where: { product_id: productId, is_purchased: false },
      include: { wishlists: { select: { user_id: true } } }
    });

    const userIds = [...new Set(wishlistItems.map((i: any) => i.wishlists.user_id))];
    for (const userId of userIds) {
      await send(
        userId as string,
        '🔖 Wishlist item on sale!',
        `"${productTitle}" is now on sale for Kr ${salePrice.toFixed(2)}`,
        { type: 'wishlist_on_sale', product_id: productId, productTitle }
      );
    }
  }

  static async notifyDealAlertMatch(userId: string, productTitle: string, priceKr: number) {
    await send(
      userId,
      '🔔 Deal Alert!',
      `"${productTitle}" is now available at Kr ${priceKr.toFixed(2)}`,
      { type: 'deal_alert', productTitle }
    );
  }
}
