-- ═══════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY (RLS) IMPLEMENTATION
-- ═══════════════════════════════════════════════════════════
-- This migration implements RLS on all sensitive tables to ensure
-- users can only access their own data at the database level.
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on sensitive tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_contribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE chama_payout ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- USER TABLE POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can view their own profile
CREATE POLICY user_select_own ON "user"
  FOR SELECT
  USING (id = current_setting('app.current_user_id', true)::uuid);

-- Users can update their own profile (except sensitive fields)
CREATE POLICY user_update_own ON "user"
  FOR UPDATE
  USING (id = current_setting('app.current_user_id', true)::uuid);

-- Admins can view all users
CREATE POLICY user_select_admin ON "user"
  FOR SELECT
  USING (current_setting('app.is_admin', true)::boolean = true);

-- Admins can update all users
CREATE POLICY user_update_admin ON "user"
  FOR UPDATE
  USING (current_setting('app.is_admin', true)::boolean = true);

-- ═══════════════════════════════════════════════════════════
-- WALLET TABLE POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can only view their own wallet
CREATE POLICY wallet_select_own ON wallets
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can only update their own wallet
CREATE POLICY wallet_update_own ON wallets
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Admins can view all wallets
CREATE POLICY wallet_select_admin ON wallets
  FOR SELECT
  USING (current_setting('app.is_admin', true)::boolean = true);

-- ═══════════════════════════════════════════════════════════
-- TRANSACTION TABLE POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can only view their own transactions
CREATE POLICY transaction_select_own ON transactions
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can only insert their own transactions
CREATE POLICY transaction_insert_own ON transactions
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Admins can view all transactions
CREATE POLICY transaction_select_admin ON transactions
  FOR SELECT
  USING (current_setting('app.is_admin', true)::boolean = true);

-- ═══════════════════════════════════════════════════════════
-- WITHDRAWAL REQUEST POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can only view their own withdrawal requests
CREATE POLICY withdrawal_select_own ON withdrawal_requests
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can only create their own withdrawal requests
CREATE POLICY withdrawal_insert_own ON withdrawal_requests
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Admins can view all withdrawal requests
CREATE POLICY withdrawal_select_admin ON withdrawal_requests
  FOR SELECT
  USING (current_setting('app.is_admin', true)::boolean = true);

-- Admins can update all withdrawal requests
CREATE POLICY withdrawal_update_admin ON withdrawal_requests
  FOR UPDATE
  USING (current_setting('app.is_admin', true)::boolean = true);

-- ═══════════════════════════════════════════════════════════
-- KYC DOCUMENT POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can only view their own KYC documents
CREATE POLICY kyc_select_own ON kyc_documents
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can only insert their own KYC documents
CREATE POLICY kyc_insert_own ON kyc_documents
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Admins can view all KYC documents
CREATE POLICY kyc_select_admin ON kyc_documents
  FOR SELECT
  USING (current_setting('app.is_admin', true)::boolean = true);

-- Admins can update all KYC documents
CREATE POLICY kyc_update_admin ON kyc_documents
  FOR UPDATE
  USING (current_setting('app.is_admin', true)::boolean = true);

-- ═══════════════════════════════════════════════════════════
-- REFRESH TOKEN POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can only view their own refresh tokens
CREATE POLICY refresh_token_select_own ON refresh_tokens
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can only insert their own refresh tokens
CREATE POLICY refresh_token_insert_own ON refresh_tokens
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can only delete their own refresh tokens
CREATE POLICY refresh_token_delete_own ON refresh_tokens
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- ═══════════════════════════════════════════════════════════
-- SUBSCRIPTION POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can view subscriptions they're part of (as subscriber or creator)
CREATE POLICY subscription_select_own ON subscriptions
  FOR SELECT
  USING (
    subscriber_id = current_setting('app.current_user_id', true)::uuid OR
    creator_id = current_setting('app.current_user_id', true)::uuid
  );

-- Users can only create subscriptions as subscriber
CREATE POLICY subscription_insert_own ON subscriptions
  FOR INSERT
  WITH CHECK (subscriber_id = current_setting('app.current_user_id', true)::uuid);

-- Users can only update their own subscriptions
CREATE POLICY subscription_update_own ON subscriptions
  FOR UPDATE
  USING (subscriber_id = current_setting('app.current_user_id', true)::uuid);

-- ═══════════════════════════════════════════════════════════
-- CONTENT UNLOCK POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can view unlocks they purchased or created
CREATE POLICY content_unlock_select_own ON content_unlocks
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id', true)::uuid OR
    creator_id = current_setting('app.current_user_id', true)::uuid
  );

-- Users can only create their own unlocks
CREATE POLICY content_unlock_insert_own ON content_unlocks
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- ═══════════════════════════════════════════════════════════
-- CHAMA MEMBER POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can only view chamas they're members of
CREATE POLICY chama_member_select_own ON chama_member
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Chama admins can view all members of their chamas
CREATE POLICY chama_member_select_admin ON chama_member
  FOR SELECT
  USING (
    chama_id IN (
      SELECT chama_id FROM chama_member
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
        AND role IN ('ADMIN', 'CHAIRPERSON', 'TREASURER')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- CHAMA WALLET POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can only view wallets of chamas they're members of
CREATE POLICY chama_wallet_select_member ON chama_wallet
  FOR SELECT
  USING (
    chama_id IN (
      SELECT chama_id FROM chama_member
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Only chama admins can update wallet
CREATE POLICY chama_wallet_update_admin ON chama_wallet
  FOR UPDATE
  USING (
    chama_id IN (
      SELECT chama_id FROM chama_member
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
        AND role IN ('ADMIN', 'TREASURER')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- CHAMA CONTRIBUTION POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can view contributions in their chamas
CREATE POLICY chama_contribution_select_member ON chama_contribution
  FOR SELECT
  USING (
    chama_id IN (
      SELECT chama_id FROM chama_member
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Users can only create their own contributions
CREATE POLICY chama_contribution_insert_own ON chama_contribution
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- ═══════════════════════════════════════════════════════════
-- CHAMA PAYOUT POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can view payouts in their chamas
CREATE POLICY chama_payout_select_member ON chama_payout
  FOR SELECT
  USING (
    chama_id IN (
      SELECT chama_id FROM chama_member
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Only chama admins can create payouts
CREATE POLICY chama_payout_insert_admin ON chama_payout
  FOR INSERT
  WITH CHECK (
    chama_id IN (
      SELECT chama_id FROM chama_member
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
        AND role IN ('ADMIN', 'TREASURER')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- MESSAGE POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can view messages they sent or received
CREATE POLICY message_select_own ON messages
  FOR SELECT
  USING (
    sender_id = current_setting('app.current_user_id', true)::uuid OR
    recipient_id = current_setting('app.current_user_id', true)::uuid OR
    chat_id IN (
      SELECT chat_id FROM chat_participant
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Users can only send messages as themselves
CREATE POLICY message_insert_own ON messages
  FOR INSERT
  WITH CHECK (sender_id = current_setting('app.current_user_id', true)::uuid);

-- ═══════════════════════════════════════════════════════════
-- NOTIFICATION POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can only view their own notifications
CREATE POLICY notification_select_own ON notifications
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- Users can only update their own notifications (mark as read)
CREATE POLICY notification_update_own ON notifications
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- ═══════════════════════════════════════════════════════════
-- AUDIT LOG POLICIES
-- ═══════════════════════════════════════════════════════════

-- Users can view their own audit logs
CREATE POLICY audit_log_select_own ON audit_logs
  FOR SELECT
  USING (target_user_id = current_setting('app.current_user_id', true)::uuid);

-- Admins can view all audit logs
CREATE POLICY audit_log_select_admin ON audit_logs
  FOR SELECT
  USING (current_setting('app.is_admin', true)::boolean = true);

-- System can always insert audit logs
CREATE POLICY audit_log_insert_system ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- GRANT PERMISSIONS
-- ═══════════════════════════════════════════════════════════

-- Grant necessary permissions to application role
-- (Adjust role name based on your setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
