# Compliance Dashboard Tables

## Overview
This migration adds three critical tables for the compliance dashboard to support manual review workflows, suspicious activity reporting, and immutable audit logging.

## Requirements
- **Requirement 2.13.1**: Flagged Transactions Review
- **Requirement 2.13.2**: Suspicious Activity Reports

## Tables Created

### 1. `compliance_reviews`
**Purpose**: Manual review workflow for flagged transactions and users

**Fields**:
- `id` (UUID): Primary key
- `transaction_id` (UUID): Reference to flagged transaction
- `user_id` (UUID): User being reviewed
- `reviewer_id` (UUID): Compliance officer performing review
- `review_type` (VARCHAR): Type of review (TRANSACTION, USER_PROFILE, WITHDRAWAL, CHAMA, etc.)
- `status` (VARCHAR): Review status (PENDING, IN_REVIEW, APPROVED, REJECTED, ESCALATED)
- `decision` (VARCHAR): Final decision (APPROVE, REJECT, REQUEST_INFO, ESCALATE)
- `notes` (TEXT): Review notes and reasoning
- `created_at` (TIMESTAMP): When review was created
- `reviewed_at` (TIMESTAMP): When review was completed

**Indexes**:
- `transaction_id` - Fast lookup by transaction
- `user_id` - Fast lookup by user
- `reviewer_id` - Track reviews by officer
- `status` - Filter by review status
- `created_at` - Sort by date

**Use Cases**:
- Compliance officers review flagged transactions
- Track review decisions and reasoning
- Escalate complex cases to senior officers
- Generate compliance reports

---

### 2. `suspicious_activity_reports`
**Purpose**: SAR (Suspicious Activity Report) tracking for regulatory filing

**Fields**:
- `id` (UUID): Primary key
- `user_id` (UUID): User involved in suspicious activity
- `activity_type` (VARCHAR): Type of activity (SELF_TIPPING, CIRCULAR_TIPPING, RAPID_WITHDRAWAL, CHAMA_FRAUD, etc.)
- `description` (TEXT): Detailed description of suspicious activity
- `severity` (VARCHAR): Severity level (LOW, MEDIUM, HIGH, CRITICAL)
- `status` (VARCHAR): SAR status (DRAFT, FILED, ACKNOWLEDGED, CLOSED)
- `filed_at` (TIMESTAMP): When SAR was filed with regulators
- `filed_by` (UUID): Compliance officer who filed the SAR
- `report_number` (VARCHAR): Unique SAR number for regulatory tracking (e.g., SAR-2025-001234)
- `regulatory_body` (VARCHAR): Regulatory body SAR was filed with (e.g., "FinCEN", "FCA")
- `related_transactions` (TEXT[]): Array of transaction IDs related to the activity
- `evidence_urls` (TEXT[]): URLs to evidence/screenshots
- `metadata` (JSONB): Additional context data
- `created_at` (TIMESTAMP): When SAR was created
- `updated_at` (TIMESTAMP): Last update timestamp

**Indexes**:
- `user_id` - Fast lookup by user
- `status` - Filter by SAR status
- `severity` - Filter by severity
- `activity_type` - Filter by activity type
- `created_at` - Sort by creation date
- `filed_at` - Sort by filing date

**Use Cases**:
- Create draft SARs for suspicious activity
- File SARs with regulatory bodies
- Track SAR acknowledgments and closures
- Generate regulatory reports
- Link multiple transactions to a single SAR

---

### 3. `audit_logs`
**Purpose**: Immutable audit trail for all compliance actions

**Fields**:
- `id` (UUID): Primary key
- `action_type` (VARCHAR): Type of action (TRANSACTION_FLAGGED, USER_SUSPENDED, WITHDRAWAL_BLOCKED, KYC_APPROVED, etc.)
- `performed_by` (VARCHAR): User ID or "SYSTEM" for automated actions
- `target_user_id` (UUID): User affected by the action
- `action_details` (JSONB): Full context of the action
- `ip_address` (VARCHAR): IP address of the action performer
- `user_agent` (TEXT): User agent string
- `created_at` (TIMESTAMP): When action was performed (immutable)

**Indexes**:
- `action_type` - Filter by action type
- `performed_by` - Track actions by user/system
- `target_user_id` - Track actions affecting a user
- `created_at` - Sort by date

**Security**:
- **Append-only table**: No updates or deletes allowed
- **Immutable records**: Once created, records cannot be modified
- **7-year retention**: Required for regulatory compliance
- **Row Level Security**: Optional RLS policies included in migration (commented out)

**Use Cases**:
- Complete audit trail for regulatory compliance
- Track all compliance actions (manual and automated)
- Investigate user activity history
- Generate compliance reports
- Forensic analysis of suspicious activity

---

## Migration Instructions

### Apply Migration
```bash
# Using Prisma
npx prisma migrate dev --name add_compliance_dashboard_tables

# Or apply SQL directly
psql -U your_user -d your_database -f add_compliance_dashboard_tables.sql
```

### Verify Migration
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('compliance_reviews', 'suspicious_activity_reports', 'audit_logs');

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('compliance_reviews', 'suspicious_activity_reports', 'audit_logs');
```

---

## Usage Examples

### 1. Create a Compliance Review
```typescript
await prisma.compliance_reviews.create({
  data: {
    transaction_id: 'txn-123',
    user_id: 'user-456',
    reviewer_id: 'admin-789',
    review_type: 'TRANSACTION',
    status: 'PENDING',
    notes: 'Flagged for high velocity - 50 transactions in 1 hour'
  }
});
```

### 2. File a Suspicious Activity Report
```typescript
await prisma.suspicious_activity_reports.create({
  data: {
    user_id: 'user-456',
    activity_type: 'SELF_TIPPING',
    description: 'User tipping themselves through multiple accounts',
    severity: 'HIGH',
    status: 'FILED',
    filed_at: new Date(),
    filed_by: 'admin-789',
    report_number: 'SAR-2025-001234',
    regulatory_body: 'FinCEN',
    related_transactions: ['txn-123', 'txn-124', 'txn-125'],
    evidence_urls: ['https://evidence.example.com/screenshot1.png'],
    metadata: {
      device_fingerprint: 'abc123',
      ip_addresses: ['192.168.1.1', '192.168.1.2']
    }
  }
});
```

### 3. Log an Audit Event
```typescript
await prisma.audit_logs.create({
  data: {
    action_type: 'USER_SUSPENDED',
    performed_by: 'admin-789',
    target_user_id: 'user-456',
    action_details: {
      reason: 'Suspicious activity detected',
      risk_score: 85,
      flagged_transactions: ['txn-123', 'txn-124'],
      suspension_duration: '30 days'
    },
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0...'
  }
});
```

---

## Compliance Dashboard Queries

### Get Pending Reviews
```sql
SELECT * FROM compliance_reviews
WHERE status = 'PENDING'
ORDER BY created_at DESC;
```

### Get High-Severity SARs
```sql
SELECT * FROM suspicious_activity_reports
WHERE severity IN ('HIGH', 'CRITICAL')
AND status = 'DRAFT'
ORDER BY created_at DESC;
```

### Get Audit Trail for User
```sql
SELECT * FROM audit_logs
WHERE target_user_id = 'user-456'
ORDER BY created_at DESC;
```

### Get Recent Compliance Actions
```sql
SELECT 
  action_type,
  performed_by,
  target_user_id,
  created_at
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## Security Considerations

### Audit Logs Immutability
The `audit_logs` table is designed to be **append-only**:
- No UPDATE operations allowed
- No DELETE operations allowed
- Only INSERT and SELECT operations permitted

To enforce this at the database level, uncomment the Row Level Security (RLS) policies in the migration file.

### Access Control
- Only compliance officers should have access to these tables
- Implement role-based access control (RBAC) in your application
- Log all access to compliance data in `audit_logs`

### Data Retention
- **Audit logs**: 7 years (regulatory requirement)
- **SARs**: 5 years minimum
- **Compliance reviews**: 3 years minimum

---

## Rollback

If you need to rollback this migration:

```sql
-- Drop tables (WARNING: This will delete all data)
DROP TABLE IF EXISTS compliance_reviews CASCADE;
DROP TABLE IF EXISTS suspicious_activity_reports CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
```

---

## Related Files
- Migration SQL: `add_compliance_dashboard_tables.sql`
- Schema: `backend/prisma/schema.prisma`
- Requirements: `.kiro/specs/wallet-compliance-restructuring/requirements.md`
- Design: `.kiro/specs/wallet-compliance-restructuring/design.md`

---

## Next Steps
1. Apply the migration
2. Implement compliance dashboard UI
3. Create API endpoints for compliance officers
4. Set up automated SAR generation for high-risk patterns
5. Configure audit log retention policies
6. Implement RLS policies for production
