-- Add marketplace and social media tables to existing schema
-- Run this migration: npx prisma migrate dev --name add_marketplace_and_social_media

-- ═══════════════════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════════════════

CREATE TYPE "InfluencerTier" AS ENUM ('NANO', 'MICRO', 'MID', 'MACRO', 'MEGA');
CREATE TYPE "CampaignType" AS ENUM ('SPONSORED_POST', 'PRODUCT_REVIEW', 'BRAND_AMBASSADOR', 'CONTEST_PROMOTION', 'AFFILIATE', 'EVENT_COVERAGE', 'CONTENT_CREATION');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');
CREATE TYPE "SponsorshipType" AS ENUM ('CONTEST_PRIZE', 'CONTEST_BRANDING', 'CONTEST_EXCLUSIVE', 'CONTENT_SPONSORSHIP');
CREATE TYPE "ConversionCampaignType" AS ENUM ('POST_CONTEST_DISCOUNT', 'WINNER_ADVOCACY', 'PARTICIPANT_RETARGETING', 'ENGAGEMENT_REWARD');
CREATE TYPE "FunnelStage" AS ENUM ('AWARENESS', 'INTEREST', 'CONSIDERATION', 'CONVERSION', 'RETENTION', 'ADVOCACY');
CREATE TYPE "SocialPlatform" AS ENUM ('TIKTOK', 'YOUTUBE', 'INSTAGRAM', 'FACEBOOK', 'TWITTER', 'TWITCH', 'LINKEDIN', 'SNAPCHAT');

-- ═══════════════════════════════════════════════════════════
-- INFLUENCER PROFILES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "influencer_profiles" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "tier" "InfluencerTier" NOT NULL,
  "bio" TEXT,
  "categories" TEXT[] NOT NULL DEFAULT '{}',
  
  -- Metrics
  "avg_engagement_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "avg_views" INTEGER NOT NULL DEFAULT 0,
  
  -- Rates
  "rate_per_post" DECIMAL(18,4),
  "rate_per_video" DECIMAL(18,4),
  "rate_per_story" DECIMAL(18,4),
  "is_available" BOOLEAN NOT NULL DEFAULT true,
  
  -- Verification
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "verified_at" TIMESTAMP,
  
  -- Stats
  "total_campaigns" INTEGER NOT NULL DEFAULT 0,
  "total_earnings_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "influencer_profiles_tier_available_idx" ON "influencer_profiles"("tier", "is_available");
CREATE INDEX "influencer_profiles_engagement_idx" ON "influencer_profiles"("avg_engagement_rate");

-- ═══════════════════════════════════════════════════════════
-- SOCIAL MEDIA ACCOUNTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "social_media_accounts" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "influencer_id" TEXT NOT NULL REFERENCES "influencer_profiles"("id") ON DELETE CASCADE,
  "platform" "SocialPlatform" NOT NULL,
  
  -- Account Details
  "username" TEXT NOT NULL,
  "profile_url" TEXT NOT NULL,
  "display_name" TEXT,
  
  -- Metrics (auto-fetched)
  "follower_count" INTEGER NOT NULL DEFAULT 0,
  "subscriber_count" INTEGER NOT NULL DEFAULT 0,
  "video_count" INTEGER NOT NULL DEFAULT 0,
  "total_views" BIGINT NOT NULL DEFAULT 0,
  "avg_views" INTEGER NOT NULL DEFAULT 0,
  "avg_likes" INTEGER NOT NULL DEFAULT 0,
  "engagement_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- Verification
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  
  -- Sync Status
  "last_synced_at" TIMESTAMP,
  "sync_status" TEXT NOT NULL DEFAULT 'pending',
  "sync_error" TEXT,
  
  -- API Credentials (encrypted)
  "access_token" TEXT,
  "refresh_token" TEXT,
  "token_expires_at" TIMESTAMP,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE("influencer_id", "platform")
);

CREATE INDEX "social_media_accounts_platform_followers_idx" ON "social_media_accounts"("platform", "follower_count");
CREATE INDEX "social_media_accounts_influencer_primary_idx" ON "social_media_accounts"("influencer_id", "is_primary");

-- ═══════════════════════════════════════════════════════════
-- BRAND CAMPAIGNS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "brand_campaigns" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "brand_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "type" "CampaignType" NOT NULL,
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  
  -- Targeting
  "target_tiers" "InfluencerTier"[] NOT NULL DEFAULT '{}',
  "target_categories" TEXT[] NOT NULL DEFAULT '{}',
  "min_followers" INTEGER,
  "min_engagement_rate" DECIMAL(5,2),
  "target_geos" TEXT[] NOT NULL DEFAULT '{}',
  
  -- Budget
  "budget_kr" DECIMAL(18,4) NOT NULL,
  "compensation_per_influencer" DECIMAL(18,4) NOT NULL,
  "max_influencers" INTEGER NOT NULL,
  
  -- Deliverables
  "required_posts" INTEGER NOT NULL DEFAULT 0,
  "required_videos" INTEGER NOT NULL DEFAULT 0,
  "required_stories" INTEGER NOT NULL DEFAULT 0,
  "content_guidelines" TEXT,
  "hashtags" TEXT[] NOT NULL DEFAULT '{}',
  "mentions" TEXT[] NOT NULL DEFAULT '{}',
  
  -- Linked Contest
  "contest_id" TEXT REFERENCES "contests"("id") ON DELETE SET NULL,
  
  -- Timeline
  "application_deadline" TIMESTAMP,
  "campaign_start_date" TIMESTAMP NOT NULL,
  "campaign_end_date" TIMESTAMP NOT NULL,
  
  -- Metrics
  "total_applications" INTEGER NOT NULL DEFAULT 0,
  "accepted_influencers" INTEGER NOT NULL DEFAULT 0,
  "total_reach" INTEGER NOT NULL DEFAULT 0,
  "total_engagement" INTEGER NOT NULL DEFAULT 0,
  "total_conversions" INTEGER NOT NULL DEFAULT 0,
  "total_revenue_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "roi" DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "brand_campaigns_status_start_idx" ON "brand_campaigns"("status", "campaign_start_date");
CREATE INDEX "brand_campaigns_brand_idx" ON "brand_campaigns"("brand_id");
CREATE INDEX "brand_campaigns_contest_idx" ON "brand_campaigns"("contest_id");

-- ═══════════════════════════════════════════════════════════
-- CAMPAIGN APPLICATIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "campaign_applications" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" TEXT NOT NULL REFERENCES "brand_campaigns"("id") ON DELETE CASCADE,
  "influencer_id" TEXT NOT NULL REFERENCES "influencer_profiles"("id") ON DELETE CASCADE,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  
  -- Application Details
  "pitch" TEXT NOT NULL,
  "proposed_rate" DECIMAL(18,4),
  "availability" TEXT,
  
  -- Response
  "response_note" TEXT,
  "responded_at" TIMESTAMP,
  
  "applied_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE("campaign_id", "influencer_id")
);

CREATE INDEX "campaign_applications_influencer_status_idx" ON "campaign_applications"("influencer_id", "status");

-- ═══════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "notifications" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "notifications_user_read_idx" ON "notifications"("user_id", "is_read", "created_at");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- ═══════════════════════════════════════════════════════════
-- GAMIFICATION
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "gamification_points" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  
  -- Point Categories
  "engagement_points" INTEGER NOT NULL DEFAULT 0,
  "marketing_points" INTEGER NOT NULL DEFAULT 0,
  "sales_points" INTEGER NOT NULL DEFAULT 0,
  "total_points" INTEGER NOT NULL DEFAULT 0,
  
  -- Levels
  "current_level" INTEGER NOT NULL DEFAULT 1,
  "next_level_at" INTEGER NOT NULL,
  
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "gamification_points_total_idx" ON "gamification_points"("total_points");

CREATE TABLE "gamification_activities" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  
  -- Activity Details
  "activity_type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "points_earned" INTEGER NOT NULL,
  
  -- Context
  "reference_type" TEXT,
  "reference_id" TEXT,
  
  "description" TEXT,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "gamification_activities_user_created_idx" ON "gamification_activities"("user_id", "created_at");
CREATE INDEX "gamification_activities_type_idx" ON "gamification_activities"("activity_type");

-- ═══════════════════════════════════════════════════════════
-- CONTEST SPONSORSHIPS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "contest_sponsorships" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "contest_id" TEXT NOT NULL REFERENCES "contests"("id") ON DELETE CASCADE,
  "brand_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" "SponsorshipType" NOT NULL,
  
  -- Sponsorship Details
  "sponsorship_kr" DECIMAL(18,4) NOT NULL,
  "benefits" TEXT[] NOT NULL DEFAULT '{}',
  
  -- Branding
  "logo_url" TEXT,
  "brand_message" TEXT,
  "website_url" TEXT,
  
  -- Metrics
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "conversions" INTEGER NOT NULL DEFAULT 0,
  "revenue_generated" DECIMAL(18,4) NOT NULL DEFAULT 0,
  
  -- Status
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "start_date" TIMESTAMP NOT NULL,
  "end_date" TIMESTAMP NOT NULL,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "contest_sponsorships_contest_idx" ON "contest_sponsorships"("contest_id");
CREATE INDEX "contest_sponsorships_brand_idx" ON "contest_sponsorships"("brand_id");

-- ═══════════════════════════════════════════════════════════
-- CONVERSION CAMPAIGNS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "conversion_campaigns" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "contest_id" TEXT NOT NULL REFERENCES "contests"("id") ON DELETE CASCADE,
  "brand_id" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "type" "ConversionCampaignType" NOT NULL,
  
  -- Campaign Details
  "title" TEXT NOT NULL,
  "description" TEXT,
  
  -- Targeting
  "target_segment" TEXT NOT NULL,
  
  -- Offer
  "discount_percent" DECIMAL(5,2),
  "discount_code" TEXT,
  "offer_expires_at" TIMESTAMP,
  
  -- Metrics
  "total_sent" INTEGER NOT NULL DEFAULT 0,
  "total_opened" INTEGER NOT NULL DEFAULT 0,
  "total_clicked" INTEGER NOT NULL DEFAULT 0,
  "total_converted" INTEGER NOT NULL DEFAULT 0,
  "revenue_generated" DECIMAL(18,4) NOT NULL DEFAULT 0,
  
  -- Status
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "conversion_campaigns_contest_idx" ON "conversion_campaigns"("contest_id");
CREATE INDEX "conversion_campaigns_type_active_idx" ON "conversion_campaigns"("type", "is_active");

-- ═══════════════════════════════════════════════════════════
-- SALES FUNNEL EVENTS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "sales_funnel_events" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "contest_id" TEXT REFERENCES "contests"("id") ON DELETE CASCADE,
  "campaign_id" TEXT REFERENCES "brand_campaigns"("id") ON DELETE CASCADE,
  
  -- Event Details
  "stage" "FunnelStage" NOT NULL,
  "event_type" TEXT NOT NULL,
  
  -- Context
  "source_type" TEXT,
  "source_id" TEXT,
  
  -- Metadata
  "metadata" JSONB,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "sales_funnel_events_user_stage_idx" ON "sales_funnel_events"("user_id", "stage");
CREATE INDEX "sales_funnel_events_contest_stage_idx" ON "sales_funnel_events"("contest_id", "stage");
CREATE INDEX "sales_funnel_events_campaign_stage_idx" ON "sales_funnel_events"("campaign_id", "stage");
CREATE INDEX "sales_funnel_events_created_idx" ON "sales_funnel_events"("created_at");

-- ═══════════════════════════════════════════════════════════
-- SYNC LOGS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "social_media_sync_logs" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "account_id" TEXT NOT NULL,
  
  -- Sync Details
  "sync_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  
  -- Metrics Before/After
  "followers_before" INTEGER NOT NULL,
  "followers_after" INTEGER NOT NULL,
  "follower_change" INTEGER NOT NULL,
  
  -- Error Handling
  "error_message" TEXT,
  "error_code" TEXT,
  
  -- Performance
  "duration_ms" INTEGER NOT NULL,
  
  "synced_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "social_media_sync_logs_account_synced_idx" ON "social_media_sync_logs"("account_id", "synced_at");
CREATE INDEX "social_media_sync_logs_status_idx" ON "social_media_sync_logs"("status");

-- ═══════════════════════════════════════════════════════════
-- PLATFORM RATE LIMITS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "platform_rate_limits" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform" "SocialPlatform" NOT NULL UNIQUE,
  
  -- Rate Limit Config
  "requests_per_hour" INTEGER NOT NULL,
  "requests_remaining" INTEGER NOT NULL,
  "reset_at" TIMESTAMP NOT NULL,
  
  -- Tracking
  "last_request_at" TIMESTAMP,
  
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- INFLUENCER PORTFOLIO
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "influencer_portfolio" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "influencer_id" TEXT NOT NULL REFERENCES "influencer_profiles"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "media_url" TEXT NOT NULL,
  "media_type" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "views" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "influencer_portfolio_influencer_idx" ON "influencer_portfolio"("influencer_id");

-- ═══════════════════════════════════════════════════════════
-- INFLUENCER REVIEWS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "influencer_reviews" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" TEXT NOT NULL,
  "influencer_id" TEXT NOT NULL REFERENCES "influencer_profiles"("id") ON DELETE CASCADE,
  "brand_id" TEXT NOT NULL,
  
  "rating" INTEGER NOT NULL,
  "review" TEXT,
  
  -- Specific Ratings
  "communication_rating" INTEGER NOT NULL,
  "quality_rating" INTEGER NOT NULL,
  "timeliness_rating" INTEGER NOT NULL,
  
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE("campaign_id", "influencer_id")
);

CREATE INDEX "influencer_reviews_influencer_idx" ON "influencer_reviews"("influencer_id");

-- ═══════════════════════════════════════════════════════════
-- CAMPAIGN DELIVERABLES
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "campaign_deliverables" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" TEXT NOT NULL REFERENCES "brand_campaigns"("id") ON DELETE CASCADE,
  "influencer_id" TEXT NOT NULL REFERENCES "influencer_profiles"("id") ON DELETE CASCADE,
  
  -- Deliverable Details
  "type" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "content_url" TEXT NOT NULL,
  "caption" TEXT,
  
  -- Metrics
  "views" INTEGER NOT NULL DEFAULT 0,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "comments" INTEGER NOT NULL DEFAULT 0,
  "shares" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  "conversions" INTEGER NOT NULL DEFAULT 0,
  
  -- Review
  "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
  "review_note" TEXT,
  "reviewed_at" TIMESTAMP,
  
  "submitted_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "campaign_deliverables_campaign_status_idx" ON "campaign_deliverables"("campaign_id", "status");
CREATE INDEX "campaign_deliverables_influencer_idx" ON "campaign_deliverables"("influencer_id");

-- ═══════════════════════════════════════════════════════════
-- CAMPAIGN ANALYTICS
-- ═══════════════════════════════════════════════════════════

CREATE TABLE "campaign_analytics" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaign_id" TEXT NOT NULL REFERENCES "brand_campaigns"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  
  -- Reach & Engagement
  "impressions" INTEGER NOT NULL DEFAULT 0,
  "reach" INTEGER NOT NULL DEFAULT 0,
  "engagement" INTEGER NOT NULL DEFAULT 0,
  "clicks" INTEGER NOT NULL DEFAULT 0,
  
  -- Conversions
  "conversions" INTEGER NOT NULL DEFAULT 0,
  "revenue" DECIMAL(18,4) NOT NULL DEFAULT 0,
  
  -- Costs
  "spent_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
  
  -- Calculated Metrics
  "ctr" DECIMAL(5,4) NOT NULL DEFAULT 0,
  "conversion_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
  "cpa" DECIMAL(18,4) NOT NULL DEFAULT 0,
  "roas" DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  UNIQUE("campaign_id", "date")
);

CREATE INDEX "campaign_analytics_date_idx" ON "campaign_analytics"("date");
