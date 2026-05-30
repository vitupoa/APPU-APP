-- Migration: Update Chama Schema for Compliance
-- Date: 2025-01-XX
-- Requirements: 2.9.1, 2.11.1
-- 
-- Changes:
-- 1. Add kyc_verified_members_only field to chama table (default true)
-- 2. Add device_fingerprint field to chama_member table
-- 3. Convert existing INVESTMENT type chamas to WELFARE type
-- 4. Document notification requirement for affected members

-- ============================================================================
-- STEP 1: Add kyc_verified_members_only field to chama table
-- ============================================================================
-- This field enforces KYC verification for all chama members
-- Default is true to ensure compliance for all new chamas
ALTER TABLE chama 
ADD COLUMN IF NOT EXISTS kyc_verified_members_only BOOLEAN NOT NULL DEFAULT true;

-- ============================================================================
-- STEP 2: Add device_fingerprint field to chama_member table
-- ============================================================================
-- This field helps detect suspicious patterns (same device, multiple accounts)
-- Used for self-tipping and money laundering detection
ALTER TABLE chama_member 
ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(255);

-- Create index for efficient device fingerprint queries
CREATE INDEX IF NOT EXISTS idx_chama_member_device_fingerprint 
ON chama_member(device_fingerprint) 
WHERE device_fingerprint IS NOT NULL;

-- ============================================================================
-- STEP 3: Convert existing INVESTMENT type chamas to WELFARE type
-- ============================================================================
-- INVESTMENT type is removed due to securities regulations
-- All investment chamas are converted to WELFARE type

-- First, check if any INVESTMENT type chamas exist
DO $$
DECLARE
    investment_count INTEGER;
    affected_chama_ids TEXT[];
    affected_member_ids TEXT[];
BEGIN
    -- Count INVESTMENT type chamas (if the type still exists in the enum)
    -- Note: If INVESTMENT has already been removed from the enum, this will fail gracefully
    BEGIN
        SELECT COUNT(*), ARRAY_AGG(id)
        INTO investment_count, affected_chama_ids
        FROM chama
        WHERE type = 'INVESTMENT';
        
        RAISE NOTICE 'Found % INVESTMENT type chamas to convert', investment_count;
        
        IF investment_count > 0 THEN
            -- Get all member IDs from affected chamas for notification
            SELECT ARRAY_AGG(DISTINCT user_id)
            INTO affected_member_ids
            FROM chama_member
            WHERE chama_id = ANY(affected_chama_ids);
            
            RAISE NOTICE 'Affected members: %', affected_member_ids;
            
            -- Convert INVESTMENT chamas to WELFARE type
            UPDATE chama
            SET 
                type = 'WELFARE',
                updated_at = NOW()
            WHERE type = 'INVESTMENT';
            
            RAISE NOTICE 'Successfully converted % INVESTMENT chamas to WELFARE type', investment_count;
            
            -- Log the conversion for audit trail
            -- Note: This assumes a chama_transaction table exists for audit logging
            INSERT INTO chama_transaction (
                id,
                chama_id,
                user_id,
                type,
                amount_kr,
                description,
                created_at
            )
            SELECT 
                gen_random_uuid(),
                c.id,
                c.creator_id,
                'ADMIN_ACTION',
                0,
                'Chama type converted from INVESTMENT to WELFARE for compliance (securities regulations)',
                NOW()
            FROM chama c
            WHERE c.id = ANY(affected_chama_ids);
            
        ELSE
            RAISE NOTICE 'No INVESTMENT type chamas found. Migration complete.';
        END IF;
        
    EXCEPTION
        WHEN invalid_text_representation THEN
            RAISE NOTICE 'INVESTMENT type no longer exists in enum. Skipping conversion.';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error during INVESTMENT chama conversion: %', SQLERRM;
    END;
END $$;

-- ============================================================================
-- STEP 4: Set kyc_verified_members_only to true for all existing chamas
-- ============================================================================
-- Ensure all existing chamas require KYC verification
UPDATE chama 
SET kyc_verified_members_only = true
WHERE kyc_verified_members_only IS NULL OR kyc_verified_members_only = false;

-- ============================================================================
-- NOTIFICATION REQUIREMENT (Manual Action Required)
-- ============================================================================
-- 
-- IMPORTANT: After running this migration, the application MUST send 
-- notifications to all members of converted chamas.
--
-- Notification Message Template:
-- ------------------------------
-- Subject: Important Update to Your Chama
-- 
-- Dear [Member Name],
-- 
-- We're writing to inform you of an important update to your chama "[Chama Name]".
-- 
-- To comply with financial regulations, we've made the following changes:
-- 
-- 1. Your chama type has been updated from "Investment" to "Welfare"
-- 2. All chama members must now complete KYC verification to continue participating
-- 3. The chama's core functionality remains unchanged - you can still contribute 
--    and receive payouts as before
-- 
-- What you need to do:
-- - Complete KYC verification in your profile settings (if not already done)
-- - Review your chama's updated settings
-- - Contact support if you have any questions
-- 
-- These changes help us maintain a safe and compliant platform for all users.
-- 
-- Thank you for your understanding.
-- 
-- The Krieta Team
-- ------------------------------
--
-- Implementation Notes:
-- 1. Query all members from converted chamas
-- 2. Send in-app notification + email
-- 3. Log notification delivery for audit trail
-- 4. Provide support contact for questions
--
-- SQL to get affected members:
-- SELECT DISTINCT u.id, u.email, u.display_name, c.name as chama_name
-- FROM "user" u
-- JOIN chama_member cm ON u.id = cm.user_id
-- JOIN chama c ON cm.chama_id = c.id
-- WHERE c.type = 'WELFARE' 
--   AND c.updated_at >= NOW() - INTERVAL '1 hour'
--   AND EXISTS (
--     SELECT 1 FROM chama_transaction ct 
--     WHERE ct.chama_id = c.id 
--     AND ct.description LIKE '%converted from INVESTMENT%'
--   );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify kyc_verified_members_only field was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'chama' 
  AND column_name = 'kyc_verified_members_only';

-- Verify device_fingerprint field was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'chama_member' 
  AND column_name = 'device_fingerprint';

-- Check if any INVESTMENT type chamas remain (should be 0)
-- Note: This will fail if INVESTMENT has been removed from the enum
-- SELECT COUNT(*) as remaining_investment_chamas
-- FROM chama
-- WHERE type = 'INVESTMENT';

-- Count total chamas by type
SELECT type, COUNT(*) as count
FROM chama
GROUP BY type
ORDER BY type;

-- Check for members without KYC in chamas requiring it
SELECT 
    c.name as chama_name,
    c.kyc_verified_members_only,
    COUNT(cm.id) as total_members,
    COUNT(CASE WHEN u.kyc_status != 'APPROVED' THEN 1 END) as members_without_kyc
FROM chama c
JOIN chama_member cm ON c.id = cm.chama_id
JOIN "user" u ON cm.user_id = u.id
WHERE c.kyc_verified_members_only = true
GROUP BY c.id, c.name, c.kyc_verified_members_only
HAVING COUNT(CASE WHEN u.kyc_status != 'APPROVED' THEN 1 END) > 0;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (Emergency Use Only)
-- ============================================================================
-- 
-- WARNING: Rolling back this migration may cause compliance issues.
-- Only rollback if absolutely necessary and with legal approval.
--
-- To rollback:
-- 1. ALTER TABLE chama DROP COLUMN IF EXISTS kyc_verified_members_only;
-- 2. ALTER TABLE chama_member DROP COLUMN IF EXISTS device_fingerprint;
-- 3. DROP INDEX IF EXISTS idx_chama_member_device_fingerprint;
-- 4. Note: Cannot rollback INVESTMENT -> WELFARE conversion without data loss
--
-- ============================================================================
