-- Additional Performance Indexes Migration
-- Run this on Railway database after testing

-- Transaction indexes for wallet operations
CREATE INDEX IF NOT EXISTS "transactions_user_type_created_idx" ON "transactions"("user_id", "type", "created_at");
CREATE INDEX IF NOT EXISTS "transactions_status_created_idx" ON "transactions"("status", "created_at");

-- Short indexes for feed queries
CREATE INDEX IF NOT EXISTS "shorts_user_created_locked_idx" ON "shorts"("user_id", "created_at", "is_locked");
CREATE INDEX IF NOT EXISTS "shorts_contest_created_idx" ON "shorts"("contest_id", "created_at");
CREATE INDEX IF NOT EXISTS "shorts_views_idx" ON "shorts"("views");
CREATE INDEX IF NOT EXISTS "shorts_likes_idx" ON "shorts"("likes_count");

-- Post indexes for feed queries
CREATE INDEX IF NOT EXISTS "posts_user_created_locked_idx" ON "posts"("user_id", "created_at", "is_locked");
CREATE INDEX IF NOT EXISTS "posts_likes_idx" ON "posts"("likes_count");

-- Wallet indexes for balance queries
CREATE INDEX IF NOT EXISTS "wallets_balance_idx" ON "wallets"("kr_balance");

-- ContestSubmission indexes for ranking
CREATE INDEX IF NOT EXISTS "contest_submissions_contest_score_idx" ON "contest_submissions"("contest_id", "final_score");
CREATE INDEX IF NOT EXISTS "contest_submissions_contest_votes_idx" ON "contest_submissions"("contest_id", "votes_count");
CREATE INDEX IF NOT EXISTS "contest_submissions_contest_rank_idx" ON "contest_submissions"("contest_id", "rank");

-- Order indexes for shop queries
CREATE INDEX IF NOT EXISTS "orders_buyer_created_idx" ON "orders"("buyer_id", "created_at");
CREATE INDEX IF NOT EXISTS "orders_status_created_idx" ON "orders"("status", "created_at");

-- LiveStream indexes for discovery
CREATE INDEX IF NOT EXISTS "live_streams_status_viewers_idx" ON "live_streams"("status", "viewer_count");
CREATE INDEX IF NOT EXISTS "live_streams_category_status_idx" ON "live_streams"("category", "status");

-- Chama indexes for member queries
CREATE INDEX IF NOT EXISTS "chamas_status_created_idx" ON "chamas"("status", "created_at");

-- ChamaMember indexes for rotation queries
CREATE INDEX IF NOT EXISTS "chama_members_chama_rotation_idx" ON "chama_members"("chama_id", "rotation_number");
CREATE INDEX IF NOT EXISTS "chama_members_chama_status_idx" ON "chama_members"("chama_id", "status");

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;
