import { prisma } from '../../config/database.js';
import { ShopNotificationService } from './notifications.service.js';

export class ReviewService {

  static async createReview(userId: string, data: {
    product_id: string; rating: number; title?: string;
    text?: string; videoUrl?: string; imageUrls?: string[];
  }) {
    const review = await prisma.product_reviews.create({
      data: {
        product_id: data.product_id,
        user_id: userId,
        rating: data.rating,
        title: data.title,
        text: data.text,
        video_url: data.videoUrl,
        image_urls: data.imageUrls || [],
      },
      include: { User: { select: { id: true, username: true, display_name: true, avatar_url: true } } }
    });

    // Update product average rating
    const agg = await prisma.product_reviews.aggregate({
      where: { product_id: data.product_id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.products.update({
      where: { id: data.product_id },
      data: {
        avg_rating: agg._avg.rating || 0,
        review_count: agg._count,
      }
    });

    return formatReview(review);
  }

  static async getProductReviews(productId: string, cursor?: string, limit = 20) {
    const reviews = await prisma.product_reviews.findMany({
      where: { product_id: productId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: { User: { select: { id: true, username: true, display_name: true, avatar_url: true } } }
    });

    const hasMore = reviews.length > limit;
    const items = hasMore ? reviews.slice(0, limit) : reviews;

    return {
      items: items.map(formatReview),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  static async deleteReview(reviewId: string, userId: string) {
    const review = await prisma.product_reviews.findUniqueOrThrow({ where: { id: reviewId } });
    if (review.user_id !== userId) throw new Error('You can only delete your own reviews');

    await prisma.product_reviews.delete({ where: { id: reviewId } });

    // Recalculate avg
    const agg = await prisma.product_reviews.aggregate({
      where: { product_id: review.product_id },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.products.update({
      where: { id: review.product_id },
      data: { avg_rating: agg._avg.rating || 0, review_count: agg._count }
    });
  }
}

export class WishlistService {

  static async createWishlist(userId: string, data: {
    name: string; isPublic?: boolean; isRegistry?: boolean;
    eventType?: string; eventDate?: string;
  }) {
    return prisma.wishlists.create({
      data: {
        user_id: userId,
        name: data.name,
        is_public: data.isPublic || false,
        is_registry: data.isRegistry || false,
        event_type: data.eventType,
        event_date: data.eventDate ? new Date(data.eventDate) : undefined,
      },
      include: { wishlist_items: { include: { products: true } } }
    });
  }

  static async getUserWishlists(userId: string) {
    return prisma.wishlists.findMany({
      where: { user_id: userId },
      include: {
        wishlist_items: {
          include: { products: { select: { id: true, title: true, image_urls: true, price_kr: true, status: true } } },
          orderBy: { priority: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  static async getPublicWishlists(userId: string) {
    return prisma.wishlists.findMany({
      where: { user_id: userId, is_public: true },
      include: {
        wishlist_items: {
          include: { products: { select: { id: true, title: true, image_urls: true, price_kr: true, status: true } } },
          orderBy: { priority: 'desc' }
        }
      }
    });
  }

  static async addItem(wishlistId: string, userId: string, data: {
    product_id: string; quantity?: number; priority?: number; notes?: string;
  }) {
    const wishlist = await prisma.wishlists.findUniqueOrThrow({ where: { id: wishlistId } });
    if (wishlist.user_id !== userId) throw new Error('Not your wishlist');

    return prisma.wishlist_items.create({
      data: {
        wishlist_id: wishlistId,
        product_id: data.product_id,
        quantity: data.quantity || 1,
        priority: data.priority || 0,
        notes: data.notes,
      },
      include: { products: { select: { id: true, title: true, image_urls: true, price_kr: true } } }
    });
  }

  static async removeItem(wishlistId: string, itemId: string, userId: string) {
    const wishlist = await prisma.wishlists.findUniqueOrThrow({ where: { id: wishlistId } });
    if (wishlist.user_id !== userId) throw new Error('Not your wishlist');
    await prisma.wishlist_items.delete({ where: { id: itemId } });
  }

  static async deleteWishlist(wishlistId: string, userId: string) {
    const wishlist = await prisma.wishlists.findUniqueOrThrow({ where: { id: wishlistId } });
    if (wishlist.user_id !== userId) throw new Error('Not your wishlist');
    await prisma.wishlists.delete({ where: { id: wishlistId } });
  }
}

export class CartService {

  static async addToCart(userId: string, data: {
    product_id: string; quantity?: number; bargainPrice?: number;
  }) {
    const product = await prisma.products.findUniqueOrThrow({ where: { id: data.product_id } });
    if (product.status !== 'active') throw new Error('Product not available');

    return prisma.cart_items.upsert({
      where: { user_id_product_id: { user_id: userId, product_id: data.product_id } },
      create: {
        user_id: userId,
        product_id: data.product_id,
        quantity: data.quantity || 1,
        bargain_price: data.bargainPrice ? data.bargainPrice : undefined,
      },
      update: {
        quantity: data.quantity || 1,
        bargain_price: data.bargainPrice ? data.bargainPrice : undefined,
      },
      include: {
        products: {
          select: {
            id: true, title: true, image_urls: true, price_kr: true,
            wholesale_price: true, wholesale_min_qty: true, stock: true, status: true,
            User: { select: { id: true, username: true, display_name: true, avatar_url: true } }
          }
        }
      }
    });
  }

  static async getCart(userId: string) {
    const items = await prisma.cart_items.findMany({
      where: { user_id: userId },
      include: {
        products: {
          select: {
            id: true, title: true, image_urls: true, price_kr: true,
            wholesale_price: true, wholesale_min_qty: true, stock: true, status: true,
            User: { select: { id: true, username: true, display_name: true, avatar_url: true } }
          }
        }
      },
      orderBy: { added_at: 'desc' }
    });

    // Calculate totals
    let totalKr = 0;
    const formatted = items.map((item: any) => {
      const price = item.bargain_price
        ? Number(item.bargain_price)
        : (item.products.wholesale_price && item.quantity >= (item.products.wholesale_min_qty || 999))
          ? Number(item.products.wholesale_price)
          : Number(item.products.price_kr);
      const lineTotal = price * item.quantity;
      totalKr += lineTotal;

      return {
        id: item.id,
        product: {
          ...item.products,
          price_kr: Number(item.products.price_kr),
          wholesale_price: item.products.wholesale_price ? Number(item.products.wholesale_price) : null,
        },
        quantity: item.quantity,
        unitPrice: price,
        lineTotal,
        bargain_price: item.bargain_price ? Number(item.bargain_price) : null,
      };
    });

    return { items: formatted, totalKr, itemCount: items.length };
  }

  static async removeFromCart(userId: string, product_id: string) {
    await prisma.cart_items.delete({
      where: { user_id_product_id: { user_id: userId, product_id } }
    });
  }

  static async clearCart(userId: string) {
    await prisma.cart_items.deleteMany({ where: { user_id: userId } });
  }
}

export class GiftService {

  static async sendGift(senderId: string, data: {
    recipient_id: string; product_id: string; message?: string;
  }) {
    const product = await prisma.products.findUniqueOrThrow({ where: { id: data.product_id } });
    const sender = await prisma.user.findUniqueOrThrow({
      where: { id: senderId },
      select: { display_name: true, username: true }
    });

    const gift = await prisma.gifts.create({
      data: {
        sender_id: senderId,
        recipient_id: data.recipient_id,
        product_id: data.product_id,
        message: data.message,
        amount_kr: product.price_kr,
        status: 'pending',
        escrow_status: 'held',
      }
    });

    await ShopNotificationService.notifyGiftReceived(
      data.recipient_id,
      sender.display_name || sender.username,
      product.title,
      data.message
    ).catch(() => {});

    return gift;
  }

  static async getReceivedGifts(userId: string) {
    return prisma.gifts.findMany({
      where: { recipient_id: userId },
      include: {
        User_gifts_sender_idToUser: { select: { id: true, username: true, display_name: true, avatar_url: true } },
      },
      orderBy: { created_at: 'desc' }
    });
  }

  static async getSentGifts(userId: string) {
    return prisma.gifts.findMany({
      where: { sender_id: userId },
      orderBy: { created_at: 'desc' }
    });
  }
}

function formatReview(r: any) {
  return {
    id: r.id,
    user: r.User,
    rating: r.rating,
    title: r.title,
    text: r.text,
    video_url: r.video_url,
    image_urls: r.image_urls,
    is_verified: r.is_verified,
    created_at: r.created_at?.toISOString(),
  };
}
