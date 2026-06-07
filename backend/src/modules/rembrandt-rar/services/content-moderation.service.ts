import { prisma } from '../../../config/database.js';
import { AuditService } from './audit.service.js';
import { ADMIN_ACTIONS } from '../rembrandt-rar.types.js';
import crypto from 'crypto';

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
    if (userId) where.user_id = userId;
    if (search) where.caption = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.shorts.findMany({
        where,
        include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.shorts.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private static async listPosts(page: number, limit: number, search?: string, userId?: string) {
    const where: any = {};
    if (userId) where.user_id = userId;
    if (search) where.caption = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.post.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private static async listContests(page: number, limit: number, search?: string, userId?: string, status?: string) {
    const where: any = {};
    if (userId) where.creator_id = userId;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.contest.findMany({
        where,
        include: { user: { select: { id: true, username: true, display_name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.contest.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  private static async listStories(page: number, limit: number, userId?: string) {
    const where: any = {};
    if (userId) where.creator_id = userId;

    const [items, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: { creator: { select: { id: true, username: true, display_name: true, avatar_url: true } } },
        orderBy: { created_at: 'desc' },
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
      await prisma.shorts.delete({ where: { id: shortId } });
    }
    // For 'hide', we'd add a hidden flag — using delete as primary action for now

    await prisma.content_moderation_logs.create({
      data: { adminId: adminId, contentType: 'short', content_id: shortId, action, reason }
    } as any);
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

    await prisma.content_moderation_logs.create({
      data: { adminId: adminId, contentType: 'post', content_id: postId, action, reason }
    } as any);
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

    await prisma.content_moderation_logs.create({
      data: { adminId: adminId, contentType: 'contest', content_id: contestId, action, reason }
    } as any);
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

    await prisma.content_moderation_logs.create({
      data: { adminId: adminId, contentType: 'story', content_id: storyId, action, reason }
    } as any);
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
      prisma.content_moderation_logs.findMany({
        where, orderBy: { created_at: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.content_moderation_logs.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
