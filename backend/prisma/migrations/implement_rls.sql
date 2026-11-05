-- ==========================================
-- ROW LEVEL SECURITY (RLS) IMPLEMENTATION
-- Date: 2026-11-05
-- Description: Implement database-level access control
-- ==========================================

-- Enable RLS on critical tables
BEGIN;

-- ==========================================
-- 1. ENABLE RLS ON SENSITIVE TABLES
-- ==========================================

-- User data
ALTER TABLE user ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Financial data
ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_approvals ENABLE ROW LEVEL SECURITY;

-- Private messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participant ENABLE ROW LEVEL SECURITY;

-- KYC data
ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

-- Contest submissions
ALTER TABLE contest_submissions ENABLE ROW LEVEL SECURITY;

-- Marketplace
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. CREATE RLS POLICIES FOR USER TABLE
-- ==========================================

-- Users can view their own data
CREATE POLICY user_view_own ON user
  FOR SELECT
  USING (id = current_setting('app.current_user_id', true)::text);

-- Users can update their own profile
CREATE POLICY user_update_own ON user
  FOR UPDATE
  USING (id = current_setting('app.current_user_id', true)::text);

-- Admins can view all users
CREATE POLICY admin_view_all_users ON user
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_profile ap
      WHERE ap.user_id = current_setting('app.current_user_id', true)::text
        AND ap.is_active = true
    )
  );

-- ==========================================
-- 3. WALLET & TRANSACTIONS
-- ==========================================

-- Users can only see their own wallet
CREATE POLICY wallet_own ON wallets
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- Users can only see their own transactions
CREATE POLICY transaction_own ON transactions
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- Users can insert their own transactions (via app logic)
CREATE POLICY transaction_insert_own ON transactions
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

-- Admins can view all transactions
CREATE POLICY admin_view_all_transactions ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profile ap
      WHERE ap.user_id = current_setting('app.current_user_id', true)::text
        AND ap.is_active = true
    )
  );

-- ==========================================
-- 4. WITHDRAWAL REQUESTS
-- ==========================================

-- Users can only see their own withdrawal requests
CREATE POLICY withdrawal_own ON withdrawal_requests
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- Users can create their own withdrawal requests
CREATE POLICY withdrawal_insert_own ON withdrawal_requests
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

-- Admins can view/update all withdrawal requests
CREATE POLICY admin_manage_withdrawals ON withdrawal_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_profile ap
      WHERE ap.user_id = current_setting('app.current_user_id', true)::text
        AND ap.is_active = true
    )
  );

-- ==========================================
-- 5. MESSAGES & CHAT
-- ==========================================

-- Users can only see messages in chats they're part of
CREATE POLICY message_participant_only ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participant cp
      WHERE cp.chat_id = messages.chat_id
        AND cp.user_id = current_setting('app.current_user_id', true)::text
    )
  );

-- Users can send messages to chats they're part of
CREATE POLICY message_send_participant ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = current_setting('app.current_user_id', true)::text
    AND EXISTS (
      SELECT 1 FROM chat_participant cp
      WHERE cp.chat_id = messages.chat_id
        AND cp.user_id = current_setting('app.current_user_id', true)::text
    )
  );

-- ==========================================
-- 6. KYC VERIFICATIONS
-- ==========================================

-- Users can only view their own KYC data
CREATE POLICY kyc_own ON kyc_verifications
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- Users can submit their own KYC
CREATE POLICY kyc_submit_own ON kyc_verifications
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

-- Admins can view/update all KYC verifications
CREATE POLICY admin_manage_kyc ON kyc_verifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_profile ap
      WHERE ap.user_id = current_setting('app.current_user_id', true)::text
        AND ap.is_active = true
    )
  );

-- ==========================================
-- 7. CONTEST SUBMISSIONS
-- ==========================================

-- Users can view their own submissions
CREATE POLICY submission_own ON contest_submissions
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- Users can create their own submissions
CREATE POLICY submission_create_own ON contest_submissions
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::text);

-- Contest creators can view all submissions for their contests
CREATE POLICY creator_view_submissions ON contest_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contest c
      WHERE c.id = contest_submissions.contest_id
        AND c.creator_id = current_setting('app.current_user_id', true)::text
    )
  );

-- ==========================================
-- 8. INFLUENCER PROFILES & SOCIAL MEDIA
-- ==========================================

-- Users can only manage their own influencer profile
CREATE POLICY influencer_profile_own ON influencer_profiles
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true)::text);

-- Users can only manage their own social media accounts
CREATE POLICY social_media_own ON social_media_accounts
  FOR ALL
  USING (influencer_id = current_setting('app.current_user_id', true)::text);

-- ==========================================
-- 9. ESCROW ACCOUNTS
-- ==========================================

-- Contest creators can view their own escrow accounts
CREATE POLICY escrow_creator ON escrow_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contest c
      WHERE c.id = escrow_accounts.contest_id
        AND c.creator_id = current_setting('app.current_user_id', true)::text
    )
  );

-- Super admins can manage all escrow accounts
CREATE POLICY admin_manage_escrow ON escrow_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_profile ap
      WHERE ap.user_id = current_setting('app.current_user_id', true)::text
        AND ap.role = 'SUPER_ADMIN'
        AND ap.is_active = true
    )
  );

-- ==========================================
-- 10. FUNCTION TO SET CURRENT USER
-- ==========================================

-- Helper function to set current user in session
-- Call this from your app: SELECT set_current_user_id('user-id');
CREATE OR REPLACE FUNCTION set_current_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Run these to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
-- SELECT * FROM pg_policies WHERE schemaname = 'public';
