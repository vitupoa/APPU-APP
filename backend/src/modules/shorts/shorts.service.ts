import { prisma } from '../../config/database';

export class ShortsService {
  static async getFeed(params: {
    userId: string;
    tab: 'home' | 'discover' | 'admiring';
    cursor?: string;
    limit: number;
  }) {
    const { userId, tab, cursor, limit } = params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = {};

    if (tab === 'admiring') {
      const admiring = await prisma.admire.findMany({
        where: { admirerId: userId },
        select: { admiredId: true }
      });
      const followingIds = admiring.map((a) => a.admiredId);
      whereClause = { userId: { in: followingIds } };
    }

    if (tab === 'home') {
      whereClause = { contestId: { not: null } };
    }

    const shorts = await prisma.short.findMany({
      where: whereClause,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: tab === 'discover'
        ? [{ views: 'desc' as const }, { createdAt: 'desc' as const }]
        : { createdAt: 'desc' as const },
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
        },
        linkedProduct: {
          select: {
            id: true,
            title: true,
            imageUrls: true,
            priceKr: true
          }
        }
      }
    });

    const hasMore = shorts.length > limit;
    const items = hasMore ? shorts.slice(0, limit) : shorts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Check if user has liked each short
    const likedIds = new Set(
      (await prisma.shortLike.findMany({
        where: { userId, shortId: { in: items.map((s) => s.id) } },
        select: { shortId: true }
      })).map((l) => l.shortId)
    );

    return {
      items: items.map((s) => ({
        id: s.id,
        creator: s.user,
        videoUrl: s.videoUrl,
        thumbnailUrl: s.thumbnailUrl,
        caption: s.caption,
        musicTrack: s.musicTitle ? `${s.musicTitle}${s.musicArtist ? ` - ${s.musicArtist}` : ''}` : null,
        contestId: s.contestId,
        collectionId: s.collectionId,
        linkedProductId: s.linkedProductId,
        linkedProduct: s.linkedProduct ? {
          id: s.linkedProduct.id,
          title: s.linkedProduct.title,
          imageUrl: s.linkedProduct.imageUrls?.[0] ?? null,
          priceKr: Number(s.linkedProduct.priceKr)
        } : null,
        isLocked: s.isLocked,
        requiredTier: s.requiredTier,
        likesCount: s.likesCount,
        commentsCount: s.commentsCount,
        views: s.views,
        isLiked: likedIds.has(s.id),
        createdAt: s.createdAt.toISOString()
      })),
      nextCursor
    };
  }

  static async createShort(data: {
    userId: string;
    videoUrl: string;
    thumbnailUrl?: string;
    caption: string;
    musicTrack?: string;
    contestId?: string;
    collectionId?: string;
    linkedProductId?: string;
    isLocked: boolean;
    requiredTier?: string;
  }) {
    // Parse musicTrack "Title - Artist" format
    let musicTitle: string | undefined;
    let musicArtist: string | undefined;
    if (data.musicTrack) {
      const parts = data.musicTrack.split(' - ');
      musicTitle = parts[0]?.trim();
      musicArtist = parts[1]?.trim();
    }

    const short = await prisma.short.create({
      data: {
        userId: data.userId,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        caption: data.caption,
        musicTitle,
        musicArtist,
        contestId: data.contestId,
        collectionId: data.collectionId,
        linkedProductId: data.linkedProductId,
        isLocked: data.isLocked,
        requiredTier: data.requiredTier as any
      },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      }
    });

    return {
      ...short,
      creator: short.user,
      createdAt: short.createdAt.toISOString()
    };
  }

  static async toggleLike(userId: string, shortId: string) {
    const existing = await prisma.shortLike.findUnique({
      where: { shortId_userId: { shortId, userId } }
    });

    if (existing) {
      await prisma.$transaction([
        prisma.shortLike.delete({ where: { id: existing.id } }),
        prisma.short.update({ where: { id: shortId }, data: { likesCount: { decrement: 1 } } })
      ]);
      return { liked: false };
    } else {
      await prisma.$transaction([
        prisma.shortLike.create({ data: { userId, shortId } }),
        prisma.short.update({ where: { id: shortId }, data: { likesCount: { increment: 1 } } })
      ]);
      return { liked: true };
    }
  }

  static async addComment(userId: string, shortId: string, text: string) {
    const [comment] = await prisma.$transaction([
      prisma.shortComment.create({
        data: { userId, shortId, text },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
        }
      }),
      prisma.short.update({ where: { id: shortId }, data: { commentsCount: { increment: 1 } } })
    ]);

    return {
      ...comment,
      createdAt: comment.createdAt.toISOString()
    };
  }

  static async getComments(shortId: string, cursor?: string, limit = 20) {
    const comments = await prisma.shortComment.findMany({
      where: { shortId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
      }
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    return {
      items: items.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  static async incrementView(shortId: string) {
    prisma.short.update({ where: { id: shortId }, data: { views: { increment: 1 } } })
      .catch(() => {});
  }

  static async getCollections(userId: string) {
    const collections = await prisma.shortCollection.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { shorts: true } } }
    });
    return collections.map((c) => ({
      ...c,
      shortCount: c._count.shorts,
      createdAt: c.createdAt.toISOString()
    }));
  }

  static async createCollection(userId: string, name: string) {
    const collection = await prisma.shortCollection.create({ data: { userId, name } });
    return { ...collection, createdAt: collection.createdAt.toISOString() };
  }
}
