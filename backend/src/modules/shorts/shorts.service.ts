import { prisma } from '../../config/database.js';
import { Prisma, SubscriptionTierType } from '../../generated/prisma/client.js';
import { emitLikeUpdate } from '../../shared/gateway/events.js';
import { HashtagService } from '../../shared/hashtag.service.js';

export class ShortsService {
  /**
   * Get shorts feed based on type
   * - discover: Users NOT in admiring list (For You)
   * - admiring: Users in admiring list (Following)
   */
  static async getFeed(type: string, cursor?: string, limit = 20, userId?: string) {
    let whereClause: any = {};

    if (type === 'admiring' && userId) {
      // Get list of users the current user is admiring
      const admiringList = await prisma.admire.findMany({
        where: { admirerId: userId },
        select: { admiredId: true }
      });
      const admiringIds = admiringList.map(a => a.admiredId);

      if (admiringIds.length === 0) {
        return { items: [], nextCursor: null };
      }

      whereClause.userId = { in: admiringIds };
    } else if (type === 'discover' && userId) {
      // Get list of users the current user is admiring
      const admiringList = await prisma.admire.findMany({
        where: { admirerId: userId },
        select: { admiredId: true }
      });
      const admiringIds = admiringList.map(a => a.admiredId);

      // Exclude admiring users and self
      whereClause.userId = {
        notIn: [...admiringIds, userId]
      };
    }

    const shorts = await prisma.short.findMany({
      where: whereClause,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true
          }
        },
        linkedProduct: {
          select: {
            id: true,
            title: true,
            priceKr: true,
            imageUrls: true
          }
        }
      }
    });

    const hasMore = shorts.length > limit;
    const items = hasMore ? shorts.slice(0, limit) : shorts;

    // Check if user has liked each short
    const likedIds = new Set<string>();
    if (userId) {
      const likes = await prisma.shortLike.findMany({
        where: {
          userId,
          shortId: { in: items.map(s => s.id) }
        },
        select: { shortId: true }
      });
      likes.forEach((l: { shortId: string }) => likedIds.add(l.shortId));
    }

    return {
      items: items.map(s => ({
        id: s.id,
        creator: s.user,
        videoUrl: s.videoUrl,
        caption: s.caption || '',
        musicTrack: s.musicTitle ? `${s.musicTitle}${s.musicArtist ? ' - ' + s.musicArtist : ''}` : null,
        likesCount: s.likesCount,
        commentsCount: s.commentsCount,
        isLiked: likedIds.has(s.id),
        isLocked: s.isLocked,
        requiredTier: s.requiredTier,
        linkedProduct: s.linkedProduct ? {
          id: s.linkedProduct.id,
          title: s.linkedProduct.title,
          priceKr: Number(s.linkedProduct.priceKr),
          imageUrl: s.linkedProduct.imageUrls[0] || null
        } : null,
        createdAt: s.createdAt.toISOString()
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Create a new short
   */
  static async createShort(data: {
    creatorId: string;
    videoUrl: string;
    caption?: string;
    musicTrack?: string;
    linkedProductId?: string;
    isLocked?: boolean;
    requiredTier?: SubscriptionTierType;
  }) {
    // Parse musicTrack into title and artist
    let musicTitle: string | undefined;
    let musicArtist: string | undefined;
    if (data.musicTrack) {
      const parts = data.musicTrack.split(' - ');
      musicTitle = parts[0];
      musicArtist = parts[1];
    }

    const short = await prisma.short.create({
      data: {
        userId: data.creatorId,
        videoUrl: data.videoUrl,
        caption: data.caption,
        musicTitle,
        musicArtist,
        linkedProductId: data.linkedProductId,
        isLocked: data.isLocked || false,
        requiredTier: data.requiredTier
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });
    // Process hashtags and mentions from caption (fire-and-forget)
    if (short.caption) {
      HashtagService.processContent(short.id, 'SHORT', short.caption).catch(() => {});
    }

    return {
      id: short.id,
      creator: short.user,
      videoUrl: short.videoUrl,
      caption: short.caption,
      musicTrack: short.musicTitle ? `${short.musicTitle}${short.musicArtist ? ' - ' + short.musicArtist : ''}` : null,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isLocked: short.isLocked,
      requiredTier: short.requiredTier,
      createdAt: short.createdAt.toISOString()
    };
  }

  /**
   * Toggle like on a short
   */
  static async toggleLike(userId: string, shortId: string) {
    const short = await prisma.short.findUniqueOrThrow({ where: { id: shortId } });

    return prisma.$transaction(async (tx) => {
      const existingLike = await tx.shortLike.findUnique({
        where: {
          shortId_userId: {
            userId,
            shortId
          }
        }
      });

      if (existingLike) {
        // Unlike
        await tx.shortLike.delete({ where: { id: existingLike.id } });
        await tx.short.update({
          where: { id: shortId },
          data: { likesCount: { decrement: 1 } }
        });
        
        const newCount = short.likesCount - 1;
        emitLikeUpdate(shortId, 'SHORT', newCount);
        
        return { liked: false, likesCount: newCount };
      } else {
        // Like
        await tx.shortLike.create({
          data: {
            userId,
            shortId
          }
        });
        await tx.short.update({
          where: { id: shortId },
          data: { likesCount: { increment: 1 } }
        });
        
        const newCount = short.likesCount + 1;
        emitLikeUpdate(shortId, 'SHORT', newCount);
        
        return { liked: true, likesCount: newCount };
      }
    });
  }

  /**
   * Increment view count
   */
  static async incrementView(shortId: string, userId?: string) {
    await prisma.short.update({
      where: { id: shortId },
      data: { views: { increment: 1 } }
    });
  }
}
