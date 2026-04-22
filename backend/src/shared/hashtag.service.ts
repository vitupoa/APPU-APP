import { prisma } from '../../config/database.js';

/**
 * Shared service for extracting and persisting hashtags and mentions
 * from content captions (posts, shorts, contests).
 */
export class HashtagService {
  /**
   * Extract hashtags from text. Returns normalized tags (lowercase, no #).
   */
  static extractHashtags(text: string): string[] {
    if (!text) return [];
    const regex = /#([a-zA-Z0-9_]+)/g;
    const tags = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      tags.add(match[1].toLowerCase());
    }
    return Array.from(tags);
  }

  /**
   * Extract @mentions from text. Returns usernames (lowercase, no @).
   */
  static extractMentions(text: string): string[] {
    if (!text) return [];
    const regex = /@([a-zA-Z0-9_]+)/g;
    const mentions = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      mentions.add(match[1].toLowerCase());
    }
    return Array.from(mentions);
  }

  /**
   * Process hashtags for a piece of content.
   * Upserts Hashtag records and creates ContentHashtag joins.
   */
  static async processHashtags(
    contentId: string,
    contentType: 'POST' | 'SHORT' | 'CONTEST',
    text: string
  ) {
    const tags = this.extractHashtags(text);
    if (tags.length === 0) return;

    for (const tag of tags) {
      const hashtag = await prisma.hashtag.upsert({
        where: { tag },
        create: { tag },
        update: { usageCount: { increment: 1 } }
      });

      await prisma.contentHashtag.upsert({
        where: {
          hashtagId_contentId_contentType: {
            hashtagId: hashtag.id,
            contentId,
            contentType
          }
        },
        create: { hashtagId: hashtag.id, contentId, contentType },
        update: {}
      });
    }
  }

  /**
   * Process @mentions for a piece of content.
   * Resolves usernames to user IDs and creates ContentMention records.
   */
  static async processMentions(
    contentId: string,
    contentType: 'POST' | 'SHORT' | 'CONTEST',
    text: string
  ) {
    const usernames = this.extractMentions(text);
    if (usernames.length === 0) return;

    const users = await prisma.user.findMany({
      where: { username: { in: usernames, mode: 'insensitive' } },
      select: { id: true, username: true }
    });

    for (const user of users) {
      await prisma.contentMention.upsert({
        where: {
          mentionedUserId_contentId_contentType: {
            mentionedUserId: user.id,
            contentId,
            contentType
          }
        },
        create: { mentionedUserId: user.id, contentId, contentType },
        update: {}
      });
    }
  }

  /**
   * Full processing: extract and persist both hashtags and mentions.
   */
  static async processContent(
    contentId: string,
    contentType: 'POST' | 'SHORT' | 'CONTEST',
    text: string
  ) {
    await Promise.all([
      this.processHashtags(contentId, contentType, text),
      this.processMentions(contentId, contentType, text)
    ]);
  }

  /**
   * Get trending hashtags (most used).
   */
  static async getTrending(limit = 20) {
    return prisma.hashtag.findMany({
      orderBy: { usageCount: 'desc' },
      take: limit,
      select: { id: true, tag: true, usageCount: true }
    });
  }

  /**
   * Get content by hashtag.
   */
  static async getContentByTag(tag: string, contentType?: string, limit = 20, cursor?: string) {
    const normalizedTag = tag.toLowerCase().replace(/^#/, '');
    
    const whereClause: any = {
      hashtag: { tag: normalizedTag }
    };
    if (contentType) {
      whereClause.contentType = contentType;
    }

    const items = await prisma.contentHashtag.findMany({
      where: whereClause,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      select: { id: true, contentId: true, contentType: true, createdAt: true }
    });

    const hasMore = items.length > limit;
    const results = hasMore ? items.slice(0, limit) : items;

    return {
      items: results,
      nextCursor: hasMore ? results[results.length - 1].id : null
    };
  }
}
