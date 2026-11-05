-- ==========================================
-- REMOVE CHAMA & SHOP REVIEWS/WISHLISTS
-- Date: 2026-11-05
-- Description: Cleanup for MVP launch - removing non-essential features
-- ==========================================

BEGIN;

-- 1. Drop Chama Tables (in dependency order - child tables first)
DROP TABLE IF EXISTS chama_vote CASCADE;
DROP TABLE IF EXISTS chama_secondment CASCADE;
DROP TABLE IF EXISTS chama_nomination CASCADE;
DROP TABLE IF EXISTS chama_election CASCADE;
DROP TABLE IF EXISTS chama_defaulter CASCADE;
DROP TABLE IF EXISTS chama_transaction CASCADE;
DROP TABLE IF EXISTS chama_payout_approval CASCADE;
DROP TABLE IF EXISTS chama_payout CASCADE;
DROP TABLE IF EXISTS chama_cycle CASCADE;
DROP TABLE IF EXISTS chama_contribution CASCADE;
DROP TABLE IF EXISTS chama_member CASCADE;
DROP TABLE IF EXISTS chama_wallet CASCADE;
DROP TABLE IF EXISTS chama CASCADE;

-- 2. Drop Shop Review Tables
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS garage_reviews CASCADE;

-- 3. Remove review columns from products (if they exist)
ALTER TABLE products 
  DROP COLUMN IF EXISTS review_count,
  DROP COLUMN IF EXISTS avg_rating;

-- 4. Remove review columns from garage_profiles (if they exist)
ALTER TABLE garage_profiles
  DROP COLUMN IF EXISTS review_count,
  DROP COLUMN IF EXISTS avg_rating;

-- 5. Clean up orphaned Chama transactions
-- This preserves historical data but removes the type association
DELETE FROM transactions 
WHERE type IN ('CHAMA_CONTRIBUTION', 'CHAMA_PAYOUT');

COMMIT;

-- Verification queries (run these after migration)
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%chama%';
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%wishlist%';
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'product_reviews';
