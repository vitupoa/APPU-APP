import { prisma } from '../../config/database.js';
import { HashtagService } from '../../shared/hashtag.service.js';

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

    return {
      items: items.map((p) => ({
        id: p.id,
        creator: p.user,
        imageUrls: p.imageUrls,
        caption: p.caption,
        isLocked: p.isLocked,
        requiredTier: p.requiredTier,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        isLiked: likedIds.has(p.id),
        createdAt: p.createdAt.toISOString()
      })),
      nextCursor
    };
  }

  static async createPost(data: {
    userId: string;
    imageUrls: string[];
    caption: string;
    isLocked: boolean;
    requiredTier?: string;
  }) {
    const post = await prisma.post.create({
      data: {
        userId: data.userId,
        imageUrls: data.imageUrls,
        caption: data.caption ?? '',
        isLocked: data.isLocked,
        requiredTier: data.requiredTier as any
      },
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
      creator: post.user,
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
