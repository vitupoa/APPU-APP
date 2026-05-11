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
      orderBy: { createdAt: 'desc' as const },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
            accountType: true
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
      const liked = await prisma.postLike.findMany({
        where: { userId, postId: { in: items.map((p) => p.id) } },
        select: { postId: true }
      });
      liked.forEach((l) => likedIds.add(l.postId));
    }

    // Check access for locked content
    const accessChecks = await Promise.all(
      items.map(async (p: any) => {
        if (!p.isLocked) return { id: p.id, hasAccess: true };
        if (!userId) return { id: p.id, hasAccess: false };
        
        const access = await ContentLockService.checkAccess(
          userId,
          p.id,
          'POST',
          p.userId,
          p.isLocked,
          p.requiredTier,
          p.unlockAmountKr ? Number(p.unlockAmountKr) : undefined
        );
        return { id: p.id, ...access };
      })
    );
    const accessMap = new Map(accessChecks.map(a => [a.id, a]));

    return {
      items: items.map((p) => {
        const access = accessMap.get(p.id) || { hasAccess: true };
        return {
          id: p.id,
          creator: p.user,
          imageUrls: access.hasAccess ? p.imageUrls : [],
          caption: p.caption,
          isLocked: p.isLocked,
          requiredTier: p.requiredTier,
          unlockAmountKr: (p as any).unlockAmountKr ? Number((p as any).unlockAmountKr) : undefined,
          hasAccess: access.hasAccess,
          requiresSubscription: (access as any).requiresSubscription,
          requiresUnlock: (access as any).requiresUnlock,
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          isLiked: likedIds.has(p.id),
          commentsEnabled: (p as any).commentsEnabled ?? true,
          createdAt: p.createdAt.toISOString()
        };
      }),
      nextCursor
    };
  }

  static async createPost(data: {
    userId: string;
    imageUrls: string[];
    caption: string;
    isLocked: boolean;
    requiredTier?: string;
    unlockAmountKr?: number;
  }) {
    const post = await prisma.post.create({
      data: {
        userId: data.userId,
        imageUrls: data.imageUrls,
        caption: data.caption ?? '',
        isLocked: data.isLocked,
        requiredTier: data.requiredTier as any,
        unlockAmountKr: data.unlockAmountKr ? new Prisma.Decimal(data.unlockAmountKr) : undefined
      } as any,
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
      }
    });

    // Process hashtags and mentions from caption (fire-and-forget)
    if (post.caption) {
      HashtagService.processContent(post.id, 'POST', post.caption).catch(() => {});
    }

    return {
      ...post,
      creator: (post as any).user,
      createdAt: post.createdAt.toISOString()
    };
  }

  static async toggleLike(userId: string, postId: string) {
    const existing = await prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } }
    });

    if (existing) {
      await prisma.$transaction([
        prisma.postLike.delete({ where: { id: existing.id } }),
        prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } })
      ]);
      return { liked: false };
    } else {
      await prisma.$transaction([
        prisma.postLike.create({ data: { userId, postId } }),
        prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } })
      ]);
      return { liked: true };
    }
  }

  static async addComment(userId: string, postId: string, text: string) {
    const [comment] = await prisma.$transaction([
      prisma.postComment.create({
        data: { userId, postId, text },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
        }
      }),
      prisma.post.update({ where: { id: postId }, data: { commentsCount: { increment: 1 } } })
    ]);

    return {
      ...comment,
      createdAt: comment.createdAt.toISOString()
    };
  }
}
