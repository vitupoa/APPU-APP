import { prisma } from '../../config/database.js';
import { HashtagService } from '../../shared/hashtag.service.js';
import { ContentLockService } from '../contentLock/contentLock.service.js';
import { Prisma } from '@prisma/client';

export class FeedService {
  /**
   * Get personalized and randomized feed for user
   * Uses similar algorithm to shorts feed for consistency
   */
  static async getFeed(params: {
    userId?: string;
    cursor?: string;
    limit: number;
  }) {
    const { userId, cursor, limit } = params;

    try {
      let posts: any[];

      if (userId) {
        // Personalized feed with randomization
        posts = await this.getPersonalizedFeed(userId, cursor, limit);
      } else {
        // Guest users get random popular posts
        posts = await this.getGuestFeed(cursor, limit);
      }

      const hasMore = posts.length > limit;
      const items = hasMore ? posts.slice(0, limit) : posts;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      // Check liked status if user is authenticated
      const likedIds = new Set<string>();
      if (userId) {
        const liked = await prisma.post_likes.findMany({
          where: { user_id: userId, post_id: { in: items.map((p) => p.id) } },
          select: { post_id: true }
        });
        liked.forEach((l: any) => likedIds.add(l.post_id));
      }

      // Check access for locked content
      const accessChecks = await Promise.all(
        items.map(async (p: any) => {
          if (!p.is_locked) return { id: p.id, hasAccess: true };
          if (!userId) return { id: p.id, hasAccess: false };
          
          const access = await ContentLockService.checkAccess(
            userId,
            p.id,
            'POST',
            p.user_id,
            p.is_locked,
            p.required_tier,
            p.unlock_amount_kr ? Number(p.unlock_amount_kr) : undefined
          );
          return { id: p.id, ...access };
        })
      );
      const accessMap = new Map(accessChecks.map(a => [a.id, a]));

      return {
        items: items.map((p: any) => {
          const access = accessMap.get(p.id) || { hasAccess: true };
          return {
            id: p.id,
            creator: {
              id: p.User.id,
              username: p.User.username,
              displayName: p.User.display_name,
              avatarUrl: p.User.avatar_url,
              isVerified: p.User.is_verified,
              accountType: p.User.account_type
            },
            imageUrls: access.hasAccess ? p.image_urls : [],
            caption: p.caption,
            isLocked: p.is_locked,
            requiredTier: p.required_tier,
            unlockAmountKr: p.unlock_amount_kr ? Number(p.unlock_amount_kr) : undefined,
            hasAccess: access.hasAccess,
            requiresSubscription: (access as any).requiresSubscription,
            requiresUnlock: (access as any).requiresUnlock,
            likesCount: p.likes_count,
            commentsCount: p.comments_count,
            isLiked: likedIds.has(p.id),
            commentsEnabled: (p as any).commentsEnabled ?? true,
            created_at: p.created_at.toISOString()
          };
        }),
        nextCursor
      };
    } catch (error) {
      console.error('Error in getFeed:', error);
      // Always return valid structure even on error
      return {
        items: [],
        nextCursor: null
      };
    }
  }

  /**
   * Get personalized feed with randomization
   * Mix of: admirers' posts, similar interests, trending, and random
   */
  private static async getPersonalizedFeed(userId: string, cursor: string | undefined, limit: number) {
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { country: true }
    });
    const userCountry = user?.country || '';

    // Get user's admirers (people they follow)
    const admiringList = await prisma.admires.findMany({
      where: { admirer_id: userId },
      select: { admired_id: true }
    });
    const admiringIds = admiringList.map(a => a.admired_id);

    // Calculate distribution (similar to shorts)
    const admirersCount = Math.floor(limit * 0.4); // 40% from people you follow
    const similarCount = Math.floor(limit * 0.3);  // 30% similar interests
    const trendingCount = Math.floor(limit * 0.2); // 20% trending posts
    const randomCount = limit - admirersCount - similarCount - trendingCount; // 10% random

    // Get posts from different sources
    const [admirersPosts, similarPosts, trendingPosts, randomPosts] = await Promise.all([
      this.getAdmirersPosts(admiringIds, admirersCount, cursor),
      this.getSimilarInterestPosts(userId, userCountry, similarCount, cursor),
      this.getTrendingPosts(userCountry, trendingCount, cursor),
      this.getRandomPosts(userCountry, randomCount, cursor)
    ]);

    // Combine and shuffle to create personalized feed
    const allPosts = [
      ...admirersPosts,
      ...similarPosts,
      ...trendingPosts,
      ...randomPosts
    ];

    // Remove duplicates by post ID
    const uniquePosts = Array.from(
      new Map(allPosts.map(p => [p.id, p])).values()
    );

    // Shuffle to randomize order (Fisher-Yates shuffle)
    for (let i = uniquePosts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniquePosts[i], uniquePosts[j]] = [uniquePosts[j], uniquePosts[i]];
    }

    return uniquePosts.slice(0, limit + 1);
  }

  /**
   * Get posts from people the user is following
   */
  private static async getAdmirersPosts(admiringIds: string[], count: number, cursor?: string) {
    if (admiringIds.length === 0) return [];

    return prisma.post.findMany({
      where: { user_id: { in: admiringIds } },
      take: count,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
            account_type: true
          }
        }
      }
    });
  }

  /**
   * Get posts based on similar interests (hashtags user has interacted with)
   */
  private static async getSimilarInterestPosts(userId: string, country: string, count: number, cursor?: string) {
    // Get hashtags from posts the user has liked
    const likedHashtags = await prisma.$queryRaw<{ hashtag_id: string }[]>`
      SELECT DISTINCT ch.hashtag_id
      FROM content_hashtags ch
      INNER JOIN post_likes pl ON ch.content_id = pl.post_id
      WHERE pl.user_id = ${userId}
      AND ch.content_type = 'POST'
      LIMIT 20
    `;

    if (likedHashtags.length === 0) {
      // Fallback to random posts from same country
      return this.getRandomPosts(country, count, cursor);
    }

    const hashtagIds = likedHashtags.map(h => h.hashtag_id);

    // Get posts with similar hashtags
    const posts = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT p.*
      FROM post p
      INNER JOIN content_hashtags ch ON p.id = ch.content_id
      WHERE ch.hashtag_id = ANY(${hashtagIds})
      AND ch.content_type = 'POST'
      AND p.user_id IN (SELECT id FROM "user" WHERE country = ${country})
      ORDER BY RANDOM()
      LIMIT ${count}
    `;

    // Fetch user data for each post
    const postsWithUsers = await Promise.all(
      posts.map(async (p) => {
        const user = await prisma.user.findUnique({
          where: { id: p.user_id },
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
            account_type: true
          }
        });
        return { ...p, User: user };
      })
    );

    return postsWithUsers;
  }

  /**
   * Get trending posts (high engagement in last 24 hours)
   */
  private static async getTrendingPosts(country: string, count: number, cursor?: string) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.post.findMany({
      where: {
        created_at: { gte: oneDayAgo },
        User: { country }
      },
      take: count,
      orderBy: [
        { likes_count: 'desc' },
        { comments_count: 'desc' }
      ],
      include: {
        User: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
            account_type: true
          }
        }
      }
    });
  }

  /**
   * Get random posts for diversity
   */
  private static async getRandomPosts(country: string, count: number, cursor?: string) {
    const posts = await prisma.$queryRaw<any[]>`
      SELECT p.*
      FROM post p
      INNER JOIN "user" u ON p.user_id = u.id
      WHERE u.country = ${country}
      ORDER BY RANDOM()
      LIMIT ${count}
    `;

    // Fetch user data for each post
    const postsWithUsers = await Promise.all(
      posts.map(async (p) => {
        const user = await prisma.user.findUnique({
          where: { id: p.user_id },
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
            account_type: true
          }
        });
        return { ...p, User: user };
      })
    );

    return postsWithUsers;
  }

  /**
   * Get feed for guest users (not logged in)
   */
  private static async getGuestFeed(cursor: string | undefined, limit: number) {
    // Show popular posts with randomization
    const posts = await prisma.$queryRaw<any[]>`
      SELECT p.*
      FROM post p
      WHERE p.created_at >= NOW() - INTERVAL '7 days'
      AND p.likes_count > 5
      ORDER BY RANDOM()
      LIMIT ${limit + 1}
    `;

    // Fetch user data for each post
    const postsWithUsers = await Promise.all(
      posts.map(async (p) => {
        const user = await prisma.user.findUnique({
          where: { id: p.user_id },
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
            account_type: true
          }
        });
        return { ...p, User: user };
      })
    );

    return postsWithUsers;
  }

  static async createPost(data: {
    user_id: string;
    imageUrls: string[];
    caption: string;
    isLocked: boolean;
    requiredTier?: string;
    unlockAmountKr?: number;
  }) {
    const post = await prisma.post.create({
      data: {
        user_id: data.user_id,
        image_urls: data.imageUrls,
        caption: data.caption ?? '',
        is_locked: data.isLocked,
        required_tier: data.requiredTier as any,
        unlock_amount_kr: data.unlockAmountKr ? new Prisma.Decimal(data.unlockAmountKr) : undefined
      } as any,
      include: {
        User: { select: { id: true, username: true, display_name: true, avatar_url: true } }
      }
    });

    // Process hashtags and mentions from caption (fire-and-forget)
    if (post.caption) {
      HashtagService.processContent(post.id, 'POST', post.caption).catch(() => {});
    }

    return {
      ...post,
      creator: (post as any).User,
      created_at: post.created_at.toISOString()
    };
  }

  static async toggleLike(userId: string, post_id: string) {
    const existing = await prisma.post_likes.findUnique({
      where: { post_id_user_id: { post_id, user_id: userId } }
    });

    if (existing) {
      await prisma.$transaction([
        prisma.post_likes.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id: post_id }, data: { likes_count: { decrement: 1 } } })
      ]);
      return { liked: false };
    } else {
      await prisma.$transaction([
        prisma.post_likes.create({ data: { user_id: userId, post_id } }),
        prisma.post.update({ where: { id: post_id }, data: { likes_count: { increment: 1 } } })
      ]);
      return { liked: true };
    }
  }

  static async addComment(userId: string, post_id: string, text: string) {
    const [comment] = await prisma.$transaction([
      prisma.post_comments.create({
        data: { user_id: userId, post_id, text },
        include: {
          User: { select: { id: true, username: true, display_name: true, avatar_url: true } }
        }
      }),
      prisma.post.update({ where: { id: post_id }, data: { comments_count: { increment: 1 } } })
    ]);

    return {
      ...comment,
      created_at: comment.created_at.toISOString()
    };
  }
}
