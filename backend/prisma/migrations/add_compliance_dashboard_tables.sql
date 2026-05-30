-- Migration: Add Compliance Dashboard Tables
-- Description: Creates compliance_reviews, suspicious_activity_reports, and audit_logs tables
-- Requirements: 2.13.1, 2.13.2
-- Date: 2025-01-XX

-- ═══════════════════════════════════════════════════════════
-- COMPLIANCE REVIEWS TABLE
-- ═══════════════════════════════════════════════════════════
-- Purpose: Manual review workflow for flagged transactions and users
-- Features: Review tracking, decision logging, escalation support

CREATE TABLE IF NOT EXISTS compliance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reviewer_id UUID,
    
    -- Review details
    review_type VARCHAR(50) NOT NULL, -- TRANSACTION, USER_PROFILE, WITHDRAWAL, CHAMA, etc.
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_REVIEW, APPROVED, REJECTED, ESCALATED
    decision VARCHAR(50), -- APPROVE, REJECT, REQUEST_INFO, ESCALATE
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

-- Indexes for compliance_reviews
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_transaction_id ON compliance_reviews(transaction_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_user_id ON compliance_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_reviewer_id ON compliance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_status ON compliance_reviews(status);
CREATE INDEX IF NOT EXISTS idx_compliance_reviews_created_at ON compliance_reviews(created_at);

-- ═══════════════════════════════════════════════════════════
-- SUSPICIOUS ACTIVITY REPORTS TABLE
-- ═══════════════════════════════════════════════════════════
-- Purpose: SAR tracking for regulatory filing
-- Features: Activity tracking, severity classification, regulatory filing support

CREATE TABLE IF NOT EXISTS suspicious_activity_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type VARCHAR(100) NOT NULL, -- SELF_TIPPING, CIRCULAR_TIPPING, RAPID_WITHDRAWAL, CHAMA_FRAUD, etc.
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, FILED, ACKNOWLEDGED, CLOSED
    
    -- Filing details
    filed_at TIMESTAMP,
    filed_by UUID,
    report_number VARCHAR(100), -- Unique SAR number for regulatory tracking
    regulatory_body VARCHAR(100), -- e.g., "FinCEN", "FCA", etc.
    
    -- Supporting data
    related_transactions TEXT[] DEFAULT '{}', -- Array of transaction IDs
    evidence_urls TEXT[] DEFAULT '{}', -- URLs to evidence/screenshots
    metadata JSONB, -- Additional context data
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for suspicious_activity_reports
CREATE INDEX IF NOT EXISTS idx_sar_user_id ON suspicious_activity_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_sar_status ON suspicious_activity_reports(status);
CREATE INDEX IF NOT EXISTS idx_sar_severity ON suspicious_activity_reports(severity);
CREATE INDEX IF NOT EXISTS idx_sar_activity_type ON suspicious_activity_reports(activity_type);
CREATE INDEX IF NOT EXISTS idx_sar_created_at ON suspicious_activity_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_sar_filed_at ON suspicious_activity_reports(filed_at);

-- ═══════════════════════════════════════════════════════════
-- AUDIT LOGS TABLE
-- ═══════════════════════════════════════════════════════════
-- Purpose: Immutable compliance action tracking
-- Features: Complete audit trail, no updates/deletes allowed
-- Security: Append-only table for regulatory compliance

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(100) NOT NULL, -- TRANSACTION_FLAGGED, USER_SUSPENDED, WITHDRAWAL_BLOCKED, KYC_APPROVED, etc.
    performed_by VARCHAR(100) NOT NULL, -- User ID or "SYSTEM" for automated actions
    target_user_id UUID, -- User affected by the action
    
    -- Action details
    action_details JSONB NOT NULL, -- JSONB with full context of the action
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    
    -- Immutable timestamp - no updates or deletes allowed
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (Optional - for enhanced security)
-- ═══════════════════════════════════════════════════════════
-- Uncomment if RLS is enabled on your database

-- Enable RLS on audit_logs to prevent updates/deletes
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT only (no UPDATE or DELETE)
-- CREATE POLICY audit_logs_insert_only ON audit_logs
--     FOR INSERT
--     WITH CHECK (true);

-- Policy: Allow SELECT for compliance officers only
-- CREATE POLICY audit_logs_select_compliance ON audit_logs
--     FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM "user" u
--             WHERE u.id = current_setting('app.current_user_id')::uuid
--             AND u.is_admin = true
--         )
--     );

-- ═══════════════════════════════════════════════════════════
-- COMMENTS FOR DOCUMENTATION
-- ═══════════════════════════════════════════════════════════

COMMENT ON TABLE compliance_reviews IS 'Manual review workflow for flagged transactions and users';
COMMENT ON TABLE suspicious_activity_reports IS 'Suspicious Activity Reports (SAR) for regulatory filing';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all compliance actions (append-only)';

COMMENT ON COLUMN audit_logs.created_at IS 'Immutable timestamp - no updates or deletes allowed on this table';
COMMENT ON COLUMN suspicious_activity_reports.report_number IS 'Unique SAR number for regulatory tracking (e.g., SAR-2025-001234)';
COMMENT ON COLUMN compliance_reviews.decision IS 'Final decision: APPROVE, REJECT, REQUEST_INFO, ESCALATE';
