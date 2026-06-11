import { prisma } from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class BookmarkService {
  static async toggleBookmark(userId: string, contentId: string, contentType: string) {
    const existing = await prisma.$queryRaw`
      SELECT id FROM user_bookmarks 
      WHERE user_id = ${userId} 
      AND content_id = ${contentId} 
      AND content_type = ${contentType}
    ` as any[];

    if (existing.length > 0) {
      await prisma.$executeRaw`
        DELETE FROM user_bookmarks 
        WHERE user_id = ${userId} 
        AND content_id = ${contentId} 
        AND content_type = ${contentType}
      `;
      return { bookmarked: false };
    } else {
      const id = uuidv4();
      await prisma.$executeRaw`
        INSERT INTO user_bookmarks (id, user_id, content_id, content_type, created_at)
        VALUES (${id}, ${userId}, ${contentId}, ${contentType}, NOW())
      `;
      return { bookmarked: true };
    }
  }

  static async getUserBookmarks(userId: string, contentType?: string, cursor?: string, limit = 20) {
    let query = `
      SELECT * FROM user_bookmarks
      WHERE user_id = $1
    `;
    const params: any[] = [userId];

    if (contentType) {
      query += ` AND content_type = $2`;
      params.push(contentType);
    }

    if (cursor) {
      const cursorIndex = params.length + 1;
      query += ` AND created_at < (SELECT created_at FROM user_bookmarks WHERE id = $${cursorIndex})`;
      params.push(cursor);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit + 1);

    const bookmarks = await prisma.$queryRawUnsafe(query, ...params) as any[];

    const hasMore = bookmarks.length > limit;
    const items = hasMore ? bookmarks.slice(0, limit) : bookmarks;

    return {
      items: items.map((b: any) => ({
        id: b.id,
        contentId: b.content_id,
        contentType: b.content_type,
        collectionId: b.collection_id,
        createdAt: b.created_at.toISOString()
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  static async isBookmarked(userId: string, contentId: string, contentType: string): Promise<boolean> {
    const result = await prisma.$queryRaw`
      SELECT id FROM user_bookmarks 
      WHERE user_id = ${userId} 
      AND content_id = ${contentId} 
      AND content_type = ${contentType}
      LIMIT 1
    ` as any[];
    
    return result.length > 0;
  }
}
