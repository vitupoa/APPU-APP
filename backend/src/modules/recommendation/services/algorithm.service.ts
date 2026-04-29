import { prisma } from '../../../config/database.js';
import {
  CreatorTier,
  ContentDistributionTier,
  ViralityThresholds,
  EngagementMetrics,
  CreatorAdvantages,
  MicroInterest
} from '../models/types.js';

export class RecommendationAlgorithm {
  
  /**
   * Get creator tier based on admirer count
   */
  static getCreatorTier(admirerCount: number): CreatorTier {
    if (admirerCount >= 1000000) return CreatorTier.ELITE;
    if (admirerCount >= 100000) return CreatorTier.POPULAR;
    if (admirerCount >= 10000) return CreatorTier.ESTABLISHED;
    if (admirerCount >= 1000) return CreatorTier.RISING;
    return CreatorTier.EMERGING;
  }

  /**
   * Get creator advantages based on tier
   */
  static getCreatorAdvantages(tier: CreatorTier): CreatorAdvantages {
    const advantages: Record<CreatorTier, CreatorAdvantages> = {
      [CreatorTier.EMERGING]: {
        initialAudienceSize: 300,
        nicheTargetingBoost: 2.0,
        offPeakBoost: 1.5,
        algorithmicPatience: 5,
        featuredInDiscover: false
      },
      [CreatorTier.RISING]: {
        initialAudienceSize: 500,
        nicheTargetingBoost: 1.5,
        offPeakBoost: 1.2,
        algorithmicPatience: 3,
        featuredInDiscover: true
      },
      [CreatorTier.ESTABLISHED]: {
        initialAudienceSize: 1000,
        nicheTargetingBoost: 1.2,
        offPeakBoost: 1.0,
        algorithmicPatience: 2,
        featuredInDiscover: true,
        prioritySupport: true
      },
      [CreatorTier.POPULAR]: {
        initialAudienceSize: 2000,
        nicheTargetingBoost: 1.0,
        offPeakBoost: 1.0,
        algorithmicPatience: 1,
        featuredInDiscover: true,
        prioritySupport: true,
        brandPartnerships: true
      },
      [CreatorTier.ELITE]: {
        initialAudienceSize: 5000,
        nicheTargetingBoost: 1.0,
        offPeakBoost: 1.0,
        algorithmicPatience: 1,
        featuredInDiscover: true,
        prioritySupport: true,
        brandPartnerships: true,
        verifiedBadge: true
      }
    };
    return advantages[tier];
  }

  /**
   * Get virality thresholds for current distribution tier
   */
  static getViralityThresholds(tier: ContentDistributionTier): ViralityThresholds {
    const thresholds: Record<ContentDistributionTier, ViralityThresholds> = {
      [ContentDistributionTier.TEST]: {
        completionRate: 0.50,
        likeRate: 0.08,
        shareRate: 0.02,
        commentRate: 0.03,
        rewatchRate: 0.10
      },
      [ContentDistributionTier.TIER_1]: {
        completionRate: 0.45,
        likeRate: 0.06,
        shareRate: 0.015,
        commentRate: 0.02,
        rewatchRate: 0.08
      },
      [ContentDistributionTier.TIER_2]: {
        completionRate: 0.40,
        likeRate: 0.05,
        shareRate: 0.01,
        commentRate: 0.015,
        rewatchRate: 0.06
      },
      [ContentDistributionTier.TIER_3]: {
        completionRate: 0.35,
        likeRate: 0.04,
        shareRate: 0.008,
        commentRate: 0.01,
        rewatchRate: 0.05
      },
      [ContentDistributionTier.VIRAL]: {
        completionRate: 0.30,
        likeRate: 0.03,
        shareRate: 0.005,
        commentRate: 0.008,
        rewatchRate: 0.04
      }
    };
    return thresholds[tier];
  }

  /**
   * Calculate engagement score
   */
  static calculateEngagementScore(metrics: EngagementMetrics, thresholds: ViralityThresholds): number {
    const score = (
      metrics.completionRate * 0.4 +
      metrics.likeRate * 0.2 +
      metrics.shareRate * 0.3 +      // Shares weighted highest
      metrics.commentRate * 0.05 +
      metrics.rewatchRate * 0.05
    );

    const threshold = (
      thresholds.completionRate * 0.4 +
      thresholds.likeRate * 0.2 +
      thresholds.shareRate * 0.3 +
      thresholds.commentRate * 0.05 +
      thresholds.rewatchRate * 0.05
    );

    return score / threshold; // Returns ratio (>1.0 means exceeds threshold)
  }

  /**
   * Determine if content should be amplified to next tier
   */
  static shouldAmplify(metrics: EngagementMetrics, currentTier: ContentDistributionTier): boolean {
    if (currentTier >= ContentDistributionTier.VIRAL) return false;
    
    const thresholds = this.getViralityThresholds(currentTier);
    const score = this.calculateEngagementScore(metrics, thresholds);
    
    return score >= 1.0;
  }

  /**
   * Get initial test audience size based on creator tier
   */
  static getInitialAudienceSize(creatorId: string, admirerCount: number): number {
    const tier = this.getCreatorTier(admirerCount);
    const advantages = this.getCreatorAdvantages(tier);
    return advantages.initialAudienceSize;
  }

  /**
   * Get time-based boost for content
   */
  static getTimeBasedBoost(admirerCount: number, uploadTime: Date, location?: string): number {
    let boost = 1.0;
    
    // Small creator boost during off-peak hours
    if (admirerCount < 5000) {
      const hour = uploadTime.getHours();
      if ((hour >= 2 && hour <= 6) || (hour >= 14 && hour <= 16)) {
        boost *= 1.5; // 50% boost during off-peak
      }
    }
    
    // Local content boost
    if (location) {
      boost *= 2.0; // 2x boost for local audience
    }
    
    return boost;
  }

  /**
   * Check if content meets quality baseline
   */
  static meetsQualityBaseline(
    duration: number,
    initialCompletionRate: number,
    isSpam: boolean,
    isDuplicate: boolean
  ): boolean {
    return (
      duration >= 3000 &&                    // At least 3 seconds
      !isSpam &&
      !isDuplicate &&
      initialCompletionRate > 0.20           // At least 20% completion
    );
  }

  /**
   * Calculate niche affinity between user and content
   */
  static calculateNicheAffinity(userInterests: MicroInterest[], contentInterests: MicroInterest[]): number {
    let totalAffinity = 0;
    let matches = 0;

    for (const userInterest of userInterests) {
      for (const contentInterest of contentInterests) {
        if (userInterest.category === contentInterest.category) {
          // Exact category match
          totalAffinity += userInterest.affinity * contentInterest.affinity;
          matches++;
        } else if (
          userInterest.keywords.some(k => contentInterest.keywords.includes(k))
        ) {
          // Keyword overlap
          totalAffinity += (userInterest.affinity * contentInterest.affinity) * 0.5;
          matches++;
        }
      }
    }

    return matches > 0 ? totalAffinity / matches : 0;
  }

  /**
   * Determine if old content should be resurfaced
   */
  static shouldResurfaceContent(
    uploadTime: Date,
    engagementRate: number,
    completionRate: number,
    viewCount: number,
    hashtags: string[],
    trendingTopics: string[]
  ): boolean {
    const daysSinceUpload = Math.floor(
      (Date.now() - uploadTime.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Recent content - use normal algorithm
    if (daysSinceUpload < 7) return false;

    // Old content that's suddenly relevant
    if (daysSinceUpload > 30 && hashtags.some(tag => trendingTopics.includes(tag))) {
      return true;
    }

    // Evergreen content with consistent engagement
    if (engagementRate > 0.10 && completionRate > 0.60) {
      return true;
    }

    // Content that performed well, try new niches
    if (viewCount > 10000) {
      return true;
    }

    return false;
  }

  /**
   * Get next distribution tier audience size
   */
  static getNextTierAudienceSize(currentTier: ContentDistributionTier): number {
    const sizes: Record<ContentDistributionTier, number> = {
      [ContentDistributionTier.TEST]: 2000,
      [ContentDistributionTier.TIER_1]: 5000,
      [ContentDistributionTier.TIER_2]: 50000,
      [ContentDistributionTier.TIER_3]: 500000,
      [ContentDistributionTier.VIRAL]: 5000000
    };
    return sizes[currentTier] || 2000;
  }
}
