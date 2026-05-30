# Prisma Schema Additions for Compliance Tables

## 📋 Instructions

Add these models to your `backend/prisma/schema.prisma` file, then run:
```bash
npx prisma generate
```

---

## 📄 Models to Add

```prisma
// ═══════════════════════════════════════════════════════════
// COMPLIANCE DASHBOARD MODELS
// ═══════════════════════════════════════════════════════════

/// Manual review workflow for flagged transactions and users
model ComplianceReview {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  transaction_id String    @db.Uuid
  user_id        String    @db.Uuid
  reviewer_id    String?   @db.Uuid
  
  // Review details
  review_type    String    @db.VarChar(50)  // TRANSACTION, USER_PROFILE, WITHDRAWAL, CHAMA, etc.
  status         String    @default("PENDING") @db.VarChar(50)  // PENDING, IN_REVIEW, APPROVED, REJECTED, ESCALATED
  decision       String?   @db.VarChar(50)  // APPROVE, REJECT, REQUEST_INFO, ESCALATE
  notes          String?   @db.Text
  
  // Timestamps
  created_at     DateTime  @default(now())
  reviewed_at    DateTime?

  @@map("compliance_reviews")
  @@index([transaction_id])
  @@index([user_id])
  @@index([reviewer_id])
  @@index([status])
  @@index([created_at])
}

/// Suspicious Activity Reports (SAR) for regulatory filing
model SuspiciousActivityReport {
  id                   String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id              String    @db.Uuid
  activity_type        String    @db.VarChar(100)  // SELF_TIPPING, CIRCULAR_TIPPING, RAPID_WITHDRAWAL, CHAMA_FRAUD, etc.
  description          String    @db.Text
  severity             String    @db.VarChar(20)  // LOW, MEDIUM, HIGH, CRITICAL
  status               String    @default("DRAFT") @db.VarChar(50)  // DRAFT, FILED, ACKNOWLEDGED, CLOSED
  
  // Filing details
  filed_at             DateTime?
  filed_by             String?   @db.Uuid
  report_number        String?   @db.VarChar(100)  // Unique SAR number (e.g., SAR-2025-001234)
  regulatory_body      String?   @db.VarChar(100)  // e.g., "FinCEN", "FCA", etc.
  
  // Supporting data
  related_transactions String[]  @default([])  // Array of transaction IDs
  evidence_urls        String[]  @default([])  // URLs to evidence/screenshots
  metadata             Json?     // Additional context data
  
  // Timestamps
  created_at           DateTime  @default(now())
  updated_at           DateTime  @default(now()) @updatedAt

  @@map("suspicious_activity_reports")
  @@index([user_id])
  @@index([status])
  @@index([severity])
  @@index([activity_type])
  @@index([created_at])
  @@index([filed_at])
}

/// Immutable audit trail for all compliance actions (append-only)
model AuditLog {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  action_type     String   @db.VarChar(100)  // TRANSACTION_FLAGGED, USER_SUSPENDED, WITHDRAWAL_BLOCKED, KYC_APPROVED, etc.
  performed_by    String   @db.VarChar(100)  // User ID or "SYSTEM" for automated actions
  target_user_id  String?  @db.Uuid  // User affected by the action
  
  // Action details
  action_details  Json     // JSONB with full context of the action
  ip_address      String?  @db.VarChar(45)  // IPv4 or IPv6
  user_agent      String?  @db.Text
  
  // Immutable timestamp - no updates or deletes allowed
  created_at      DateTime @default(now())

  @@map("audit_logs")
  @@index([action_type])
  @@index([performed_by])
  @@index([target_user_id])
  @@index([created_at])
}
```

---

## 🔧 After Adding to Schema

### Step 1: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 2: Verify Types
The following types will be available:
```typescript
import { ComplianceReview, SuspiciousActivityReport, AuditLog } from '@prisma/client';
```

### Step 3: Test Queries
```typescript
// Test compliance reviews
const reviews = await prisma.complianceReview.findMany({
  where: { status: 'PENDING' },
  orderBy: { created_at: 'desc' }
});

// Test SARs
const sars = await prisma.suspiciousActivityReport.findMany({
  where: { severity: 'HIGH' },
  orderBy: { created_at: 'desc' }
});

// Test audit logs
const logs = await prisma.auditLog.findMany({
  where: { action_type: 'USER_SUSPENDED' },
  orderBy: { created_at: 'desc' },
  take: 10
});
```

---

## 📊 TypeScript Types

After generating, you'll have these types:

```typescript
// ComplianceReview type
type ComplianceReview = {
  id: string;
  transaction_id: string;
  user_id: string;
  reviewer_id: string | null;
  review_type: string;
  status: string;
  decision: string | null;
  notes: string | null;
  created_at: Date;
  reviewed_at: Date | null;
}

// SuspiciousActivityReport type
type SuspiciousActivityReport = {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  severity: string;
  status: string;
  filed_at: Date | null;
  filed_by: string | null;
  report_number: string | null;
  regulatory_body: string | null;
  related_transactions: string[];
  evidence_urls: string[];
  metadata: any;
  created_at: Date;
  updated_at: Date;
}

// AuditLog type
type AuditLog = {
  id: string;
  action_type: string;
  performed_by: string;
  target_user_id: string | null;
  action_details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}
```

---

## 🎯 Enums to Consider Adding

You might want to add these enums for type safety:

```prisma
enum ComplianceReviewType {
  TRANSACTION
  USER_PROFILE
  WITHDRAWAL
  CHAMA
  CONTEST
  KYC
}

enum ComplianceReviewStatus {
  PENDING
  IN_REVIEW
  APPROVED
  REJECTED
  ESCALATED
}

enum ComplianceDecision {
  APPROVE
  REJECT
  REQUEST_INFO
  ESCALATE
}

enum SARSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum SARStatus {
  DRAFT
  FILED
  ACKNOWLEDGED
  CLOSED
}

enum SARActivityType {
  SELF_TIPPING
  CIRCULAR_TIPPING
  RAPID_WITHDRAWAL
  CHAMA_FRAUD
  MONEY_LAUNDERING
  STRUCTURING
  UNUSUAL_PATTERN
}
```

Then update the models to use these enums:

```prisma
model ComplianceReview {
  // ... other fields
  review_type    ComplianceReviewType
  status         ComplianceReviewStatus @default(PENDING)
  decision       ComplianceDecision?
  // ... other fields
}

model SuspiciousActivityReport {
  // ... other fields
  activity_type  SARActivityType
  severity       SARSeverity
  status         SARStatus @default(DRAFT)
  // ... other fields
}
```

---

## ✅ Checklist

- [ ] Copy models to `schema.prisma`
- [ ] (Optional) Add enums for type safety
- [ ] Run `npx prisma generate`
- [ ] Verify types are available in your IDE
- [ ] Test queries work correctly
- [ ] Create service files for compliance operations

---

**Last Updated**: December 2024  
**Status**: ✅ READY TO ADD TO SCHEMA
