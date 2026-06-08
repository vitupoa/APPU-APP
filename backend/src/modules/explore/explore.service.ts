import { prisma } from '../../config/database.js';
import { HashtagService } from '../../shared/hashtag.service.js';

export class ExploreService {
  /**
   * Get trending hashtags based on usage count
   */
  static async getTrendingHashtags(limit: number = 10) {
    const hashtags = await prisma.hashtag.findMany({
      orderBy: { usageCount: 'desc' },
      take: limit,
      select: {
        id: true,
        tag: true,
        usageCount: true,
        _count: {
          select: {
            contentHashtags: true
          }
        }
      }
    });

    return hashtags.map((h: any) => ({
      tag: `#${h.tag}`,
      view_count: h.usageCount,
      postCount: h._count.contentHashtags
    }));
  }

  /**
   * Get trending shorts based on views and engagement
   */
  static async getTrendingShorts(category?: string, limit: number = 20) {
    const whereClause: any = {};
    
    // Filter by category if provided (match against caption hashtags)
    if (category && category !== 'ALL') {
      whereClause.caption = {
        contains: `#${category.toLowerCase()}`,
        mode: 'insensitive'
      };
    }

    const shorts = await prisma.shorts.findMany({
      where: whereClause,
      orderBy: [
        { views: 'desc' },
        { likes_count: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        video_url: true,
        views: true,
        user_id: true
      }
    });

    return shorts.map((s: any) => ({
      id: s.id,
      thumbnailUrl: s.video_url,
      view_count: s.views,
      creatorUsername: '',
      creatorAvatar: ''
    }));
  }

  /**
   * Get trending contests based on participants and prize
   */
  static async getTrendingContests(limit: number = 10) {
    const contests = await prisma.contest.findMany({
      where: {
        status: 'ACTIVE'
      },
      orderBy: [
        { total_participants: 'desc' },
        { prize_total_kr: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        cover_media_url: true,
        prize_total_kr: true,
        total_participants: true,
        category: true
      }
    });

    return contests.map((c: any) => ({
      id: c.id,
      title: c.title,
      thumbnailUrl: c.cover_media_url,
      prizeTotalKr: c.prize_total_kr,
      totalParticipants: c.total_participants,
      category: c.category
    }));
  }

  /**
   * Get trending creators based on follower growth and engagement
   */
  static async getTrendingCreators(limit: number = 10) {
    const creators = await prisma.user.findMany({
      where: {
        admirers_count: {
          gte: 100 // Minimum 100 followers to be considered trending
        }
      },
      orderBy: [
        { admirers_count: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        admirers_count: true,
        is_verified: true,
        bio: true,
        selectedNiches: true,
        customNiches: true,
        account_type: true
      }
    });

    return creators.map((c: any) => ({
      id: c.id,
      username: c.username,
      displayName: c.display_name,
      avatarUrl: c.avatar_url,
      followerCount: c.admirers_count,
      isVerified: c.is_verified || false,
      bio: c.bio,
      selectedNiches: c.selectedNiches || [],
      customNiches: c.customNiches || [],
      accountType: c.account_type
    }));
  }

  /**
   * Get content by hashtag
   */
  static async getHashtagContent(
    tag: string,
    contentType?: string,
    limit: number = 20,
    cursor?: string
  ) {
    const result = await HashtagService.getContentByTag(tag, contentType, limit, cursor);
    
    // Fetch actual content details
    const contentDetails = await Promise.all(
      result.items.map(async (item) => {
        if (item.contentType === 'SHORT') {
          const short = await prisma.shorts.findUnique({
            where: { id: item.content_id },
            select: {
              id: true,
              video_url: true,
              caption: true,
              views: true,
              likes_count: true,
              user_id: true
            }
          });
          return short ? {
            type: 'SHORT',
            id: short.id,
            videoUrl: short.video_url,
            caption: short.caption,
            views: short.views,
            likesCount: short.likes_count,
            creator: { id: short.user_id, username: '', avatar_url: '' }
          } : null;
        } else if (item.contentType === 'POST') {
          const post = await prisma.post.findUnique({
            where: { id: item.content_id },
            select: {
              id: true,
              caption: true,
              image_urls: true,
              likes_count: true,
              comments_count: true,
              user_id: true
            }
          });
          return post ? {
            type: 'POST',
            id: post.id,
            caption: post.caption,
            mediaUrls: post.image_urls,
            likesCount: post.likes_count,
            commentsCount: post.comments_count,
            creator: { id: post.user_id, username: '', avatar_url: '' }
          } : null;
        }
        return null;
      })
    );

    return {
      items: contentDetails.filter((item: any) => item !== null),
      nextCursor: result.nextCursor
    };
  }
}
