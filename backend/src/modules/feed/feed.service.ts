import { prisma } from '../../config/database.js';
import { HashtagService } from '../../shared/hashtag.service.js';
import { ContentLockService } from '../contentLock/contentLock.service.js';
import { Prisma } from '@prisma/client';

export class FeedService {
  static async getFeed(params: {
    userId?: string;
    cursor?: string;
    limit: number;
  }) {
    const { userId, cursor, limit } = params;

    const posts = await prisma.post.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' as const },
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
          creator: p.User,
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
