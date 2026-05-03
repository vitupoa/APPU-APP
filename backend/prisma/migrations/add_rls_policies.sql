-- =====================================================
-- ROW-LEVEL SECURITY (RLS) IMPLEMENTATION
-- Migration: Add RLS policies for subscription and content lock systems
-- =====================================================

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function: Get current user ID from application context
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  -- Get user ID from session variable set by application
  RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  user_id := COALESCE(check_user_id, current_user_id());
  
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM users
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
  subscriber_id UUID,
  creator_id UUID,
  required_tier TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  tier_order TEXT[] := ARRAY['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN'];
  required_index INT;
  subscribed_index INT;
BEGIN
  -- If no tier required, no subscription needed
  IF required_tier IS NULL THEN
    RETURN false;
  END IF;

  -- Get tier indexes
  required_index := array_position(tier_order, required_tier);
  
  IF required_index IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check active subscription
  SELECT array_position(tier_order, tier::TEXT) INTO subscribed_index
  FROM subscriptions
  WHERE subscriptions.subscriber_id = has_subscription_access.subscriber_id
    AND subscriptions.creator_id = has_subscription_access.creator_id
    AND status::TEXT = 'active'
  LIMIT 1;

  -- Return true if subscribed tier >= required tier
  RETURN subscribed_index IS NOT NULL AND subscribed_index >= required_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check if content is unlocked by user
CREATE OR REPLACE FUNCTION has_unlocked_content(
  check_user_id UUID,
  check_content_id UUID,
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

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can manage their own tiers
CREATE POLICY subscription_tiers_creator_manage
ON subscription_tiers
FOR ALL
USING (creator_id::TEXT = current_user_id()::TEXT OR is_admin() OR is_system_user())
WITH CHECK (creator_id::TEXT = current_user_id()::TEXT OR is_admin() OR is_system_user());

-- Policy: Everyone can view enabled tiers
CREATE POLICY subscription_tiers_public_read
ON subscription_tiers
FOR SELECT
USING (is_enabled = true OR creator_id::TEXT = current_user_id()::TEXT OR is_admin());

-- =====================================================
-- SUBSCRIPTIONS TABLE RLS
-- =====================================================

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions (as subscriber)
CREATE POLICY subscriptions_subscriber_read
ON subscriptions
FOR SELECT
USING (subscriber_id::TEXT = current_user_id()::TEXT OR is_admin());

-- Policy: Creators can view subscriptions to them
CREATE POLICY subscriptions_creator_read
ON subscriptions
FOR SELECT
USING (creator_id::TEXT = current_user_id()::TEXT OR is_admin());

-- Policy: System can create subscriptions
CREATE POLICY subscriptions_system_create
ON subscriptions
FOR INSERT
WITH CHECK (is_system_user() OR is_admin());

-- Policy: System can update subscriptions (for renewals, cancellations)
CREATE POLICY subscriptions_system_update
ON subscriptions
FOR UPDATE
USING (is_system_user() OR is_admin())
WITH CHECK (is_system_user() OR is_admin());

-- Policy: Subscribers can cancel their own subscriptions
CREATE POLICY subscriptions_subscriber_cancel
ON subscriptions
FOR UPDATE
USING (
  subscriber_id::TEXT = current_user_id()::TEXT 
  AND status = 'active'
)
WITH CHECK (
  subscriber_id::TEXT = current_user_id()::TEXT 
  AND status IN ('cancelled', 'active')
);

-- Policy: No direct deletes (use status instead)
CREATE POLICY subscriptions_no_delete
ON subscriptions
FOR DELETE
USING (is_admin());

-- =====================================================
-- CONTENT UNLOCKS TABLE RLS
-- =====================================================

-- Enable RLS
ALTER TABLE content_unlocks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own unlocks
CREATE POLICY content_unlocks_user_read
ON content_unlocks
FOR SELECT
USING (user_id::TEXT = current_user_id()::TEXT OR is_admin());

-- Policy: Creators can view unlocks of their content
CREATE POLICY content_unlocks_creator_read
ON content_unlocks
FOR SELECT
USING (creator_id::TEXT = current_user_id()::TEXT OR is_admin());

-- Policy: Only system can create unlocks
CREATE POLICY content_unlocks_system_create
ON content_unlocks
FOR INSERT
WITH CHECK (is_system_user() OR is_admin());

-- Policy: No updates allowed (immutable)
CREATE POLICY content_unlocks_no_update
ON content_unlocks
FOR UPDATE
USING (false);

-- Policy: No deletes allowed (immutable)
CREATE POLICY content_unlocks_no_delete
ON content_unlocks
FOR DELETE
USING (is_admin());

-- =====================================================
-- SHORTS TABLE RLS
-- =====================================================

-- Enable RLS
ALTER TABLE shorts ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can manage their own shorts
CREATE POLICY shorts_creator_manage
ON shorts
FOR ALL
USING (user_id::TEXT = current_user_id()::TEXT OR is_admin())
WITH CHECK (user_id::TEXT = current_user_id()::TEXT OR is_admin());

-- Policy: Users can view unlocked or accessible shorts
CREATE POLICY shorts_user_read
ON shorts
FOR SELECT
USING (
  -- Not locked
  is_locked = false 
  -- Or is creator
  OR user_id::TEXT = current_user_id()::TEXT
  -- Or has subscription access
  OR (required_tier IS NOT NULL AND has_subscription_access(current_user_id(), user_id, required_tier::TEXT))
  -- Or has unlocked
  OR (unlock_amount_kr IS NOT NULL AND has_unlocked_content(current_user_id(), id, 'SHORT'))
  -- Or is admin
  OR is_admin()
);

-- =====================================================
-- POSTS TABLE RLS
-- =====================================================

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can manage their own posts
CREATE POLICY posts_creator_manage
ON posts
FOR ALL
USING (user_id::TEXT = current_user_id()::TEXT OR is_admin())
WITH CHECK (user_id::TEXT = current_user_id()::TEXT OR is_admin());

-- Policy: Users can view unlocked or accessible posts
CREATE POLICY posts_user_read
ON posts
FOR SELECT
USING (
  -- Not locked
  is_locked = false 
  -- Or is creator
  OR user_id::TEXT = current_user_id()::TEXT
  -- Or has subscription access
  OR (required_tier IS NOT NULL AND has_subscription_access(current_user_id(), user_id, required_tier::TEXT))
  -- Or has unlocked
  OR (unlock_amount_kr IS NOT NULL AND has_unlocked_content(current_user_id(), id, 'POST'))
  -- Or is admin
  OR is_admin()
);

-- =====================================================
-- LIVE STREAMS TABLE RLS
-- =====================================================

-- Enable RLS
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- Policy: Hosts can manage their own streams
CREATE POLICY live_streams_host_manage
ON live_streams
FOR ALL
USING (host_id::TEXT = current_user_id()::TEXT OR is_admin())
WITH CHECK (host_id::TEXT = current_user_id()::TEXT OR is_admin());

-- Policy: Users can view accessible streams
CREATE POLICY live_streams_user_read
ON live_streams
FOR SELECT
USING (
  -- No unlock amount (free)
  unlock_amount_kr IS NULL
  -- Or is host
  OR host_id::TEXT = current_user_id()::TEXT
  -- Or has unlocked
  OR (unlock_amount_kr IS NOT NULL AND has_unlocked_content(current_user_id(), id, 'LIVE'))
  -- Or is admin
  OR is_admin()
);

-- =====================================================
-- WALLETS TABLE RLS (Additional Security)
-- =====================================================

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own wallet
CREATE POLICY wallets_owner_read
ON wallets
FOR SELECT
USING (user_id::TEXT = current_user_id()::TEXT OR is_admin());

-- Policy: Only system can modify wallets
CREATE POLICY wallets_system_modify
ON wallets
FOR ALL
USING (is_system_user() OR is_admin())
WITH CHECK (is_system_user() OR is_admin());

-- =====================================================
-- TRANSACTIONS TABLE RLS (Additional Security)
-- =====================================================

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY transactions_owner_read
ON transactions
FOR SELECT
USING (user_id::TEXT = current_user_id()::TEXT OR is_admin());

-- Policy: Only system can create transactions
CREATE POLICY transactions_system_create
ON transactions
FOR INSERT
WITH CHECK (is_system_user() OR is_admin());

-- Policy: No updates or deletes (immutable)
CREATE POLICY transactions_no_update
ON transactions
FOR UPDATE
USING (is_admin());

CREATE POLICY transactions_no_delete
ON transactions
FOR DELETE
USING (is_admin());

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- =====================================================

-- Grant execute on helper functions to application role
GRANT EXECUTE ON FUNCTION current_user_id() TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO PUBLIC;
GRANT EXECUTE ON FUNCTION is_system_user() TO PUBLIC;
GRANT EXECUTE ON FUNCTION has_subscription_access(UUID, UUID, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION has_unlocked_content(UUID, UUID, TEXT) TO PUBLIC;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for subscription access checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_access 
ON subscriptions(subscriber_id, creator_id, status, tier);

-- Index for content unlock checks
CREATE INDEX IF NOT EXISTS idx_content_unlocks_access 
ON content_unlocks(user_id, content_id, content_type);

-- Index for locked content queries
CREATE INDEX IF NOT EXISTS idx_shorts_locked 
ON shorts(is_locked, user_id) WHERE is_locked = true;

CREATE INDEX IF NOT EXISTS idx_posts_locked 
ON posts(is_locked, user_id) WHERE is_locked = true;

CREATE INDEX IF NOT EXISTS idx_live_streams_locked 
ON live_streams(host_id) WHERE unlock_amount_kr IS NOT NULL;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION current_user_id() IS 'Returns the current user ID from application context';
COMMENT ON FUNCTION is_admin(UUID) IS 'Checks if a user has admin privileges';
COMMENT ON FUNCTION is_system_user() IS 'Checks if the current context is a system operation';
COMMENT ON FUNCTION has_subscription_access(UUID, UUID, TEXT) IS 'Checks if user has subscription access to creator content';
COMMENT ON FUNCTION has_unlocked_content(UUID, UUID, TEXT) IS 'Checks if user has unlocked specific content';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'subscription_tiers', 
  'subscriptions', 
  'content_unlocks', 
  'shorts', 
  'posts', 
  'live_streams',
  'wallets',
  'transactions'
);

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN (
  'subscription_tiers', 
  'subscriptions', 
  'content_unlocks', 
  'shorts', 
  'posts', 
  'live_streams',
  'wallets',
  'transactions'
)
ORDER BY tablename, policyname;
