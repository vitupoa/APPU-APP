import { prisma } from '../../config/database.js';
import { Prisma, SubscriptionTierType } from '@prisma/client';
import { emitLikeUpdate } from '../../shared/gateway/events.js';
import { HashtagService } from '../../shared/hashtag.service.js';
import { contentDistributionService } from '../recommendation/services/contentDistribution.service.js';
import { ContentLockService } from '../contentLock/contentLock.service.js';
import { BookmarkService } from '../bookmarks/bookmarks.service.js';
import crypto from 'crypto';

export class ShortsService {
  /**
   * Get shorts feed based on type
   * 
   * LOVERS TAB:
   * - Shows shorts from mutual connections (both users admire each other)
   * 
   * ADMIRING TAB (Following):
   * - Shows YOUR OWN shorts
   * - Shows shorts from users YOU are admiring (excludes mutual lovers already shown in Lovers tab)
   * 
   * DISCOVER TAB (For You):
   * - Shows shorts from everyone else (not in Lovers or Admiring tabs)
   */
  static async getFeed(type: string, cursor?: string, limit = 20, userId?: string) {
    let whereClause: any = {};

    console.log(`[SHORTS FEED] Type: ${type}, UserId: ${userId}`);

    if (userId) {
      if (type === 'lovers') {
        // Get mutual lovers
        const loversList = await prisma.admires.findMany({
          where: {
            OR: [
              { admirer_id: userId, is_lovers: true },
              { admired_id: userId, is_lovers: true }
            ]
          },
          select: { admired_id: true, admirer_id: true }
        });
        const loversIds = loversList.map((a: { admirer_id: string; admired_id: string }) => 
          a.admirer_id === userId ? a.admired_id : a.admirer_id
        );

        console.log(`[LOVERS TAB] Found ${loversIds.length} lovers:`, loversIds);

        if (loversIds.length > 0) {
          whereClause.user_id = { in: loversIds };
        } else {
          // No lovers, return empty by querying impossible condition
          whereClause.id = 'impossible-id-no-lovers';
        }
      } else if (type === 'admiring') {
        // Get all people you're admiring
        const admiringList = await prisma.admires.findMany({
          where: { admirer_id: userId },
          select: { admired_id: true }
        });
        
        // Get mutual lovers
        const loversList = await prisma.admires.findMany({
          where: {
            OR: [
              { admirer_id: userId, is_lovers: true },
              { admired_id: userId, is_lovers: true }
            ]
          },
          select: { admired_id: true, admirer_id: true }
        });
        const loversIds = loversList.map((a: { admirer_id: string; admired_id: string }) => 
          a.admirer_id === userId ? a.admired_id : a.admirer_id
        );
        
        // Non-mutual admirers (exclude lovers already shown in Lovers tab)
        const admiringIds = admiringList.map((a: { admired_id: string }) => a.admired_id);
        const nonMutualIds = admiringIds.filter((id: string) => !loversIds.includes(id));

        console.log(`[ADMIRING TAB] Admiring ${admiringIds.length} users, ${loversIds.length} are lovers, ${nonMutualIds.length} non-mutual`);
        console.log(`[ADMIRING TAB] Including userId: ${userId} + nonMutual:`, nonMutualIds);

        // Own shorts + non-mutual admirers (always include userId)
        const includeIds = [userId, ...nonMutualIds];
        whereClause.user_id = { in: includeIds };
        
        console.log(`[ADMIRING TAB] Final query - user_id IN:`, includeIds);
      } else if (type === 'discover') {
        // Get all people you're admiring
        const admiringList = await prisma.admires.findMany({
          where: { admirer_id: userId },
          select: { admired_id: true }
        });
        const admiringIds = admiringList.map((a: { admired_id: string }) => a.admired_id);

        console.log(`[DISCOVER TAB] Excluding userId + ${admiringIds.length} admired users`);

        // Exclude own shorts and anyone you're admiring
        whereClause.user_id = { notIn: [userId, ...admiringIds] };
      }
    }
    // If no userId, show all shorts (guest mode)

    console.log(`[SHORTS FEED] Where clause:`, JSON.stringify(whereClause, null, 2));

    const shorts = await prisma.shorts.findMany({
      where: whereClause,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: { user: {
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

    console.log(`[SHORTS FEED] Query returned ${shorts.length} shorts`);

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
        // CRITICAL: Use snake_case field names from Prisma
        const isLocked = s.is_locked;
        const requiredTier = s.required_tier;
        const unlockAmountKr = s.unlock_amount_kr;
        
        if (!isLocked) return { id: s.id, hasAccess: true };
        if (!userId) return { id: s.id, hasAccess: false, requiresSubscription: !!requiredTier, requiresUnlock: !!unlockAmountKr };
        
        const access = await ContentLockService.checkAccess(
          userId,
          s.id,
          'SHORT',
          s.user_id,
          isLocked,
          requiredTier,
          unlockAmountKr ? Number(unlockAmountKr) : undefined
        );
        return { id: s.id, ...access };
      })
    );
    const accessMap = new Map(accessChecks.map(a => [a.id, a]));

    // Check bookmark status
    const bookmarkChecks = userId ? await Promise.all(
      items.map(s => BookmarkService.isBookmarked(userId, s.id, 'SHORT'))
    ) : [];
    const bookmarkMap = new Map(items.map((s, i) => [s.id, bookmarkChecks[i] || false]));

    return {
      items: items.map((s: any) => {
        const access = accessMap.get(s.id) || { hasAccess: true, requiresSubscription: false, requiresUnlock: false };
        const isLocked = s.is_locked;
        const isBookmarked = bookmarkMap.get(s.id) || false;
        
        return {
          id: s.id,
          creator: {
            id: s.user.id,
            username: s.user.username,
            displayName: s.user.display_name,
            avatarUrl: s.user.avatar_url,
            isVerified: s.user.is_verified
          },
          // CRITICAL: Only send video/media URLs if user has access
          videoUrl: access.hasAccess ? s.video_url : null,
          thumbnailUrl: access.hasAccess ? s.thumbnail_url : null,
          media_type: s.media_type,
          aspectRatio: s.aspect_ratio,
          mediaUrls: access.hasAccess ? s.media_urls : [],
          caption: s.caption || '',
          musicTrack: s.music_title ? `${s.music_title}${s.music_artist ? ' - ' + s.music_artist : ''}` : null,
          likesCount: s.likes_count,
          commentsCount: s.comments_count,
          isLiked: likedIds.has(s.id),
          isBookmarked: isBookmarked,
          isLocked: isLocked,
          requiredTier: s.required_tier,
          unlockAmountKr: s.unlock_amount_kr ? Number(s.unlock_amount_kr) : undefined,
          hasAccess: access.hasAccess,
          requiresSubscription: (access as any).requiresSubscription || false,
          requiresUnlock: (access as any).requiresUnlock || false,
          commentsEnabled: s.commentsEnabled ?? true,
          linkedProduct: s.products ? {
            id: s.products.id,
            title: s.products.title,
            priceKr: Number(s.products.price_kr),
            imageUrl: s.products.image_urls[0] || null
          } : null,
          createdAt: s.created_at.toISOString()
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
        id: crypto.randomUUID(),
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
      include: { user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
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
      { hashtags, location: short.user.country }
    ).catch(err => console.error('Failed to initialize distribution:', err));

    return {
      id: short.id,
      creator: {
        id: short.user.id,
        username: short.user.username,
        displayName: short.user.display_name,
        avatarUrl: short.user.avatar_url,
        isVerified: short.user.is_verified
      },
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
      createdAt: short.created_at.toISOString()
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
