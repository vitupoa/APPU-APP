# Chama Schema Compliance Update Migration

## Overview
This migration updates the Chama schema to comply with financial regulations by:
1. Removing the INVESTMENT chama type (securities regulations)
2. Adding KYC verification requirements for chama members
3. Adding device fingerprinting for fraud detection

## Requirements
- **Requirement 2.9.1**: Remove 'INVESTMENT' from ChamaType enum
- **Requirement 2.11.1**: KYC Requirements for Chama

## Changes

### 1. Chama Table
**Added Field**: `kyc_verified_members_only` (BOOLEAN, default: true)
- Enforces KYC verification for all chama members
- Default is `true` to ensure compliance for all new chamas
- Existing chamas are updated to require KYC

### 2. ChamaMember Table
**Added Field**: `device_fingerprint` (VARCHAR(255), nullable)
- Stores device fingerprint for fraud detection
- Used to detect:
  - Same device creating multiple accounts
  - Circular tipping patterns
  - Self-tipping through fake chamas
- Index created for efficient queries

### 3. Data Migration
**INVESTMENT → WELFARE Conversion**
- All existing INVESTMENT type chamas are converted to WELFARE type
- Conversion is logged in `chama_transaction` table for audit trail
- Affected members are identified for notification

## Migration File
`update_chama_schema_compliance.sql`

## Running the Migration

### Option 1: Using Prisma Migrate (Recommended)
```bash
# Generate migration from schema changes
npx prisma migrate dev --name update_chama_schema_compliance

# Or apply existing migration
npx prisma migrate deploy
```

### Option 2: Manual SQL Execution
```bash
# Connect to database
psql -U your_username -d your_database

# Run migration
\i backend/prisma/migrations/update_chama_schema_compliance.sql
```

## Post-Migration Actions

### 1. Send Notifications to Affected Members
After running the migration, you MUST notify all members of converted chamas.

**Query to get affected members:**
```sql
SELECT DISTINCT 
    u.id, 
    u.email, 
    u.display_name, 
    c.name as chama_name,
    c.id as chama_id
FROM "user" u
JOIN chama_member cm ON u.id = cm.user_id
JOIN chama c ON cm.chama_id = c.id
WHERE c.type = 'WELFARE' 
  AND c.updated_at >= NOW() - INTERVAL '1 hour'
  AND EXISTS (
    SELECT 1 FROM chama_transaction ct 
    WHERE ct.chama_id = c.id 
    AND ct.description LIKE '%converted from INVESTMENT%'
  );
```

**Notification Template:**
```
Subject: Important Update to Your Chama

Dear [Member Name],

We're writing to inform you of an important update to your chama "[Chama Name]".

To comply with financial regulations, we've made the following changes:

1. Your chama type has been updated from "Investment" to "Welfare"
2. All chama members must now complete KYC verification to continue participating
3. The chama's core functionality remains unchanged - you can still contribute 
   and receive payouts as before

What you need to do:
- Complete KYC verification in your profile settings (if not already done)
- Review your chama's updated settings
- Contact support if you have any questions

These changes help us maintain a safe and compliant platform for all users.

Thank you for your understanding.

The Krieta Team
```

### 2. Verify Migration Success
```sql
-- Check kyc_verified_members_only field
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'chama' 
  AND column_name = 'kyc_verified_members_only';

-- Check device_fingerprint field
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'chama_member' 
  AND column_name = 'device_fingerprint';

-- Count chamas by type (should have no INVESTMENT)
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
```

### 3. Update Application Code
Ensure the following code changes are made:

**Backend:**
- Update chama creation logic to enforce `kyc_verified_members_only`
- Add device fingerprint capture on chama member join
- Block non-KYC users from joining chamas with `kyc_verified_members_only = true`
- Update chama type validation to reject INVESTMENT type

**Frontend:**
- Remove INVESTMENT option from chama creation UI
- Show KYC requirement badge on chamas
- Prompt users to complete KYC when joining chamas
- Display device fingerprint consent message

## Backward Compatibility

### Breaking Changes
1. **INVESTMENT type removed**: Any code referencing INVESTMENT type will fail
2. **KYC enforcement**: Non-KYC users cannot join chamas with `kyc_verified_members_only = true`

### Non-Breaking Changes
1. **device_fingerprint**: Nullable field, existing records remain valid
2. **kyc_verified_members_only**: Default true, but existing chamas can be updated

## Rollback Instructions

⚠️ **WARNING**: Rolling back this migration may cause compliance issues. Only rollback if absolutely necessary and with legal approval.

```sql
-- Remove added fields
ALTER TABLE chama DROP COLUMN IF EXISTS kyc_verified_members_only;
ALTER TABLE chama_member DROP COLUMN IF EXISTS device_fingerprint;
DROP INDEX IF EXISTS idx_chama_member_device_fingerprint;

-- Note: Cannot rollback INVESTMENT -> WELFARE conversion without data loss
-- You would need to manually identify and update converted chamas
```

## Testing Checklist

- [ ] Migration runs successfully without errors
- [ ] `kyc_verified_members_only` field exists in chama table with default true
- [ ] `device_fingerprint` field exists in chama_member table
- [ ] Index on device_fingerprint is created
- [ ] No INVESTMENT type chamas remain in database
- [ ] Affected members are identified and notified
- [ ] KYC enforcement works in application code
- [ ] Device fingerprint is captured on member join
- [ ] Chama creation UI no longer shows INVESTMENT option

## Related Files
- Schema: `backend/prisma/schema.prisma`
- Migration: `backend/prisma/migrations/update_chama_schema_compliance.sql`
- Requirements: `.kiro/specs/wallet-compliance-restructuring/requirements.md`
- Design: `.kiro/specs/wallet-compliance-restructuring/design.md`

## Support
For questions or issues with this migration, contact:
- Technical Lead: [Your Name]
- Compliance Officer: [Compliance Contact]
- Support: support@krieta.com
