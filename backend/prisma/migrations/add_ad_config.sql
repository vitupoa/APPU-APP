-- Ad Configuration Table
CREATE TABLE ad_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_cut_percentage DECIMAL(5, 2) NOT NULL DEFAULT 15.0 CHECK (platform_cut_percentage >= 1 AND platform_cut_percentage <= 50),
  
  -- Native Ad Pricing (CPM in KES)
  native_ad_min_cpm DECIMAL(10, 2) NOT NULL DEFAULT 40.0,
  native_ad_max_cpm DECIMAL(10, 2) NOT NULL DEFAULT 150.0,
  native_ad_frequency INT NOT NULL DEFAULT 6 CHECK (native_ad_frequency >= 3 AND native_ad_frequency <= 20),
  
  -- Banner Ad Pricing (CPM in KES)
  banner_ad_min_cpm DECIMAL(10, 2) NOT NULL DEFAULT 30.0,
  banner_ad_max_cpm DECIMAL(10, 2) NOT NULL DEFAULT 100.0,
  banner_ad_frequency INT NOT NULL DEFAULT 15 CHECK (banner_ad_frequency >= 10 AND banner_ad_frequency <= 30),
  
  -- Story Ad Pricing (CPM in KES)
  story_ad_min_cpm DECIMAL(10, 2) NOT NULL DEFAULT 80.0,
  story_ad_max_cpm DECIMAL(10, 2) NOT NULL DEFAULT 200.0,
  story_ad_frequency INT NOT NULL DEFAULT 20 CHECK (story_ad_frequency >= 15 AND story_ad_frequency <= 40),
  
  -- Global Controls
  ads_enabled BOOLEAN NOT NULL DEFAULT true,
  max_ad_load_enabled BOOLEAN NOT NULL DEFAULT false,
  
  updated_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default config
INSERT INTO ad_config (id) VALUES ('00000000-0000-0000-0000-000000000001');

-- Ad Campaign Table (for brand campaigns)
CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  ad_type VARCHAR(50) NOT NULL CHECK (ad_type IN ('NATIVE', 'BANNER', 'STORY')),
  
  -- Budget & Pricing
  budget_kes DECIMAL(18, 4) NOT NULL,
  spent_kes DECIMAL(18, 4) NOT NULL DEFAULT 0,
  cpm_bid DECIMAL(10, 2) NOT NULL,
  
  -- Targeting
  target_age_min INT,
  target_age_max INT,
  target_genders TEXT[],
  target_locations TEXT[],
  target_interests TEXT[],
  
  -- Creative
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  cta_text VARCHAR(50),
  cta_url VARCHAR(500),
  
  -- Schedule
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'REJECTED')),
  rejection_reason TEXT,
  
  -- Metrics
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ad_campaigns_brand ON ad_campaigns(brand_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

-- Sponsored Post Requests (creator collaborations)
CREATE TABLE sponsored_post_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Campaign Details
  campaign_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  
  -- Payment
  total_payment_kes DECIMAL(18, 4) NOT NULL,
  creator_payment_kes DECIMAL(18, 4) NOT NULL,
  platform_fee_kes DECIMAL(18, 4) NOT NULL,
  
  -- Content
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('POST', 'SHORT', 'STORY')),
  content_id UUID,
  content_url VARCHAR(500),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'PAYMENT_RELEASED', 'COMPLETED')),
  rejection_reason TEXT,
  
  -- Verification
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  payment_released_at TIMESTAMP,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sponsored_posts_brand ON sponsored_post_requests(brand_id);
CREATE INDEX idx_sponsored_posts_creator ON sponsored_post_requests(creator_id);
CREATE INDEX idx_sponsored_posts_status ON sponsored_post_requests(status);

-- Ad Analytics (daily aggregates)
CREATE TABLE ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  
  -- Revenue
  total_ad_spend_kes DECIMAL(18, 4) NOT NULL DEFAULT 0,
  platform_revenue_kes DECIMAL(18, 4) NOT NULL DEFAULT 0,
  creator_revenue_kes DECIMAL(18, 4) NOT NULL DEFAULT 0,
  
  -- Campaign Metrics
  active_campaigns INT NOT NULL DEFAULT 0,
  total_impressions INT NOT NULL DEFAULT 0,
  total_clicks INT NOT NULL DEFAULT 0,
  total_conversions INT NOT NULL DEFAULT 0,
  
  -- Ad Type Breakdown
  native_impressions INT NOT NULL DEFAULT 0,
  banner_impressions INT NOT NULL DEFAULT 0,
  story_impressions INT NOT NULL DEFAULT 0,
  
  -- Sponsored Posts
  sponsored_posts_active INT NOT NULL DEFAULT 0,
  sponsored_posts_revenue_kes DECIMAL(18, 4) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(date)
);

CREATE INDEX idx_ad_analytics_date ON ad_analytics(date DESC);
