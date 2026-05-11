/*
  Warnings:

  - The `category` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `contest_actions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contest_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `live_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `live_streams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `short_collections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription_tiers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InfluencerTier" AS ENUM ('NANO', 'MICRO', 'MID', 'MACRO', 'MEGA');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('SPONSORED_POST', 'PRODUCT_REVIEW', 'BRAND_AMBASSADOR', 'CONTEST_PROMOTION', 'AFFILIATE', 'EVENT_COVERAGE', 'CONTENT_CREATION');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED');

-- CreateEnum
CREATE TYPE "SponsorshipType" AS ENUM ('CONTEST_PRIZE', 'CONTEST_BRANDING', 'CONTEST_EXCLUSIVE', 'CONTENT_SPONSORSHIP');

-- CreateEnum
CREATE TYPE "ConversionCampaignType" AS ENUM ('POST_CONTEST_DISCOUNT', 'WINNER_ADVOCACY', 'PARTICIPANT_RETARGETING', 'ENGAGEMENT_REWARD');

-- CreateEnum
CREATE TYPE "FunnelStage" AS ENUM ('AWARENESS', 'INTEREST', 'CONSIDERATION', 'CONVERSION', 'RETENTION', 'ADVOCACY');

-- CreateEnum
CREATE TYPE "TargetingScope" AS ENUM ('GLOBAL', 'CONTINENT', 'COUNTRY', 'REGION', 'CITY', 'TOWN', 'ROAD', 'LANDMARK', 'SHOPPING_CENTER');

-- CreateEnum
CREATE TYPE "PlacementType" AS ENUM ('LIVE_STREAMS', 'CONTESTS', 'DISCOVER_SHORTS', 'ADMIRING_SHORTS', 'DRIPS_FEED', 'STORIES', 'GROUP_CHATS', 'CHAMA_CHATS');

-- CreateEnum
CREATE TYPE "ChatNiche" AS ENUM ('DOCTORS', 'REAL_ESTATE_INVESTMENT', 'FINANCE', 'TECH', 'FASHION', 'AUTOMOTIVE', 'FOOD_BEVERAGE', 'HEALTH_FITNESS', 'EDUCATION', 'ENTERTAINMENT', 'GENERAL');

-- CreateEnum
CREATE TYPE "BudgetType" AS ENUM ('DAILY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "BiddingStrategy" AS ENUM ('LOWEST_COST', 'TARGET_CPM', 'COST_CAP');

-- CreateEnum
CREATE TYPE "AdCampaignStatus" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'PAUSED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SponsoredContentType" AS ENUM ('SHORT', 'POST', 'STORY');

-- CreateEnum
CREATE TYPE "SponsoredContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('CPM', 'CPV', 'CPE', 'CPC', 'FLAT_FEE');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('TIKTOK', 'YOUTUBE', 'INSTAGRAM', 'FACEBOOK', 'TWITTER', 'TWITCH', 'LINKEDIN', 'SNAPCHAT');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('VEHICLES', 'SPARE_PARTS', 'REAL_ESTATE', 'FASHION', 'SHOES', 'ELECTRONICS', 'FOOD_FMCG', 'BOOKS', 'DIGITAL_PRODUCTS', 'SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'USED', 'REFURBISHED', 'FOR_PARTS');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('WHATSAPP', 'WEBSITE', 'PHONE', 'IN_APP_CHAT');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'DCT');

-- CreateEnum
CREATE TYPE "VehicleBodyType" AS ENUM ('SEDAN', 'COUPE', 'HATCHBACK', 'SUV', 'PICKUP', 'VAN', 'CONVERTIBLE', 'WAGON', 'MINIVAN', 'BUS', 'TRUCK', 'TRAILER', 'MOTORCYCLE');

-- CreateEnum
CREATE TYPE "FlashSaleType" AS ENUM ('FLASH', 'LIGHTNING', 'DAILY_FEATURED', 'CLEARANCE');

-- CreateEnum
CREATE TYPE "FlashSaleStatus" AS ENUM ('SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportRequestStatus" AS ENUM ('PENDING', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GroupBuyStatus" AS ENUM ('OPEN', 'THRESHOLD_MET', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PremiumType" AS ENUM ('FEATURED', 'PROMOTED', 'TOP_SPOT');

-- DropForeignKey
ALTER TABLE "admires" DROP CONSTRAINT "admires_admired_id_fkey";

-- DropForeignKey
ALTER TABLE "admires" DROP CONSTRAINT "admires_admirer_id_fkey";

-- DropForeignKey
ALTER TABLE "bio_links" DROP CONSTRAINT "bio_links_user_id_fkey";

-- DropForeignKey
ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "comment_reports" DROP CONSTRAINT "comment_reports_reporter_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_reply_to_user_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_action_completions" DROP CONSTRAINT "contest_action_completions_action_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_action_completions" DROP CONSTRAINT "contest_action_completions_submission_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_actions" DROP CONSTRAINT "contest_actions_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_judges" DROP CONSTRAINT "contest_judges_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_judges" DROP CONSTRAINT "contest_judges_user_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_participants" DROP CONSTRAINT "contest_participants_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_participants" DROP CONSTRAINT "contest_participants_user_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_prize_distributions" DROP CONSTRAINT "contest_prize_distributions_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_submissions" DROP CONSTRAINT "contest_submissions_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_submissions" DROP CONSTRAINT "contest_submissions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_votes" DROP CONSTRAINT "contest_votes_submission_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_votes" DROP CONSTRAINT "contest_votes_voter_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_winners" DROP CONSTRAINT "contest_winners_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "contest_winners" DROP CONSTRAINT "contest_winners_user_id_fkey";

-- DropForeignKey
ALTER TABLE "contests" DROP CONSTRAINT "contests_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "daily_stats" DROP CONSTRAINT "daily_stats_user_id_fkey";

-- DropForeignKey
ALTER TABLE "escrows" DROP CONSTRAINT "escrows_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "escrows" DROP CONSTRAINT "escrows_user_id_fkey";

-- DropForeignKey
ALTER TABLE "judge_invites" DROP CONSTRAINT "judge_invites_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "judge_invites" DROP CONSTRAINT "judge_invites_judge_id_fkey";

-- DropForeignKey
ALTER TABLE "live_banned_viewers" DROP CONSTRAINT "live_banned_viewers_stream_id_fkey";

-- DropForeignKey
ALTER TABLE "live_battles" DROP CONSTRAINT "live_battles_opponent_stream_id_fkey";

-- DropForeignKey
ALTER TABLE "live_battles" DROP CONSTRAINT "live_battles_stream_id_fkey";

-- DropForeignKey
ALTER TABLE "live_co_hosts" DROP CONSTRAINT "live_co_hosts_stream_id_fkey";

-- DropForeignKey
ALTER TABLE "live_messages" DROP CONSTRAINT "live_messages_stream_id_fkey";

-- DropForeignKey
ALTER TABLE "live_pinned_products" DROP CONSTRAINT "live_pinned_products_stream_id_fkey";

-- DropForeignKey
ALTER TABLE "live_session_products" DROP CONSTRAINT "live_session_products_session_id_fkey";

-- DropForeignKey
ALTER TABLE "live_sessions" DROP CONSTRAINT "live_sessions_host_id_fkey";

-- DropForeignKey
ALTER TABLE "live_streams" DROP CONSTRAINT "live_streams_host_id_fkey";

-- DropForeignKey
ALTER TABLE "live_tips" DROP CONSTRAINT "live_tips_stream_id_fkey";

-- DropForeignKey
ALTER TABLE "live_viewers" DROP CONSTRAINT "live_viewers_stream_id_fkey";

-- DropForeignKey
ALTER TABLE "milestone_completions" DROP CONSTRAINT "milestone_completions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "milestones" DROP CONSTRAINT "milestones_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "post_comments" DROP CONSTRAINT "post_comments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "post_comments" DROP CONSTRAINT "post_comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "post_likes" DROP CONSTRAINT "post_likes_post_id_fkey";

-- DropForeignKey
ALTER TABLE "post_likes" DROP CONSTRAINT "post_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "short_collections" DROP CONSTRAINT "short_collections_user_id_fkey";

-- DropForeignKey
ALTER TABLE "short_comments" DROP CONSTRAINT "short_comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "short_likes" DROP CONSTRAINT "short_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "shorts" DROP CONSTRAINT "shorts_collection_id_fkey";

-- DropForeignKey
ALTER TABLE "shorts" DROP CONSTRAINT "shorts_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "shorts" DROP CONSTRAINT "shorts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "subscription_tiers" DROP CONSTRAINT "subscription_tiers_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_creator_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_subscriber_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_tier_id_fkey";

-- DropForeignKey
ALTER TABLE "team_chats" DROP CONSTRAINT "team_chats_team_id_fkey";

-- DropForeignKey
ALTER TABLE "team_contest_registrations" DROP CONSTRAINT "team_contest_registrations_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "team_contest_registrations" DROP CONSTRAINT "team_contest_registrations_team_id_fkey";

-- DropForeignKey
ALTER TABLE "team_invitations" DROP CONSTRAINT "team_invitations_invitee_id_fkey";

-- DropForeignKey
ALTER TABLE "team_invitations" DROP CONSTRAINT "team_invitations_inviter_id_fkey";

-- DropForeignKey
ALTER TABLE "team_invitations" DROP CONSTRAINT "team_invitations_team_id_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_team_id_fkey";

-- DropForeignKey
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "team_submission_votes" DROP CONSTRAINT "team_submission_votes_voter_id_fkey";

-- DropForeignKey
ALTER TABLE "team_submissions" DROP CONSTRAINT "team_submissions_contest_id_fkey";

-- DropForeignKey
ALTER TABLE "team_submissions" DROP CONSTRAINT "team_submissions_team_id_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_leader_id_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_user_id_fkey";

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bargain_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bargain_min_price" DECIMAL(18,4),
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "condition" "ProductCondition" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "contactMethod" "ContactMethod" NOT NULL DEFAULT 'WHATSAPP',
ADD COLUMN     "currency" VARCHAR(3),
ADD COLUMN     "featured_until" TIMESTAMP(3),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_promoted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_top_spot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "local_price" DECIMAL(18,4),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "promoted_until" TIMESTAMP(3),
ADD COLUMN     "purchase_url" TEXT,
ADD COLUMN     "review_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sales_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "subcategory" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "top_spot_until" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "wholesale_min_qty" INTEGER,
ADD COLUMN     "wholesale_price" DECIMAL(18,4),
DROP COLUMN "category",
ADD COLUMN     "category" "ProductCategory" NOT NULL DEFAULT 'OTHER',
ALTER COLUMN "whatsapp_number" DROP NOT NULL;

-- DropTable
DROP TABLE "contest_actions";

-- DropTable
DROP TABLE "contest_submissions";

-- DropTable
DROP TABLE "contests";

-- DropTable
DROP TABLE "live_sessions";

-- DropTable
DROP TABLE "live_streams";

-- DropTable
DROP TABLE "posts";

-- DropTable
DROP TABLE "short_collections";

-- DropTable
DROP TABLE "subscription_tiers";

-- DropTable
DROP TABLE "teams";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "ContestAction" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "action_type" "RequirementType" NOT NULL,
    "target_url" TEXT,
    "label" TEXT NOT NULL,
    "is_verifiable" BOOLEAN NOT NULL DEFAULT false,
    "requires_upload" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContestAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestSubmission" (
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

    CONSTRAINT "ContestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contest" (
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

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveSession" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_start" TIMESTAMP(3) NOT NULL,
    "actual_start" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "viewer_count" INTEGER NOT NULL DEFAULT 0,
    "peak_viewers" INTEGER NOT NULL DEFAULT 0,
    "total_sales_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveStream" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) DEFAULT 'Chat',
    "thumbnail_url" TEXT,
    "type" "LiveStreamType" NOT NULL DEFAULT 'NORMAL',
    "status" "LiveStreamStatus" NOT NULL DEFAULT 'SCHEDULED',
    "stream_key" TEXT NOT NULL,
    "stream_url" TEXT,
    "playback_url" TEXT,
    "viewer_count" INTEGER NOT NULL DEFAULT 0,
    "peak_viewers" INTEGER NOT NULL DEFAULT 0,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "total_tips_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_sales_kr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "gift_goal_title" TEXT,
    "gift_goal_target" DECIMAL(18,4),
    "gift_goal_current" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unlock_amount_kr" DECIMAL(18,4),
    "chama_id" TEXT,
    "contest_id" TEXT,
    "order_id" TEXT,
    "is_co_host_enabled" BOOLEAN NOT NULL DEFAULT false,
    "max_co_hosts" INTEGER NOT NULL DEFAULT 1,
    "scheduled_start" TIMESTAMP(3),
    "actual_start" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveStream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "caption" TEXT,
    "image_urls" TEXT[],
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "required_tier" "SubscriptionTierType",
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "group_buy_participants" (
    "id" TEXT NOT NULL,
    "group_buy_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_buy_participants_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ad_platform_settings" (
    "id" TEXT NOT NULL,
    "scope" "TargetingScope" NOT NULL,
    "scope_value" TEXT,
    "min_daily_budget_kes" DECIMAL(18,4) NOT NULL,
    "min_lifetime_budget_kes" DECIMAL(18,4) NOT NULL,
    "live_stream_min_cpm" DECIMAL(10,2) NOT NULL,
    "live_stream_max_cpm" DECIMAL(10,2) NOT NULL,
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

    CONSTRAINT "display_ad_campaigns_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "display_ad_analytics" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "live_stream_impressions" INTEGER NOT NULL DEFAULT 0,
    "live_stream_clicks" INTEGER NOT NULL DEFAULT 0,
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

    CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "ShortCollection" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cover_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionTier" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "tier" "SubscriptionTierType" NOT NULL,
    "kr_amount" DECIMAL(18,4) NOT NULL,
    "benefits" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "avatar_url" TEXT,
    "leader_id" TEXT NOT NULL,
    "max_members" INTEGER NOT NULL DEFAULT 5,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "total_prizes" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
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

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "ContestSubmission_contest_id_user_id_key" ON "ContestSubmission"("contest_id", "user_id");

-- CreateIndex
CREATE INDEX "Contest_status_deadline_idx" ON "Contest"("status", "deadline");

-- CreateIndex
CREATE INDEX "LiveSession_host_id_status_idx" ON "LiveSession"("host_id", "status");

-- CreateIndex
CREATE INDEX "LiveSession_status_scheduled_start_idx" ON "LiveSession"("status", "scheduled_start");

-- CreateIndex
CREATE UNIQUE INDEX "LiveStream_stream_key_key" ON "LiveStream"("stream_key");

-- CreateIndex
CREATE INDEX "LiveStream_category_status_idx" ON "LiveStream"("category", "status");

-- CreateIndex
CREATE INDEX "LiveStream_host_id_status_idx" ON "LiveStream"("host_id", "status");

-- CreateIndex
CREATE INDEX "LiveStream_status_created_at_idx" ON "LiveStream"("status", "created_at");

-- CreateIndex
CREATE INDEX "live_streams_status_viewers_idx" ON "LiveStream"("status", "viewer_count");

-- CreateIndex
CREATE INDEX "Post_user_id_created_at_idx" ON "Post"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_details_product_id_key" ON "vehicle_details"("product_id");

-- CreateIndex
CREATE INDEX "vehicle_details_make_model_idx" ON "vehicle_details"("make", "model");

-- CreateIndex
CREATE INDEX "vehicle_details_body_type_idx" ON "vehicle_details"("body_type");

-- CreateIndex
CREATE INDEX "vehicle_details_year_idx" ON "vehicle_details"("year");

-- CreateIndex
CREATE UNIQUE INDEX "spare_part_details_product_id_key" ON "spare_part_details"("product_id");

-- CreateIndex
CREATE INDEX "spare_part_details_part_type_idx" ON "spare_part_details"("part_type");

-- CreateIndex
CREATE INDEX "spare_part_details_compatible_makes_idx" ON "spare_part_details"("compatible_makes");

-- CreateIndex
CREATE UNIQUE INDEX "real_estate_details_product_id_key" ON "real_estate_details"("product_id");

-- CreateIndex
CREATE INDEX "real_estate_details_property_type_listing_type_idx" ON "real_estate_details"("property_type", "listing_type");

-- CreateIndex
CREATE UNIQUE INDEX "fashion_details_product_id_key" ON "fashion_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "shoe_details_product_id_key" ON "shoe_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "electronics_details_product_id_key" ON "electronics_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "food_details_product_id_key" ON "food_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_details_product_id_key" ON "book_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "digital_product_details_product_id_key" ON "digital_product_details"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_details_product_id_key" ON "service_details"("product_id");

-- CreateIndex
CREATE INDEX "product_discounts_product_id_is_active_idx" ON "product_discounts"("product_id", "is_active");

-- CreateIndex
CREATE INDEX "flash_sales_status_start_time_idx" ON "flash_sales"("status", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "flash_sale_products_flash_sale_id_product_id_key" ON "flash_sale_products"("flash_sale_id", "product_id");

-- CreateIndex
CREATE INDEX "group_buys_status_expires_at_idx" ON "group_buys"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "group_buy_participants_group_buy_id_user_id_key" ON "group_buy_participants"("group_buy_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_user_id_product_id_key" ON "cart_items"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "orders_buyer_id_status_idx" ON "orders"("buyer_id", "status");

-- CreateIndex
CREATE INDEX "wishlists_user_id_idx" ON "wishlists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_product_id_key" ON "wishlist_items"("wishlist_id", "product_id");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_rating_idx" ON "product_reviews"("product_id", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_product_id_user_id_key" ON "product_reviews"("product_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "garage_profiles_user_id_key" ON "garage_profiles"("user_id");

-- CreateIndex
CREATE INDEX "garage_bookings_garage_id_status_idx" ON "garage_bookings"("garage_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "garage_reviews_garage_id_user_id_key" ON "garage_reviews"("garage_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "importer_profiles_user_id_key" ON "importer_profiles"("user_id");

-- CreateIndex
CREATE INDEX "import_requests_user_id_status_idx" ON "import_requests"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "import_quotes_request_id_importer_id_key" ON "import_quotes"("request_id", "importer_id");

-- CreateIndex
CREATE UNIQUE INDEX "logistics_companies_user_id_key" ON "logistics_companies"("user_id");

-- CreateIndex
CREATE INDEX "shipping_jobs_status_idx" ON "shipping_jobs"("status");

-- CreateIndex
CREATE INDEX "premium_listings_is_active_end_date_idx" ON "premium_listings"("is_active", "end_date");

-- CreateIndex
CREATE INDEX "product_tags_content_id_content_type_idx" ON "product_tags"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "deal_alerts_user_id_is_active_idx" ON "deal_alerts"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "product_analytics_product_id_date_key" ON "product_analytics"("product_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "influencer_profiles_user_id_key" ON "influencer_profiles"("user_id");

-- CreateIndex
CREATE INDEX "influencer_profiles_tier_is_available_idx" ON "influencer_profiles"("tier", "is_available");

-- CreateIndex
CREATE INDEX "influencer_profiles_avg_engagement_rate_idx" ON "influencer_profiles"("avg_engagement_rate");

-- CreateIndex
CREATE INDEX "brand_campaigns_status_campaign_start_date_idx" ON "brand_campaigns"("status", "campaign_start_date");

-- CreateIndex
CREATE INDEX "brand_campaigns_brand_id_idx" ON "brand_campaigns"("brand_id");

-- CreateIndex
CREATE INDEX "brand_campaigns_contest_id_idx" ON "brand_campaigns"("contest_id");

-- CreateIndex
CREATE INDEX "campaign_applications_influencer_id_status_idx" ON "campaign_applications"("influencer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_applications_campaign_id_influencer_id_key" ON "campaign_applications"("campaign_id", "influencer_id");

-- CreateIndex
CREATE INDEX "campaign_deliverables_campaign_id_status_idx" ON "campaign_deliverables"("campaign_id", "status");

-- CreateIndex
CREATE INDEX "campaign_deliverables_influencer_id_idx" ON "campaign_deliverables"("influencer_id");

-- CreateIndex
CREATE INDEX "influencer_reviews_influencer_id_idx" ON "influencer_reviews"("influencer_id");

-- CreateIndex
CREATE UNIQUE INDEX "influencer_reviews_campaign_id_influencer_id_key" ON "influencer_reviews"("campaign_id", "influencer_id");

-- CreateIndex
CREATE INDEX "contest_sponsorships_contest_id_idx" ON "contest_sponsorships"("contest_id");

-- CreateIndex
CREATE INDEX "contest_sponsorships_brand_id_idx" ON "contest_sponsorships"("brand_id");

-- CreateIndex
CREATE INDEX "contest_engagement_actions_contest_id_user_id_idx" ON "contest_engagement_actions"("contest_id", "user_id");

-- CreateIndex
CREATE INDEX "contest_engagement_actions_action_type_is_completed_idx" ON "contest_engagement_actions"("action_type", "is_completed");

-- CreateIndex
CREATE INDEX "contest_purchase_entries_contest_id_user_id_idx" ON "contest_purchase_entries"("contest_id", "user_id");

-- CreateIndex
CREATE INDEX "contest_purchase_entries_order_id_idx" ON "contest_purchase_entries"("order_id");

-- CreateIndex
CREATE INDEX "conversion_campaigns_contest_id_idx" ON "conversion_campaigns"("contest_id");

-- CreateIndex
CREATE INDEX "conversion_campaigns_type_is_active_idx" ON "conversion_campaigns"("type", "is_active");

-- CreateIndex
CREATE INDEX "conversion_campaign_recipients_user_id_idx" ON "conversion_campaign_recipients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversion_campaign_recipients_campaign_id_user_id_key" ON "conversion_campaign_recipients"("campaign_id", "user_id");

-- CreateIndex
CREATE INDEX "sales_funnel_events_user_id_stage_idx" ON "sales_funnel_events"("user_id", "stage");

-- CreateIndex
CREATE INDEX "sales_funnel_events_contest_id_stage_idx" ON "sales_funnel_events"("contest_id", "stage");

-- CreateIndex
CREATE INDEX "sales_funnel_events_campaign_id_stage_idx" ON "sales_funnel_events"("campaign_id", "stage");

-- CreateIndex
CREATE INDEX "sales_funnel_events_created_at_idx" ON "sales_funnel_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_points_user_id_key" ON "gamification_points"("user_id");

-- CreateIndex
CREATE INDEX "gamification_points_total_points_idx" ON "gamification_points"("total_points");

-- CreateIndex
CREATE INDEX "gamification_activities_user_id_created_at_idx" ON "gamification_activities"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "gamification_activities_activity_type_idx" ON "gamification_activities"("activity_type");

-- CreateIndex
CREATE INDEX "campaign_analytics_date_idx" ON "campaign_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_analytics_campaign_id_date_key" ON "campaign_analytics"("campaign_id", "date");

-- CreateIndex
CREATE INDEX "contest_analytics_date_idx" ON "contest_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "contest_analytics_contest_id_date_key" ON "contest_analytics"("contest_id", "date");

-- CreateIndex
CREATE INDEX "ad_platform_settings_scope_priority_idx" ON "ad_platform_settings"("scope", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "ad_platform_settings_scope_scope_value_key" ON "ad_platform_settings"("scope", "scope_value");

-- CreateIndex
CREATE INDEX "display_ad_campaigns_brand_id_status_idx" ON "display_ad_campaigns"("brand_id", "status");

-- CreateIndex
CREATE INDEX "display_ad_campaigns_status_start_date_idx" ON "display_ad_campaigns"("status", "start_date");

-- CreateIndex
CREATE INDEX "ad_campaign_locations_campaign_id_idx" ON "ad_campaign_locations"("campaign_id");

-- CreateIndex
CREATE INDEX "ad_campaign_locations_scope_scope_value_idx" ON "ad_campaign_locations"("scope", "scope_value");

-- CreateIndex
CREATE INDEX "display_ad_analytics_date_idx" ON "display_ad_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "display_ad_analytics_campaign_id_date_key" ON "display_ad_analytics"("campaign_id", "date");

-- CreateIndex
CREATE INDEX "ad_impressions_campaign_id_user_id_idx" ON "ad_impressions"("campaign_id", "user_id");

-- CreateIndex
CREATE INDEX "ad_impressions_user_id_created_at_idx" ON "ad_impressions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ad_impressions_placement_created_at_idx" ON "ad_impressions"("placement", "created_at");

-- CreateIndex
CREATE INDEX "location_master_parent_id_idx" ON "location_master"("parent_id");

-- CreateIndex
CREATE INDEX "location_master_country_code_idx" ON "location_master"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "location_master_scope_scope_value_key" ON "location_master"("scope", "scope_value");

-- CreateIndex
CREATE INDEX "sponsored_content_brand_user_id_status_idx" ON "sponsored_content"("brand_user_id", "status");

-- CreateIndex
CREATE INDEX "sponsored_content_content_type_status_start_date_end_date_idx" ON "sponsored_content"("content_type", "status", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "sponsored_content_bid_amount_idx" ON "sponsored_content"("bid_amount");

-- CreateIndex
CREATE INDEX "sponsored_impressions_campaign_id_type_idx" ON "sponsored_impressions"("campaign_id", "type");

-- CreateIndex
CREATE INDEX "sponsored_impressions_user_id_created_at_idx" ON "sponsored_impressions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionTier_creator_id_tier_key" ON "SubscriptionTier"("creator_id", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_apple_id_key" ON "User"("apple_id");

-- CreateIndex
CREATE INDEX "social_media_accounts_platform_follower_count_idx" ON "social_media_accounts"("platform", "follower_count");

-- CreateIndex
CREATE INDEX "social_media_accounts_influencer_id_is_primary_idx" ON "social_media_accounts"("influencer_id", "is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "social_media_accounts_influencer_id_platform_key" ON "social_media_accounts"("influencer_id", "platform");

-- CreateIndex
CREATE INDEX "social_media_sync_logs_account_id_synced_at_idx" ON "social_media_sync_logs"("account_id", "synced_at");

-- CreateIndex
CREATE INDEX "social_media_sync_logs_status_idx" ON "social_media_sync_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "platform_rate_limits_platform_key" ON "platform_rate_limits"("platform");

-- CreateIndex
CREATE INDEX "products_category_status_idx" ON "products"("category", "status");

-- CreateIndex
CREATE INDEX "products_seller_id_status_idx" ON "products"("seller_id", "status");

-- AddForeignKey
ALTER TABLE "admires" ADD CONSTRAINT "admires_admired_id_fkey" FOREIGN KEY ("admired_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admires" ADD CONSTRAINT "admires_admirer_id_fkey" FOREIGN KEY ("admirer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bio_links" ADD CONSTRAINT "bio_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reports" ADD CONSTRAINT "comment_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_reply_to_user_id_fkey" FOREIGN KEY ("reply_to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_action_completions" ADD CONSTRAINT "contest_action_completions_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "ContestAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_action_completions" ADD CONSTRAINT "contest_action_completions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "ContestSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestAction" ADD CONSTRAINT "ContestAction_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_judges" ADD CONSTRAINT "contest_judges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_participants" ADD CONSTRAINT "contest_participants_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_participants" ADD CONSTRAINT "contest_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_prize_distributions" ADD CONSTRAINT "contest_prize_distributions_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_votes" ADD CONSTRAINT "contest_votes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "ContestSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_votes" ADD CONSTRAINT "contest_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_winners" ADD CONSTRAINT "contest_winners_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_winners" ADD CONSTRAINT "contest_winners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contest" ADD CONSTRAINT "Contest_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrows" ADD CONSTRAINT "escrows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_invites" ADD CONSTRAINT "judge_invites_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "judge_invites" ADD CONSTRAINT "judge_invites_judge_id_fkey" FOREIGN KEY ("judge_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_banned_viewers" ADD CONSTRAINT "live_banned_viewers_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "LiveStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_battles" ADD CONSTRAINT "live_battles_opponent_stream_id_fkey" FOREIGN KEY ("opponent_stream_id") REFERENCES "LiveStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_battles" ADD CONSTRAINT "live_battles_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "LiveStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_co_hosts" ADD CONSTRAINT "live_co_hosts_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "LiveStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_messages" ADD CONSTRAINT "live_messages_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "LiveStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_pinned_products" ADD CONSTRAINT "live_pinned_products_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "LiveStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_session_products" ADD CONSTRAINT "live_session_products_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveStream" ADD CONSTRAINT "LiveStream_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_tips" ADD CONSTRAINT "live_tips_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "LiveStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_viewers" ADD CONSTRAINT "live_viewers_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "LiveStream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestone_completions" ADD CONSTRAINT "milestone_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_details" ADD CONSTRAINT "vehicle_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spare_part_details" ADD CONSTRAINT "spare_part_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_details" ADD CONSTRAINT "real_estate_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fashion_details" ADD CONSTRAINT "fashion_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shoe_details" ADD CONSTRAINT "shoe_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "electronics_details" ADD CONSTRAINT "electronics_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_details" ADD CONSTRAINT "food_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_details" ADD CONSTRAINT "book_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_product_details" ADD CONSTRAINT "digital_product_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_details" ADD CONSTRAINT "service_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_discounts" ADD CONSTRAINT "product_discounts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_products" ADD CONSTRAINT "flash_sale_products_flash_sale_id_fkey" FOREIGN KEY ("flash_sale_id") REFERENCES "flash_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_products" ADD CONSTRAINT "flash_sale_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_buys" ADD CONSTRAINT "group_buys_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_buy_participants" ADD CONSTRAINT "group_buy_participants_group_buy_id_fkey" FOREIGN KEY ("group_buy_id") REFERENCES "group_buys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_buy_participants" ADD CONSTRAINT "group_buy_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_profiles" ADD CONSTRAINT "garage_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_bookings" ADD CONSTRAINT "garage_bookings_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garage_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_bookings" ADD CONSTRAINT "garage_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_reviews" ADD CONSTRAINT "garage_reviews_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garage_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_reviews" ADD CONSTRAINT "garage_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "importer_profiles" ADD CONSTRAINT "importer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_requests" ADD CONSTRAINT "import_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_quotes" ADD CONSTRAINT "import_quotes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "import_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_quotes" ADD CONSTRAINT "import_quotes_importer_id_fkey" FOREIGN KEY ("importer_id") REFERENCES "importer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_companies" ADD CONSTRAINT "logistics_companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_jobs" ADD CONSTRAINT "shipping_jobs_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_jobs" ADD CONSTRAINT "shipping_jobs_logistics_id_fkey" FOREIGN KEY ("logistics_id") REFERENCES "logistics_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premium_listings" ADD CONSTRAINT "premium_listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_shares" ADD CONSTRAINT "product_shares_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_shares" ADD CONSTRAINT "product_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_alerts" ADD CONSTRAINT "deal_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_alerts" ADD CONSTRAINT "deal_alerts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_analytics" ADD CONSTRAINT "product_analytics_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_profiles" ADD CONSTRAINT "influencer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_campaigns" ADD CONSTRAINT "brand_campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_campaigns" ADD CONSTRAINT "brand_campaigns_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "brand_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_deliverables" ADD CONSTRAINT "campaign_deliverables_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "brand_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_deliverables" ADD CONSTRAINT "campaign_deliverables_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_reviews" ADD CONSTRAINT "influencer_reviews_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_sponsorships" ADD CONSTRAINT "contest_sponsorships_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_sponsorships" ADD CONSTRAINT "contest_sponsorships_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_engagement_actions" ADD CONSTRAINT "contest_engagement_actions_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_engagement_actions" ADD CONSTRAINT "contest_engagement_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_purchase_entries" ADD CONSTRAINT "contest_purchase_entries_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_purchase_entries" ADD CONSTRAINT "contest_purchase_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_campaigns" ADD CONSTRAINT "conversion_campaigns_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_campaigns" ADD CONSTRAINT "conversion_campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_campaign_recipients" ADD CONSTRAINT "conversion_campaign_recipients_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "conversion_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversion_campaign_recipients" ADD CONSTRAINT "conversion_campaign_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_funnel_events" ADD CONSTRAINT "sales_funnel_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_funnel_events" ADD CONSTRAINT "sales_funnel_events_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_funnel_events" ADD CONSTRAINT "sales_funnel_events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "brand_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_points" ADD CONSTRAINT "gamification_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gamification_activities" ADD CONSTRAINT "gamification_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_analytics" ADD CONSTRAINT "campaign_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "brand_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contest_analytics" ADD CONSTRAINT "contest_analytics_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaign_locations" ADD CONSTRAINT "ad_campaign_locations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "display_ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "display_ad_analytics" ADD CONSTRAINT "display_ad_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "display_ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_content" ADD CONSTRAINT "sponsored_content_brand_user_id_fkey" FOREIGN KEY ("brand_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_impressions" ADD CONSTRAINT "sponsored_impressions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "sponsored_content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_impressions" ADD CONSTRAINT "sponsored_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortCollection" ADD CONSTRAINT "ShortCollection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_comments" ADD CONSTRAINT "short_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_likes" ADD CONSTRAINT "short_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shorts" ADD CONSTRAINT "shorts_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "ShortCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shorts" ADD CONSTRAINT "shorts_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shorts" ADD CONSTRAINT "shorts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTier" ADD CONSTRAINT "SubscriptionTier_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "SubscriptionTier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_chats" ADD CONSTRAINT "team_chats_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_contest_registrations" ADD CONSTRAINT "team_contest_registrations_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_contest_registrations" ADD CONSTRAINT "team_contest_registrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_submission_votes" ADD CONSTRAINT "team_submission_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_submissions" ADD CONSTRAINT "team_submissions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_media_accounts" ADD CONSTRAINT "social_media_accounts_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
