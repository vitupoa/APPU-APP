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
            contentTags: true
          }
        }
      }
    });

    return hashtags.map((h: any) => ({
      tag: `#${h.tag}`,
      viewCount: h.usageCount,
      postCount: h._count.contentTags
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

    const shorts = await prisma.short.findMany({
      where: whereClause,
      orderBy: [
        { views: 'desc' },
        { likesCount: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        videoUrl: true,
        views: true,
        userId: true
      }
    });

    return shorts.map((s: any) => ({
      id: s.id,
      thumbnailUrl: s.videoUrl,
      viewCount: s.views,
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
        { totalParticipants: 'desc' },
        { prizeTotalKr: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        coverMediaUrl: true,
        prizeTotalKr: true,
        totalParticipants: true,
        category: true
      }
    });

    return contests.map((c: any) => ({
      id: c.id,
      title: c.title,
      thumbnailUrl: c.coverMediaUrl,
      prizeTotalKr: c.prizeTotalKr,
      totalParticipants: c.totalParticipants,
      category: c.category
    }));
  }

  /**
   * Get trending creators based on follower growth and engagement
   */
  static async getTrendingCreators(limit: number = 10) {
    const creators = await prisma.user.findMany({
      where: {
        admirersCount: {
          gte: 100 // Minimum 100 followers to be considered trending
        }
      },
      orderBy: [
        { admirersCount: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        admirersCount: true,
        isVerified: true,
        bio: true
      }
    });

    return creators.map((c: any) => ({
      id: c.id,
      username: c.username,
      displayName: c.displayName,
      avatarUrl: c.avatarUrl,
      followerCount: c.admirersCount,
      isVerified: c.isVerified || false,
      bio: c.bio
    }));
  }

  /**
   * Get active live streams
   */
  static async getLiveStreams(limit: number = 20) {
    const streams = await prisma.liveStream.findMany({
      where: {
        status: 'LIVE'
      },
      orderBy: {
        viewerCount: 'desc'
      },
      take: limit,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        viewerCount: true,
        category: true,
        createdAt: true,
        hostId: true
      }
    });

    return streams.map((s: any) => ({
      id: s.id,
      creatorId: s.hostId,
      creatorUsername: '',
      creatorAvatar: '',
      thumbnailUrl: s.thumbnailUrl || '',
      viewerCount: s.viewerCount,
      title: s.title,
      category: s.category || this.inferCategory(s.title)
    }));
  }

  /**
   * Infer category from stream title (temporary until category field is added)
   */
  private static inferCategory(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('game') || lowerTitle.includes('gaming') || lowerTitle.includes('play')) return 'Gaming';
    if (lowerTitle.includes('music') || lowerTitle.includes('sing') || lowerTitle.includes('song')) return 'Music';
    if (lowerTitle.includes('chat') || lowerTitle.includes('talk') || lowerTitle.includes('q&a')) return 'Chat';
    if (lowerTitle.includes('sport') || lowerTitle.includes('fitness') || lowerTitle.includes('workout')) return 'Sports';
    if (lowerTitle.includes('art') || lowerTitle.includes('draw') || lowerTitle.includes('paint')) return 'Art';
    if (lowerTitle.includes('cook') || lowerTitle.includes('recipe') || lowerTitle.includes('food')) return 'Cooking';
    if (lowerTitle.includes('tech') || lowerTitle.includes('code') || lowerTitle.includes('programming')) return 'Tech';
    return 'Chat'; // Default category
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
          const short = await prisma.short.findUnique({
            where: { id: item.contentId },
            select: {
              id: true,
              videoUrl: true,
              caption: true,
              views: true,
              likesCount: true,
              userId: true
            }
          });
          return short ? {
            type: 'SHORT',
            id: short.id,
            videoUrl: short.videoUrl,
            caption: short.caption,
            views: short.views,
            likesCount: short.likesCount,
            creator: { id: short.userId, username: '', avatarUrl: '' }
          } : null;
        } else if (item.contentType === 'POST') {
          const post = await prisma.post.findUnique({
            where: { id: item.contentId },
            select: {
              id: true,
              caption: true,
              imageUrls: true,
              likesCount: true,
              commentsCount: true,
              userId: true
            }
          });
          return post ? {
            type: 'POST',
            id: post.id,
            caption: post.caption,
            mediaUrls: post.imageUrls,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            creator: { id: post.userId, username: '', avatarUrl: '' }
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
