import { prisma } from '../../config/database.js';
import { ShopNotificationService } from './notifications.service.js';

export class ReviewService {

  static async createReview(userId: string, data: {
    productId: string; rating: number; title?: string;
    text?: string; videoUrl?: string; imageUrls?: string[];
  }) {
    const review = await prisma.productReview.create({
      data: {
        productId: data.productId,
        userId,
        rating: data.rating,
        title: data.title,
        text: data.text,
        videoUrl: data.videoUrl,
        imageUrls: data.imageUrls || [],
      },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
    });

    // Update product average rating
    const agg = await prisma.productReview.aggregate({
      where: { productId: data.productId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: data.productId },
      data: {
        avgRating: agg._avg.rating || 0,
        reviewCount: agg._count,
      }
    });

    return formatReview(review);
  }

  static async getProductReviews(productId: string, cursor?: string, limit = 20) {
    const reviews = await prisma.productReview.findMany({
      where: { productId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
    });

    const hasMore = reviews.length > limit;
    const items = hasMore ? reviews.slice(0, limit) : reviews;

    return {
      items: items.map(formatReview),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  static async deleteReview(reviewId: string, userId: string) {
    const review = await prisma.productReview.findUniqueOrThrow({ where: { id: reviewId } });
    if (review.userId !== userId) throw new Error('You can only delete your own reviews');

    await prisma.productReview.delete({ where: { id: reviewId } });

    // Recalculate avg
    const agg = await prisma.productReview.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: review.productId },
      data: { avgRating: agg._avg.rating || 0, reviewCount: agg._count }
    });
  }
}

export class WishlistService {

  static async createWishlist(userId: string, data: {
    name: string; isPublic?: boolean; isRegistry?: boolean;
    eventType?: string; eventDate?: string;
  }) {
    return prisma.wishlist.create({
      data: {
        userId,
        name: data.name,
        isPublic: data.isPublic || false,
        isRegistry: data.isRegistry || false,
        eventType: data.eventType,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      },
      include: { items: { include: { product: true } } }
    });
  }

  static async getUserWishlists(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: { select: { id: true, title: true, imageUrls: true, priceKr: true, status: true } } },
          orderBy: { priority: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getPublicWishlists(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId, isPublic: true },
      include: {
        items: {
          include: { product: { select: { id: true, title: true, imageUrls: true, priceKr: true, status: true } } },
          orderBy: { priority: 'desc' }
        }
      }
    });
  }

  static async addItem(wishlistId: string, userId: string, data: {
    productId: string; quantity?: number; priority?: number; notes?: string;
  }) {
    const wishlist = await prisma.wishlist.findUniqueOrThrow({ where: { id: wishlistId } });
    if (wishlist.userId !== userId) throw new Error('Not your wishlist');

    return prisma.wishlistItem.create({
      data: {
        wishlistId,
        productId: data.productId,
        quantity: data.quantity || 1,
        priority: data.priority || 0,
        notes: data.notes,
      },
      include: { product: { select: { id: true, title: true, imageUrls: true, priceKr: true } } }
    });
  }

  static async removeItem(wishlistId: string, itemId: string, userId: string) {
    const wishlist = await prisma.wishlist.findUniqueOrThrow({ where: { id: wishlistId } });
    if (wishlist.userId !== userId) throw new Error('Not your wishlist');
    await prisma.wishlistItem.delete({ where: { id: itemId } });
  }

  static async deleteWishlist(wishlistId: string, userId: string) {
    const wishlist = await prisma.wishlist.findUniqueOrThrow({ where: { id: wishlistId } });
    if (wishlist.userId !== userId) throw new Error('Not your wishlist');
    await prisma.wishlist.delete({ where: { id: wishlistId } });
  }
}

export class CartService {

  static async addToCart(userId: string, data: {
    productId: string; quantity?: number; bargainPrice?: number;
  }) {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: data.productId } });
    if (product.status !== 'active') throw new Error('Product not available');

    return prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId: data.productId } },
      create: {
        userId,
        productId: data.productId,
        quantity: data.quantity || 1,
        bargainPrice: data.bargainPrice ? data.bargainPrice : undefined,
      },
      update: {
        quantity: data.quantity || 1,
        bargainPrice: data.bargainPrice ? data.bargainPrice : undefined,
      },
      include: {
        product: {
          select: {
            id: true, title: true, imageUrls: true, priceKr: true,
            wholesalePrice: true, wholesaleMinQty: true, stock: true, status: true,
            seller: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
          }
        }
      }
    });
  }

  static async getCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true, title: true, imageUrls: true, priceKr: true,
            wholesalePrice: true, wholesaleMinQty: true, stock: true, status: true,
            seller: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    });

    // Calculate totals
    let totalKr = 0;
    const formatted = items.map(item => {
      const price = item.bargainPrice
        ? Number(item.bargainPrice)
        : (item.product.wholesalePrice && item.quantity >= (item.product.wholesaleMinQty || 999))
          ? Number(item.product.wholesalePrice)
          : Number(item.product.priceKr);
      const lineTotal = price * item.quantity;
      totalKr += lineTotal;

      return {
        id: item.id,
        product: {
          ...item.product,
          priceKr: Number(item.product.priceKr),
          wholesalePrice: item.product.wholesalePrice ? Number(item.product.wholesalePrice) : null,
        },
        quantity: item.quantity,
        unitPrice: price,
        lineTotal,
        bargainPrice: item.bargainPrice ? Number(item.bargainPrice) : null,
      };
    });

    return { items: formatted, totalKr, itemCount: items.length };
  }

  static async removeFromCart(userId: string, productId: string) {
    await prisma.cartItem.delete({
      where: { userId_productId: { userId, productId } }
    });
  }

  static async clearCart(userId: string) {
    await prisma.cartItem.deleteMany({ where: { userId } });
  }
}

export class GiftService {

  static async sendGift(senderId: string, data: {
    recipientId: string; productId: string; message?: string;
  }) {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: data.productId } });
    const sender = await prisma.user.findUniqueOrThrow({
      where: { id: senderId },
      select: { displayName: true, username: true }
    });

    const gift = await prisma.gift.create({
      data: {
        senderId,
        recipientId: data.recipientId,
        productId: data.productId,
        message: data.message,
        amountKr: product.priceKr,
        status: 'pending',
        escrowStatus: 'held',
      }
    });

    await ShopNotificationService.notifyGiftReceived(
      data.recipientId,
      sender.displayName || sender.username,
      product.title,
      data.message
    ).catch(() => {});

    return gift;
  }

  static async getReceivedGifts(userId: string) {
    return prisma.gift.findMany({
      where: { recipientId: userId },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getSentGifts(userId: string) {
    return prisma.gift.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

function formatReview(r: any) {
  return {
    id: r.id,
    user: r.user,
    rating: r.rating,
    title: r.title,
    text: r.text,
    videoUrl: r.videoUrl,
    imageUrls: r.imageUrls,
    isVerified: r.isVerified,
    createdAt: r.createdAt?.toISOString(),
  };
}
