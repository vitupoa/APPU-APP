import { prisma } from '../../../config/database.js';
import { redis } from '../../../config/redis.js';
import crypto from 'crypto';

const FEED_CACHE_TTL = 300; // 5 minutes
const TRENDING_CACHE_TTL = 900; // 15 minutes
const INTERESTS_CACHE_TTL = 3600; // 1 hour

export class FeedGenerationService {
  
  async generateDiscoverFeed(userId: string, limit: number = 20, cursor?: string) {
    // Check Redis cache
    const cacheKey = `discover_feed:${userId}:${limit}:${cursor || 'initial'}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis cache read error:', err);
    }

    // 60% Personalized, 20% Admiring, 10% Trending, 10% Discovery
    const personalizedCount = Math.floor(limit * 0.6);
    const admiringCount = Math.floor(limit * 0.2);
    const trendingCount = Math.floor(limit * 0.1);
    const discoveryCount = limit - personalizedCount - admiringCount - trendingCount;

    const [personalized, admiring, trending, discovery] = await Promise.all([
      this.getPersonalizedContent(userId, personalizedCount),
      this.getAdmiringContent(userId, admiringCount),
      this.getTrendingContent(trendingCount),
      this.getDiscoveryContent(userId, discoveryCount)
    ]);

    const feed = [...personalized, ...admiring, ...trending, ...discovery];
    const shuffled = this.shuffleWithClustering(feed);

    const result = {
      content: shuffled,
      composition: {
        personalized: personalized.length,
        admiring: admiring.length,
        trending: trending.length,
        discovery: discovery.length
      }
    };

    // Cache for 5 minutes
    try {
      await redis.setex(cacheKey, FEED_CACHE_TTL, JSON.stringify(result));
    } catch (err) {
      console.error('Redis cache write error:', err);
    }

    return result;
  }

  async generateAdmiringFeed(userId: string, limit: number = 20) {
    // Check Redis cache
    const cacheKey = `admiring_feed:${userId}:${limit}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis cache read error:', err);
    }

    // Get creators user admires
    const admiringRelations = await prisma.admires.findMany({
      where: { admirer_id: userId },
      select: { admired_id: true }
    });

    const creatorIds = admiringRelations.map((a: any) => a.admired_id);
    if (creatorIds.length === 0) return { content: [] };

    // Calculate split: 90% unseen, 7% trending, 3% favorites
    const unseenCount = Math.floor(limit * 0.90);
    const trendingCount = Math.floor(limit * 0.07);
    const favoritesCount = limit - unseenCount - trendingCount;

    // Get 90% unseen content from admired creators
    const unseenContent = await prisma.$queryRaw<any[]>`
      SELECT s.id, s.user_id as "userId", s.video_url as "videoUrl", s.thumbnail_url as "thumbnailUrl",
             s.media_type as "mediaType", s.aspect_ratio as "aspectRatio", s.media_urls as "mediaUrls",
             s.caption, s.created_at as "createdAt", 'SHORT' as type
      FROM shorts s
      WHERE s.user_id = ANY(${creatorIds})
        AND s.id NOT IN (
          SELECT content_id FROM user_content_delivery 
          WHERE user_id = ${userId} AND content_type = 'SHORT'
        )
      ORDER BY s.created_at DESC
      LIMIT ${unseenCount}
    `;

    // Get 7% trending/viral content from non-admired creators
    const trendingContent = await prisma.$queryRaw<any[]>`
      SELECT s.id, s.user_id as "userId", s.video_url as "videoUrl", s.thumbnail_url as "thumbnailUrl",
             s.media_type as "mediaType", s.aspect_ratio as "aspectRatio", s.media_urls as "mediaUrls",
             s.caption, s.created_at as "createdAt", 'SHORT' as type
      FROM shorts s
      INNER JOIN content_distribution cd ON s.id = cd.content_id AND cd.content_type = 'SHORT'
      WHERE s.user_id != ALL(${creatorIds})
        AND cd.engagement_score > 0.25
        AND s.id NOT IN (
          SELECT content_id FROM user_content_delivery 
          WHERE user_id = ${userId} AND content_type = 'SHORT'
        )
      ORDER BY cd.engagement_score DESC, s.created_at DESC
      LIMIT ${trendingCount}
    `;

    // Get 3% previously liked content (favorites for rewatching)
    const favoritesContent = await prisma.$queryRaw<any[]>`
      SELECT s.id, s.user_id as "userId", s.video_url as "videoUrl", s.thumbnail_url as "thumbnailUrl",
             s.media_type as "mediaType", s.aspect_ratio as "aspectRatio", s.media_urls as "mediaUrls",
             s.caption, s.created_at as "createdAt", 'SHORT' as type
      FROM shorts s
      INNER JOIN user_content_delivery ucd ON s.id = ucd.content_id AND ucd.content_type = 'SHORT'
      WHERE s.user_id = ANY(${creatorIds})
        AND ucd.user_id = ${userId}
        AND ucd.liked = true
      ORDER BY RANDOM()
      LIMIT ${favoritesCount}
    `;

    // Shuffle together
    const allContent = [...unseenContent, ...trendingContent, ...favoritesContent].sort(() => Math.random() - 0.5);

    const result = { 
      content: allContent,
      composition: {
        unseen: unseenContent.length,
        trending: trendingContent.length,
        favorites: favoritesContent.length
      }
    };

    // Cache for 5 minutes
    try {
      await redis.setex(cacheKey, FEED_CACHE_TTL, JSON.stringify(result));
    } catch (err) {
      console.error('Redis cache write error:', err);
    }

    return result;
  }

  private async getPersonalizedContent(userId: string, count: number) {
    // Check Redis cache for user interests
    const interestsCacheKey = `user_interests:${userId}`;
    let interests: any[] = [];
    
    try {
      const cached = await redis.get(interestsCacheKey);
      if (cached) {
        interests = JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis cache read error:', err);
    }

    if (interests.length === 0) {
      // Get user's micro-interests from DB
      interests = await prisma.user_micro_interests.findMany({
        where: { user_id: userId },
        orderBy: { affinity: 'desc' },
        take: 10
      });

      // Cache for 1 hour
      try {
        await redis.setex(interestsCacheKey, INTERESTS_CACHE_TTL, JSON.stringify(interests));
      } catch (err) {
        console.error('Redis cache write error:', err);
      }
    }

    if (interests.length === 0) return this.getTrendingContent(count);

    const categories = interests.map((i: any) => i.category);

    // Find content matching user interests that hasn't been delivered
    const content = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT s.id, s.user_id as "userId", s.video_url as "videoUrl", 
             s.thumbnail_url as "thumbnailUrl", s.media_type as "mediaType", 
             s.aspect_ratio as "aspectRatio", s.media_urls as "mediaUrls",
             s.caption, s.created_at as "createdAt", 'SHORT' as type
      FROM shorts s
      WHERE s.id NOT IN (
        SELECT content_id FROM user_content_delivery 
        WHERE user_id = ${userId} AND content_type = 'SHORT'
      )
      ORDER BY s.created_at DESC
      LIMIT ${count}
    `;

    return content;
  }

  private async getAdmiringContent(userId: string, count: number) {
    const admiringRelations = await prisma.admires.findMany({
      where: { admirer_id: userId },
      select: { admired_id: true },
      take: 20
    });

    const creatorIds = admiringRelations.map((a: any) => a.admired_id);
    if (creatorIds.length === 0) return [];

    const content = await prisma.$queryRaw<any[]>`
      SELECT s.id, s.user_id as "userId", s.video_url as "videoUrl", 
             s.thumbnail_url as "thumbnailUrl", s.media_type as "mediaType",
             s.aspect_ratio as "aspectRatio", s.media_urls as "mediaUrls",
             s.caption, s.created_at as "createdAt", 'SHORT' as type
      FROM shorts s
      WHERE s.user_id = ANY(${creatorIds})
        AND s.id NOT IN (
          SELECT content_id FROM user_content_delivery 
          WHERE user_id = ${userId} AND content_type = 'SHORT'
        )
      ORDER BY s.created_at DESC
      LIMIT ${count}
    `;

    return content;
  }

  private async getTrendingContent(count: number) {
    // Check Redis cache for trending content
    const trendingCacheKey = `trending_content:${count}`;
    
    try {
      const cached = await redis.get(trendingCacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error('Redis cache read error:', err);
    }

    const content = await prisma.$queryRaw<any[]>`
      SELECT s.id, s.user_id as "userId", s.video_url as "videoUrl", 
             s.thumbnail_url as "thumbnailUrl", s.media_type as "mediaType",
             s.aspect_ratio as "aspectRatio", s.media_urls as "mediaUrls",
             s.caption, s.created_at as "createdAt", 'SHORT' as type
      FROM shorts s
      INNER JOIN content_distribution cd ON s.id = cd.content_id AND cd.content_type = 'SHORT'
      WHERE cd.engagement_score > 0.20
      ORDER BY cd.engagement_score DESC, s.created_at DESC
      LIMIT ${count}
    `;

    // Cache for 15 minutes
    try {
      await redis.setex(trendingCacheKey, TRENDING_CACHE_TTL, JSON.stringify(content));
    } catch (err) {
      console.error('Redis cache write error:', err);
    }

    return content;
  }

  private async getDiscoveryContent(userId: string, count: number) {
    // Small creators with high engagement
    const content = await prisma.$queryRaw<any[]>`
      SELECT s.id, s.user_id as "userId", s.video_url as "videoUrl", 
             s.thumbnail_url as "thumbnailUrl", s.media_type as "mediaType",
             s.aspect_ratio as "aspectRatio", s.media_urls as "mediaUrls",
             s.caption, s.created_at as "createdAt", 'SHORT' as type
      FROM shorts s
      INNER JOIN users u ON s.user_id = u.id
      INNER JOIN content_distribution cd ON s.id = cd.content_id AND cd.content_type = 'SHORT'
      WHERE u.admirers_count < 10000
        AND cd.engagement_score > 0.15
        AND s.id NOT IN (
          SELECT content_id FROM user_content_delivery 
          WHERE user_id = ${userId} AND content_type = 'SHORT'
        )
      ORDER BY cd.engagement_score DESC
      LIMIT ${count}
    `;

    return content;
  }

  private shuffleWithClustering(content: any[]) {
    // Shuffle but maintain some clustering to avoid jarring transitions
    const shuffled = [...content];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async trackInteraction(userId: string, content_id: string, contentType: string, interaction: {
    signalType: string;
    watchDuration?: number;
    totalDuration?: number;
  }) {
    // Track interaction signal
    await prisma.user_interaction_signals.create({
      data: {
        user_id: userId,
        content_id,
        content_type: contentType,
        signal_type: interaction.signalType,
        watch_duration: interaction.watchDuration || 0,
        total_duration: interaction.totalDuration || 0,
        weight: this.getSignalWeight(interaction.signalType)
      }
    } as any);

    // Update delivery record
    const updates: any = {};
    if (interaction.signalType === 'VIEW') {
      updates.viewed = true;
      updates.view_duration = interaction.watchDuration;
      if (interaction.watchDuration && interaction.totalDuration) {
        updates.completed = interaction.watchDuration >= interaction.totalDuration * 0.9;
      }
    } else if (interaction.signalType === 'LIKE') {
      updates.liked = true;
    } else if (interaction.signalType === 'SHARE') {
      updates.shared = true;
    } else if (interaction.signalType === 'COMMENT') {
      updates.commented = true;
    } else if (interaction.signalType === 'REWATCH') {
      updates.rewatched_count = { increment: 1 };
    }

    await prisma.user_content_delivery.updateMany({
      where: { user_id: userId, content_id, content_type: contentType },
      data: updates
    });

    // Update micro-interests based on interaction
    await this.updateMicroInterests(userId, content_id, contentType, interaction.signalType);

    // Invalidate user's feed cache
    try {
      const pattern = `*_feed:${userId}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      // Also invalidate interests cache
      await redis.del(`user_interests:${userId}`);
    } catch (err) {
      console.error('Redis cache invalidation error:', err);
    }
  }

  private getSignalWeight(signalType: string): number {
    const weights: Record<string, number> = {
      VIEW: 1.0,
      LIKE: 1.5,
      SHARE: 2.0,
      COMMENT: 1.8,
      REWATCH: 1.7,
      SKIP: -0.5,
      NOT_INTERESTED: -1.0,
      HIDE: -2.0,
      ADMIRE: 2.5,
      UNADMIRE: -1.5
    };
    return weights[signalType] || 1.0;
  }

  private async updateMicroInterests(userId: string, content_id: string, contentType: string, signalType: string) {
    // Extract categories/hashtags from content and update user interests
    // This is a simplified version - in production, use NLP/ML for better categorization
    const weight = this.getSignalWeight(signalType);
    if (weight <= 0) return;

    // Get content hashtags
    const hashtags = await prisma.$queryRaw<{ tag: string }[]>`
      SELECT h.tag FROM hashtags h
      INNER JOIN content_hashtags ch ON h.id = ch.hashtag_id
      WHERE ch.content_id = ${content_id} AND ch.content_type = ${contentType}
    `;

    for (const { tag } of hashtags) {
      // Check if interest exists
      const existing = await prisma.user_micro_interests.findFirst({
        where: {
          user_id: userId,
          category: tag
        }
      });

      if (existing) {
        await prisma.user_micro_interests.update({
          where: { id: existing.id },
          data: {
            affinity: {
              increment: Math.min(0.05 * weight, 0.2)
            },
            last_engaged_at: new Date()
          }
        });
      } else {
        await prisma.user_micro_interests.create({
          data: {
            user_id: userId,
            interest: tag,
            category: tag,
            affinity: Math.min(0.1 * weight, 1.0),
            last_engaged_at: new Date()
          }
        } as any);
      }
    }
  }
}

export const feedGenerationService = new FeedGenerationService();
