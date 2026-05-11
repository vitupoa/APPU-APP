-- =====================================================
-- ROW-LEVEL SECURITY (RLS) IMPLEMENTATION - CORRECTED
-- Migration: Add RLS policies for subscription and content lock systems
-- Uses actual table names from Prisma schema
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function: Get current user ID from application context
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_id TEXT;
BEGIN
  user_id := COALESCE(check_user_id, current_user_id());
  
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM "User"
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check if current context is system user
CREATE OR REPLACE FUNCTION is_system_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(current_setting('app.is_system', true)::BOOLEAN, false);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check subscription access for content
CREATE OR REPLACE FUNCTION has_subscription_access(
  subscriber_id TEXT,
  creator_id TEXT,
  required_tier TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  tier_order TEXT[] := ARRAY['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN'];
  required_index INT;
  subscribed_index INT;
BEGIN
  IF required_tier IS NULL THEN
    RETURN false;
  END IF;

  required_index := array_position(tier_order, required_tier);
  
  IF required_index IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT array_position(tier_order, tier::TEXT) INTO subscribed_index
  FROM subscriptions
  WHERE subscriptions.subscriber_id = has_subscription_access.subscriber_id
    AND subscriptions.creator_id = has_subscription_access.creator_id
    AND status = 'active'
  LIMIT 1;

  RETURN subscribed_index IS NOT NULL AND subscribed_index >= required_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check if content is unlocked by user
CREATE OR REPLACE FUNCTION has_unlocked_content(
  check_user_id TEXT,
  check_content_id TEXT,
  check_content_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM content_unlocks
    WHERE user_id = check_user_id
      AND content_id = check_content_id
      AND content_type = check_content_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- SUBSCRIPTION TIERS TABLE RLS
-- =====================================================

ALTER TABLE "SubscriptionTier" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_tiers_creator_manage" ON "SubscriptionTier";
CREATE POLICY "subscription_tiers_creator_manage"
ON "SubscriptionTier"
FOR ALL
USING (creator_id = current_user_id() OR is_admin() OR is_system_user())
WITH CHECK (creator_id = current_user_id() OR is_admin() OR is_system_user());

DROP POLICY IF EXISTS "subscription_tiers_public_read" ON "SubscriptionTier";
CREATE POLICY "subscription_tiers_public_read"
ON "SubscriptionTier"
FOR SELECT
USING (is_enabled = true OR creator_id = current_user_id() OR is_admin());

-- =====================================================
-- SUBSCRIPTIONS TABLE RLS
-- =====================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_subscriber_read" ON subscriptions;
CREATE POLICY "subscriptions_subscriber_read"
ON subscriptions
FOR SELECT
USING (subscriber_id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "subscriptions_creator_read" ON subscriptions;
CREATE POLICY "subscriptions_creator_read"
ON subscriptions
FOR SELECT
USING (creator_id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "subscriptions_system_create" ON subscriptions;
CREATE POLICY "subscriptions_system_create"
ON subscriptions
FOR INSERT
WITH CHECK (is_system_user() OR is_admin());

DROP POLICY IF EXISTS "subscriptions_system_update" ON subscriptions;
CREATE POLICY "subscriptions_system_update"
ON subscriptions
FOR UPDATE
USING (is_system_user() OR is_admin())
WITH CHECK (is_system_user() OR is_admin());

DROP POLICY IF EXISTS "subscriptions_subscriber_cancel" ON subscriptions;
CREATE POLICY "subscriptions_subscriber_cancel"
ON subscriptions
FOR UPDATE
USING (
  subscriber_id = current_user_id() 
  AND status = 'active'
)
WITH CHECK (
  subscriber_id = current_user_id() 
  AND status IN ('cancelled', 'active')
);

DROP POLICY IF EXISTS "subscriptions_no_delete" ON subscriptions;
CREATE POLICY "subscriptions_no_delete"
ON subscriptions
FOR DELETE
USING (is_admin());

-- =====================================================
-- CONTENT UNLOCKS TABLE RLS
-- =====================================================

ALTER TABLE content_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_unlocks_user_read" ON content_unlocks;
CREATE POLICY "content_unlocks_user_read"
ON content_unlocks
FOR SELECT
USING (user_id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "content_unlocks_creator_read" ON content_unlocks;
CREATE POLICY "content_unlocks_creator_read"
ON content_unlocks
FOR SELECT
USING (creator_id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "content_unlocks_system_create" ON content_unlocks;
CREATE POLICY "content_unlocks_system_create"
ON content_unlocks
FOR INSERT
WITH CHECK (is_system_user() OR is_admin());

DROP POLICY IF EXISTS "content_unlocks_no_update" ON content_unlocks;
CREATE POLICY "content_unlocks_no_update"
ON content_unlocks
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "content_unlocks_no_delete" ON content_unlocks;
CREATE POLICY "content_unlocks_no_delete"
ON content_unlocks
FOR DELETE
USING (is_admin());

-- =====================================================
-- SHORTS TABLE RLS
-- =====================================================

ALTER TABLE shorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shorts_creator_manage" ON shorts;
CREATE POLICY "shorts_creator_manage"
ON shorts
FOR ALL
USING (user_id = current_user_id() OR is_admin())
WITH CHECK (user_id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "shorts_user_read" ON shorts;
CREATE POLICY "shorts_user_read"
ON shorts
FOR SELECT
USING (
  is_locked = false 
  OR user_id = current_user_id()
  OR (required_tier IS NOT NULL AND has_subscription_access(current_user_id(), user_id, required_tier::TEXT))
  OR (unlock_amount_kr IS NOT NULL AND has_unlocked_content(current_user_id(), id, 'SHORT'))
  OR is_admin()
);

-- =====================================================
-- POSTS TABLE RLS
-- =====================================================

ALTER TABLE "Post" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_creator_manage" ON "Post";
CREATE POLICY "posts_creator_manage"
ON "Post"
FOR ALL
USING (user_id = current_user_id() OR is_admin())
WITH CHECK (user_id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "posts_user_read" ON "Post";
CREATE POLICY "posts_user_read"
ON "Post"
FOR SELECT
USING (
  is_locked = false 
  OR user_id = current_user_id()
  OR (required_tier IS NOT NULL AND has_subscription_access(current_user_id(), user_id, required_tier::TEXT))
  OR (unlock_amount_kr IS NOT NULL AND has_unlocked_content(current_user_id(), id, 'POST'))
  OR is_admin()
);

-- =====================================================
-- LIVE STREAMS TABLE RLS
-- =====================================================

ALTER TABLE "LiveStream" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "live_streams_host_manage" ON "LiveStream";
CREATE POLICY "live_streams_host_manage"
ON "LiveStream"
FOR ALL
USING (host_id = current_user_id() OR is_admin())
WITH CHECK (host_id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "live_streams_user_read" ON "LiveStream";
CREATE POLICY "live_streams_user_read"
ON "LiveStream"
FOR SELECT
USING (
  unlock_amount_kr IS NULL
  OR host_id = current_user_id()
  OR (unlock_amount_kr IS NOT NULL AND has_unlocked_content(current_user_id(), id, 'LIVE'))
  OR is_admin()
);

-- =====================================================
-- WALLETS TABLE RLS
-- =====================================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_owner_read" ON wallets;
CREATE POLICY "wallets_owner_read"
ON wallets
FOR SELECT
USING (user_id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "wallets_system_modify" ON wallets;
CREATE POLICY "wallets_system_modify"
ON wallets
FOR ALL
USING (is_system_user() OR is_admin())
WITH CHECK (is_system_user() OR is_admin());

-- =====================================================
-- TRANSACTIONS TABLE RLS
-- =====================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_owner_read" ON transactions;
CREATE POLICY "transactions_owner_read"
ON transactions
FOR SELECT
USING (user_id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "transactions_system_create" ON transactions;
CREATE POLICY "transactions_system_create"
ON transactions
FOR INSERT
WITH CHECK (is_system_user() OR is_admin());

DROP POLICY IF EXISTS "transactions_no_update" ON transactions;
CREATE POLICY "transactions_no_update"
ON transactions
FOR UPDATE
USING (is_admin());

DROP POLICY IF EXISTS "transactions_no_delete" ON transactions;
CREATE POLICY "transactions_no_delete"
ON transactions
FOR DELETE
USING (is_admin());

-- =====================================================
-- USER TABLE RLS
-- =====================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own" ON "User";
CREATE POLICY "users_select_own"
ON "User"
FOR SELECT
USING (id = current_user_id() OR is_admin());

DROP POLICY IF EXISTS "users_update_own" ON "User";
CREATE POLICY "users_update_own"
ON "User"
FOR UPDATE
USING (id = current_user_id())
WITH CHECK (id = current_user_id());

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin(TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_system_user() TO PUBLIC;
GRANT EXECUTE ON FUNCTION has_subscription_access(TEXT, TEXT, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION has_unlocked_content(TEXT, TEXT, TEXT) TO PUBLIC;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_access 
ON subscriptions(subscriber_id, creator_id, status, tier);

CREATE INDEX IF NOT EXISTS idx_content_unlocks_access 
ON content_unlocks(user_id, content_id, content_type);

CREATE INDEX IF NOT EXISTS idx_shorts_locked 
ON shorts(is_locked, user_id) WHERE is_locked = true;

CREATE INDEX IF NOT EXISTS idx_posts_locked 
ON "Post"(is_locked, user_id) WHERE is_locked = true;

CREATE INDEX IF NOT EXISTS idx_live_streams_locked 
ON "LiveStream"(host_id) WHERE unlock_amount_kr IS NOT NULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION current_user_id() IS 'Returns the current user ID from application context';
COMMENT ON FUNCTION is_admin(TEXT) IS 'Checks if a user has admin privileges';
COMMENT ON FUNCTION is_system_user() IS 'Checks if the current context is a system operation';
COMMENT ON FUNCTION has_subscription_access(TEXT, TEXT, TEXT) IS 'Checks if user has subscription access to creator content';
COMMENT ON FUNCTION has_unlocked_content(TEXT, TEXT, TEXT) IS 'Checks if user has unlocked specific content';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies applied successfully!';
  RAISE NOTICE 'Tables secured: User, SubscriptionTier, subscriptions, content_unlocks, shorts, Post, LiveStream, wallets, transactions';
END $$;
