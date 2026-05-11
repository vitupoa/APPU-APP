-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('NATIVE', 'BANNER', 'STORY');

-- CreateEnum
CREATE TYPE "AdCampaignStatusType" AS ENUM ('PENDING', 'APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SponsoredPostStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'PAYMENT_RELEASED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "unlock_amount_kr" DECIMAL(18,4);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "devicePlatform" TEXT,
ADD COLUMN     "fcmToken" TEXT;

-- AlterTable
ALTER TABLE "shorts" ADD COLUMN     "unlock_amount_kr" DECIMAL(18,4);

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

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_unlocks_user_id_idx" ON "content_unlocks"("user_id");

-- CreateIndex
CREATE INDEX "content_unlocks_content_id_content_type_idx" ON "content_unlocks"("content_id", "content_type");

-- CreateIndex
CREATE INDEX "content_unlocks_creator_id_idx" ON "content_unlocks"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_unlocks_user_id_content_id_content_type_key" ON "content_unlocks"("user_id", "content_id", "content_type");

-- CreateIndex
CREATE INDEX "ad_campaigns_brand_id_idx" ON "ad_campaigns"("brand_id");

-- CreateIndex
CREATE INDEX "ad_campaigns_status_idx" ON "ad_campaigns"("status");

-- CreateIndex
CREATE INDEX "ad_campaigns_start_date_end_date_idx" ON "ad_campaigns"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "sponsored_post_requests_brand_id_idx" ON "sponsored_post_requests"("brand_id");

-- CreateIndex
CREATE INDEX "sponsored_post_requests_creator_id_idx" ON "sponsored_post_requests"("creator_id");

-- CreateIndex
CREATE INDEX "sponsored_post_requests_status_idx" ON "sponsored_post_requests"("status");

-- CreateIndex
CREATE INDEX "ad_analytics_date_idx" ON "ad_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ad_analytics_date_key" ON "ad_analytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_user_id_created_at_idx" ON "idempotency_keys"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idempotency_keys_key_idx" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");

-- CreateIndex
CREATE INDEX "messages_recipient_id_idx" ON "messages"("recipient_id");

-- CreateIndex
CREATE INDEX "messages_chat_id_idx" ON "messages"("chat_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "User_fcmToken_idx" ON "User"("fcmToken");

-- AddForeignKey
ALTER TABLE "content_unlocks" ADD CONSTRAINT "content_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_unlocks" ADD CONSTRAINT "content_unlocks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_campaigns" ADD CONSTRAINT "ad_campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_post_requests" ADD CONSTRAINT "sponsored_post_requests_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsored_post_requests" ADD CONSTRAINT "sponsored_post_requests_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_forwarded_from_id_fkey" FOREIGN KEY ("forwarded_from_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
