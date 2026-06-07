import { prisma } from '../../config/database.js';
import { HashtagService } from '../../shared/hashtag.service.js';
import { ContentLockService } from '../contentLock/contentLock.service.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

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
          const isLocked = p.is_locked;
          const requiredTier = p.required_tier;
          const unlockAmountKr = p.unlock_amount_kr;
          
          if (!isLocked) return { id: p.id, hasAccess: true };
          if (!userId) return { id: p.id, hasAccess: false, requiresSubscription: !!requiredTier, requiresUnlock: !!unlockAmountKr };
          
          const access = await ContentLockService.checkAccess(
            userId,
            p.id,
            'POST',
            p.user_id,
            isLocked,
            requiredTier,
            unlockAmountKr ? Number(unlockAmountKr) : undefined
          );
          return { id: p.id, ...access };
        })
      );
      const accessMap = new Map(accessChecks.map(a => [a.id, a]));

      return {
        items: items.map((p: any) => {
          const access = accessMap.get(p.id) || { hasAccess: true, requiresSubscription: false, requiresUnlock: false };
          return {
            id: p.id,
            creator: {
              id: p.user.id,
              username: p.user.username,
              displayName: p.user.display_name,
              avatarUrl: p.user.avatar_url,
              isVerified: p.user.is_verified,
              accountType: p.user.account_type
            },
            imageUrls: access.hasAccess ? p.image_urls : [],
            caption: p.caption,
            isLocked: p.is_locked,
            requiredTier: p.required_tier,
            unlockAmountKr: p.unlock_amount_kr ? Number(p.unlock_amount_kr) : undefined,
            hasAccess: access.hasAccess,
            requiresSubscription: (access as any).requiresSubscription || false,
            requiresUnlock: (access as any).requiresUnlock || false,
            likesCount: p.likes_count,
            commentsCount: p.comments_count,
            isLiked: likedIds.has(p.id),
            commentsEnabled: (p as any).commentsEnabled ?? true,
            createdAt: p.created_at.toISOString()
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
    console.log('[FeedService] Getting personalized feed for user:', userId);
    
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { country: true }
    });
    const userCountry = user?.country || '';
    console.log('[FeedService] User country:', userCountry);

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
    const [admirersPosts, similarPosts, trendingPosts, randomPosts, userPosts] = await Promise.all([
      this.getAdmirersPosts(admiringIds, admirersCount, cursor),
      this.getSimilarInterestPosts(userId, userCountry, similarCount, cursor),
      this.getTrendingPosts(userCountry, trendingCount, cursor),
      this.getRandomPosts(userCountry, randomCount, cursor),
      this.getUserOwnPosts(userId, Math.ceil(limit * 0.2))
    ]);

    // Combine and shuffle to create personalized feed
    const allPosts = [
      ...admirersPosts,
      ...similarPosts,
      ...trendingPosts,
      ...randomPosts,
      ...userPosts
    ];

    console.log('[FeedService] Feed sources:', {
      admirers: admirersPosts.length,
      similar: similarPosts.length,
      trending: trendingPosts.length,
      random: randomPosts.length,
      userOwn: userPosts.length,
      total: allPosts.length
    });

    // Remove duplicates by post ID
    const uniquePosts = Array.from(
      new Map(allPosts.map(p => [p.id, p])).values()
    );

    // If we still have very few posts, get more random ones globally
    if (uniquePosts.length < limit / 2) {
      const additionalPosts = await this.getGlobalRandomPosts(limit, uniquePosts.map(p => p.id));
      uniquePosts.push(...additionalPosts);
    }

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
      include: { user: {
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
    const likedHashtags = await prisma.$queryRaw<{ "hashtagId": string }[]>`
      SELECT DISTINCT ch."hashtagId"
      FROM content_hashtag ch
      INNER JOIN post_likes pl ON ch.content_id = pl.post_id
      WHERE pl.user_id = ${userId}
      AND ch."contentType" = 'POST'
      LIMIT 20
    `;

    if (likedHashtags.length === 0) {
      // Fallback to random posts from same country
      return this.getRandomPosts(country, count, cursor);
    }

    const hashtagIds = likedHashtags.map(h => h.hashtagId);

    // Get posts with similar hashtags
    const posts = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT p.*
      FROM post p
      INNER JOIN content_hashtag ch ON p.id = ch.content_id
      WHERE ch."hashtagId" = ANY(${hashtagIds})
      AND ch."contentType" = 'POST'
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
        return { ...p, user: user };
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
        user: { country }
      },
      take: count,
      orderBy: [
        { likes_count: 'desc' },
        { comments_count: 'desc' }
      ],
      include: { user: {
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
   * Get user's own posts
   */
  private static async getUserOwnPosts(userId: string, count: number) {
    return prisma.post.findMany({
      where: { user_id: userId },
      take: count,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
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
        return { ...p, user: user };
      })
    );

    return postsWithUsers;
  }

  /**
   * Get global random posts (no country filter)
   */
  private static async getGlobalRandomPosts(count: number, excludeIds: string[] = []) {
    const posts = await prisma.post.findMany({
      where: excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {},
      take: count,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
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
    return posts;
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
        return { ...p, user: user };
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
    console.log('[FeedService] Creating post with data:', data);
    
    const post = await prisma.post.create({
      data: {
        user_id: data.user_id,
        image_urls: data.imageUrls,
        caption: data.caption ?? '',
        is_locked: data.isLocked,
        required_tier: data.requiredTier as any,
        unlock_amount_kr: data.unlockAmountKr ? new Prisma.Decimal(data.unlockAmountKr) : undefined
      } as any,
      include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } }
      }
    });

    console.log('[FeedService] Post created successfully:', post.id);

    // Process hashtags and mentions from caption (fire-and-forget)
    if (post.caption) {
      HashtagService.processContent(post.id, 'POST', post.caption).catch(() => {});
    }

    return {
      ...post,
      creator: (post as any).user,
      createdAt: post.created_at.toISOString()
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
        prisma.post_likes.create({
          data: { user_id: userId, post_id }
        } as any),
        prisma.post.update({ where: { id: post_id }, data: { likes_count: { increment: 1 } } })
      ]);
      return { liked: true };
    }
  }

  static async addComment(userId: string, post_id: string, text: string) {
    const [comment] = await prisma.$transaction([
      prisma.post_comments.create({
        data: { user_id: userId, post_id, text },
        include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } }
        }
      }),
      prisma.post.update({ where: { id: post_id }, data: { comments_count: { increment: 1 } } })
    ]);

    return {
      ...comment,
      createdAt: comment.created_at.toISOString()
    };
  }

  static async getPostById(postId: string, userId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
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

    if (!post) {
      throw new Error('Post not found');
    }

    // Check if user has liked this post
    let isLiked = false;
    if (userId) {
      const like = await prisma.post_likes.findUnique({
        where: { post_id_user_id: { post_id: postId, user_id: userId } }
      });
      isLiked = !!like;
    }

    // Check access for locked content
    const access = await ContentLockService.checkAccess(
      userId || '',
      post.id,
      'POST',
      post.user_id,
      post.is_locked,
      post.required_tier,
      post.unlock_amount_kr ? Number(post.unlock_amount_kr) : undefined
    );

    return {
      id: post.id,
      creator: {
        id: post.user.id,
        username: post.user.username,
        displayName: post.user.display_name,
        avatarUrl: post.user.avatar_url,
        isVerified: post.user.is_verified,
        accountType: post.user.account_type
      },
      imageUrls: access.hasAccess ? post.image_urls : [],
      caption: post.caption,
      isLocked: post.is_locked,
      requiredTier: post.required_tier,
      unlockAmountKr: post.unlock_amount_kr ? Number(post.unlock_amount_kr) : undefined,
      hasAccess: access.hasAccess,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      isLiked,
      commentsEnabled: true,
      createdAt: post.created_at.toISOString()
    };
  }
}
