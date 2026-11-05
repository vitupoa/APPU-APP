-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CREATOR', 'BUSINESS');

-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'PAUSED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AdCampaignStatusType" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('NATIVE', 'BANNER', 'STORY');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'FINANCIAL_ADMIN');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BiddingStrategy" AS ENUM ('LOWEST_COST', 'TARGET_CPM', 'COST_CAP');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('DAILY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('SPONSORED_POST', 'PRODUCT_REVIEW', 'BRAND_AMBASSADOR', 'CONTEST_PROMOTION', 'AFFILIATE', 'EVENT_COVERAGE', 'CONTENT_CREATION');

-- CreateEnum
CREATE TYPE "ChamaStatus" AS ENUM ('SETUP', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "ChamaType" AS ENUM ('MERRY_GO_ROUND', 'WELFARE');

-- CreateEnum
CREATE TYPE "Chama_Cycle_Status" AS ENUM ('OPEN', 'COLLECTING', 'CLOSED', 'DISBURSING');

-- CreateEnum
CREATE TYPE "Chama_Election_Phase" AS ENUM ('NOMINATION', 'SECONDING', 'VOTING', 'RERUN', 'COMPLETED', 'SECONDMENT');

-- CreateEnum
CREATE TYPE "Chama_Member_Role" AS ENUM ('ADMIN', 'CHAIRPERSON', 'TREASURER', 'SECRETARY', 'MEMBER');

-- CreateEnum
CREATE TYPE "Chama_Member_Status" AS ENUM ('ACTIVE', 'INACTIVE', 'LEFT', 'REMOVED');

-- CreateEnum
CREATE TYPE "Chama_Payout_Decision" AS ENUM ('APPROVED', 'REJECTED', 'APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "Chama_Payout_Status" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'DISBURSED', 'FAILED');

-- CreateEnum
CREATE TYPE "Chama_Transaction_Type" AS ENUM ('CONTRIBUTION', 'PAYOUT', 'EXTERNAL', 'PENALTY', 'MEMBERSHIP_FEE', 'REFUND');

-- CreateEnum
CREATE TYPE "ChatNiche" AS ENUM ('DOCTORS', 'REAL_ESTATE_INVESTMENT', 'FINANCE', 'TECH', 'FASHION', 'AUTOMOTIVE', 'FOOD_BEVERAGE', 'HEALTH_FITNESS', 'EDUCATION', 'ENTERTAINMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "ChatTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ChatType" AS ENUM ('DIRECT', 'GROUP', 'CHAMA');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('WHATSAPP', 'WEBSITE', 'PHONE', 'IN_APP_CHAT');

-- CreateEnum
CREATE TYPE "ContestMediaType" AS ENUM ('PHOTO', 'VIDEO', 'PHOTO_AND_VIDEO');

-- CreateEnum
CREATE TYPE "ContestStatus" AS ENUM ('DRAFT', 'ACTIVE', 'JUDGING', 'PENDING_PAYOUT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContributionFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ONE_OFF');

-- CreateEnum
CREATE TYPE "ConversionCampaignType" AS ENUM ('POST_CONTEST_DISCOUNT', 'WINNER_ADVOCACY', 'PARTICIPANT_RETARGETING', 'ENGAGEMENT_REWARD');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE');

-- CreateEnum
CREATE TYPE "FlashSaleStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FlashSaleType" AS ENUM ('FLASH', 'LIGHTNING', 'DAILY_FEATURED', 'CLEARANCE');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG');

-- CreateEnum
CREATE TYPE "FunnelStage" AS ENUM ('AWARENESS', 'INTEREST', 'CONSIDERATION', 'CONVERSION', 'RETENTION', 'ADVOCACY');

-- CreateEnum
CREATE TYPE "GroupBuyStatus" AS ENUM ('OPEN', 'THRESHOLD_MET', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportRequestStatus" AS ENUM ('PENDING', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InfluencerTier" AS ENUM ('NANO', 'MICRO', 'MID', 'MACRO', 'MEGA');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "JudgeInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "JudgingCriteria" AS ENUM ('CREATOR_PICKS', 'COMMUNITY_VOTE', 'MOST_ENGAGEMENT', 'COMBINATION');

-- CreateEnum
CREATE TYPE "JudgingMethod" AS ENUM ('JUDGES_ONLY', 'VOTES_ONLY', 'JUDGES_AND_VOTES');

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ParticipationType" AS ENUM ('INDIVIDUAL_ONLY', 'TEAM_ONLY', 'BOTH');

-- CreateEnum
CREATE TYPE "PlacementType" AS ENUM ('CONTESTS', 'DISCOVER_SHORTS', 'ADMIRING_SHORTS', 'DRIPS_FEED', 'STORIES', 'GROUP_CHATS', 'CHAMA_CHATS');

-- CreateEnum
CREATE TYPE "PremiumType" AS ENUM ('FEATURED', 'PROMOTED', 'TOP_SPOT');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('CPM', 'CPV', 'CPE', 'CPC', 'FLAT_FEE');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('VEHICLES', 'SPARE_PARTS', 'REAL_ESTATE', 'FASHION', 'SHOES', 'ELECTRONICS', 'FOOD_FMCG', 'BOOKS', 'DIGITAL_PRODUCTS', 'SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'USED', 'REFURBISHED', 'FOR_PARTS');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('FOLLOW_RUNINGA', 'YOUTUBE_SUB', 'SPOTIFY_FOLLOW', 'INSTAGRAM_FOLLOW', 'TIKTOK_FOLLOW', 'WATCH_VIDEO', 'VISIT_SHOP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('TIKTOK', 'YOUTUBE', 'INSTAGRAM', 'FACEBOOK', 'TWITTER', 'TWITCH', 'LINKEDIN', 'SNAPCHAT');

-- CreateEnum
CREATE TYPE "SponsoredContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SponsoredContentType" AS ENUM ('SHORT', 'POST', 'STORY');

-- CreateEnum
CREATE TYPE "SponsoredPostStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'PAYMENT_RELEASED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SponsorshipType" AS ENUM ('CONTEST_PRIZE', 'CONTEST_BRANDING', 'CONTEST_EXCLUSIVE', 'CONTENT_SPONSORSHIP');

-- CreateEnum
CREATE TYPE "StoryPrivacy" AS ENUM ('PUBLIC', 'ADMIRERS', 'LOVERS', 'SPECIFIC_USERS');

-- CreateEnum
CREATE TYPE "SubscriptionTierType" AS ENUM ('TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN');

-- CreateEnum
CREATE TYPE "TargetingScope" AS ENUM ('GLOBAL', 'CONTINENT', 'COUNTRY', 'REGION', 'CITY', 'TOWN', 'ROAD', 'LANDMARK', 'SHOPPING_CENTER');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('LEADER', 'CO_LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CONTENT_TIP', 'LOCKED_CHAT_TASK', 'SUBSCRIPTION', 'CONTEST_ENTRY', 'CONTEST_VOTE', 'CONTEST_PRIZE', 'CHAMA_CONTRIBUTION', 'CHAMA_PAYOUT', 'PLATFORM_REWARD', 'WITHDRAWAL', 'TOP_UP', 'SHOP_LISTING_FEE');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'DCT');

-- CreateEnum
CREATE TYPE "VehicleBodyType" AS ENUM ('SEDAN', 'COUPE', 'HATCHBACK', 'SUV', 'PICKUP', 'VAN', 'CONVERTIBLE', 'WAGON', 'MINIVAN', 'BUS', 'TRUCK', 'TRAILER', 'MOTORCYCLE');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'FLAGGED');

-- CreateTable
CREATE TABLE "ad_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_ad_spend_kes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "platform_revenue_kes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "creator_revenue_kes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "active_campaigns" INTEGER NOT NULL DEFAULT 0,
    "total_impressions" INTEGER NOT NULL DEFAULT 0,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "total_conversions" INTEGER NOT NULL DEFAULT 0,
    "native_impressions" INTEGER NOT NULL DEFAULT 0,
    "banner_impressions" INTEGER NOT NULL DEFAULT 0,
    "story_impressions" INTEGER NOT NULL DEFAULT 0,
    "sponsored_posts_active" INTEGER NOT NULL DEFAULT 0,
    "sponsored_posts_revenue_kes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaign_locations" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "scope" "TargetingScope" NOT NULL,
    "scope_value" TEXT NOT NULL,
    "scope_display_name" TEXT NOT NULL,
    "continent" TEXT,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,
    "town" TEXT,
    "road" TEXT,
    "landmark" TEXT,
    "shopping_center" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "radius_km" DECIMAL(6,2),
    "is_excluded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_campaign_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_campaigns" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "ad_type" "AdType" NOT NULL,
    "budget_kes" DECIMAL(18,4) NOT NULL,
    "spent_kes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "cpm_bid" DECIMAL(10,2) NOT NULL,
    "target_age_min" INTEGER,
    "target_age_max" INTEGER,
    "target_genders" TEXT[],
    "target_locations" TEXT[],
    "target_interests" TEXT[],
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "cta_text" VARCHAR(50),
    "cta_url" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "AdCampaignStatusType" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_config" (
    "id" TEXT NOT NULL,
    "platform_cut_percentage" DECIMAL(5,2) NOT NULL DEFAULT 15.0,
    "native_ad_min_cpm" DECIMAL(10,2) NOT NULL DEFAULT 40.0,
    "native_ad_max_cpm" DECIMAL(10,2) NOT NULL DEFAULT 150.0,
    "native_ad_frequency" INTEGER NOT NULL DEFAULT 6,
    "banner_ad_min_cpm" DECIMAL(10,2) NOT NULL DEFAULT 30.0,
    "banner_ad_max_cpm" DECIMAL(10,2) NOT NULL DEFAULT 100.0,
    "banner_ad_frequency" INTEGER NOT NULL DEFAULT 15,
    "story_ad_min_cpm" DECIMAL(10,2) NOT NULL DEFAULT 80.0,
    "story_ad_max_cpm" DECIMAL(10,2) NOT NULL DEFAULT 200.0,
    "story_ad_frequency" INTEGER NOT NULL DEFAULT 20,
    "ads_enabled" BOOLEAN NOT NULL DEFAULT true,
    "max_ad_load_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_impressions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "placement" "PlacementType" NOT NULL,
    "content_id" TEXT,
    "content_type" TEXT,
    "chat_id" TEXT,
    "chat_niche" "ChatNiche",
    "was_clicked" BOOLEAN NOT NULL DEFAULT false,
    "was_converted" BOOLEAN NOT NULL DEFAULT false,
    "view_duration_ms" INTEGER NOT NULL DEFAULT 0,
    "cost_kes" DECIMAL(10,4) NOT NULL,
    "user_country" TEXT,
    "user_city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_niche" TEXT,

    CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_platform_settings" (
    "id" TEXT NOT NULL,
    "scope" "TargetingScope" NOT NULL,
    "scope_value" TEXT,
    "min_daily_budget_kes" DECIMAL(18,4) NOT NULL,
    "min_lifetime_budget_kes" DECIMAL(18,4) NOT NULL,
    "contest_min_cpm" DECIMAL(10,2) NOT NULL,
    "contest_max_cpm" DECIMAL(10,2) NOT NULL,
    "discover_min_cpm" DECIMAL(10,2) NOT NULL,
    "discover_max_cpm" DECIMAL(10,2) NOT NULL,
    "admiring_min_cpm" DECIMAL(10,2) NOT NULL,
    "admiring_max_cpm" DECIMAL(10,2) NOT NULL,
    "drips_min_cpm" DECIMAL(10,2) NOT NULL,
    "drips_max_cpm" DECIMAL(10,2) NOT NULL,
    "stories_min_cpm" DECIMAL(10,2) NOT NULL,
    "stories_max_cpm" DECIMAL(10,2) NOT NULL,
    "group_chat_min_cpm" DECIMAL(10,2) NOT NULL,
    "group_chat_max_cpm" DECIMAL(10,2) NOT NULL,
    "chama_chat_min_cpm" DECIMAL(10,2) NOT NULL,
    "chama_chat_max_cpm" DECIMAL(10,2) NOT NULL,
    "targeting_multiplier" DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "granted_by" TEXT,
    "permissions" JSONB,

    CONSTRAINT "admin_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admires" (
    "id" TEXT NOT NULL,
    "admirer_id" TEXT NOT NULL,
    "admired_id" TEXT NOT NULL,
    "is_lovers" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action_details" JSONB NOT NULL,
    "action_type" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "target_user_id" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bio_links" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bio_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "isbn" TEXT,
    "publisher" TEXT,
    "edition" TEXT,
    "language" TEXT,
    "page_count" INTEGER,
    "genre" TEXT,
    "downloadable" BOOLEAN NOT NULL DEFAULT false,
    "download_url" TEXT,

    CONSTRAINT "book_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_campaigns" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "target_tiers" "InfluencerTier"[],
    "target_categories" TEXT[],
    "min_followers" INTEGER,
    "min_engagement_rate" DECIMAL(5,2),
    "target_geos" TEXT[],
    "budget_kr" DECIMAL(18,4) NOT NULL,
    "compensation_per_influencer" DECIMAL(18,4) NOT NULL,
    "max_influencers" INTEGER NOT NULL,
    "required_posts" INTEGER NOT NULL DEFAULT 0,
    "required_videos" INTEGER NOT NULL DEFAULT 0,
    "required_stories" INTEGER NOT NULL DEFAULT 0,
    "content_guidelines" TEXT,
    "hashtags" TEXT[],
    "mentions" TEXT[],
    "contest_id" TEXT,
    "application_deadline" TIMESTAMP(3),
    "campaign_start_date" TIMESTAMP(3) NOT NULL,
    "campaign_end_date" TIMESTAMP(3) NOT NULL,
    "total_applications" INTEGER NOT NULL DEFAULT 0,
    "accepted_influencers" INTEGER NOT NULL DEFAULT 0,
    "total_reach" INTEGER NOT NULL DEFAULT 0,
    "total_engagement" INTEGER NOT NULL DEFAULT 0,
    "total_conversions" INTEGER NOT NULL DEFAULT 0,
    "total_revenue_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "roi" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_analytics" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "spent_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "ctr" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "cpa" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "roas" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "campaign_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_applications" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "pitch" TEXT NOT NULL,
    "proposed_rate" DECIMAL(18,4),
    "availability" TEXT,
    "response_note" TEXT,
    "responded_at" TIMESTAMP(3),
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_deliverables" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content_url" TEXT NOT NULL,
    "caption" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "bargain_price" DECIMAL(18,4),
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "contribution_amount_kr" DECIMAL(18,4) NOT NULL,
    "current_cycle_number" INTEGER NOT NULL DEFAULT 1,
    "min_approvals" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "penalty_amount_kr" DECIMAL(18,4),
    "allowMidTermVoteOut" BOOLEAN NOT NULL DEFAULT true,
    "autoLockOnFull" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" TEXT,
    "contributionFrequency" "ContributionFrequency" NOT NULL,
    "creator_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 3,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockPeriodDays" INTEGER,
    "maxMembers" INTEGER,
    "membershipFeeKr" DECIMAL(18,4),
    "reason" TEXT NOT NULL,
    "type" "ChamaType" NOT NULL,
    "status" "ChamaStatus" NOT NULL DEFAULT 'SETUP',
    "kyc_verified_members_only" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "chama_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_contribution" (
    "id" TEXT NOT NULL,
    "chama_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chama_contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_cycle" (
    "id" TEXT NOT NULL,
    "chama_id" TEXT NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "status" "Chama_Cycle_Status" NOT NULL DEFAULT 'OPEN',
    "collected_amount_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "target_amount_kr" DECIMAL(18,4) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chama_cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_defaulter" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "chama_id" TEXT NOT NULL,
    "chama_name" TEXT NOT NULL,
    "amount_owed_kr" DECIMAL(18,4) NOT NULL,
    "fine_amount_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "chama_defaulter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_election" (
    "id" TEXT NOT NULL,
    "chama_id" TEXT NOT NULL,
    "position" "Chama_Member_Role" NOT NULL,
    "phase" "Chama_Election_Phase" NOT NULL DEFAULT 'NOMINATION',
    "is_mid_term" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chama_election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_member" (
    "id" TEXT NOT NULL,
    "chama_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "Chama_Member_Role" NOT NULL,
    "status" "Chama_Member_Status" NOT NULL DEFAULT 'ACTIVE',
    "total_contributed" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_received" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_defaulter" BOOLEAN NOT NULL DEFAULT false,
    "leftAt" TIMESTAMP(3),
    "rotationNumber" INTEGER,
    "device_fingerprint" TEXT,

    CONSTRAINT "chama_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_nomination" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "nominee_id" TEXT NOT NULL,
    "nominator_id" TEXT NOT NULL,
    "seconds_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chama_nomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_payout" (
    "id" TEXT NOT NULL,
    "chama_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "cycle_id" TEXT,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "status" "Chama_Payout_Status" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "disbursed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chama_payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_payout_approval" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "decision" "Chama_Payout_Decision" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chama_payout_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_secondment" (
    "id" TEXT NOT NULL,
    "nomination_id" TEXT NOT NULL,
    "seconder_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chama_secondment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_transaction" (
    "id" TEXT NOT NULL,
    "chama_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "Chama_Transaction_Type" NOT NULL,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "description" TEXT NOT NULL,
    "receipt_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chama_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_vote" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "nomination_id" TEXT NOT NULL,
    "voter_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chama_vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_wallet" (
    "id" TEXT NOT NULL,
    "chama_id" TEXT NOT NULL,
    "kr_balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chama_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat" (
    "id" TEXT NOT NULL,
    "type" "ChatType" NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participant" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "lastRead" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_task_unlocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "task_description" TEXT NOT NULL,
    "status" "ChatTaskStatus" NOT NULL DEFAULT 'PENDING',
    "deadline" TIMESTAMP(3) NOT NULL,
    "deliverable_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "chat_task_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_reports" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_settings" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "comments_enabled" BOOLEAN NOT NULL DEFAULT true,
    "replies_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "comment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "parent_id" TEXT,
    "reply_to_user_id" TEXT,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "replies_count" INTEGER NOT NULL DEFAULT 0,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(3),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_reviews" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reviewer_id" TEXT,
    "review_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decision" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "compliance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_distribution" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "distribution_tier" TEXT NOT NULL DEFAULT 'TEST',
    "target_audience_size" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" DECIMAL(5,4),
    "like_rate" DECIMAL(5,4),
    "share_rate" DECIMAL(5,4),
    "comment_rate" DECIMAL(5,4),
    "rewatch_rate" DECIMAL(5,4),
    "engagement_score" DECIMAL(5,4),
    "should_amplify" BOOLEAN NOT NULL DEFAULT false,
    "last_evaluated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_hashtag" (
    "id" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_mention" (
    "id" TEXT NOT NULL,
    "mentionedUserId" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_mention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_moderation_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_moderation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_niche_tags" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 1.0,

    CONSTRAINT "content_niche_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_unlocks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "amount_fiat" DECIMAL(18,4),
    "currency" VARCHAR(3),
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_unlocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "media_type" "ContestMediaType" NOT NULL,
    "category" TEXT NOT NULL,
    "cover_media_url" TEXT,
    "prize_total_kr" DECIMAL(18,4) NOT NULL,
    "platform_fee_kr" DECIMAL(18,4) NOT NULL,
    "participation_type" "ParticipationType" NOT NULL DEFAULT 'INDIVIDUAL_ONLY',
    "team_size" INTEGER,
    "max_teams" INTEGER,
    "entry_fee_kr" DECIMAL(18,4),
    "public_vote_weight" INTEGER,
    "target_ages" INTEGER[],
    "target_geos" TEXT[],
    "airdrop_kr" DECIMAL(18,4),
    "airdrop_limit" INTEGER,
    "allow_daily_prizes" BOOLEAN NOT NULL DEFAULT false,
    "daily_prize_kr" DECIMAL(18,4),
    "max_winners" SMALLINT NOT NULL,
    "judging_criteria" "JudgingCriteria" NOT NULL,
    "sponsor_name" TEXT,
    "sponsor_url" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "ContestStatus" NOT NULL DEFAULT 'ACTIVE',
    "total_participants" INTEGER NOT NULL DEFAULT 0,
    "total_submissions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_legal_structure" BOOLEAN NOT NULL DEFAULT true,
    "is_voting_paid" BOOLEAN NOT NULL DEFAULT false,
    "judge_weight_percentage" INTEGER,
    "judging_method" "JudgingMethod",
    "validation_errors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vote_weight_percentage" INTEGER,
    "voting_cost_per_vote_kr" DECIMAL(18,4),
    "voting_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_action" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "action_type" "RequirementType" NOT NULL,
    "target_url" TEXT,
    "label" TEXT NOT NULL,
    "is_verifiable" BOOLEAN NOT NULL DEFAULT false,
    "requires_upload" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contest_action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_action_completions" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "action_id" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "proof_url" TEXT,

    CONSTRAINT "contest_action_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_analytics" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "joins" INTEGER NOT NULL DEFAULT 0,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "shop_visits" INTEGER NOT NULL DEFAULT 0,
    "product_views" INTEGER NOT NULL DEFAULT 0,
    "add_to_carts" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "join_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "submission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "purchase_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,

    CONSTRAINT "contest_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_engagement_actions" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "target_url" TEXT,
    "proof_url" TEXT,
    "metadata" JSONB,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_engagement_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_judges" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_judges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_participants" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_prize_distributions" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "contest_prize_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_purchase_entries" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "purchase_amount" DECIMAL(18,4) NOT NULL,
    "product_ids" TEXT[],
    "is_eligible" BOOLEAN NOT NULL DEFAULT true,
    "auto_entered" BOOLEAN NOT NULL DEFAULT false,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_purchase_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_sponsorships" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "type" "SponsorshipType" NOT NULL,
    "sponsorship_kr" DECIMAL(18,4) NOT NULL,
    "benefits" TEXT[],
    "logo_url" TEXT,
    "brand_message" TEXT,
    "website_url" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue_generated" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_sponsorships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_submission" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "proof_urls" TEXT[],
    "votes_count" INTEGER NOT NULL DEFAULT 0,
    "judge_score" DECIMAL(5,2) DEFAULT 0,
    "final_score" DECIMAL(7,2),
    "rank" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_votes" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "voter_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "fingerprint" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contest_winners" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "prize_kr" DECIMAL(18,4) NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contest_winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_campaign_recipients" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opened_at" TIMESTAMP(3),
    "clicked_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "order_id" TEXT,
    "revenue_kr" DECIMAL(18,4),

    CONSTRAINT "conversion_campaign_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_campaigns" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "brand_id" TEXT,
    "type" "ConversionCampaignType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_segment" TEXT NOT NULL,
    "discount_percent" DECIMAL(5,2),
    "discount_code" TEXT,
    "offer_expires_at" TIMESTAMP(3),
    "total_sent" INTEGER NOT NULL DEFAULT 0,
    "total_opened" INTEGER NOT NULL DEFAULT 0,
    "total_clicked" INTEGER NOT NULL DEFAULT 0,
    "total_converted" INTEGER NOT NULL DEFAULT 0,
    "revenue_generated" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversion_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_boost_global_settings" (
    "id" TEXT NOT NULL,
    "minBoostAmountKes" DECIMAL(18,4) NOT NULL,
    "shortCpmKes" DECIMAL(10,2) NOT NULL,
    "postCpmKes" DECIMAL(10,2) NOT NULL,
    "liveCpmKes" DECIMAL(10,2) NOT NULL,
    "updatedBy" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_boost_global_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_boost_settings" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "daily_budget_kes" DECIMAL(18,4) NOT NULL,
    "spent_today_kes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "target_cpm" DECIMAL(10,2) NOT NULL,
    "target_age_min" INTEGER,
    "target_age_max" INTEGER,
    "target_genders" TEXT[],
    "target_locations" TEXT[],
    "target_interests" TEXT[],
    "boosted_content_count" INTEGER NOT NULL DEFAULT 0,
    "total_impressions" INTEGER NOT NULL DEFAULT 0,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "total_spent_kes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "last_reset_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_boost_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creator_niche" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_niche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_stats" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "new_admirers" INTEGER NOT NULL DEFAULT 0,
    "kr_earned" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "kr_spent" DECIMAL(18,4) NOT NULL DEFAULT 0,

    CONSTRAINT "daily_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_alerts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT,
    "category" "ProductCategory",
    "max_price_kr" DECIMAL(18,4),
    "keywords" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_fingerprints" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fingerprint_hash" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "device_type" TEXT,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "request_count" INTEGER NOT NULL DEFAULT 1,
    "is_suspicious" BOOLEAN NOT NULL DEFAULT false,
    "shared_with_users" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_product_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "file_format" TEXT NOT NULL,
    "file_size_mb" DECIMAL(10,2),
    "license_type" TEXT NOT NULL,
    "download_limit" INTEGER,
    "drm_protected" BOOLEAN NOT NULL DEFAULT false,
    "download_url" TEXT,

    CONSTRAINT "digital_product_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "display_ad_analytics" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "contest_impressions" INTEGER NOT NULL DEFAULT 0,
    "contest_clicks" INTEGER NOT NULL DEFAULT 0,
    "discover_impressions" INTEGER NOT NULL DEFAULT 0,
    "discover_clicks" INTEGER NOT NULL DEFAULT 0,
    "admiring_impressions" INTEGER NOT NULL DEFAULT 0,
    "admiring_clicks" INTEGER NOT NULL DEFAULT 0,
    "drips_impressions" INTEGER NOT NULL DEFAULT 0,
    "drips_clicks" INTEGER NOT NULL DEFAULT 0,
    "stories_impressions" INTEGER NOT NULL DEFAULT 0,
    "stories_clicks" INTEGER NOT NULL DEFAULT 0,
    "group_chat_impressions" INTEGER NOT NULL DEFAULT 0,
    "group_chat_clicks" INTEGER NOT NULL DEFAULT 0,
    "chama_chat_impressions" INTEGER NOT NULL DEFAULT 0,
    "chama_chat_clicks" INTEGER NOT NULL DEFAULT 0,
    "total_impressions" INTEGER NOT NULL DEFAULT 0,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "total_conversions" INTEGER NOT NULL DEFAULT 0,
    "total_spent_kes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "ctr" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "avg_cpm" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cost_per_click" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "display_ad_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "display_ad_campaigns" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "campaign_objective" TEXT NOT NULL,
    "ad_title" TEXT NOT NULL,
    "ad_description" TEXT,
    "primary_image_url" TEXT NOT NULL,
    "secondary_image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "video_url" TEXT,
    "cta_text" TEXT NOT NULL,
    "cta_url" TEXT NOT NULL,
    "budget_type" "BudgetType" NOT NULL,
    "daily_budget_kes" DECIMAL(18,4),
    "lifetime_budget_kes" DECIMAL(18,4),
    "total_spent_kes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "bidding_strategy" "BiddingStrategy" NOT NULL,
    "target_cpm" DECIMAL(10,2),
    "cost_cap" DECIMAL(10,2),
    "target_age_min" INTEGER,
    "target_age_max" INTEGER,
    "target_genders" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_behaviors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_creator_tiers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "placements" "PlacementType"[] DEFAULT ARRAY[]::"PlacementType"[],
    "chat_niches" "ChatNiche"[] DEFAULT ARRAY[]::"ChatNiche"[],
    "pixel_id" TEXT,
    "conversion_events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "AdCampaignStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "frequency" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "ctr" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "avg_cpm" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "escrow_id" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "target_content_niches" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "display_ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electronics_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "processor" TEXT,
    "ram" TEXT,
    "storage" TEXT,
    "screen_size" TEXT,
    "battery_life" TEXT,
    "os" TEXT,
    "connectivity" TEXT[],
    "serial_number" TEXT,
    "warranty_months" INTEGER,

    CONSTRAINT "electronics_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escrows" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "prize_amount_kr" DECIMAL(18,4) NOT NULL,
    "fee_amount_kr" DECIMAL(18,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'held',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "escrows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fashion_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "size" TEXT,
    "material" TEXT,
    "color_variants" TEXT[],
    "fit_type" TEXT,
    "pattern" TEXT,
    "season" TEXT,
    "gender" TEXT,
    "care_instructions" TEXT,

    CONSTRAINT "fashion_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "scope" TEXT,
    "scope_value" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_transaction_logs" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "amount_fiat" DECIMAL(18,4),
    "currency" VARCHAR(3),
    "provider" TEXT,
    "counterpartyId" TEXT,
    "signature" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "device_id" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_transaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flagged_transactions" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "flag_reason" TEXT NOT NULL,
    "flag_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "action_taken" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flagged_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sale_products" (
    "id" TEXT NOT NULL,
    "flash_sale_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sale_price" DECIMAL(18,4) NOT NULL,
    "stock_limit" INTEGER,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "per_user_limit" INTEGER,

    CONSTRAINT "flash_sale_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sales" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "FlashSaleType" NOT NULL,
    "status" "FlashSaleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flash_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "ingredients" TEXT[],
    "nutritional_info" JSONB,
    "expiry_date" TIMESTAMP(3),
    "allergens" TEXT[],
    "certifications" TEXT[],
    "is_organic" BOOLEAN NOT NULL DEFAULT false,
    "weight_volume" TEXT,

    CONSTRAINT "food_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "furniture_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "material" TEXT,
    "dimensions" TEXT,
    "weight" TEXT,
    "color" TEXT,
    "style" TEXT,
    "assembly_required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "furniture_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points_earned" INTEGER NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gamification_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_points" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "engagement_points" INTEGER NOT NULL DEFAULT 0,
    "marketing_points" INTEGER NOT NULL DEFAULT 0,
    "sales_points" INTEGER NOT NULL DEFAULT 0,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "current_level" INTEGER NOT NULL DEFAULT 1,
    "next_level_at" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gamification_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garage_bookings" (
    "id" TEXT NOT NULL,
    "garage_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "price_kr" DECIMAL(18,4),
    "is_on_site" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garage_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garage_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "description" TEXT,
    "service_types" TEXT[],
    "certifications" TEXT[],
    "location" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "service_area" TEXT,
    "offers_on_site" BOOLEAN NOT NULL DEFAULT false,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garage_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garage_reviews" (
    "id" TEXT NOT NULL,
    "garage_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garage_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "message" TEXT,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "escrow_status" TEXT NOT NULL DEFAULT 'held',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grocery_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "ingredients" TEXT[],
    "nutritional_info" JSONB,
    "expiry_date" TIMESTAMP(3),
    "allergens" TEXT[],
    "certifications" TEXT[],
    "is_organic" BOOLEAN NOT NULL DEFAULT false,
    "weight_volume" TEXT,

    CONSTRAINT "grocery_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_buy_participants" (
    "id" TEXT NOT NULL,
    "group_buy_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_buy_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_buys" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_participants" INTEGER NOT NULL,
    "current_count" INTEGER NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "status" "GroupBuyStatus" NOT NULL DEFAULT 'OPEN',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_buys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtag" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_path" VARCHAR(500) NOT NULL,
    "request_method" VARCHAR(10) NOT NULL,
    "request_body" JSONB,
    "response_code" INTEGER NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_quotes" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "importer_id" TEXT NOT NULL,
    "quote_amount_kr" DECIMAL(18,4) NOT NULL,
    "estimated_days" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year_from" INTEGER,
    "year_to" INTEGER,
    "country_of_origin" TEXT,
    "budget" DECIMAL(18,4),
    "requirements" TEXT,
    "status" "ImportRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "importer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "description" TEXT,
    "countries_served" TEXT[],
    "specialization" TEXT,
    "years_experience" INTEGER,
    "total_imports" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "importer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencer_portfolio" (
    "id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "influencer_portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencer_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" "InfluencerTier" NOT NULL,
    "bio" TEXT,
    "categories" TEXT[],
    "avg_engagement_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avg_views" INTEGER NOT NULL DEFAULT 0,
    "rate_per_post" DECIMAL(18,4),
    "rate_per_video" DECIMAL(18,4),
    "rate_per_story" DECIMAL(18,4),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "total_campaigns" INTEGER NOT NULL DEFAULT 0,
    "total_earnings_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "influencer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencer_reviews" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "communication_rating" INTEGER NOT NULL,
    "quality_rating" INTEGER NOT NULL,
    "timeliness_rating" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "influencer_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judge_invites" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "judge_id" TEXT NOT NULL,
    "status" "JudgeInviteStatus" NOT NULL DEFAULT 'PENDING',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judge_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judge_scores" (
    "id" TEXT NOT NULL,
    "judge_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judge_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "front_image_url" TEXT NOT NULL,
    "back_image_url" TEXT,
    "selfie_url" TEXT NOT NULL,
    "status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
    "verified_by" TEXT,
    "verification_note" TEXT,
    "rejection_reason" TEXT,
    "name_matches" BOOLEAN NOT NULL DEFAULT false,
    "name_match_score" DECIMAL(5,2),
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_fee_config" (
    "id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" "TargetingScope" NOT NULL,
    "scope_value" TEXT,
    "category" "ProductCategory",
    "base_fee_kr" DECIMAL(18,4) NOT NULL,
    "daily_free_quota" INTEGER NOT NULL DEFAULT 0,
    "weekly_free_quota" INTEGER NOT NULL DEFAULT 0,
    "monthly_free_quota" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_fee_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_fee_transaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "location_scope" "TargetingScope" NOT NULL,
    "location_value" TEXT,
    "fee_kr" DECIMAL(18,4) NOT NULL,
    "was_free" BOOLEAN NOT NULL DEFAULT false,
    "quota_type" TEXT,
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_fee_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_master" (
    "id" TEXT NOT NULL,
    "scope" "TargetingScope" NOT NULL,
    "scope_value" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "parent_id" TEXT,
    "continent" TEXT,
    "country" TEXT,
    "country_code" VARCHAR(2),
    "region" TEXT,
    "city" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "population" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locked_chat_settings" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "task_fee_kr" DECIMAL(18,4) NOT NULL,
    "typical_delivery_time" TEXT,
    "total_tasks_completed" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locked_chat_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locked_chat_tasks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "task_description" TEXT NOT NULL,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deadline" TIMESTAMP(3) NOT NULL,
    "deliverable_url" TEXT,
    "deliverable_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "expired_at" TIMESTAMP(3),
    "chat_unlocked_until" TIMESTAMP(3),

    CONSTRAINT "locked_chat_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_companies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "description" TEXT,
    "service_types" TEXT[],
    "coverage_areas" TEXT[],
    "vehicle_types" TEXT[],
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logistics_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT,
    "chat_id" TEXT,
    "text" TEXT,
    "media_url" TEXT,
    "media_type" TEXT,
    "forwarded_from_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_system_event" BOOLEAN NOT NULL DEFAULT false,
    "payload" TEXT,
    "status" TEXT,
    "replies_count" INTEGER NOT NULL DEFAULT 0,
    "reply_to_id" TEXT,
    "thumbnail_url" TEXT,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_completions" (
    "id" TEXT NOT NULL,
    "milestone_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestone_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirement_type" TEXT NOT NULL,
    "requirement_value" INTEGER NOT NULL,
    "reward_kr" DECIMAL(18,4) NOT NULL,
    "contest_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ofac_screening_cache" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT NOT NULL,
    "is_match" BOOLEAN NOT NULL DEFAULT false,
    "match_score" INTEGER,
    "matched_entry" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "list_version" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ofac_screening_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_kr" DECIMAL(18,4) NOT NULL,
    "total_price_kr" DECIMAL(18,4) NOT NULL,
    "escrow_status" TEXT NOT NULL DEFAULT 'held',
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "total_kr" DECIMAL(18,4) NOT NULL,
    "platform_fee_kr" DECIMAL(18,4) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetScope" TEXT DEFAULT 'all',
    "type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "platform_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "platform_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_rate_limits" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "requests_per_hour" INTEGER NOT NULL,
    "requests_remaining" INTEGER NOT NULL,
    "reset_at" TIMESTAMP(3) NOT NULL,
    "last_request_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_wallet" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "kr_balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "caption" TEXT,
    "image_urls" TEXT[],
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "required_tier" "SubscriptionTierType",
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlock_amount_kr" DECIMAL(18,4),

    CONSTRAINT "post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "premium_listings" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "type" "PremiumType" NOT NULL,
    "daily_rate_kr" DECIMAL(10,2) NOT NULL,
    "total_paid_kr" DECIMAL(18,4) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "premium_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_analytics" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "add_to_cart" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "avg_time_on_page" INTEGER NOT NULL DEFAULT 0,
    "bounce_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,

    CONSTRAINT "product_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_discounts" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "discount_type" TEXT NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_quantity" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "text" TEXT,
    "video_url" TEXT,
    "image_urls" TEXT[],
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_moderated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_shares" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT,
    "content_type" TEXT,
    "caption" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_tags" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "position_x" DECIMAL(5,2),
    "position_y" DECIMAL(5,2),
    "timestamp" INTEGER,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_urls" TEXT[],
    "price_kr" DECIMAL(18,4) NOT NULL,
    "whatsapp_number" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "bargain_enabled" BOOLEAN NOT NULL DEFAULT false,
    "bargain_min_price" DECIMAL(18,4),
    "brand" TEXT,
    "condition" "ProductCondition" NOT NULL DEFAULT 'NEW',
    "contactMethod" "ContactMethod" NOT NULL DEFAULT 'WHATSAPP',
    "currency" VARCHAR(3),
    "featured_until" TIMESTAMP(3),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_promoted" BOOLEAN NOT NULL DEFAULT false,
    "is_top_spot" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DECIMAL(10,7),
    "local_price" DECIMAL(18,4),
    "location" TEXT,
    "longitude" DECIMAL(10,7),
    "promoted_until" TIMESTAMP(3),
    "purchase_url" TEXT,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "sales_count" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "subcategory" TEXT,
    "tags" TEXT[],
    "top_spot_until" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "wholesale_min_qty" INTEGER,
    "wholesale_price" DECIMAL(18,4),
    "category" "ProductCategory" NOT NULL DEFAULT 'OTHER',

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prohibited_names" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "added_by" TEXT,

    CONSTRAINT "prohibited_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_estate_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "property_type" TEXT NOT NULL,
    "listing_type" TEXT NOT NULL,
    "land_size" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floors" INTEGER,
    "year_built" INTEGER,
    "amenities" TEXT[],
    "legal_documents" TEXT[],
    "furnished" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "real_estate_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserved_usernames" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "reserved_for" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "reserved_by" TEXT,

    CONSTRAINT "reserved_usernames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_factors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "factor_type" TEXT NOT NULL,
    "factor_name" TEXT NOT NULL,
    "factor_value" TEXT NOT NULL,
    "factor_score" INTEGER NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_funnel_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "contest_id" TEXT,
    "campaign_id" TEXT,
    "stage" "FunnelStage" NOT NULL,
    "event_type" TEXT NOT NULL,
    "source_type" TEXT,
    "source_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "delivery_mode" TEXT NOT NULL,
    "duration_minutes" INTEGER,
    "availability" TEXT,
    "revisions_allowed" INTEGER,
    "turnaround_days" INTEGER,

    CONSTRAINT "service_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_jobs" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "logistics_id" TEXT,
    "pickup_location" TEXT NOT NULL,
    "delivery_location" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "vehicle_desc" TEXT,
    "price_kr" DECIMAL(18,4),
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipping_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shoe_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "shoe_size" TEXT NOT NULL,
    "sole_material" TEXT,
    "heel_height" TEXT,
    "closure_type" TEXT,
    "water_resistant" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT,

    CONSTRAINT "shoe_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_collection" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cover_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_comments" (
    "id" TEXT NOT NULL,
    "short_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_likes" (
    "id" TEXT NOT NULL,
    "short_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shorts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "caption" TEXT,
    "music_title" TEXT,
    "music_artist" TEXT,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "required_tier" "SubscriptionTierType",
    "contest_id" TEXT,
    "collection_id" TEXT,
    "linked_product_id" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlock_amount_kr" DECIMAL(18,4),
    "aspect_ratio" DOUBLE PRECISION,
    "media_type" TEXT NOT NULL DEFAULT 'VIDEO',
    "media_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "shorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_accounts" (
    "id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "username" TEXT NOT NULL,
    "profile_url" TEXT NOT NULL,
    "display_name" TEXT,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "subscriber_count" INTEGER NOT NULL DEFAULT 0,
    "video_count" INTEGER NOT NULL DEFAULT 0,
    "total_views" BIGINT NOT NULL DEFAULT 0,
    "avg_views" INTEGER NOT NULL DEFAULT 0,
    "avg_likes" INTEGER NOT NULL DEFAULT 0,
    "engagement_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "last_synced_at" TIMESTAMP(3),
    "sync_status" TEXT NOT NULL DEFAULT 'pending',
    "sync_error" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_media_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_media_sync_logs" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "followers_before" INTEGER NOT NULL,
    "followers_after" INTEGER NOT NULL,
    "follower_change" INTEGER NOT NULL,
    "error_message" TEXT,
    "error_code" TEXT,
    "duration_ms" INTEGER NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_media_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spare_part_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "compatible_makes" TEXT[],
    "compatible_models" TEXT[],
    "compatible_year_from" INTEGER,
    "compatible_year_to" INTEGER,
    "part_type" TEXT NOT NULL,
    "part_number" TEXT,
    "oem_number" TEXT,
    "is_genuine" BOOLEAN NOT NULL DEFAULT false,
    "fits_left" BOOLEAN NOT NULL DEFAULT false,
    "fits_right" BOOLEAN NOT NULL DEFAULT false,
    "fits_front" BOOLEAN NOT NULL DEFAULT false,
    "fits_rear" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "spare_part_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsored_content" (
    "id" TEXT NOT NULL,
    "brand_user_id" TEXT NOT NULL,
    "content_type" "SponsoredContentType" NOT NULL,
    "content_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "budget" DECIMAL(18,4) NOT NULL,
    "spent" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "pricing_model" "PricingModel" NOT NULL,
    "bid_amount" DECIMAL(18,4) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "targeting" JSONB,
    "status" "SponsoredContentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "engagements" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "escrow_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsored_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsored_impressions" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sponsored_impressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsored_post_requests" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "campaign_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "total_payment_kes" DECIMAL(18,4) NOT NULL,
    "creator_payment_kes" DECIMAL(18,4) NOT NULL,
    "platform_fee_kes" DECIMAL(18,4) NOT NULL,
    "content_type" TEXT NOT NULL,
    "content_id" TEXT,
    "content_url" TEXT,
    "status" "SponsoredPostStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "payment_released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsored_post_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "caption" TEXT,
    "duration_secs" INTEGER NOT NULL DEFAULT 15,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "replies_count" INTEGER NOT NULL DEFAULT 0,
    "is_highlighted" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "text" TEXT,
    "privacy" "StoryPrivacy" NOT NULL DEFAULT 'PUBLIC',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_view" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isTipped" BOOLEAN NOT NULL DEFAULT false,
    "tip_amount" DECIMAL(18,4),

    CONSTRAINT "story_view_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_viewer_preference" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "preferredViewerId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_viewer_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_tier" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "tier" "SubscriptionTierType" NOT NULL,
    "kr_amount" DECIMAL(18,4) NOT NULL,
    "benefits" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_tier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "subscriber_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "tier_id" TEXT NOT NULL,
    "tier" "SubscriptionTierType" NOT NULL,
    "kr_amount" DECIMAL(18,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_billing_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolution_note" TEXT,

    CONSTRAINT "suspicious_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suspicious_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_activity_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "filed_at" TIMESTAMP(3),
    "filed_by" TEXT,
    "report_number" TEXT,
    "regulatory_body" TEXT,
    "related_transactions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suspicious_activity_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "avatar_url" TEXT,
    "leader_id" TEXT NOT NULL,
    "max_members" INTEGER NOT NULL DEFAULT 5,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "total_prizes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_chats" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_contest_registrations" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_contest_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_invitations" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "inviter_id" TEXT NOT NULL,
    "invitee_id" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_submission_votes" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "voter_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_submission_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_submissions" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "caption" TEXT,
    "contributors" TEXT[],
    "votes_count" INTEGER NOT NULL DEFAULT 0,
    "judge_score" DECIMAL(5,2) DEFAULT 0,
    "final_score" DECIMAL(7,2),
    "rank" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_contexts" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "context_type" TEXT NOT NULL,
    "reference_id" TEXT,
    "description" TEXT NOT NULL,
    "content_type" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_nonces" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transactionType" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_nonces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "amount_fiat" DECIMAL(18,4),
    "currency" VARCHAR(3),
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "counterparty_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" JSONB,
    "context_desc" TEXT,
    "context_ref_id" TEXT,
    "context_type" TEXT,
    "description" TEXT,
    "device_id" TEXT,
    "flag_reason" TEXT,
    "ip_address" TEXT,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "reference_id" TEXT,
    "risk_score" INTEGER DEFAULT 0,
    "transaction_type" "TransactionType",
    "user_agent" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending_topics" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "category" TEXT,
    "mention_count" INTEGER NOT NULL DEFAULT 0,
    "engagement" INTEGER NOT NULL DEFAULT 0,
    "trend_score" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trending_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "cover_photo_url" TEXT,
    "bio" TEXT,
    "country" VARCHAR(2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "google_id" TEXT,
    "apple_id" TEXT,
    "account_type" "AccountType" NOT NULL DEFAULT 'CREATOR',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_wallet_unlocked" BOOLEAN NOT NULL DEFAULT false,
    "wallet_pin_hash" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "devicePlatform" TEXT,
    "fcmToken" TEXT,
    "customNiches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "selectedNiches" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "admirers_count" INTEGER NOT NULL DEFAULT 0,
    "kyc_status" "KYCStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "isRotationLocked" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_content_delivery" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed" BOOLEAN NOT NULL DEFAULT false,
    "view_duration" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "commented" BOOLEAN NOT NULL DEFAULT false,
    "rewatched_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_content_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interaction_signals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "watch_duration" INTEGER,
    "total_duration" INTEGER,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interaction_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_listing_quota" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "daily_used" INTEGER NOT NULL DEFAULT 0,
    "weekly_used" INTEGER NOT NULL DEFAULT 0,
    "monthly_used" INTEGER NOT NULL DEFAULT 0,
    "last_daily_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_weekly_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_monthly_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_listing_quota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_micro_interests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "affinity" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "category" TEXT NOT NULL,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_engaged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_micro_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_risk_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "kyc_risk_score" INTEGER NOT NULL DEFAULT 0,
    "geographic_risk_score" INTEGER NOT NULL DEFAULT 0,
    "transaction_risk_score" INTEGER NOT NULL DEFAULT 0,
    "behavioral_risk_score" INTEGER NOT NULL DEFAULT 0,
    "self_tipping_score" INTEGER NOT NULL DEFAULT 0,
    "circular_tipping_score" INTEGER NOT NULL DEFAULT 0,
    "recipient_diversity" INTEGER NOT NULL DEFAULT 100,
    "withdrawal_blocked" BOOLEAN NOT NULL DEFAULT false,
    "transaction_limited" BOOLEAN NOT NULL DEFAULT false,
    "requires_manual_review" BOOLEAN NOT NULL DEFAULT false,
    "last_calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flagged_reasons" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'LOW',

    CONSTRAINT "user_risk_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_session_secrets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "secret" BYTEA NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "device_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_session_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_suspensions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "suspendedBy" TEXT,
    "liftedBy" TEXT,
    "liftedAt" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_suspensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_details" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER,
    "fuel_type" "FuelType",
    "transmission" "TransmissionType",
    "body_type" "VehicleBodyType",
    "engine_size" TEXT,
    "color" TEXT,
    "vin" TEXT,
    "number_of_owners" INTEGER,
    "logbook_ready" BOOLEAN NOT NULL DEFAULT false,
    "import_status" TEXT,
    "import_cert_url" TEXT,
    "auction_sheet_url" TEXT,
    "accident_history" BOOLEAN NOT NULL DEFAULT false,
    "trade_in_enabled" BOOLEAN NOT NULL DEFAULT false,
    "swap_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vehicle_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_favorites" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kr_balance" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "wishlist_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_purchased" BOOLEAN NOT NULL DEFAULT false,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_registry" BOOLEAN NOT NULL DEFAULT false,
    "event_type" TEXT,
    "event_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_limits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "daily_limit_kr" DECIMAL(18,4) NOT NULL,
    "withdrawn_today_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "last_reset_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount_kr" DECIMAL(18,4) NOT NULL,
    "method" TEXT,
    "destination" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "account_details" JSONB,
    "account_name" TEXT,
    "amount_fiat" DECIMAL(18,4),
    "currency" TEXT,
    "flag_reason" TEXT,
    "flagged_at" TIMESTAMP(3),
    "kyc_document_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "name_match_status" TEXT,
    "provider" TEXT,
    "requires_kyc" BOOLEAN NOT NULL DEFAULT false,
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "suspicious_flags" JSONB,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ad_analytics_date_key" ON "ad_analytics"("date");

-- CreateIndex
CREATE INDEX "ad_analytics_date_idx" ON "ad_analytics"("date");

-- CreateIndex
CREATE INDEX "ad_campaign_locations_campaign_id_idx" ON "ad_campaign_locations"("campaign_id");

-- CreateIndex
CREATE INDEX "ad_campaign_locations_scope_scope_value_idx" ON "ad_campaign_locations"("scope", "scope_value");

-- CreateIndex
CREATE INDEX "ad_campaigns_brand_id_idx" ON "ad_campaigns"("brand_id");

-- CreateIndex
CREATE INDEX "ad_campaigns_start_date_end_date_idx" ON "ad_campaigns"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "ad_campaigns_status_idx" ON "ad_campaigns"("status");

-- CreateIndex
CREATE INDEX "ad_impressions_campaign_id_user_id_idx" ON "ad_impressions"("campaign_id", "user_id");

-- CreateIndex
CREATE INDEX "ad_impressions_placement_created_at_idx" ON "ad_impressions"("placement", "created_at");

-- CreateIndex
CREATE INDEX "ad_impressions_user_id_created_at_idx" ON "ad_impressions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ad_platform_settings_scope_priority_idx" ON "ad_platform_settings"("scope", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "ad_platform_settings_scope_scope_value_key" ON "ad_platform_settings"("scope", "scope_value");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profile_user_id_key" ON "admin_profile"("user_id");

-- CreateIndex
CREATE INDEX "admin_profile_user_id_idx" ON "admin_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admires_admirer_id_admired_id_key" ON "admires"("admirer_id", "admired_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_type_idx" ON "audit_logs"("action_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_performed_by_idx" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "audit_logs_target_user_id_idx" ON "audit_logs"("target_user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_audit_logs_performed_by" ON "audit_logs"("performed_by");

-- CreateIndex
CREATE INDEX "idx_audit_logs_target_user_id" ON "audit_logs"("target_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_details_product_id_key" ON "book_details"("product_id");

-- CreateIndex
CREATE INDEX "brand_campaigns_brand_id_idx" ON "brand_campaigns"("brand_id");

-- CreateIndex
CREATE INDEX "brand_campaigns_contest_id_idx" ON "brand_campaigns"("contest_id");

-- CreateIndex
CREATE INDEX "brand_campaigns_status_campaign_start_date_idx" ON "brand_campaigns"("status", "campaign_start_date");

-- CreateIndex
CREATE INDEX "campaign_analytics_date_idx" ON "campaign_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_analytics_campaign_id_date_key" ON "campaign_analytics"("campaign_id", "date");

-- CreateIndex
CREATE INDEX "campaign_applications_influencer_id_status_idx" ON "campaign_applications"("influencer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_applications_campaign_id_influencer_id_key" ON "campaign_applications"("campaign_id", "influencer_id");

-- CreateIndex
CREATE INDEX "campaign_deliverables_campaign_id_status_idx" ON "campaign_deliverables"("campaign_id", "status");

-- CreateIndex
CREATE INDEX "campaign_deliverables_influencer_id_idx" ON "campaign_deliverables"("influencer_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_user_id_product_id_key" ON "cart_items"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "chama_creator_id_idx" ON "chama"("creator_id");

-- CreateIndex
CREATE INDEX "chama_status_idx" ON "chama"("status");

-- CreateIndex
CREATE INDEX "chama_contribution_chama_id_cycle_number_idx" ON "chama_contribution"("chama_id", "cycle_number");

-- CreateIndex
CREATE INDEX "chama_contribution_chama_id_idx" ON "chama_contribution"("chama_id");

-- CreateIndex
CREATE INDEX "chama_contribution_member_id_idx" ON "chama_contribution"("member_id");

-- CreateIndex
CREATE INDEX "chama_cycle_chama_id_idx" ON "chama_cycle"("chama_id");

-- CreateIndex
CREATE INDEX "chama_cycle_chama_id_status_idx" ON "chama_cycle"("chama_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "chama_cycle_chama_id_cycle_number_key" ON "chama_cycle"("chama_id", "cycle_number");

-- CreateIndex
CREATE INDEX "chama_defaulter_chama_id_idx" ON "chama_defaulter"("chama_id");

-- CreateIndex
CREATE INDEX "chama_defaulter_user_id_idx" ON "chama_defaulter"("user_id");

-- CreateIndex
CREATE INDEX "chama_defaulter_user_id_is_resolved_idx" ON "chama_defaulter"("user_id", "is_resolved");

-- CreateIndex
CREATE INDEX "chama_election_chama_id_idx" ON "chama_election"("chama_id");

-- CreateIndex
CREATE INDEX "chama_election_chama_id_phase_idx" ON "chama_election"("chama_id", "phase");

-- CreateIndex
CREATE INDEX "chama_member_chama_id_idx" ON "chama_member"("chama_id");

-- CreateIndex
CREATE INDEX "chama_member_user_id_idx" ON "chama_member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chama_member_chama_id_user_id_key" ON "chama_member"("chama_id", "user_id");

-- CreateIndex
CREATE INDEX "chama_nomination_election_id_idx" ON "chama_nomination"("election_id");

-- CreateIndex
CREATE INDEX "chama_nomination_nominee_id_idx" ON "chama_nomination"("nominee_id");

-- CreateIndex
CREATE UNIQUE INDEX "chama_nomination_election_id_nominee_id_key" ON "chama_nomination"("election_id", "nominee_id");

-- CreateIndex
CREATE INDEX "chama_payout_chama_id_idx" ON "chama_payout"("chama_id");

-- CreateIndex
CREATE INDEX "chama_payout_chama_id_status_idx" ON "chama_payout"("chama_id", "status");

-- CreateIndex
CREATE INDEX "chama_payout_recipient_id_idx" ON "chama_payout"("recipient_id");

-- CreateIndex
CREATE INDEX "chama_payout_approval_approver_id_idx" ON "chama_payout_approval"("approver_id");

-- CreateIndex
CREATE INDEX "chama_payout_approval_payout_id_idx" ON "chama_payout_approval"("payout_id");

-- CreateIndex
CREATE INDEX "chama_secondment_nomination_id_idx" ON "chama_secondment"("nomination_id");

-- CreateIndex
CREATE INDEX "chama_secondment_seconder_id_idx" ON "chama_secondment"("seconder_id");

-- CreateIndex
CREATE UNIQUE INDEX "chama_secondment_nomination_id_seconder_id_key" ON "chama_secondment"("nomination_id", "seconder_id");

-- CreateIndex
CREATE INDEX "chama_transaction_chama_id_created_at_idx" ON "chama_transaction"("chama_id", "created_at");

-- CreateIndex
CREATE INDEX "chama_transaction_chama_id_idx" ON "chama_transaction"("chama_id");

-- CreateIndex
CREATE INDEX "chama_vote_election_id_idx" ON "chama_vote"("election_id");

-- CreateIndex
CREATE INDEX "chama_vote_nomination_id_idx" ON "chama_vote"("nomination_id");

-- CreateIndex
CREATE INDEX "chama_vote_voter_id_idx" ON "chama_vote"("voter_id");

-- CreateIndex
CREATE UNIQUE INDEX "chama_vote_election_id_voter_id_key" ON "chama_vote"("election_id", "voter_id");

-- CreateIndex
CREATE UNIQUE INDEX "chama_wallet_chama_id_key" ON "chama_wallet"("chama_id");

-- CreateIndex
CREATE INDEX "chama_wallet_chama_id_idx" ON "chama_wallet"("chama_id");

-- CreateIndex
CREATE INDEX "chat_participant_chat_id_idx" ON "chat_participant"("chat_id");

-- CreateIndex
CREATE INDEX "chat_participant_user_id_idx" ON "chat_participant"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_participant_chat_id_user_id_key" ON "chat_participant"("chat_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_task_unlocks_creator_id_idx" ON "chat_task_unlocks"("creator_id");

-- CreateIndex
CREATE INDEX "chat_task_unlocks_status_idx" ON "chat_task_unlocks"("status");

-- CreateIndex
CREATE INDEX "chat_task_unlocks_user_id_creator_id_idx" ON "chat_task_unlocks"("user_id", "creator_id");

-- CreateIndex
CREATE INDEX "chat_task_unlocks_user_id_idx" ON "chat_task_unlocks"("user_id");

-- CreateIndex
CREATE INDEX "comment_likes_comment_id_idx" ON "comment_likes"("comment_id");

-- CreateIndex
CREATE INDEX "comment_likes_user_id_idx" ON "comment_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_comment_id_user_id_key" ON "comment_likes"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "comment_reports_comment_id_idx" ON "comment_reports"("comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "comment_settings_content_id_content_type_key" ON "comment_settings"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "comments_content_type_content_id_created_at_idx" ON "comments"("content_type", "content_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_is_pinned_created_at_idx" ON "comments"("is_pinned", "created_at");

-- CreateIndex
CREATE INDEX "comments_parent_id_idx" ON "comments"("parent_id");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");

-- CreateIndex
CREATE INDEX "compliance_reviews_created_at_idx" ON "compliance_reviews"("created_at");

-- CreateIndex
CREATE INDEX "compliance_reviews_reviewer_id_idx" ON "compliance_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "compliance_reviews_status_idx" ON "compliance_reviews"("status");

-- CreateIndex
CREATE INDEX "compliance_reviews_transaction_id_idx" ON "compliance_reviews"("transaction_id");

-- CreateIndex
CREATE INDEX "compliance_reviews_user_id_idx" ON "compliance_reviews"("user_id");

-- CreateIndex
CREATE INDEX "idx_compliance_reviews_created_at" ON "compliance_reviews"("created_at");

-- CreateIndex
CREATE INDEX "idx_compliance_reviews_reviewer_id" ON "compliance_reviews"("reviewer_id");

-- CreateIndex
CREATE INDEX "idx_compliance_reviews_status" ON "compliance_reviews"("status");

-- CreateIndex
CREATE INDEX "idx_compliance_reviews_user_id" ON "compliance_reviews"("user_id");

-- CreateIndex
CREATE INDEX "content_distribution_content_id_content_type_idx" ON "content_distribution"("content_id", "content_type");

-- CreateIndex
CREATE UNIQUE INDEX "content_distribution_content_id_content_type_key" ON "content_distribution"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "content_hashtag_content_id_contentType_idx" ON "content_hashtag"("content_id", "contentType");

-- CreateIndex
CREATE INDEX "content_hashtag_hashtagId_idx" ON "content_hashtag"("hashtagId");

-- CreateIndex
CREATE UNIQUE INDEX "content_hashtag_hashtagId_content_id_contentType_key" ON "content_hashtag"("hashtagId", "content_id", "contentType");

-- CreateIndex
CREATE INDEX "content_mention_content_id_contentType_idx" ON "content_mention"("content_id", "contentType");

-- CreateIndex
CREATE INDEX "content_mention_mentionedUserId_idx" ON "content_mention"("mentionedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "content_mention_mentionedUserId_content_id_contentType_key" ON "content_mention"("mentionedUserId", "content_id", "contentType");

-- CreateIndex
CREATE INDEX "content_moderation_logs_adminId_idx" ON "content_moderation_logs"("adminId");

-- CreateIndex
CREATE INDEX "content_moderation_logs_contentType_content_id_idx" ON "content_moderation_logs"("contentType", "content_id");

-- CreateIndex
CREATE INDEX "content_niche_tags_content_id_contentType_idx" ON "content_niche_tags"("content_id", "contentType");

-- CreateIndex
CREATE INDEX "content_niche_tags_niche_idx" ON "content_niche_tags"("niche");

-- CreateIndex
CREATE UNIQUE INDEX "content_niche_tags_content_id_contentType_niche_key" ON "content_niche_tags"("content_id", "contentType", "niche");

-- CreateIndex
CREATE INDEX "content_unlocks_content_id_content_type_idx" ON "content_unlocks"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "content_unlocks_creator_id_idx" ON "content_unlocks"("creator_id");

-- CreateIndex
CREATE INDEX "content_unlocks_user_id_idx" ON "content_unlocks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_unlocks_user_id_content_id_content_type_key" ON "content_unlocks"("user_id", "content_id", "content_type");

-- CreateIndex
CREATE INDEX "contest_is_legal_structure_idx" ON "contest"("is_legal_structure");

-- CreateIndex
CREATE INDEX "contest_status_deadline_idx" ON "contest"("status", "deadline");

-- CreateIndex
CREATE INDEX "contest_analytics_date_idx" ON "contest_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "contest_analytics_contest_id_date_key" ON "contest_analytics"("contest_id", "date");

-- CreateIndex
CREATE INDEX "contest_engagement_actions_action_type_is_completed_idx" ON "contest_engagement_actions"("action_type", "is_completed");

-- CreateIndex
CREATE INDEX "contest_engagement_actions_contest_id_user_id_idx" ON "contest_engagement_actions"("contest_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contest_judges_contest_id_user_id_key" ON "contest_judges"("contest_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contest_participants_contest_id_user_id_key" ON "contest_participants"("contest_id", "user_id");

-- CreateIndex
CREATE INDEX "contest_purchase_entries_contest_id_user_id_idx" ON "contest_purchase_entries"("contest_id", "user_id");

-- CreateIndex
CREATE INDEX "contest_purchase_entries_order_id_idx" ON "contest_purchase_entries"("order_id");

-- CreateIndex
CREATE INDEX "contest_sponsorships_brand_id_idx" ON "contest_sponsorships"("brand_id");

-- CreateIndex
CREATE INDEX "contest_sponsorships_contest_id_idx" ON "contest_sponsorships"("contest_id");

-- CreateIndex
CREATE UNIQUE INDEX "contest_submission_contest_id_user_id_key" ON "contest_submission"("contest_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "contest_votes_submission_id_voter_id_key" ON "contest_votes"("submission_id", "voter_id");

-- CreateIndex
CREATE INDEX "conversion_campaign_recipients_user_id_idx" ON "conversion_campaign_recipients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversion_campaign_recipients_campaign_id_user_id_key" ON "conversion_campaign_recipients"("campaign_id", "user_id");

-- CreateIndex
CREATE INDEX "conversion_campaigns_contest_id_idx" ON "conversion_campaigns"("contest_id");

-- CreateIndex
CREATE INDEX "conversion_campaigns_type_is_active_idx" ON "conversion_campaigns"("type", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "creator_boost_settings_creator_id_key" ON "creator_boost_settings"("creator_id");

-- CreateIndex
CREATE INDEX "creator_boost_settings_creator_id_idx" ON "creator_boost_settings"("creator_id");

-- CreateIndex
CREATE INDEX "creator_boost_settings_is_enabled_idx" ON "creator_boost_settings"("is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "creator_niche_name_key" ON "creator_niche"("name");

-- CreateIndex
CREATE UNIQUE INDEX "daily_stats_user_id_date_key" ON "daily_stats"("user_id", "date");

-- CreateIndex
CREATE INDEX "deal_alerts_user_id_is_active_idx" ON "deal_alerts"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "device_fingerprints_fingerprint_hash_idx" ON "device_fingerprints"("fingerprint_hash");

-- CreateIndex
CREATE INDEX "device_fingerprints_ip_address_idx" ON "device_fingerprints"("ip_address");

-- CreateIndex
CREATE INDEX "device_fingerprints_is_suspicious_idx" ON "device_fingerprints"("is_suspicious");

-- CreateIndex
CREATE UNIQUE INDEX "device_fingerprints_user_id_fingerprint_hash_key" ON "device_fingerprints"("user_id", "fingerprint_hash");

-- CreateIndex
CREATE UNIQUE INDEX "digital_product_details_product_id_key" ON "digital_product_details"("product_id");

-- CreateIndex
CREATE INDEX "display_ad_analytics_date_idx" ON "display_ad_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "display_ad_analytics_campaign_id_date_key" ON "display_ad_analytics"("campaign_id", "date");

-- CreateIndex
CREATE INDEX "display_ad_campaigns_brand_id_status_idx" ON "display_ad_campaigns"("brand_id", "status");

-- CreateIndex
CREATE INDEX "display_ad_campaigns_status_start_date_idx" ON "display_ad_campaigns"("status", "start_date");

-- CreateIndex
CREATE UNIQUE INDEX "electronics_details_product_id_key" ON "electronics_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "fashion_details_product_id_key" ON "fashion_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_key" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX "feature_flags_scope_priority_idx" ON "feature_flags"("scope", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_key_scope_scope_value_key" ON "feature_flags"("key", "scope", "scope_value");

-- CreateIndex
CREATE INDEX "financial_transaction_logs_transactionType_idx" ON "financial_transaction_logs"("transactionType");

-- CreateIndex
CREATE INDEX "financial_transaction_logs_transaction_id_idx" ON "financial_transaction_logs"("transaction_id");

-- CreateIndex
CREATE INDEX "financial_transaction_logs_user_id_created_at_idx" ON "financial_transaction_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "flagged_transactions_created_at_idx" ON "flagged_transactions"("created_at");

-- CreateIndex
CREATE INDEX "flagged_transactions_flag_type_idx" ON "flagged_transactions"("flag_type");

-- CreateIndex
CREATE INDEX "flagged_transactions_risk_score_idx" ON "flagged_transactions"("risk_score");

-- CreateIndex
CREATE INDEX "flagged_transactions_severity_idx" ON "flagged_transactions"("severity");

-- CreateIndex
CREATE INDEX "flagged_transactions_status_idx" ON "flagged_transactions"("status");

-- CreateIndex
CREATE INDEX "flagged_transactions_user_id_idx" ON "flagged_transactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "flash_sale_products_flash_sale_id_product_id_key" ON "flash_sale_products"("flash_sale_id", "product_id");

-- CreateIndex
CREATE INDEX "flash_sales_status_start_time_idx" ON "flash_sales"("status", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "food_details_product_id_key" ON "food_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "furniture_details_product_id_key" ON "furniture_details"("product_id");

-- CreateIndex
CREATE INDEX "gamification_activities_activity_type_idx" ON "gamification_activities"("activity_type");

-- CreateIndex
CREATE INDEX "gamification_activities_user_id_created_at_idx" ON "gamification_activities"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_points_user_id_key" ON "gamification_points"("user_id");

-- CreateIndex
CREATE INDEX "gamification_points_total_points_idx" ON "gamification_points"("total_points");

-- CreateIndex
CREATE INDEX "garage_bookings_garage_id_status_idx" ON "garage_bookings"("garage_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "garage_profiles_user_id_key" ON "garage_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "garage_reviews_garage_id_user_id_key" ON "garage_reviews"("garage_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "grocery_details_product_id_key" ON "grocery_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_buy_participants_group_buy_id_user_id_key" ON "group_buy_participants"("group_buy_id", "user_id");

-- CreateIndex
CREATE INDEX "group_buys_status_expires_at_idx" ON "group_buys"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "hashtag_tag_key" ON "hashtag"("tag");

-- CreateIndex
CREATE INDEX "hashtag_usageCount_idx" ON "hashtag"("usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_key_idx" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_user_id_created_at_idx" ON "idempotency_keys"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "import_quotes_request_id_importer_id_key" ON "import_quotes"("request_id", "importer_id");

-- CreateIndex
CREATE INDEX "import_requests_user_id_status_idx" ON "import_requests"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "importer_profiles_user_id_key" ON "importer_profiles"("user_id");

-- CreateIndex
CREATE INDEX "influencer_portfolio_influencer_id_idx" ON "influencer_portfolio"("influencer_id");

-- CreateIndex
CREATE UNIQUE INDEX "influencer_profiles_user_id_key" ON "influencer_profiles"("user_id");

-- CreateIndex
CREATE INDEX "influencer_profiles_avg_engagement_rate_idx" ON "influencer_profiles"("avg_engagement_rate");

-- CreateIndex
CREATE INDEX "influencer_profiles_tier_is_available_idx" ON "influencer_profiles"("tier", "is_available");

-- CreateIndex
CREATE INDEX "influencer_reviews_influencer_id_idx" ON "influencer_reviews"("influencer_id");

-- CreateIndex
CREATE UNIQUE INDEX "influencer_reviews_campaign_id_influencer_id_key" ON "influencer_reviews"("campaign_id", "influencer_id");

-- CreateIndex
CREATE INDEX "judge_invites_contest_id_idx" ON "judge_invites"("contest_id");

-- CreateIndex
CREATE INDEX "judge_invites_judge_id_idx" ON "judge_invites"("judge_id");

-- CreateIndex
CREATE INDEX "judge_invites_status_idx" ON "judge_invites"("status");

-- CreateIndex
CREATE UNIQUE INDEX "judge_invites_contest_id_judge_id_key" ON "judge_invites"("contest_id", "judge_id");

-- CreateIndex
CREATE INDEX "judge_scores_submission_id_idx" ON "judge_scores"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "judge_scores_judge_id_submission_id_key" ON "judge_scores"("judge_id", "submission_id");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "kyc_documents"("status");

-- CreateIndex
CREATE INDEX "kyc_documents_user_id_idx" ON "kyc_documents"("user_id");

-- CreateIndex
CREATE INDEX "listing_fee_config_is_enabled_is_active_idx" ON "listing_fee_config"("is_enabled", "is_active");

-- CreateIndex
CREATE INDEX "listing_fee_config_scope_priority_idx" ON "listing_fee_config"("scope", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "listing_fee_config_scope_scope_value_category_key" ON "listing_fee_config"("scope", "scope_value", "category");

-- CreateIndex
CREATE INDEX "listing_fee_transaction_product_id_idx" ON "listing_fee_transaction"("product_id");

-- CreateIndex
CREATE INDEX "listing_fee_transaction_user_id_created_at_idx" ON "listing_fee_transaction"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "listing_fee_transaction_was_free_idx" ON "listing_fee_transaction"("was_free");

-- CreateIndex
CREATE INDEX "location_master_country_code_idx" ON "location_master"("country_code");

-- CreateIndex
CREATE INDEX "location_master_parent_id_idx" ON "location_master"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_master_scope_scope_value_key" ON "location_master"("scope", "scope_value");

-- CreateIndex
CREATE UNIQUE INDEX "locked_chat_settings_creator_id_key" ON "locked_chat_settings"("creator_id");

-- CreateIndex
CREATE INDEX "locked_chat_settings_creator_id_idx" ON "locked_chat_settings"("creator_id");

-- CreateIndex
CREATE INDEX "locked_chat_settings_is_locked_idx" ON "locked_chat_settings"("is_locked");

-- CreateIndex
CREATE INDEX "locked_chat_tasks_creator_id_idx" ON "locked_chat_tasks"("creator_id");

-- CreateIndex
CREATE INDEX "locked_chat_tasks_creator_id_status_idx" ON "locked_chat_tasks"("creator_id", "status");

-- CreateIndex
CREATE INDEX "locked_chat_tasks_status_idx" ON "locked_chat_tasks"("status");

-- CreateIndex
CREATE INDEX "locked_chat_tasks_user_id_idx" ON "locked_chat_tasks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "logistics_companies_user_id_key" ON "logistics_companies"("user_id");

-- CreateIndex
CREATE INDEX "messages_chat_id_idx" ON "messages"("chat_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "messages_recipient_id_idx" ON "messages"("recipient_id");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "milestone_completions_milestone_id_key" ON "milestone_completions"("milestone_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ofac_screening_cache_name_normalized_key" ON "ofac_screening_cache"("name_normalized");

-- CreateIndex
CREATE INDEX "ofac_screening_cache_expires_at_idx" ON "ofac_screening_cache"("expires_at");

-- CreateIndex
CREATE INDEX "ofac_screening_cache_is_match_idx" ON "ofac_screening_cache"("is_match");

-- CreateIndex
CREATE INDEX "orders_buyer_id_status_idx" ON "orders"("buyer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "platform_config_key_key" ON "platform_config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "platform_rate_limits_platform_key" ON "platform_rate_limits"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "platform_wallet_label_key" ON "platform_wallet"("label");

-- CreateIndex
CREATE INDEX "post_user_id_created_at_idx" ON "post"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_post_id_user_id_key" ON "post_likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "premium_listings_is_active_end_date_idx" ON "premium_listings"("is_active", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "product_analytics_product_id_date_key" ON "product_analytics"("product_id", "date");

-- CreateIndex
CREATE INDEX "product_discounts_product_id_is_active_idx" ON "product_discounts"("product_id", "is_active");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_rating_idx" ON "product_reviews"("product_id", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_product_id_user_id_key" ON "product_reviews"("product_id", "user_id");

-- CreateIndex
CREATE INDEX "product_tags_content_id_content_type_idx" ON "product_tags"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "products_category_status_idx" ON "products"("category", "status");

-- CreateIndex
CREATE INDEX "products_seller_id_status_idx" ON "products"("seller_id", "status");

-- CreateIndex
CREATE INDEX "products_status_created_at_idx" ON "products"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "prohibited_names_name_key" ON "prohibited_names"("name");

-- CreateIndex
CREATE INDEX "prohibited_names_type_idx" ON "prohibited_names"("type");

-- CreateIndex
CREATE UNIQUE INDEX "real_estate_details_product_id_key" ON "real_estate_details"("product_id");

-- CreateIndex
CREATE INDEX "real_estate_details_property_type_listing_type_idx" ON "real_estate_details"("property_type", "listing_type");

-- CreateIndex
CREATE UNIQUE INDEX "reserved_usernames_username_key" ON "reserved_usernames"("username");

-- CreateIndex
CREATE INDEX "reserved_usernames_reserved_for_idx" ON "reserved_usernames"("reserved_for");

-- CreateIndex
CREATE INDEX "risk_factors_factor_type_idx" ON "risk_factors"("factor_type");

-- CreateIndex
CREATE INDEX "risk_factors_user_id_calculated_at_idx" ON "risk_factors"("user_id", "calculated_at");

-- CreateIndex
CREATE INDEX "risk_factors_user_id_idx" ON "risk_factors"("user_id");

-- CreateIndex
CREATE INDEX "sales_funnel_events_campaign_id_stage_idx" ON "sales_funnel_events"("campaign_id", "stage");

-- CreateIndex
CREATE INDEX "sales_funnel_events_contest_id_stage_idx" ON "sales_funnel_events"("contest_id", "stage");

-- CreateIndex
CREATE INDEX "sales_funnel_events_created_at_idx" ON "sales_funnel_events"("created_at");

-- CreateIndex
CREATE INDEX "sales_funnel_events_user_id_stage_idx" ON "sales_funnel_events"("user_id", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "service_details_product_id_key" ON "service_details"("product_id");

-- CreateIndex
CREATE INDEX "shipping_jobs_status_idx" ON "shipping_jobs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "shoe_details_product_id_key" ON "shoe_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "short_likes_short_id_user_id_key" ON "short_likes"("short_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_shorts_locked" ON "shorts"("is_locked", "user_id") WHERE (is_locked = true);

-- CreateIndex
CREATE INDEX "shorts_user_id_created_at_idx" ON "shorts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "social_media_accounts_influencer_id_is_primary_idx" ON "social_media_accounts"("influencer_id", "is_primary");

-- CreateIndex
CREATE INDEX "social_media_accounts_platform_follower_count_idx" ON "social_media_accounts"("platform", "follower_count");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_accounts_influencer_id_platform_key" ON "social_media_accounts"("influencer_id", "platform");

-- CreateIndex
CREATE INDEX "social_media_sync_logs_account_id_synced_at_idx" ON "social_media_sync_logs"("account_id", "synced_at");

-- CreateIndex
CREATE INDEX "social_media_sync_logs_status_idx" ON "social_media_sync_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "spare_part_details_product_id_key" ON "spare_part_details"("product_id");

-- CreateIndex
CREATE INDEX "spare_part_details_compatible_makes_idx" ON "spare_part_details"("compatible_makes");

-- CreateIndex
CREATE INDEX "spare_part_details_part_type_idx" ON "spare_part_details"("part_type");

-- CreateIndex
CREATE INDEX "sponsored_content_bid_amount_idx" ON "sponsored_content"("bid_amount");

-- CreateIndex
CREATE INDEX "sponsored_content_brand_user_id_status_idx" ON "sponsored_content"("brand_user_id", "status");

-- CreateIndex
CREATE INDEX "sponsored_content_content_type_status_start_date_end_date_idx" ON "sponsored_content"("content_type", "status", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "sponsored_impressions_campaign_id_type_idx" ON "sponsored_impressions"("campaign_id", "type");

-- CreateIndex
CREATE INDEX "sponsored_impressions_user_id_created_at_idx" ON "sponsored_impressions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "sponsored_post_requests_brand_id_idx" ON "sponsored_post_requests"("brand_id");

-- CreateIndex
CREATE INDEX "sponsored_post_requests_creator_id_idx" ON "sponsored_post_requests"("creator_id");

-- CreateIndex
CREATE INDEX "sponsored_post_requests_status_idx" ON "sponsored_post_requests"("status");

-- CreateIndex
CREATE INDEX "stories_expires_at_idx" ON "stories"("expires_at");

-- CreateIndex
CREATE INDEX "stories_user_id_created_at_idx" ON "stories"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "story_creator_id_created_at_idx" ON "story"("creator_id", "created_at");

-- CreateIndex
CREATE INDEX "story_expires_at_idx" ON "story"("expires_at");

-- CreateIndex
CREATE INDEX "story_view_storyId_idx" ON "story_view"("storyId");

-- CreateIndex
CREATE INDEX "story_view_viewerId_idx" ON "story_view"("viewerId");

-- CreateIndex
CREATE UNIQUE INDEX "story_view_storyId_viewerId_key" ON "story_view"("storyId", "viewerId");

-- CreateIndex
CREATE INDEX "story_viewer_preference_ownerId_idx" ON "story_viewer_preference"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "story_viewer_preference_ownerId_preferredViewerId_key" ON "story_viewer_preference"("ownerId", "preferredViewerId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_tier_creator_id_tier_key" ON "subscription_tier"("creator_id", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_subscriber_id_creator_id_key" ON "subscriptions"("subscriber_id", "creator_id");

-- CreateIndex
CREATE INDEX "suspicious_activities_resolved_idx" ON "suspicious_activities"("resolved");

-- CreateIndex
CREATE INDEX "suspicious_activities_severity_idx" ON "suspicious_activities"("severity");

-- CreateIndex
CREATE INDEX "suspicious_activities_user_id_idx" ON "suspicious_activities"("user_id");

-- CreateIndex
CREATE INDEX "suspicious_activity_logs_resolved_idx" ON "suspicious_activity_logs"("resolved");

-- CreateIndex
CREATE INDEX "suspicious_activity_logs_severity_idx" ON "suspicious_activity_logs"("severity");

-- CreateIndex
CREATE INDEX "suspicious_activity_logs_user_id_idx" ON "suspicious_activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_sar_activity_type" ON "suspicious_activity_reports"("activity_type");

-- CreateIndex
CREATE INDEX "idx_sar_created_at" ON "suspicious_activity_reports"("created_at");

-- CreateIndex
CREATE INDEX "idx_sar_filed_at" ON "suspicious_activity_reports"("filed_at");

-- CreateIndex
CREATE INDEX "idx_sar_severity" ON "suspicious_activity_reports"("severity");

-- CreateIndex
CREATE INDEX "idx_sar_status" ON "suspicious_activity_reports"("status");

-- CreateIndex
CREATE INDEX "suspicious_activity_reports_activity_type_idx" ON "suspicious_activity_reports"("activity_type");

-- CreateIndex
CREATE INDEX "suspicious_activity_reports_created_at_idx" ON "suspicious_activity_reports"("created_at");

-- CreateIndex
CREATE INDEX "suspicious_activity_reports_filed_at_idx" ON "suspicious_activity_reports"("filed_at");

-- CreateIndex
CREATE INDEX "suspicious_activity_reports_severity_idx" ON "suspicious_activity_reports"("severity");

-- CreateIndex
CREATE INDEX "suspicious_activity_reports_status_idx" ON "suspicious_activity_reports"("status");

-- CreateIndex
CREATE INDEX "suspicious_activity_reports_user_id_idx" ON "suspicious_activity_reports"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_name_key" ON "team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "team_chats_team_id_key" ON "team_chats"("team_id");

-- CreateIndex
CREATE INDEX "team_contest_registrations_contest_id_idx" ON "team_contest_registrations"("contest_id");

-- CreateIndex
CREATE INDEX "team_contest_registrations_team_id_idx" ON "team_contest_registrations"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_contest_registrations_contest_id_team_id_key" ON "team_contest_registrations"("contest_id", "team_id");

-- CreateIndex
CREATE INDEX "team_invitations_invitee_id_status_idx" ON "team_invitations"("invitee_id", "status");

-- CreateIndex
CREATE INDEX "team_invitations_team_id_status_idx" ON "team_invitations"("team_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "team_invitations_team_id_invitee_id_status_key" ON "team_invitations"("team_id", "invitee_id", "status");

-- CreateIndex
CREATE INDEX "team_members_team_id_idx" ON "team_members"("team_id");

-- CreateIndex
CREATE INDEX "team_members_user_id_idx" ON "team_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_team_id_user_id_key" ON "team_members"("team_id", "user_id");

-- CreateIndex
CREATE INDEX "team_submission_votes_submission_id_idx" ON "team_submission_votes"("submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_submission_votes_submission_id_voter_id_key" ON "team_submission_votes"("submission_id", "voter_id");

-- CreateIndex
CREATE INDEX "team_submissions_contest_id_votes_count_idx" ON "team_submissions"("contest_id", "votes_count");

-- CreateIndex
CREATE UNIQUE INDEX "team_submissions_contest_id_team_id_key" ON "team_submissions"("contest_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_contexts_transaction_id_key" ON "transaction_contexts"("transaction_id");

-- CreateIndex
CREATE INDEX "transaction_contexts_context_type_idx" ON "transaction_contexts"("context_type");

-- CreateIndex
CREATE INDEX "transaction_contexts_reference_id_idx" ON "transaction_contexts"("reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_nonces_nonce_key" ON "transaction_nonces"("nonce");

-- CreateIndex
CREATE INDEX "transaction_nonces_expires_at_idx" ON "transaction_nonces"("expires_at");

-- CreateIndex
CREATE INDEX "transaction_nonces_user_id_idx" ON "transaction_nonces"("user_id");

-- CreateIndex
CREATE INDEX "transactions_context_type_idx" ON "transactions"("context_type");

-- CreateIndex
CREATE INDEX "transactions_is_flagged_idx" ON "transactions"("is_flagged");

-- CreateIndex
CREATE INDEX "transactions_transaction_type_idx" ON "transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "transactions_user_id_created_at_idx" ON "transactions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "trending_topics_topic_key" ON "trending_topics"("topic");

-- CreateIndex
CREATE INDEX "trending_topics_is_active_trend_score_idx" ON "trending_topics"("is_active", "trend_score");

-- CreateIndex
CREATE INDEX "trending_topics_trend_score_idx" ON "trending_topics"("trend_score");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_google_id_key" ON "user"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_apple_id_key" ON "user"("apple_id");

-- CreateIndex
CREATE INDEX "user_fcmToken_idx" ON "user"("fcmToken");

-- CreateIndex
CREATE INDEX "user_content_delivery_content_id_content_type_idx" ON "user_content_delivery"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "user_content_delivery_user_id_content_id_content_type_idx" ON "user_content_delivery"("user_id", "content_id", "content_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_content_delivery_user_id_content_id_content_type_key" ON "user_content_delivery"("user_id", "content_id", "content_type");

-- CreateIndex
CREATE INDEX "user_interaction_signals_content_id_content_type_idx" ON "user_interaction_signals"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "user_interaction_signals_user_id_content_id_idx" ON "user_interaction_signals"("user_id", "content_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_listing_quota_user_id_key" ON "user_listing_quota"("user_id");

-- CreateIndex
CREATE INDEX "user_listing_quota_user_id_idx" ON "user_listing_quota"("user_id");

-- CreateIndex
CREATE INDEX "user_micro_interests_user_id_idx" ON "user_micro_interests"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_micro_interests_user_id_category_key" ON "user_micro_interests"("user_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "user_micro_interests_user_id_interest_key" ON "user_micro_interests"("user_id", "interest");

-- CreateIndex
CREATE UNIQUE INDEX "user_risk_profiles_user_id_key" ON "user_risk_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_risk_profiles_last_calculated_at_idx" ON "user_risk_profiles"("last_calculated_at");

-- CreateIndex
CREATE INDEX "user_risk_profiles_risk_level_idx" ON "user_risk_profiles"("risk_level");

-- CreateIndex
CREATE INDEX "user_risk_profiles_risk_score_idx" ON "user_risk_profiles"("risk_score");

-- CreateIndex
CREATE INDEX "user_risk_profiles_user_id_idx" ON "user_risk_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_session_secrets_expires_at_idx" ON "user_session_secrets"("expires_at");

-- CreateIndex
CREATE INDEX "user_session_secrets_user_id_is_active_idx" ON "user_session_secrets"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_suspensions_expires_at_idx" ON "user_suspensions"("expires_at");

-- CreateIndex
CREATE INDEX "user_suspensions_user_id_idx" ON "user_suspensions"("user_id");

-- CreateIndex
CREATE INDEX "user_bookmarks_user_id_idx" ON "user_bookmarks"("user_id");

-- CreateIndex
CREATE INDEX "user_bookmarks_content_id_content_type_idx" ON "user_bookmarks"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "user_bookmarks_created_at_idx" ON "user_bookmarks"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_bookmarks_user_id_content_id_content_type_key" ON "user_bookmarks"("user_id", "content_id", "content_type");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_details_product_id_key" ON "vehicle_details"("product_id");

-- CreateIndex
CREATE INDEX "vehicle_details_body_type_idx" ON "vehicle_details"("body_type");

-- CreateIndex
CREATE INDEX "vehicle_details_make_model_idx" ON "vehicle_details"("make", "model");

-- CreateIndex
CREATE INDEX "vehicle_details_year_idx" ON "vehicle_details"("year");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_favorites_user_id_product_id_key" ON "vehicle_favorites"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_product_id_key" ON "wishlist_items"("wishlist_id", "product_id");

-- CreateIndex
CREATE INDEX "wishlists_user_id_idx" ON "wishlists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_limits_user_id_key" ON "withdrawal_limits"("user_id");

-- CreateIndex
CREATE INDEX "withdrawal_limits_user_id_idx" ON "withdrawal_limits"("user_id");

-- CreateIndex
CREATE INDEX "withdrawal_requests_risk_score_idx" ON "withdrawal_requests"("risk_score");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_created_at_idx" ON "withdrawal_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "withdrawal_requests_user_id_status_idx" ON "withdrawal_requests"("user_id", "status");

-- AddForeignKey
ALTER TABLE "ad_campaign_locations" ADD CONSTRAINT "ad_campaign_locations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "display_ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profile" ADD CONSTRAINT "admin_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admires" ADD CONSTRAINT "admires_admired_id_fkey" FOREIGN KEY ("admired_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admires" ADD CONSTRAINT "admires_admirer_id_fkey" FOREIGN KEY ("admirer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bio_links" ADD CONSTRAINT "bio_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_details" ADD CONSTRAINT "book_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_campaigns" ADD CONSTRAINT "brand_campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_campaigns" ADD CONSTRAINT "brand_campaigns_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_analytics" ADD CONSTRAINT "campaign_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "brand_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "brand_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_deliverables" ADD CONSTRAINT "campaign_deliverables_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "brand_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_deliverables" ADD CONSTRAINT "campaign_deliverables_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama" ADD CONSTRAINT "chama_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_contribution" ADD CONSTRAINT "chama_contribution_chama_id_fkey" FOREIGN KEY ("chama_id") REFERENCES "chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_contribution" ADD CONSTRAINT "chama_contribution_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "chama_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_contribution" ADD CONSTRAINT "chama_contribution_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_cycle" ADD CONSTRAINT "chama_cycle_chama_id_fkey" FOREIGN KEY ("chama_id") REFERENCES "chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_defaulter" ADD CONSTRAINT "chama_defaulter_chama_id_fkey" FOREIGN KEY ("chama_id") REFERENCES "chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_defaulter" ADD CONSTRAINT "chama_defaulter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_election" ADD CONSTRAINT "chama_election_chama_id_fkey" FOREIGN KEY ("chama_id") REFERENCES "chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_member" ADD CONSTRAINT "chama_member_chama_id_fkey" FOREIGN KEY ("chama_id") REFERENCES "chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_member" ADD CONSTRAINT "chama_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_nomination" ADD CONSTRAINT "chama_nomination_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "chama_election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_nomination" ADD CONSTRAINT "chama_nomination_nominator_id_fkey" FOREIGN KEY ("nominator_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_nomination" ADD CONSTRAINT "chama_nomination_nominee_id_fkey" FOREIGN KEY ("nominee_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_payout" ADD CONSTRAINT "chama_payout_chama_id_fkey" FOREIGN KEY ("chama_id") REFERENCES "chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_payout" ADD CONSTRAINT "chama_payout_cycle_id_fkey" FOREIGN KEY ("cycle_id") REFERENCES "chama_cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_payout" ADD CONSTRAINT "chama_payout_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "chama_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_payout" ADD CONSTRAINT "chama_payout_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_payout_approval" ADD CONSTRAINT "chama_payout_approval_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_payout_approval" ADD CONSTRAINT "chama_payout_approval_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "chama_payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_secondment" ADD CONSTRAINT "chama_secondment_nomination_id_fkey" FOREIGN KEY ("nomination_id") REFERENCES "chama_nomination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_secondment" ADD CONSTRAINT "chama_secondment_seconder_id_fkey" FOREIGN KEY ("seconder_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_transaction" ADD CONSTRAINT "chama_transaction_chama_id_fkey" FOREIGN KEY ("chama_id") REFERENCES "chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_transaction" ADD CONSTRAINT "chama_transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_vote" ADD CONSTRAINT "chama_vote_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "chama_election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_vote" ADD CONSTRAINT "chama_vote_nomination_id_fkey" FOREIGN KEY ("nomination_id") REFERENCES "chama_nomination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_vote" ADD CONSTRAINT "chama_vote_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_wallet" ADD CONSTRAINT "chama_wallet_chama_id_fkey" FOREIGN KEY ("chama_id") REFERENCES "chama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participant" ADD CONSTRAINT "chat_participant_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participant" ADD CONSTRAINT "chat_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_reply_to_user_id_fkey" FOREIGN KEY ("reply_to_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_hashtag" ADD CONSTRAINT "content_hashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_mention" ADD CONSTRAINT "content_mention_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_unlocks" ADD CONSTRAINT "content_unlocks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_unlocks" ADD CONSTRAINT "content_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest" ADD CONSTRAINT "contest_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_action" ADD CONSTRAINT "contest_action_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_action_completions" ADD CONSTRAINT "contest_action_completions_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "contest_action"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_action_completions" ADD CONSTRAINT "contest_action_completions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "contest_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_analytics" ADD CONSTRAINT "contest_analytics_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_engagement_actions" ADD CONSTRAINT "contest_engagement_actions_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_engagement_actions" ADD CONSTRAINT "contest_engagement_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_participants" ADD CONSTRAINT "contest_participants_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_participants" ADD CONSTRAINT "contest_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_prize_distributions" ADD CONSTRAINT "contest_prize_distributions_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_purchase_entries" ADD CONSTRAINT "contest_purchase_entries_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_purchase_entries" ADD CONSTRAINT "contest_purchase_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_sponsorships" ADD CONSTRAINT "contest_sponsorships_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_sponsorships" ADD CONSTRAINT "contest_sponsorships_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_submission" ADD CONSTRAINT "contest_submission_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_submission" ADD CONSTRAINT "contest_submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_votes" ADD CONSTRAINT "contest_votes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "contest_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_votes" ADD CONSTRAINT "contest_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_winners" ADD CONSTRAINT "contest_winners_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_winners" ADD CONSTRAINT "contest_winners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_campaign_recipients" ADD CONSTRAINT "conversion_campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "conversion_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_campaign_recipients" ADD CONSTRAINT "conversion_campaign_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_campaigns" ADD CONSTRAINT "conversion_campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_campaigns" ADD CONSTRAINT "conversion_campaigns_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_alerts" ADD CONSTRAINT "deal_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_alerts" ADD CONSTRAINT "deal_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_product_details" ADD CONSTRAINT "digital_product_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "display_ad_analytics" ADD CONSTRAINT "display_ad_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "display_ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electronics_details" ADD CONSTRAINT "electronics_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fashion_details" ADD CONSTRAINT "fashion_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_products" ADD CONSTRAINT "flash_sale_products_flash_sale_id_fkey" FOREIGN KEY ("flash_sale_id") REFERENCES "flash_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_products" ADD CONSTRAINT "flash_sale_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_details" ADD CONSTRAINT "food_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "furniture_details" ADD CONSTRAINT "furniture_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_activities" ADD CONSTRAINT "gamification_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_points" ADD CONSTRAINT "gamification_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_bookings" ADD CONSTRAINT "garage_bookings_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garage_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_bookings" ADD CONSTRAINT "garage_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_profiles" ADD CONSTRAINT "garage_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_reviews" ADD CONSTRAINT "garage_reviews_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garage_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_reviews" ADD CONSTRAINT "garage_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grocery_details" ADD CONSTRAINT "grocery_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_buy_participants" ADD CONSTRAINT "group_buy_participants_group_buy_id_fkey" FOREIGN KEY ("group_buy_id") REFERENCES "group_buys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_buy_participants" ADD CONSTRAINT "group_buy_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_buys" ADD CONSTRAINT "group_buys_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_quotes" ADD CONSTRAINT "import_quotes_importer_id_fkey" FOREIGN KEY ("importer_id") REFERENCES "importer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_quotes" ADD CONSTRAINT "import_quotes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "import_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_requests" ADD CONSTRAINT "import_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importer_profiles" ADD CONSTRAINT "importer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_portfolio" ADD CONSTRAINT "influencer_portfolio_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_profiles" ADD CONSTRAINT "influencer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_reviews" ADD CONSTRAINT "influencer_reviews_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_invites" ADD CONSTRAINT "judge_invites_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_invites" ADD CONSTRAINT "judge_invites_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "contest_judges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_scores" ADD CONSTRAINT "judge_scores_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "contest_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_companies" ADD CONSTRAINT "logistics_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_forwarded_from_id_fkey" FOREIGN KEY ("forwarded_from_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_completions" ADD CONSTRAINT "milestone_completions_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_completions" ADD CONSTRAINT "milestone_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_listings" ADD CONSTRAINT "premium_listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_analytics" ADD CONSTRAINT "product_analytics_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_discounts" ADD CONSTRAINT "product_discounts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_shares" ADD CONSTRAINT "product_shares_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_shares" ADD CONSTRAINT "product_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_details" ADD CONSTRAINT "real_estate_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_funnel_events" ADD CONSTRAINT "sales_funnel_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "brand_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_funnel_events" ADD CONSTRAINT "sales_funnel_events_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_funnel_events" ADD CONSTRAINT "sales_funnel_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_details" ADD CONSTRAINT "service_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_jobs" ADD CONSTRAINT "shipping_jobs_logistics_id_fkey" FOREIGN KEY ("logistics_id") REFERENCES "logistics_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_jobs" ADD CONSTRAINT "shipping_jobs_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoe_details" ADD CONSTRAINT "shoe_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_collection" ADD CONSTRAINT "short_collection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_comments" ADD CONSTRAINT "short_comments_short_id_fkey" FOREIGN KEY ("short_id") REFERENCES "shorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_comments" ADD CONSTRAINT "short_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_likes" ADD CONSTRAINT "short_likes_short_id_fkey" FOREIGN KEY ("short_id") REFERENCES "shorts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_likes" ADD CONSTRAINT "short_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shorts" ADD CONSTRAINT "shorts_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "short_collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shorts" ADD CONSTRAINT "shorts_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shorts" ADD CONSTRAINT "shorts_linked_product_id_fkey" FOREIGN KEY ("linked_product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shorts" ADD CONSTRAINT "shorts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_accounts" ADD CONSTRAINT "social_media_accounts_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_part_details" ADD CONSTRAINT "spare_part_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_content" ADD CONSTRAINT "sponsored_content_brand_user_id_fkey" FOREIGN KEY ("brand_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_impressions" ADD CONSTRAINT "sponsored_impressions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "sponsored_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_impressions" ADD CONSTRAINT "sponsored_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_post_requests" ADD CONSTRAINT "sponsored_post_requests_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_post_requests" ADD CONSTRAINT "sponsored_post_requests_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_view" ADD CONSTRAINT "story_view_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_viewer_preference" ADD CONSTRAINT "story_viewer_preference_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_tier" ADD CONSTRAINT "subscription_tier_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "subscription_tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_chats" ADD CONSTRAINT "team_chats_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_contest_registrations" ADD CONSTRAINT "team_contest_registrations_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_contest_registrations" ADD CONSTRAINT "team_contest_registrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_submission_votes" ADD CONSTRAINT "team_submission_votes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "team_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_submission_votes" ADD CONSTRAINT "team_submission_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_micro_interests" ADD CONSTRAINT "user_micro_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_suspensions" ADD CONSTRAINT "user_suspensions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_favorites" ADD CONSTRAINT "vehicle_favorites_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_favorites" ADD CONSTRAINT "vehicle_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
