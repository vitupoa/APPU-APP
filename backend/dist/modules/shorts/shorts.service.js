"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortsService = void 0;
const database_1 = require("../../config/database");
class ShortsService {
    static async getFeed(params) {
        const { userId, tab, cursor, limit } = params;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let whereClause = {};
        if (tab === 'admiring') {
            const admiring = await database_1.prisma.admire.findMany({
                where: { admirerId: userId },
                select: { admiredId: true }
            });
            const followingIds = admiring.map((a) => a.admiredId);
            whereClause = { userId: { in: followingIds } };
        }
        if (tab === 'home') {
            whereClause = { contestId: { not: null } };
        }
        const shorts = await database_1.prisma.short.findMany({
            where: whereClause,
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy: tab === 'discover'
                ? [{ views: 'desc' }, { createdAt: 'desc' }]
                : { createdAt: 'desc' },
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
        const likedIds = new Set((await database_1.prisma.shortLike.findMany({
            where: { userId, shortId: { in: items.map((s) => s.id) } },
            select: { shortId: true }
        })).map((l) => l.shortId));
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
    static async createShort(data) {
        // Parse musicTrack "Title - Artist" format
        let musicTitle;
        let musicArtist;
        if (data.musicTrack) {
            const parts = data.musicTrack.split(' - ');
            musicTitle = parts[0]?.trim();
            musicArtist = parts[1]?.trim();
        }
        const short = await database_1.prisma.short.create({
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
                requiredTier: data.requiredTier
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
    static async toggleLike(userId, shortId) {
        const existing = await database_1.prisma.shortLike.findUnique({
            where: { shortId_userId: { shortId, userId } }
        });
        if (existing) {
            await database_1.prisma.$transaction([
                database_1.prisma.shortLike.delete({ where: { id: existing.id } }),
                database_1.prisma.short.update({ where: { id: shortId }, data: { likesCount: { decrement: 1 } } })
            ]);
            return { liked: false };
        }
        else {
            await database_1.prisma.$transaction([
                database_1.prisma.shortLike.create({ data: { userId, shortId } }),
                database_1.prisma.short.update({ where: { id: shortId }, data: { likesCount: { increment: 1 } } })
            ]);
            return { liked: true };
        }
    }
    static async addComment(userId, shortId, text) {
        const [comment] = await database_1.prisma.$transaction([
            database_1.prisma.shortComment.create({
                data: { userId, shortId, text },
                include: {
                    user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
                }
            }),
            database_1.prisma.short.update({ where: { id: shortId }, data: { commentsCount: { increment: 1 } } })
        ]);
        return {
            ...comment,
            createdAt: comment.createdAt.toISOString()
        };
    }
    static async getComments(shortId, cursor, limit = 20) {
        const comments = await database_1.prisma.shortComment.findMany({
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
    static async incrementView(shortId) {
        database_1.prisma.short.update({ where: { id: shortId }, data: { views: { increment: 1 } } })
            .catch(() => { });
    }
    static async getCollections(userId) {
        const collections = await database_1.prisma.shortCollection.findMany({
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
    static async createCollection(userId, name) {
        const collection = await database_1.prisma.shortCollection.create({ data: { userId, name } });
        return { ...collection, createdAt: collection.createdAt.toISOString() };
    }
}
exports.ShortsService = ShortsService;
//# sourceMappingURL=shorts.service.js.map