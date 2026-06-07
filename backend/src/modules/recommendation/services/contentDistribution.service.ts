import { prisma } from '../../../config/database.js';
import crypto from 'crypto';

interface TestAudienceConfig {
  totalSize: number;
  localSize: number;
  globalSize: number;
  admirersPercent: number;
  similarInterestsPercent: number;
  demographicPercent: number;
  randomPercent: number;
}

const TEST_AUDIENCE_CONFIG: TestAudienceConfig = {
  totalSize: 5000,
  localSize: 3000,
  globalSize: 2000,
  admirersPercent: 0.3,
  similarInterestsPercent: 0.4,
  demographicPercent: 0.2,
  randomPercent: 0.1
};

export class ContentDistributionService {
  
  async initializeDistribution(contentId: string, contentType: 'SHORT' | 'POST', creatorId: string, metadata: {
    hashtags?: string[];
    location?: string;
  }) {
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!creator) throw new Error('Creator not found');

    // Create distribution record
    const distribution = await prisma.content_distribution.create({ data: {
        content_id: contentId,
        content_type: contentType,
        distribution_tier: 'TEST',
        target_audience_size: TEST_AUDIENCE_CONFIG.totalSize
      }} as any));

    // Select test audience
    const testAudience = await this.selectTestAudience(creatorId, metadata);

    // Schedule delivery to test audience (randomized over 24-48 hours)
    await this.scheduleContentDelivery(contentId, contentType, testAudience);

    return { distributionId: distribution.id, audienceSize: testAudience.length };
  }

  private async selectTestAudience(creatorId: string, metadata: { hashtags?: string[]; location?: string }) {
    const { localSize, globalSize, admirersPercent, similarInterestsPercent, demographicPercent, randomPercent } = TEST_AUDIENCE_CONFIG;
    
    const creator = await prisma.user.findUnique({ where: { id: creatorId }, select: { country: true } });
    const creatorCountry = creator?.country || '';

    // LOCAL AUDIENCE (3K)
    const localAdmirersCount = Math.floor(localSize * admirersPercent);
    const localSimilarCount = Math.floor(localSize * similarInterestsPercent);
    const localDemographicCount = Math.floor(localSize * demographicPercent);
    const localRandomCount = localSize - localAdmirersCount - localSimilarCount - localDemographicCount;

    const localAdmirers = await this.getAdmirers(creatorId, localAdmirersCount, creatorCountry);
    const localSimilar = await this.getSimilarInterestUsers(metadata.hashtags || [], localSimilarCount, creatorCountry);
    const localDemographic = await this.getDemographicMatch(creatorId, localDemographicCount, creatorCountry);
    const localRandom = await this.getRandomUsers(localRandomCount, creatorCountry);

    // GLOBAL AUDIENCE (2K)
    const globalAdmirersCount = Math.floor(globalSize * admirersPercent);
    const globalSimilarCount = Math.floor(globalSize * similarInterestsPercent);
    const globalDemographicCount = Math.floor(globalSize * demographicPercent);
    const globalRandomCount = globalSize - globalAdmirersCount - globalSimilarCount - globalDemographicCount;

    const globalAdmirers = await this.getAdmirers(creatorId, globalAdmirersCount);
    const globalSimilar = await this.getSimilarInterestUsers(metadata.hashtags || [], globalSimilarCount);
    const globalDemographic = await this.getDemographicMatch(creatorId, globalDemographicCount);
    const globalRandom = await this.getRandomUsers(globalRandomCount);

    const allUsers = [
      ...localAdmirers, ...localSimilar, ...localDemographic, ...localRandom,
      ...globalAdmirers, ...globalSimilar, ...globalDemographic, ...globalRandom
    ];

    // Remove duplicates and ensure exactly 5K unique users
    const uniqueUsers = Array.from(new Set(allUsers));
    return uniqueUsers.slice(0, TEST_AUDIENCE_CONFIG.totalSize);
  }

  private async getAdmirers(creatorId: string, count: number, country?: string) {
    const admirers = await prisma.admires.findMany({
      where: { 
        admired_id: creatorId,
        ...(country && { admirer: { country } })
      },
      select: { admirer_id: true },
      take: count,
      orderBy: { created_at: 'desc' }
    });
    return admirers.map((a: any) => a.admirer_id);
  }

  private async getSimilarInterestUsers(hashtags: string[], count: number, country?: string) {
    if (hashtags.length === 0) return this.getRandomUsers(count, country);
    
    const users = await prisma.$queryRaw<{ user_id: string }[]>`
      SELECT DISTINCT user_id 
      FROM user_interaction_signals 
      WHERE content_id IN (
        SELECT content_id FROM content_hashtags WHERE hashtag_id IN (
          SELECT id FROM hashtags WHERE tag = ANY(${hashtags})
        )
      )
      ${country ? prisma.$queryRaw`AND user_id IN (SELECT id FROM users WHERE country = ${country})` : prisma.$queryRaw``}
      ORDER BY created_at DESC
      LIMIT ${count}
    `;
    return users.map((u: any) => u.user_id);
  }

  private async getDemographicMatch(creatorId: string, count: number, country?: string) {
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (!creator) return [];

    const users = await prisma.user.findMany({
      where: {
        ...(country && { country }),
        id: { not: creatorId }
      },
      select: { id: true },
      take: count
    });
    return users.map((u: any) => u.id);
  }

  private async getRandomUsers(count: number, country?: string) {
    const users = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM users 
      ${country ? prisma.$queryRaw`WHERE country = ${country}` : prisma.$queryRaw``}
      ORDER BY RANDOM() 
      LIMIT ${count}
    `;
    return users.map((u: any) => u.id);
  }

  private async scheduleContentDelivery(contentId: string, contentType: string, userIds: string[]) {
    const deliveries = userIds.map((userId: any) => ({
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      delivered_at: new Date() // In production, randomize over 24-48 hours
    }));

    await prisma.user_content_delivery.createMany({
      data: deliveries,
      skipDuplicates: true
    });
  }

  async evaluatePerformance(contentId: string, contentType: string) {
    const distribution = await prisma.content_distribution.findUnique({
      where: { contentId_contentType: { content_id: contentId, content_type: contentType } }
    });

    if (!distribution) throw new Error('Distribution not found');

    const deliveries = await prisma.user_content_delivery.findMany({
      where: { content_id: contentId, content_type: contentType, viewed: true }
    });

    const totalViews = deliveries.length;
    if (totalViews < 2000) return { shouldAmplify: false, message: 'Not enough views yet' };

    const completed = deliveries.filter((d: any) => d.completed).length;
    const liked = deliveries.filter((d: any) => d.liked).length;
    const shared = deliveries.filter((d: any) => d.shared).length;
    const commented = deliveries.filter((d: any) => d.commented).length;
    const rewatched = deliveries.filter((d: any) => d.rewatched_count > 0).length;

    const completionRate = completed / totalViews;
    const likeRate = liked / totalViews;
    const shareRate = shared / totalViews;
    const commentRate = commented / totalViews;
    const rewatchRate = rewatched / totalViews;

    const engagementScore = (
      completionRate * 0.4 +
      likeRate * 0.2 +
      shareRate * 0.3 +
      commentRate * 0.05 +
      rewatchRate * 0.05
    );

    const thresholds = this.getThresholds(distribution.distribution_tier);
    const shouldAmplify = engagementScore >= thresholds.threshold;

    await prisma.content_distribution.update({
      where: { id: distribution.id },
      data: {
        completion_rate: completionRate,
        like_rate: likeRate,
        share_rate: shareRate,
        comment_rate: commentRate,
        rewatch_rate: rewatchRate,
        engagement_score: engagementScore,
        should_amplify: shouldAmplify,
        last_evaluated_at: new Date()
      }
    });

    if (shouldAmplify) {
      const nextTier = this.getNextTier(distribution.distribution_tier);
      await this.amplifyToNextTier(contentId, contentType, nextTier);
    }

    return { shouldAmplify, engagementScore, nextTier: shouldAmplify ? this.getNextTier(distribution.distribution_tier) : null };
  }

  private getThresholds(tier: string) {
    // Tuned thresholds based on TikTok-like engagement patterns
    const thresholds: Record<string, { completion: number; like: number; share: number; comment: number; rewatch: number; threshold: number }> = {
      TEST: { 
        completion: 0.45,  // 45% watch to completion
        like: 0.10,        // 10% like rate
        share: 0.03,       // 3% share rate (shares are gold)
        comment: 0.04,     // 4% comment rate
        rewatch: 0.12,     // 12% rewatch rate
        threshold: 0.28    // Overall threshold to amplify
      },
      TIER_1: { 
        completion: 0.40,  // 40% completion
        like: 0.08,        // 8% like rate
        share: 0.025,      // 2.5% share rate
        comment: 0.03,     // 3% comment rate
        rewatch: 0.10,     // 10% rewatch rate
        threshold: 0.24    // Slightly lower threshold
      },
      TIER_2: { 
        completion: 0.35,  // 35% completion
        like: 0.06,        // 6% like rate
        share: 0.02,       // 2% share rate
        comment: 0.025,    // 2.5% comment rate
        rewatch: 0.08,     // 8% rewatch rate
        threshold: 0.20    // Lower threshold for viral potential
      },
      TIER_3: { 
        completion: 0.30,  // 30% completion
        like: 0.05,        // 5% like rate
        share: 0.015,      // 1.5% share rate
        comment: 0.02,     // 2% comment rate
        rewatch: 0.06,     // 6% rewatch rate
        threshold: 0.17    // Lowest threshold for mega-viral
      }
    };
    return thresholds[tier] || thresholds.TEST;
  }

  private getNextTier(currentTier: string): string {
    const tiers: Record<string, string> = {
      TEST: 'TIER_1',
      TIER_1: 'TIER_2',
      TIER_2: 'TIER_3',
      TIER_3: 'VIRAL'
    };
    return tiers[currentTier] || 'VIRAL';
  }

  private async amplifyToNextTier(contentId: string, contentType: string, nextTier: string) {
    const tierSizes: Record<string, number> = {
      TIER_1: 10000,
      TIER_2: 50000,
      TIER_3: 500000,
      VIRAL: 5000000
    };

    await prisma.content_distribution.update({
      where: { contentId_contentType: { content_id: contentId, content_type: contentType } },
      data: {
        distribution_tier: nextTier as any,
        target_audience_size: tierSizes[nextTier]
      }
    });

    // Select and deliver to new audience
    const newAudienceSize = tierSizes[nextTier];
    const newUsers = await this.getRandomUsers(newAudienceSize);
    await this.scheduleContentDelivery(contentId, contentType, newUsers);
  }
}

export const contentDistributionService = new ContentDistributionService();
