-- ============================================================================
-- KRIETA ROW-LEVEL SECURITY (RLS) MIGRATION
-- ============================================================================
-- This migration enables PostgreSQL Row-Level Security on all sensitive tables
-- to prevent unauthorized data access at the database level.
--
-- CRITICAL: This provides defense-in-depth security beyond application-level auth
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL SENSITIVE TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. USERS TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = current_setting('app.current_user_id', true)::uuid);

-- Users can update their own profile (with restrictions)
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (id = current_setting('app.current_user_id', true)::uuid);

-- Admins can view all users
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND is_active = true
    )
  );

-- Admins can update any user
CREATE POLICY "users_update_admin"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND is_active = true
    )
  );

-- ============================================================================
-- 3. WALLETS TABLE POLICIES
-- ============================================================================

-- Users can view their own wallet
CREATE POLICY "wallets_select_own"
  ON wallets FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users CANNOT update wallet directly (only through transactions)
CREATE POLICY "wallets_update_system_only"
  ON wallets FOR UPDATE
  USING (false);

-- Admins can view all wallets
CREATE POLICY "wallets_select_admin"
  ON wallets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND role IN ('SUPER_ADMIN', 'FINANCIAL_ADMIN')
      AND is_active = true
    )
  );

-- ============================================================================
-- 4. TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own transactions
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can create their own transactions
CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Admins can view all transactions
CREATE POLICY "transactions_select_admin"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND role IN ('SUPER_ADMIN', 'FINANCIAL_ADMIN')
      AND is_active = true
    )
  );

-- ============================================================================
-- 5. WITHDRAWAL REQUESTS TABLE POLICIES
-- ============================================================================

-- Users can view their own withdrawal requests
CREATE POLICY "withdrawal_requests_select_own"
  ON withdrawal_requests FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can create their own withdrawal requests
CREATE POLICY "withdrawal_requests_insert_own"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users CANNOT update withdrawal requests (only admins)
CREATE POLICY "withdrawal_requests_update_admin_only"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND role IN ('SUPER_ADMIN', 'FINANCIAL_ADMIN')
      AND is_active = true
    )
  );

-- Admins can view all withdrawal requests
CREATE POLICY "withdrawal_requests_select_admin"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND role IN ('SUPER_ADMIN', 'FINANCIAL_ADMIN')
      AND is_active = true
    )
  );

-- ============================================================================
-- 6. WITHDRAWAL LIMITS TABLE POLICIES
-- ============================================================================

-- Users can view their own withdrawal limits
CREATE POLICY "withdrawal_limits_select_own"
  ON withdrawal_limits FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users CANNOT update withdrawal limits (system only)
CREATE POLICY "withdrawal_limits_update_system_only"
  ON withdrawal_limits FOR UPDATE
  USING (false);

-- Admins can view all withdrawal limits
CREATE POLICY "withdrawal_limits_select_admin"
  ON withdrawal_limits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND role IN ('SUPER_ADMIN', 'FINANCIAL_ADMIN')
      AND is_active = true
    )
  );

-- ============================================================================
-- 7. KYC DOCUMENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own KYC documents
CREATE POLICY "kyc_documents_select_own"
  ON kyc_documents FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can create their own KYC documents
CREATE POLICY "kyc_documents_insert_own"
  ON kyc_documents FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users CANNOT update KYC documents (only admins)
CREATE POLICY "kyc_documents_update_admin_only"
  ON kyc_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND role IN ('SUPER_ADMIN', 'FINANCIAL_ADMIN')
      AND is_active = true
    )
  );

-- Admins can view all KYC documents
CREATE POLICY "kyc_documents_select_admin"
  ON kyc_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND role IN ('SUPER_ADMIN', 'FINANCIAL_ADMIN')
      AND is_active = true
    )
  );

-- ============================================================================
-- 8. SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Users can view subscriptions they're involved in (as subscriber or creator)
CREATE POLICY "subscriptions_select_involved"
  ON subscriptions FOR SELECT
  USING (
    subscriber_id = current_setting('app.current_user_id', true)::uuid
    OR creator_id = current_setting('app.current_user_id', true)::uuid
  );

-- Users can create subscriptions as subscriber
CREATE POLICY "subscriptions_insert_subscriber"
  ON subscriptions FOR INSERT
  WITH CHECK (subscriber_id = current_setting('app.current_user_id', true)::uuid);

-- Users can update their own subscriptions (cancel)
CREATE POLICY "subscriptions_update_own"
  ON subscriptions FOR UPDATE
  USING (subscriber_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================================================
-- 9. SUBSCRIPTION TIERS TABLE POLICIES
-- ============================================================================

-- Anyone can view subscription tiers (public)
CREATE POLICY "subscription_tiers_select_all"
  ON subscription_tiers FOR SELECT
  USING (true);

-- Only creators can create their own tiers
CREATE POLICY "subscription_tiers_insert_own"
  ON subscription_tiers FOR INSERT
  WITH CHECK (creator_id = current_setting('app.current_user_id', true)::uuid);

-- Only creators can update their own tiers
CREATE POLICY "subscription_tiers_update_own"
  ON subscription_tiers FOR UPDATE
  USING (creator_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================================================
-- 10. REFRESH TOKENS TABLE POLICIES
-- ============================================================================

-- Users can view their own refresh tokens
CREATE POLICY "refresh_tokens_select_own"
  ON refresh_tokens FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can create their own refresh tokens
CREATE POLICY "refresh_tokens_insert_own"
  ON refresh_tokens FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can delete their own refresh tokens
CREATE POLICY "refresh_tokens_delete_own"
  ON refresh_tokens FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================================================
-- 11. CHAMA MEMBERS TABLE POLICIES
-- ============================================================================

-- Users can view chama members if they're in the same chama
CREATE POLICY "chama_members_select_same_chama"
  ON chama_members FOR SELECT
  USING (
    chama_id IN (
      SELECT chama_id FROM chama_members
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Users can view their own chama memberships
CREATE POLICY "chama_members_select_own"
  ON chama_members FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================================================
-- 12. CHAMA CONTRIBUTIONS TABLE POLICIES
-- ============================================================================

-- Users can view contributions in chamas they're members of
CREATE POLICY "chama_contributions_select_member"
  ON chama_contributions FOR SELECT
  USING (
    chama_id IN (
      SELECT chama_id FROM chama_members
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Users can create their own contributions
CREATE POLICY "chama_contributions_insert_own"
  ON chama_contributions FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================================================
-- 13. CHAMA PAYOUTS TABLE POLICIES
-- ============================================================================

-- Users can view payouts in chamas they're members of
CREATE POLICY "chama_payouts_select_member"
  ON chama_payouts FOR SELECT
  USING (
    chama_id IN (
      SELECT chama_id FROM chama_members
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Users can create payout requests for themselves
CREATE POLICY "chama_payouts_insert_own"
  ON chama_payouts FOR INSERT
  WITH CHECK (recipient_id = current_setting('app.current_user_id', true)::uuid);

-- ============================================================================
-- 14. CHAMA WALLETS TABLE POLICIES
-- ============================================================================

-- Users can view chama wallets if they're members
CREATE POLICY "chama_wallets_select_member"
  ON chama_wallets FOR SELECT
  USING (
    chama_id IN (
      SELECT chama_id FROM chama_members
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Users CANNOT update chama wallets directly
CREATE POLICY "chama_wallets_update_system_only"
  ON chama_wallets FOR UPDATE
  USING (false);

-- ============================================================================
-- 15. SUSPICIOUS ACTIVITIES TABLE POLICIES
-- ============================================================================

-- Users can view their own suspicious activities
CREATE POLICY "suspicious_activities_select_own"
  ON suspicious_activities FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Only admins can view all suspicious activities
CREATE POLICY "suspicious_activities_select_admin"
  ON suspicious_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
      AND role IN ('SUPER_ADMIN', 'FINANCIAL_ADMIN', 'SECURITY_ADMIN')
      AND is_active = true
    )
  );

-- Only system can create suspicious activities
CREATE POLICY "suspicious_activities_insert_system_only"
  ON suspicious_activities FOR INSERT
  WITH CHECK (false);

-- ============================================================================
-- 16. CREATE HELPER FUNCTION TO SET CURRENT USER
-- ============================================================================

-- This function should be called at the start of each request
-- to set the current user ID for RLS policies
CREATE OR REPLACE FUNCTION set_current_user_id(user_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 17. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION set_current_user_id(uuid) TO PUBLIC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- IMPORTANT: After running this migration, you MUST update your application code
-- to call set_current_user_id() at the start of each authenticated request.
--
-- Example in Express middleware:
-- await prisma.$executeRaw`SELECT set_current_user_id(${userId}::uuid)`;
