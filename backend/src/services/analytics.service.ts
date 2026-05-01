import { prisma } from '../config/database.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('AnalyticsService');

export interface AnalyticsEvent {
  userId: string;
  eventType: string;
  eventCategory: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface ConversionEvent {
  userId: string;
  contentId?: string;
  contentType?: string;
  conversionType: string;
  value?: number;
  metadata?: Record<string, any>;
}

export class AnalyticsService {
  /**
   * Track user interaction signal for recommendation algorithm
   */
  async trackInteraction(data: {
    userId: string;
    contentId: string;
    contentType: 'SHORT' | 'POST';
    signalType: 'VIEW' | 'LIKE' | 'SHARE' | 'COMMENT' | 'REWATCH' | 'SKIP' | 'NOT_INTERESTED' | 'HIDE' | 'ADMIRE' | 'UNADMIRE';
    watchDuration?: number;
    totalDuration?: number;
  }): Promise<void> {
    try {
      const weight = this.calculateSignalWeight(data.signalType, data.watchDuration, data.totalDuration);

      await prisma.userInteractionSignal.create({
        data: {
          userId: data.userId,
          contentId: data.contentId,
          contentType: data.contentType,
          signalType: data.signalType,
          watchDuration: data.watchDuration || 0,
          totalDuration: data.totalDuration || 0,
          weight,
        },
      });

      logger.info(`Tracked ${data.signalType} interaction for user ${data.userId} on ${data.contentType} ${data.contentId}`);
    } catch (error) {
      logger.error('Failed to track interaction', { error, data });
    }
  }

  /**
   * Track content delivery to user
   */
  async trackContentDelivery(data: {
    userId: string;
    contentId: string;
    contentType: 'SHORT' | 'POST';
  }): Promise<void> {
    try {
      await prisma.userContentDelivery.upsert({
        where: {
          userId_contentId_contentType: {
            userId: data.userId,
            contentId: data.contentId,
            contentType: data.contentType,
          },
        },
        create: {
          userId: data.userId,
          contentId: data.contentId,
          contentType: data.contentType,
        },
        update: {},
      });

      logger.debug(`Tracked content delivery: ${data.contentType} ${data.contentId} to user ${data.userId}`);
    } catch (error) {
      logger.error('Failed to track content delivery', { error, data });
    }
  }

  /**
   * Update content engagement metrics
   */
  async updateContentEngagement(data: {
    userId: string;
    contentId: string;
    contentType: 'SHORT' | 'POST';
    viewed?: boolean;
    viewDuration?: number;
    completed?: boolean;
    liked?: boolean;
    shared?: boolean;
    commented?: boolean;
    rewatched?: boolean;
  }): Promise<void> {
    try {
      const updateData: any = {};
      
      if (data.viewed !== undefined) updateData.viewed = data.viewed;
      if (data.viewDuration !== undefined) updateData.viewDuration = data.viewDuration;
      if (data.completed !== undefined) updateData.completed = data.completed;
      if (data.liked !== undefined) updateData.liked = data.liked;
      if (data.shared !== undefined) updateData.shared = data.shared;
      if (data.commented !== undefined) updateData.commented = data.commented;
      if (data.rewatched) updateData.rewatchedCount = { increment: 1 };

      await prisma.userContentDelivery.updateMany({
        where: {
          userId: data.userId,
          contentId: data.contentId,
          contentType: data.contentType,
        },
        data: updateData,
      });

      logger.debug(`Updated engagement for ${data.contentType} ${data.contentId}`);
    } catch (error) {
      logger.error('Failed to update content engagement', { error, data });
    }
  }

  /**
   * Track sales funnel event
   */
  async trackFunnelEvent(data: {
    userId: string;
    contestId?: string;
    campaignId?: string;
    stage: 'AWARENESS' | 'INTEREST' | 'CONSIDERATION' | 'CONVERSION' | 'RETENTION' | 'ADVOCACY';
    eventType: string;
    sourceType?: string;
    sourceId?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      await prisma.salesFunnelEvent.create({
        data: {
          userId: data.userId,
          contestId: data.contestId,
          campaignId: data.campaignId,
          stage: data.stage,
          eventType: data.eventType,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          metadata: data.metadata,
        },
      });

      logger.info(`Tracked funnel event: ${data.stage} - ${data.eventType} for user ${data.userId}`);
    } catch (error) {
      logger.error('Failed to track funnel event', { error, data });
    }
  }

  /**
   * Track product analytics
   */
  async trackProductView(data: {
    productId: string;
    userId?: string;
    source?: string;
  }): Promise<void> {
    try {
      // Increment product view count
      await prisma.product.update({
        where: { id: data.productId },
        data: { viewCount: { increment: 1 } },
      });

      // Update daily analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.productAnalytic.upsert({
        where: {
          productId_date: {
            productId: data.productId,
            date: today,
          },
        },
        create: {
          productId: data.productId,
          date: today,
          views: 1,
        },
        update: {
          views: { increment: 1 },
        },
      });

      logger.debug(`Tracked product view: ${data.productId}`);
    } catch (error) {
      logger.error('Failed to track product view', { error, data });
    }
  }

  /**
   * Track contest analytics
   */
  async trackContestEvent(data: {
    contestId: string;
    eventType: 'VIEW' | 'JOIN' | 'SUBMISSION' | 'VOTE' | 'SHARE' | 'SHOP_VISIT' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'PURCHASE';
    userId?: string;
    value?: number;
  }): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updateData: any = {};
      
      switch (data.eventType) {
        case 'VIEW':
          updateData.views = { increment: 1 };
          break;
        case 'JOIN':
          updateData.joins = { increment: 1 };
          break;
        case 'SUBMISSION':
          updateData.submissions = { increment: 1 };
          break;
        case 'VOTE':
          updateData.votes = { increment: 1 };
          break;
        case 'SHARE':
          updateData.shares = { increment: 1 };
          break;
        case 'SHOP_VISIT':
          updateData.shopVisits = { increment: 1 };
          break;
        case 'PRODUCT_VIEW':
          updateData.productViews = { increment: 1 };
          break;
        case 'ADD_TO_CART':
          updateData.addToCarts = { increment: 1 };
          break;
        case 'PURCHASE':
          updateData.purchases = { increment: 1 };
          if (data.value) updateData.revenue = { increment: data.value };
          break;
      }

      await prisma.contestAnalytics.upsert({
        where: {
          contestId_date: {
            contestId: data.contestId,
            date: today,
          },
        },
        create: {
          contestId: data.contestId,
          date: today,
          ...Object.fromEntries(
            Object.entries(updateData).map(([key, val]: [string, any]) => [key, val.increment || 0])
          ),
        },
        update: updateData,
      });

      logger.debug(`Tracked contest event: ${data.eventType} for contest ${data.contestId}`);
    } catch (error) {
      logger.error('Failed to track contest event', { error, data });
    }
  }

  /**
   * Track campaign analytics
   */
  async trackCampaignEvent(data: {
    campaignId: string;
    eventType: 'IMPRESSION' | 'REACH' | 'ENGAGEMENT' | 'CLICK' | 'CONVERSION';
    userId?: string;
    value?: number;
  }): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updateData: any = {};
      
      switch (data.eventType) {
        case 'IMPRESSION':
          updateData.impressions = { increment: 1 };
          break;
        case 'REACH':
          updateData.reach = { increment: 1 };
          break;
        case 'ENGAGEMENT':
          updateData.engagement = { increment: 1 };
          break;
        case 'CLICK':
          updateData.clicks = { increment: 1 };
          break;
        case 'CONVERSION':
          updateData.conversions = { increment: 1 };
          if (data.value) updateData.revenue = { increment: data.value };
          break;
      }

      await prisma.campaignAnalytics.upsert({
        where: {
          campaignId_date: {
            campaignId: data.campaignId,
            date: today,
          },
        },
        create: {
          campaignId: data.campaignId,
          date: today,
          ...Object.fromEntries(
            Object.entries(updateData).map(([key, val]: [string, any]) => [key, val.increment || 0])
          ),
        },
        update: updateData,
      });

      logger.debug(`Tracked campaign event: ${data.eventType} for campaign ${data.campaignId}`);
    } catch (error) {
      logger.error('Failed to track campaign event', { error, data });
    }
  }

  /**
   * Calculate signal weight based on interaction type and duration
   */
  private calculateSignalWeight(
    signalType: string,
    watchDuration?: number,
    totalDuration?: number
  ): number {
    const baseWeights: Record<string, number> = {
      VIEW: 0.1,
      LIKE: 0.5,
      SHARE: 1.0,
      COMMENT: 0.8,
      REWATCH: 0.7,
      SKIP: -0.3,
      NOT_INTERESTED: -0.5,
      HIDE: -1.0,
      ADMIRE: 1.5,
      UNADMIRE: -1.5,
    };

    let weight = baseWeights[signalType] || 0.1;

    // Adjust weight based on watch duration
    if (watchDuration && totalDuration && totalDuration > 0) {
      const completionRate = watchDuration / totalDuration;
      weight *= (0.5 + completionRate * 0.5); // Scale between 0.5x and 1.0x
    }

    return Math.max(-2.0, Math.min(2.0, weight)); // Clamp between -2.0 and 2.0
  }
}

export const analyticsService = new AnalyticsService();
