import { prisma } from '../../../config/database.js';
import { AuditService } from './audit.service.js';
import { ADMIN_ACTIONS } from '../rembrandt-rar.types.js';

type ContentType = 'short' | 'post' | 'contest' | 'comment' | 'product' | 'story';

export class ContentModerationService {
  static async listContent(type: ContentType, options: {
    page?: number; limit?: number; search?: string; userId?: string; status?: string;
  }) {
    const { page = 1, limit = 20, search, userId, status } = options;

    switch (type) {
      case 'short': return this.listShorts(page, limit, search, userId);
      case 'post': return this.listPosts(page, limit, search, userId);
      case 'contest': return this.listContests(page, limit, search, userId, status);
      case 'story': return this.listStories(page, limit, userId);
      default: throw new Error(`Unknown content type: ${type}`);
    }
  }

  private static async listShorts(page: number, limit: number, search?: string, userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (search) where.caption = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.short.findMany({
        where,
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.short.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private static async listPosts(page: number, limit: number, search?: string, userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (search) where.caption = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.post.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private static async listContests(page: number, limit: number, search?: string, userId?: string, status?: string) {
    const where: any = {};
    if (userId) where.creatorId = userId;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        include: { creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.contest.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private static async listStories(page: number, limit: number, userId?: string) {
    const where: any = {};
    if (userId) where.creatorId = userId;

    const [items, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: { creator: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.story.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── MODERATION ACTIONS ─────────────────────────────────

  static async moderateShort(
    adminId: string, shortId: string,
    action: string, reason?: string, ip?: string, ua?: string
  ) {
    if (action === 'delete') {
      await prisma.short.delete({ where: { id: shortId } });
    }
    // For 'hide', we'd add a hidden flag — using delete as primary action for now

    await prisma.contentModerationLog.create({
      data: { adminId, contentType: 'short', contentId: shortId, action, reason }
    });
    await AuditService.log(adminId, `content.${action}`, 'short', shortId, { reason }, ip, ua);
    return { success: true, message: `Short ${action}d` };
  }

  static async moderatePost(
    adminId: string, postId: string,
    action: string, reason?: string, ip?: string, ua?: string
  ) {
    if (action === 'delete') {
      await prisma.post.delete({ where: { id: postId } });
    }

    await prisma.contentModerationLog.create({
      data: { adminId, contentType: 'post', contentId: postId, action, reason }
    });
    await AuditService.log(adminId, `content.${action}`, 'post', postId, { reason }, ip, ua);
    return { success: true, message: `Post ${action}d` };
  }

  static async moderateContest(
    adminId: string, contestId: string,
    action: string, reason?: string, ip?: string, ua?: string
  ) {
    if (action === 'delete') {
      await prisma.contest.delete({ where: { id: contestId } });
    } else if (action === 'hide') {
      await prisma.contest.update({ where: { id: contestId }, data: { status: 'CANCELLED' } });
    } else if (action === 'approve') {
      await prisma.contest.update({ where: { id: contestId }, data: { status: 'ACTIVE' } });
    }

    await prisma.contentModerationLog.create({
      data: { adminId, contentType: 'contest', contentId: contestId, action, reason }
    });
    await AuditService.log(adminId, `content.${action}`, 'contest', contestId, { reason }, ip, ua);
    return { success: true, message: `Contest ${action}d` };
  }

  static async moderateStory(
    adminId: string, storyId: string,
    action: string, reason?: string, ip?: string, ua?: string
  ) {
    if (action === 'delete') {
      await prisma.story.delete({ where: { id: storyId } });
    }

    await prisma.contentModerationLog.create({
      data: { adminId, contentType: 'story', contentId: storyId, action, reason }
    });
    await AuditService.log(adminId, `content.${action}`, 'story', storyId, { reason }, ip, ua);
    return { success: true, message: `Story ${action}d` };
  }

  static async getModerationLogs(options: {
    page?: number; limit?: number; contentType?: string; adminId?: string;
  }) {
    const { page = 1, limit = 50, contentType, adminId } = options;
    const where: any = {};
    if (contentType) where.contentType = contentType;
    if (adminId) where.adminId = adminId;

    const [items, total] = await Promise.all([
      prisma.contentModerationLog.findMany({
        where, orderBy: { createdAt: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.contentModerationLog.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
