import { prisma } from '../../config/database.js';
import { Prisma, SubscriptionTierType } from '@prisma/client';
import { emitLikeUpdate } from '../../shared/gateway/events.js';
import { HashtagService } from '../../shared/hashtag.service.js';
import { contentDistributionService } from '../recommendation/services/contentDistribution.service.js';
import { ContentLockService } from '../contentLock/contentLock.service.js';

export class ShortsService {
  /**
   * Get shorts feed based on type
   * 
   * ADMIRING TAB (Following):
   * - Shows shorts from users YOU are admiring (admirer_id = userId)
   * - Shows shorts from mutual lovers (admired_id = userId AND is_lovers = true)
   * - Shows YOUR OWN shorts
   * 
   * DISCOVER TAB (For You):
   * - Shows shorts from users you are NOT admiring
   * - Excludes mutual lovers
   * - Excludes your own shorts
   */
  static async getFeed(type: string, cursor?: string, limit = 20, userId?: string) {
    let whereClause: any = {};

    if (type === 'admiring' && userId) {
      // Get list of users the current user is admiring, or mutual lovers
      const admiringList = await prisma.admires.findMany({
        where: {
          OR: [
            { admirer_id: userId },
            { admired_id: userId, is_lovers: true }
          ]
        },
        select: { admired_id: true, admirer_id: true }
      });
      const admiringIds = admiringList.map((a: { admirer_id: string; admired_id: string }) => a.admirer_id === userId ? a.admired_id : a.admirer_id);

      // Include the user's own shorts in the admiring feed
      admiringIds.push(userId);

      // Now admiringIds will always have at least the user's own ID
      whereClause.user_id = { in: admiringIds };
    } else if (type === 'discover' && userId) {
      // Get list of users the current user is admiring, or mutual lovers
      const admiringList = await prisma.admires.findMany({
        where: {
          OR: [
            { admirer_id: userId },
            { admired_id: userId, is_lovers: true }
          ]
        },
        select: { admired_id: true, admirer_id: true }
      });
      const admiringIds = admiringList.map((a: { admirer_id: string; admired_id: string }) => a.admirer_id === userId ? a.admired_id : a.admirer_id);

      // Exclude admiring users and self
      whereClause.user_id = {
        notIn: [...admiringIds, userId]
      };
    }

    const shorts = await prisma.shorts.findMany({
      where: whereClause,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true
          }
        },
        products: {
          select: {
            id: true,
            title: true,
            price_kr: true,
            image_urls: true
          }
        }
      }
    });

    const hasMore = shorts.length > limit;
    const items = hasMore ? shorts.slice(0, limit) : shorts;

    // Check if user has liked each short
    const likedIds = new Set<string>();
    if (userId) {
      const likes = await prisma.short_likes.findMany({
        where: {
          user_id: userId,
          short_id: { in: items.map((s: any) => s.id) }
        },
        select: { short_id: true }
      });
      likes.forEach((l: { short_id: string }) => likedIds.add(l.short_id));
    }

    // Check access for locked content
    const accessChecks = await Promise.all(
      items.map(async (s: any) => {
        if (!s.isLocked) return { id: s.id, hasAccess: true };
        if (!userId) return { id: s.id, hasAccess: false };
        
        const access = await ContentLockService.checkAccess(
          userId,
          s.id,
          'SHORT',
          s.user_id,
          s.isLocked,
          s.requiredTier,
          s.unlockAmountKr ? Number(s.unlockAmountKr) : undefined
        );
        return { id: s.id, ...access };
      })
    );
    const accessMap = new Map(accessChecks.map(a => [a.id, a]));

    return {
      items: items.map((s: any) => {
        const access = accessMap.get(s.id) || { hasAccess: true, requiresSubscription: false, requiresUnlock: false };
        return {
          id: s.id,
          creator: s.User,
          videoUrl: access.hasAccess ? s.video_url : null,
          thumbnailUrl: s.thumbnail_url,
          media_type: s.media_type,
          aspectRatio: s.aspect_ratio,
          mediaUrls: access.hasAccess ? s.media_urls : [],
          caption: s.caption || '',
          musicTrack: s.music_title ? `${s.music_title}${s.music_artist ? ' - ' + s.music_artist : ''}` : null,
          likesCount: s.likes_count,
          commentsCount: s.comments_count,
          isLiked: likedIds.has(s.id),
          isLocked: s.is_locked,
          requiredTier: s.required_tier,
          unlockAmountKr: s.unlock_amount_kr ? Number(s.unlock_amount_kr) : undefined,
          hasAccess: access.hasAccess,
          requiresSubscription: (access as any).requiresSubscription,
          requiresUnlock: (access as any).requiresUnlock,
          commentsEnabled: s.commentsEnabled ?? true,
          linkedProduct: s.products ? {
            id: s.products.id,
            title: s.products.title,
            priceKr: Number(s.products.price_kr),
            imageUrl: s.products.image_urls[0] || null
          } : null,
          created_at: s.created_at.toISOString()
        };
      }),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Create a new short
   */
  static async createShort(data: {
    creator_id: string;
    videoUrl: string;
    thumbnailUrl?: string;
    mediaType?: string;
    aspectRatio?: number;
    mediaUrls?: string[];
    caption?: string;
    musicTrack?: string;
    linkedProductId?: string;
    isLocked?: boolean;
    requiredTier?: SubscriptionTierType;
    unlockAmountKr?: number;
  }) {
    // Parse musicTrack into title and artist
    let musicTitle: string | undefined;
    let musicArtist: string | undefined;
    if (data.musicTrack) {
      const parts = data.musicTrack.split(' - ');
      musicTitle = parts[0];
      musicArtist = parts[1];
    }

    const short = await prisma.shorts.create({
      data: {
        user_id: data.creator_id,
        video_url: data.videoUrl,
        thumbnail_url: data.thumbnailUrl,
        media_type: data.mediaType || 'VIDEO',
        aspect_ratio: data.aspectRatio,
        media_urls: data.mediaUrls || [],
        caption: data.caption,
        music_title: musicTitle,
        music_artist: musicArtist,
        linked_product_id: data.linkedProductId,
        is_locked: data.isLocked || false,
        required_tier: data.requiredTier,
        unlock_amount_kr: data.unlockAmountKr ? new Prisma.Decimal(data.unlockAmountKr) : undefined
      } as any,
      include: {
        User: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            country: true
          }
        }
      }
    });
    
    // Process hashtags and mentions from caption (fire-and-forget)
    if (short.caption) {
      HashtagService.processContent(short.id, 'SHORT', short.caption).catch(() => {});
    }

    // Initialize content distribution (fire-and-forget)
    const hashtags = short.caption ? ShortsService.extractHashtags(short.caption) : [];
    contentDistributionService.initializeDistribution(
      short.id,
      'SHORT',
      data.creator_id,
      { hashtags, location: short.User.country }
    ).catch(err => console.error('Failed to initialize distribution:', err));

    return {
      id: short.id,
      creator: short.User,
      videoUrl: short.video_url,
      thumbnailUrl: short.thumbnail_url,
      media_type: short.media_type,
      aspectRatio: short.aspect_ratio,
      mediaUrls: short.media_urls,
      caption: short.caption,
      musicTrack: short.music_title ? `${short.music_title}${short.music_artist ? ' - ' + short.music_artist : ''}` : null,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isLocked: short.is_locked,
      requiredTier: short.required_tier,
      unlockAmountKr: short.unlock_amount_kr ? Number(short.unlock_amount_kr) : undefined,
      created_at: short.created_at.toISOString()
    };
  }

  /**
   * Extract hashtags from text
   */
  private static extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map((tag: any) => tag.substring(1).toLowerCase()) : [];
  }

  /**
   * Toggle like on a short
   */
  static async toggleLike(userId: string, shortId: string) {
    const short = await prisma.shorts.findUniqueOrThrow({ where: { id: shortId } });

    return prisma.$transaction(async (tx) => {
      const existingLike = await tx.short_likes.findUnique({
        where: {
          short_id_user_id: {
            user_id: userId,
            short_id: shortId
          }
        }
      });

      if (existingLike) {
        // Unlike
        await tx.short_likes.delete({ where: { id: existingLike.id } });
        await tx.shorts.update({
          where: { id: shortId },
          data: { likes_count: { decrement: 1 } }
        });
        
        const newCount = short.likes_count - 1;
        emitLikeUpdate(shortId, 'SHORT', newCount);
        
        return { liked: false, likesCount: newCount };
      } else {
        // Like
        await tx.short_likes.create({
          data: {
            user_id: userId,
            short_id: shortId
          }
        });
        await tx.shorts.update({
          where: { id: shortId },
          data: { likes_count: { increment: 1 } }
        });
        
        const newCount = short.likes_count + 1;
        emitLikeUpdate(shortId, 'SHORT', newCount);
        
        return { liked: true, likesCount: newCount };
      }
    });
  }

  /**
   * Increment view count
   */
  static async incrementView(shortId: string, userId?: string) {
    await prisma.shorts.update({
      where: { id: shortId },
      data: { views: { increment: 1 } }
    });
  }
}
