# Wallet Compliance API Documentation

## Overview

This document describes the compliance-focused wallet and transaction APIs. The platform operates as a **currency provider** (not a money transmitter) with comprehensive compliance controls.

---

## Authentication

All endpoints require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## Compliance Middleware

All transaction endpoints automatically apply the following compliance checks:

1. **Transaction Context Validation** - All Kr transfers require valid context
2. **Velocity Checks** - Rate limiting (10/min, 50/hour, 100K/day)
3. **Self-Tipping Detection** - Pattern detection for suspicious tipping
4. **Risk Scoring** - Automatic risk calculation and mitigation
5. **KYC Limits** - Tiered withdrawal limits based on verification

---

## Wallet Endpoints

### GET /api/v1/wallet/balance

Get user's wallet balance with fiat conversion.

**Response:**
```json
{
  "kr_balance": 10000,
  "fiatEquivalent": 1250.50,
  "currency": "KES",
  "is_wallet_unlocked": true,
  "exchange_rate": 125.05,
  "base_usd": 100.00
}
```

### GET /api/v1/wallet/transactions

Get transaction history with fiat equivalents.

**Query Parameters:**
- `limit` (number, default: 20)
- `offset` (number, default: 0)

**Response:**
```json
[
  {
    "id": "tx_123",
    "type": "CONTENT_TIP",
    "amount_kr": 100,
    "fiat_equivalent": 12.50,
    "currency": "KES",
    "exchange_rate": 125.05,
    "context_type": "CONTENT_TIP",
    "context_ref_id": "post_456",
    "context_desc": "Tip for amazing content",
    "status": "completed",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### POST /api/v1/wallet/tip

Send a tip to content creator.

**Request Body:**
```json
{
  "recipient_id": "user_123",
  "amount_kr": 100,
  "currency": "KES",
  "context_type": "CONTENT_TIP",
  "context_ref_id": "post_456",
  "context_desc": "Great content!"
}
```

**Response:**
```json
{
  "success": true,
  "krTipped": 100,
  "krReceived": 85,
  "platformFee": 15
}
```

**Compliance Checks:**
- ✅ Transaction context required
- ✅ Velocity limits enforced
- ✅ Self-tipping detection
- ✅ Risk scoring updated

---

## KYC & Limits

### GET /api/v1/compliance/kyc-tier/:userId

Get user's KYC tier and limits.

**Response:**
```json
{
  "success": true,
  "tier": "TIER_1",
  "limits": {
    "tier": "TIER_1",
    "dailyWithdrawalLimit": 50000,
    "monthlyWithdrawalLimit": 500000,
    "singleTransactionLimit": 25000,
    "requiresKYC": true
  }
}
```

### GET /api/v1/compliance/kyc-tiers

Get all KYC tier definitions.

**Response:**
```json
{
  "success": true,
  "tiers": [
    {
      "tier": "TIER_0",
      "dailyWithdrawalLimit": 10000,
      "monthlyWithdrawalLimit": 50000,
      "singleTransactionLimit": 5000,
      "requiresKYC": false
    },
    {
      "tier": "TIER_1",
      "dailyWithdrawalLimit": 50000,
      "monthlyWithdrawalLimit": 500000,
      "singleTransactionLimit": 25000,
      "requiresKYC": true
    },
    {
      "tier": "TIER_2",
      "dailyWithdrawalLimit": 500000,
      "monthlyWithdrawalLimit": 5000000,
      "singleTransactionLimit": 100000,
      "requiresKYC": true
    }
  ]
}
```

---

## Compliance Dashboard (Admin Only)

### GET /api/v1/compliance/dashboard

Get compliance overview dashboard.

**Response:**
```json
{
  "success": true,
  "overview": {
    "flaggedTransactions": 15,
    "pendingSARs": 3,
    "highRiskUsers": 8,
    "pendingReviews": 12
  },
  "recentFlags": [...],
  "recentSARs": [...]
}
```

### GET /api/v1/compliance/high-risk-users

Get list of high-risk users.

**Query Parameters:**
- `limit` (number, default: 50)
- `offset` (number, default: 0)

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "user_id": "user_123",
      "risk_score": 75,
      "risk_level": "HIGH",
      "withdrawal_blocked": false,
      "transaction_limited": true,
      "requires_manual_review": true,
      "last_calculated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 8
}
```

### GET /api/v1/compliance/flagged-transactions

Get flagged transactions for review.

**Query Parameters:**
- `status` (string: PENDING, REVIEWED, CLEARED)
- `severity` (string: LOW, MEDIUM, HIGH, CRITICAL)
- `flag_type` (string)
- `limit` (number, default: 50)
- `offset` (number, default: 0)

**Response:**
```json
{
  "success": true,
  "transactions": [...],
  "total": 15
}
```

### PUT /api/v1/compliance/flagged-transactions/:flagId/review

Review a flagged transaction.

**Request Body:**
```json
{
  "status": "CLEARED",
  "review_note": "False positive - legitimate transaction",
  "action_taken": "NO_ACTION"
}
```

### GET /api/v1/compliance/audit-logs

Get audit trail of compliance actions.

**Query Parameters:**
- `action_type` (string)
- `target_user_id` (string)
- `limit` (number, default: 50)
- `offset` (number, default: 0)

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log_123",
      "performed_by": "admin_456",
      "action_type": "KYC_APPROVED",
      "target_user_id": "user_789",
      "action_details": {...},
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150
}
```

---

## Suspicious Activity Reports (SARs)

### POST /api/v1/compliance/sar

Create a new SAR.

**Request Body:**
```json
{
  "user_id": "user_123",
  "activity_type": "SUSPICIOUS_VELOCITY",
  "description": "User exceeded velocity limits multiple times",
  "severity": "HIGH",
  "related_transactions": ["tx_1", "tx_2"],
  "evidence_urls": ["https://..."],
  "metadata": {...}
}
```

### GET /api/v1/compliance/sar

List all SARs with filters.

**Query Parameters:**
- `status` (string: DRAFT, FILED, ACKNOWLEDGED, CLOSED)
- `severity` (string: LOW, MEDIUM, HIGH, CRITICAL)
- `activity_type` (string)
- `user_id` (string)
- `limit` (number, default: 50)
- `offset` (number, default: 0)

### GET /api/v1/compliance/sar/:sarId

Get SAR by ID.

### PUT /api/v1/compliance/sar/:sarId/status

Update SAR status.

**Request Body:**
```json
{
  "status": "FILED",
  "filed_by": "admin_123",
  "regulatory_body": "FIU"
}
```

### GET /api/v1/compliance/sar/export/csv

Export SARs to CSV.

**Query Parameters:**
- `status`, `severity`, `activity_type`, `date_from`, `date_to`

### GET /api/v1/compliance/sar/export/pdf

Export SARs to PDF.

**Query Parameters:**
- `status`, `severity`, `activity_type`, `date_from`, `date_to`

---

## Locked Chat Access

### GET /api/v1/compliance/chat-access/:creatorId

Check if user can message creator.

**Response:**
```json
{
  "success": true,
  "canMessage": false,
  "reason": "LOCKED",
  "unlockFeeKr": 100
}
```

**Possible Reasons:**
- `SUBSCRIBED` - User is subscribed to creator
- `ACTIVE_TASK` - User has active task
- `LOCKED` - Chat is locked, fee required
- `UNLOCKED` - Creator hasn't enabled locked chat

### POST /api/v1/compliance/chat/unlock

Unlock chat for a task.

**Request Body:**
```json
{
  "creator_id": "user_123",
  "task_description": "Design a logo for my brand",
  "amount_kr": 500,
  "deadline_hours": 48
}
```

**Response:**
```json
{
  "success": true,
  "task": {...},
  "transaction": {...}
}
```

### POST /api/v1/compliance/chat/task/:taskId/complete

Mark task as completed (creator only).

**Request Body:**
```json
{
  "deliverable_url": "https://..."
}
```

---

## Contest Validation

### POST /api/v1/compliance/contest/validate

Validate contest configuration before creation.

**Request Body:**
```json
{
  "entry_fee_kr": 0,
  "voting_enabled": true,
  "voting_cost_per_vote_kr": 10,
  "judging_method": "VOTES_ONLY",
  "prize_total_kr": 10000,
  "max_winners": 3
}
```

**Response:**
```json
{
  "success": true,
  "isValid": false,
  "errors": [
    "Paid voting is only allowed for free-entry contests (gambling compliance)"
  ],
  "warnings": []
}
```

**Validation Rules:**
- ❌ Cannot charge both entry fee AND voting fee
- ✅ Judge weight + vote weight must = 100%
- ✅ Prize distribution must sum to 100%

### GET /api/v1/compliance/contest/:contestId/validation

Get contest validation status.

---

## Transaction Context Types

All transactions must include valid context:

| Type | Context Required | Reference ID | Description |
|------|-----------------|--------------|-------------|
| `CONTENT_TIP` | ✅ | Post/Short/Video ID | Tip for content |
| `LOCKED_CHAT_TASK` | ✅ | Task ID | Chat unlock payment |
| `SUBSCRIPTION` | ✅ | Subscription ID | Subscription payment |
| `CONTEST_ENTRY` | ✅ | Contest ID | Contest entry fee |
| `CONTEST_PRIZE` | ✅ | Contest ID | Prize payout |
| `CONTEST_VOTE` | ✅ | Submission ID | Vote payment |
| `TOPUP` | ❌ | - | Wallet top-up |
| `WITHDRAWAL` | ❌ | - | Wallet withdrawal |
| `PLATFORM_FEE` | ❌ | - | Platform fee |

**Blocked Types:**
- ❌ `WALLET_TRANSFER` - Direct transfers not allowed
- ❌ `CHAT_TIP` - Direct chat tips not allowed

---

## Error Codes

### Compliance Errors

| Code | Message | Action |
|------|---------|--------|
| `CONTEXT_REQUIRED` | Transaction context required | Add context fields |
| `VELOCITY_EXCEEDED` | Transaction velocity limit exceeded | Wait and retry |
| `RISK_BLOCKED` | Account restricted due to high risk | Contact support |
| `KYC_REQUIRED` | KYC verification required | Complete KYC |
| `LIMIT_EXCEEDED` | Withdrawal limit exceeded | Upgrade KYC tier |
| `CHAT_LOCKED` | Chat is locked | Unlock with task |
| `INVALID_CONTEST` | Contest validation failed | Fix configuration |

---

## Rate Limits

### Transaction Velocity:
- **10 tips per minute** per user
- **50 transactions per hour** per user
- **100,000 Kr per 24h** for non-KYC users
- **500,000 Kr per 24h** for KYC-approved users

### API Rate Limits:
- **100 requests per minute** per user
- **1000 requests per hour** per user

---

## Webhooks

### Transaction Events

```json
{
  "event": "transaction.completed",
  "data": {
    "transaction_id": "tx_123",
    "user_id": "user_456",
    "type": "CONTENT_TIP",
    "amount_kr": 100,
    "context": {...}
  }
}
```

### Risk Events

```json
{
  "event": "risk.flagged",
  "data": {
    "user_id": "user_123",
    "risk_level": "HIGH",
    "risk_score": 75,
    "reason": "Suspicious velocity pattern"
  }
}
```

---

## Best Practices

### For Developers:

1. **Always include transaction context** - All Kr transfers require valid context
2. **Handle velocity errors gracefully** - Implement retry logic with backoff
3. **Display fiat equivalents** - Use provided exchange rates for UI
4. **Respect KYC limits** - Check tier before large transactions
5. **Monitor risk scores** - Warn users before account restrictions

### For Compliance:

1. **Review flagged transactions daily** - Use compliance dashboard
2. **File SARs promptly** - Export and submit to regulators
3. **Monitor high-risk users** - Investigate suspicious patterns
4. **Audit regularly** - Review audit logs for compliance actions
5. **Update KYC tiers** - Adjust limits based on verification

---

## Support

For API support or compliance questions:
- Email: compliance@krieta.com
- Documentation: https://docs.krieta.com/compliance
- Status: https://status.krieta.com
