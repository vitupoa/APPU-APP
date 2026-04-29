export enum CreatorTier {
  EMERGING = 'EMERGING',      // 0-1K admirers
  RISING = 'RISING',          // 1K-10K admirers
  ESTABLISHED = 'ESTABLISHED', // 10K-100K admirers
  POPULAR = 'POPULAR',        // 100K-1M admirers
  ELITE = 'ELITE'             // 1M+ admirers
}

export enum ContentDistributionTier {
  TEST = 0,           // Initial test audience
  TIER_1 = 1,         // 5K users
  TIER_2 = 2,         // 50K users
  TIER_3 = 3,         // 500K users
  VIRAL = 4           // Millions
}

export interface ViralityThresholds {
  completionRate: number;
  likeRate: number;
  shareRate: number;
  commentRate: number;
  rewatchRate: number;
}

export interface EngagementMetrics {
  completionRate: number;
  likeRate: number;
  shareRate: number;
  commentRate: number;
  rewatchRate: number;
  avgWatchTime: number;
  totalViews: number;
  uniqueViews: number;
}

export interface CreatorAdvantages {
  initialAudienceSize: number;
  nicheTargetingBoost: number;
  offPeakBoost: number;
  algorithmicPatience: number;
  featuredInDiscover: boolean;
  prioritySupport?: boolean;
  brandPartnerships?: boolean;
  verifiedBadge?: boolean;
}

export interface UserInteractionSignal {
  userId: string;
  contentId: string;
  contentType: 'SHORT' | 'POST';
  signalType: 'VIEW' | 'LIKE' | 'SHARE' | 'COMMENT' | 'REWATCH' | 'SKIP' | 'NOT_INTERESTED' | 'HIDE' | 'ADMIRE' | 'UNADMIRE';
  watchDuration: number;
  totalDuration: number;
  timestamp: Date;
  weight: number;
}

export interface MicroInterest {
  category: string;
  subcategory: string;
  keywords: string[];
  affinity: number;
}

export interface FeedComposition {
  personalized: number;    // 60%
  admiring: number;        // 20%
  trending: number;        // 10%
  discovery: number;       // 10%
}
