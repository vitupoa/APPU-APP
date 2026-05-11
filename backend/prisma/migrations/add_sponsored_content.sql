-- Migration: Add Sponsored Content System
-- Description: Adds tables for native ad marketplace where brands can promote shorts/posts

-- Create enums
CREATE TYPE "SponsoredContentType" AS ENUM ('SHORT', 'POST', 'STORY');
CREATE TYPE "SponsoredContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAUSED', 'COMPLETED');
CREATE TYPE "PricingModel" AS ENUM ('CPM', 'CPV', 'CPE', 'CPC', 'FLAT_FEE');

-- Create sponsored_content table
CREATE TABLE "sponsored_content" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "sponsored_content_brand_user_id_fkey" FOREIGN KEY ("brand_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sponsored_content_content_id_shorts_fkey" FOREIGN KEY ("content_id") REFERENCES "shorts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sponsored_content_content_id_posts_fkey" FOREIGN KEY ("content_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sponsored_content_escrow_id_fkey" FOREIGN KEY ("escrow_id") REFERENCES "escrow"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create sponsored_impressions table
CREATE TABLE "sponsored_impressions" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "campaign_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cost" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "sponsored_impressions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "sponsored_content"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sponsored_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX "sponsored_content_brand_user_id_status_idx" ON "sponsored_content"("brand_user_id", "status");
CREATE INDEX "sponsored_content_content_type_status_start_date_end_date_idx" ON "sponsored_content"("content_type", "status", "start_date", "end_date");
CREATE INDEX "sponsored_content_bid_amount_idx" ON "sponsored_content"("bid_amount");
CREATE INDEX "sponsored_impressions_campaign_id_type_idx" ON "sponsored_impressions"("campaign_id", "type");
CREATE INDEX "sponsored_impressions_user_id_created_at_idx" ON "sponsored_impressions"("user_id", "created_at");

-- Add relations to existing tables (if not already present)
-- Note: These are handled by Prisma schema, but included here for reference

-- Add to users table:
-- sponsoredContent      SponsoredContent[]     @relation("BrandSponsoredContent")
-- sponsoredImpressions  SponsoredImpression[]  @relation("SponsoredImpressions")

-- Add to shorts table:
-- sponsoredCampaigns    SponsoredContent[]     @relation("SponsoredShorts")

-- Add to posts table:
-- sponsoredCampaigns    SponsoredContent[]     @relation("SponsoredPosts")

-- Add to escrow table:
-- sponsoredCampaigns    SponsoredContent[]
