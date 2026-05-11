# CRITICAL FIX: Add @@map() Directives to Prisma Schema

## Problem
Your database tables use **snake_case** names (e.g., `users`, `transactions`), but your Prisma models use **PascalCase** names (e.g., `User`, `Transaction`) WITHOUT `@@map()` directives.

## Solution
Add `@@map("table_name")` to EVERY model in your schema.prisma file.

## Example Pattern

```prisma
model User {
  id String @id
  email String @unique
  // ... all other fields
  
  @@map("users")  // ← ADD THIS LINE
}

model Transaction {
  id String @id
  user_id String
  // ... all other fields
  
  @@map("transactions")  // ← ADD THIS LINE
}

model Contest {
  id String @id
  creator_id String
  // ... all other fields
  
  @@map("contests")  // ← ADD THIS LINE
}
```

## Complete List of Models Needing @@map()

Based on your migration file, add these @@map() directives:

```prisma
model Contest { @@map("contests") }
model ContestAction { @@map("contest_actions") }
model ContestSubmission { @@map("contest_submissions") }
model LiveSession { @@map("live_sessions") }
model LiveStream { @@map("live_streams") }
model Post { @@map("posts") }
model ShortCollection { @@map("short_collections") }
model SubscriptionTier { @@map("subscription_tiers") }
model Team { @@map("teams") }
model User { @@map("users") }
model ad_analytics { @@map("ad_analytics") }
model ad_campaign_locations { @@map("ad_campaign_locations") }
model ad_campaigns { @@map("ad_campaigns") }
model ad_config { @@map("ad_config") }
model ad_impressions { @@map("ad_impressions") }
model ad_platform_settings { @@map("ad_platform_settings") }
model admires { @@map("admires") }
model bio_links { @@map("bio_links") }
model book_details { @@map("book_details") }
model brand_campaigns { @@map("brand_campaigns") }
model campaign_analytics { @@map("campaign_analytics") }
model campaign_applications { @@map("campaign_applications") }
model campaign_deliverables { @@map("campaign_deliverables") }
model cart_items { @@map("cart_items") }
model comment_likes { @@map("comment_likes") }
model comment_reports { @@map("comment_reports") }
model comment_settings { @@map("comment_settings") }
model comments { @@map("comments") }
model content_unlocks { @@map("content_unlocks") }
model contest_action_completions { @@map("contest_action_completions") }
model contest_analytics { @@map("contest_analytics") }
model contest_engagement_actions { @@map("contest_engagement_actions") }
model contest_judges { @@map("contest_judges") }
model contest_participants { @@map("contest_participants") }
model contest_prize_distributions { @@map("contest_prize_distributions") }
model contest_purchase_entries { @@map("contest_purchase_entries") }
model contest_sponsorships { @@map("contest_sponsorships") }
model contest_votes { @@map("contest_votes") }
model contest_winners { @@map("contest_winners") }
model conversion_campaign_recipients { @@map("conversion_campaign_recipients") }
model conversion_campaigns { @@map("conversion_campaigns") }
model daily_stats { @@map("daily_stats") }
model deal_alerts { @@map("deal_alerts") }
model digital_product_details { @@map("digital_product_details") }
model display_ad_analytics { @@map("display_ad_analytics") }
model display_ad_campaigns { @@map("display_ad_campaigns") }
model electronics_details { @@map("electronics_details") }
model escrows { @@map("escrows") }
model fashion_details { @@map("fashion_details") }
model flash_sale_products { @@map("flash_sale_products") }
model flash_sales { @@map("flash_sales") }
model food_details { @@map("food_details") }
model gamification_activities { @@map("gamification_activities") }
model gamification_points { @@map("gamification_points") }
model garage_bookings { @@map("garage_bookings") }
model garage_profiles { @@map("garage_profiles") }
model garage_reviews { @@map("garage_reviews") }
model gifts { @@map("gifts") }
model group_buy_participants { @@map("group_buy_participants") }
model group_buys { @@map("group_buys") }
model idempotency_keys { @@map("idempotency_keys") }
model import_quotes { @@map("import_quotes") }
model import_requests { @@map("import_requests") }
model importer_profiles { @@map("importer_profiles") }
model influencer_profiles { @@map("influencer_profiles") }
model influencer_portfolio { @@map("influencer_portfolio") }
model influencer_reviews { @@map("influencer_reviews") }
model judge_invites { @@map("judge_invites") }
model live_banned_viewers { @@map("live_banned_viewers") }
model live_battles { @@map("live_battles") }
model live_co_hosts { @@map("live_co_hosts") }
model live_messages { @@map("live_messages") }
model live_pinned_products { @@map("live_pinned_products") }
model live_session_products { @@map("live_session_products") }
model live_tips { @@map("live_tips") }
model live_viewers { @@map("live_viewers") }
model location_master { @@map("location_master") }
model logistics_companies { @@map("logistics_companies") }
model messages { @@map("messages") }
model milestone_completions { @@map("milestone_completions") }
model milestones { @@map("milestones") }
model order_items { @@map("order_items") }
model orders { @@map("orders") }
model platform_rate_limits { @@map("platform_rate_limits") }
model post_comments { @@map("post_comments") }
model post_likes { @@map("post_likes") }
model premium_listings { @@map("premium_listings") }
model product_analytics { @@map("product_analytics") }
model product_discounts { @@map("product_discounts") }
model product_reviews { @@map("product_reviews") }
model product_shares { @@map("product_shares") }
model product_tags { @@map("product_tags") }
model products { @@map("products") }
model real_estate_details { @@map("real_estate_details") }
model refresh_tokens { @@map("refresh_tokens") }
model sales_funnel_events { @@map("sales_funnel_events") }
model service_details { @@map("service_details") }
model shipping_jobs { @@map("shipping_jobs") }
model shoe_details { @@map("shoe_details") }
model short_comments { @@map("short_comments") }
model short_likes { @@map("short_likes") }
model shorts { @@map("shorts") }
model social_media_accounts { @@map("social_media_accounts") }
model social_media_sync_logs { @@map("social_media_sync_logs") }
model spare_part_details { @@map("spare_part_details") }
model sponsored_content { @@map("sponsored_content") }
model sponsored_impressions { @@map("sponsored_impressions") }
model sponsored_post_requests { @@map("sponsored_post_requests") }
model subscriptions { @@map("subscriptions") }
model team_chats { @@map("team_chats") }
model team_contest_registrations { @@map("team_contest_registrations") }
model team_invitations { @@map("team_invitations") }
model team_members { @@map("team_members") }
model team_submission_votes { @@map("team_submission_votes") }
model team_submissions { @@map("team_submissions") }
model transactions { @@map("transactions") }
model vehicle_details { @@map("vehicle_details") }
model wallets { @@map("wallets") }
model wishlist_items { @@map("wishlist_items") }
model wishlists { @@map("wishlists") }
model notifications { @@map("notifications") }
model user_micro_interests { @@map("user_micro_interests") }
model stories { @@map("stories") }
model trending_topics { @@map("trending_topics") }
```

## Quick Fix Steps

1. **Backup your schema**:
   ```bash
   cp prisma/schema.prisma prisma/schema.prisma.backup
   ```

2. **Add @@map() to each model** - Place it at the end of each model block, before the closing brace

3. **Validate the schema**:
   ```bash
   npx prisma validate
   ```

4. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Test locally**:
   ```bash
   npm run build
   npm start
   ```

6. **Deploy to Railway**:
   ```bash
   git add .
   git commit -m "fix: add @@map directives for table name mapping"
   git push
   ```

## Why This Happened

Your Prisma schema has `fieldMapping = "camelCase"` which only affects FIELD names, not TABLE names. Without `@@map()`, Prisma assumes:
- Model `User` → table `User` (WRONG - your table is `users`)
- Model `Transaction` → table `Transaction` (WRONG - your table is `transactions`)

The `@@map()` directive explicitly tells Prisma which database table each model maps to.
