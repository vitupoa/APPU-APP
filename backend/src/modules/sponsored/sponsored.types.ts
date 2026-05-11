/**
 * Sponsored Content System - Native Ad Marketplace (TikTok Model)
 * Brands create sponsored shorts that appear seamlessly in user feeds
 */

// Import Prisma-generated enums
import { SponsoredContentStatus, PricingModel } from '@prisma/client';

// Re-export for convenience
export { SponsoredContentStatus, PricingModel };

export enum SponsoredContentType {
  SHORT = 'short',
  POST = 'post',
  STORY = 'story'
}

export enum TargetingCriteria {
  AGE = 'age',
  GENDER = 'gender',
  LOCATION = 'location',
  INTERESTS = 'interests',
  FOLLOWERS = 'followers'
}

export interface CreateSponsoredContentRequest {
  contentType: SponsoredContentType;
  contentId: string;  // ID of the short/post/story
  campaignName: string;
  budget: number;     // Total budget in Kr
  pricingModel: PricingModel;
  bidAmount: number;  // Amount per action (CPM/CPV/CPE/CPC)
  startDate: Date;
  endDate: Date;
  targeting?: {
    ageMin?: number;
    ageMax?: number;
    gender?: string[];
    countries?: string[];
    cities?: string[];
    interests?: string[];
    minFollowers?: number;
  };
}

export interface SponsoredContentAnalytics {
  impressions: number;
  views: number;
  engagements: number;
  clicks: number;
  spent: number;
  cpm: number;
  ctr: number;
  engagementRate: number;
}
