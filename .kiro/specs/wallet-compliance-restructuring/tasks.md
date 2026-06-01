# Implementation Plan: Wallet & Platform Compliance Restructuring

## Overview

This implementation plan restructures the platform's wallet system, transaction processing, and related modules (Shop, Contest, Chama) to achieve regulatory compliance. The platform will operate as a **platform currency provider** (not a money transmitter) with comprehensive compliance controls including transaction context validation, risk scoring, KYC workflows, and suspicious activity detection.

**Key Changes:**
- Remove direct wallet-to-wallet transfers and chat tips
- Add mandatory transaction context for all Kr transfers
- Implement risk scoring and velocity checks
- Restructure Shop module to listing-only (remove escrow)
- Add contest paid voting validation rules
- Remove investment chama type, add KYC requirements
- Implement task-based locked chat access model
- Display fiat conversion for all Kr amounts

**Technology Stack:** TypeScript, Node.js, Express, Prisma, PostgreSQL, Redis

---

## Tasks

### 1. Database Schema Updates

- [x] 1.1 Update transaction schema with context fields
  - Add `context` JSONB field to `transactions` table
  - Add `transaction_type` enum with all valid types (CONTENT_TIP, LOCKED_CHAT_TASK, SUBSCRIPTION, etc.)
  - Add `reference_id` field for linking to content/service
  - Add `description` field for human-readable context
  - Remove WALLET_TRANSFER and CHAT_TIP from transaction types
  - Create migration file
  - _Requirements: 2.2.1, 2.2.2_

- [x] 1.2 Create risk scoring tables
  - Create `user_risk_profiles` table with risk_score, risk_level, last_calculated_at
  - Create `risk_factors` table to store individual risk factor values
  - Create `flagged_transactions` table for suspicious activity
  - Add indexes on risk_score, risk_level, and created_at
  - _Requirements: 2.3.1, 2.3.2_

- [x] 1.3 Create velocity tracking tables
  - Create `transaction_velocity` table with user_id, time_window, transaction_count, total_amount_kr
  - Add Redis cache schema for real-time velocity checks
  - Create indexes on user_id and time_window
  - _Requirements: 2.4.2_

- [x] 1.4 Update Contest schema for compliance
  - Add `judging_method` enum (JUDGES_ONLY, VOTES_ONLY, JUDGES_AND_VOTES)
  - Add `judge_weight_percentage` and `vote_weight_percentage` fields
  - Add `is_legal_structure` boolean flag
  - Add `validation_errors` array field
  - Update existing contests to set default values
  - _Requirements: 2.8.1, 2.8.2_

- [x] 1.5 Create locked chat access tables
  - Create `locked_chat_settings` table with creator_id, is_locked, task_fee_kr, typical_delivery_time
  - Create `chat_task_unlocks` table with user_id, creator_id, amount_kr, task_description, status, deadline
  - Add indexes on creator_id, user_id, and status
  - _Requirements: 2.6.1_

- [x] 1.6 Update Chama schema
  - Remove 'INVESTMENT' from ChamaType enum
  - Add `kyc_verified_members_only` boolean flag (default true)
  - Add `device_fingerprint` field to chama_members table
  - Create migration to convert existing investment chamas to welfare type
  - _Requirements: 2.9.1, 2.11.1_

- [x] 1.7 Create compliance dashboard tables
  - Create `compliance_reviews` table for manual review actions
  - Create `suspicious_activity_reports` table for SAR tracking
  - Create `audit_logs` table for immutable compliance actions
  - Add indexes on created_at, user_id, and status
  - _Requirements: 2.13.1, 2.13.2_

- [x] 1.8 Update User schema for KYC tiers
  - Add `kyc_tier` field (0-3) with default 0
  - Add `monthly_transaction_limit_kr` field
  - Add `email_verified` and `phone_verified` boolean flags
  - Add `account_age_days` computed field
  - _Requirements: 2.12.1_

### 2. Transaction Context Validation

- [ ] 2.1 Create TransactionContext service
  - Implement `validateContext()` method to check all required fields
  - Implement `getContextForType()` to generate context based on transaction type
  - Add validation for reference_id existence (check if content/service exists)
  - Throw errors for missing or invalid context
  - _Requirements: 2.2.1_

- [ ] 2.2 Update transaction creation endpoints
  - Modify all transaction creation endpoints to require context parameter
  - Validate context before creating transaction
  - Block transactions without valid context
  - Return clear error messages for invalid context
  - _Requirements: 2.2.1_

- [ ] 2.3 Block wallet-to-wallet transfers
  - Remove `/wallet/transfer` endpoint
  - Add middleware to block WALLET_TRANSFER transaction type
  - Update wallet UI to remove "Send Kr" button
  - Redirect existing transfer flows to content tipping
  - _Requirements: 2.2.2_

- [ ] 2.4 Block direct chat tips
  - Remove tip functionality from direct/private chat endpoints
  - Add middleware to block CHAT_TIP transactions in direct chats
  - Update chat UI to remove tip button from direct messages
  - Keep tip functionality for public content (posts, shorts, videos)
  - _Requirements: 2.2.2_

### 3. Risk Scoring Engine

- [ ] 3.1 Implement RiskScoringService
  - Create `calculateRiskScore()` method with all risk factors
  - Implement profile risk calculation (KYC status, account age, verification)
  - Implement geographic risk calculation (country, IP mismatch, VPN detection)
  - Implement transaction risk calculation (volume, velocity, large transactions)
  - Implement behavioral risk calculation (self-tipping, circular patterns, diversity)
  - Return risk score (0-100) and risk level (LOW, MEDIUM, HIGH, CRITICAL)
  - _Requirements: 2.3.1_

- [ ] 3.2 Implement automatic risk actions
  - Create `applyRiskMitigation()` method
  - CRITICAL (70-100): Suspend account, block withdrawals, flag for manual review
  - HIGH (50-69): Require KYC, reduce transaction limits, flag for review
  - MEDIUM (30-49): Enable enhanced monitoring, suggest KYC
  - LOW (0-29): Standard monitoring only
  - _Requirements: 2.3.2_

- [ ] 3.3 Integrate risk scoring into transaction flow
  - Call `calculateRiskScore()` after every transaction
  - Update user_risk_profiles table with new score
  - Apply risk mitigation actions automatically
  - Log risk score changes to audit trail
  - _Requirements: 2.3.1, 2.3.2_

### 4. Suspicious Activity Detection

- [ ] 4.1 Implement self-tipping detection
  - Create `detectSelfTipping()` method
  - Track device fingerprints across accounts using FingerprintJS
  - Calculate interaction exclusivity score (accounts only tipping each other)
  - Detect rapid buy-tip-withdraw cycles (< 1 hour)
  - Identify circular tipping patterns (A→B→C→A)
  - Calculate self-tipping score (0-100)
  - Flag users with score > 70
  - _Requirements: 2.4.1_

- [ ] 4.2 Implement velocity checks
  - Create `checkVelocity()` method using Redis for real-time tracking
  - Enforce max 10 tips per minute per user
  - Enforce max 50 transactions per hour per user
  - Enforce max 100,000 Kr per 24h for non-KYC users
  - Enforce max 500,000 Kr per 24h for KYC-approved users
  - Enforce 24-hour cooling-off period for new accounts before first withdrawal
  - Block transactions exceeding limits with clear error messages
  - _Requirements: 2.4.2_

- [ ] 4.3 Integrate pattern detection into transaction flow
  - Call `detectSelfTipping()` on every tip transaction
  - Call `checkVelocity()` before every transaction
  - Update risk score based on detection results
  - Flag suspicious transactions for manual review
  - _Requirements: 2.4.1, 2.4.2_

### 5. Currency Conversion Display

- [ ] 5.1 Create CurrencyConversionService
  - Implement `getExchangeRate()` method using fawazahmed0 API
  - Cache exchange rates in Redis for 1 hour
  - Support multiple fiat currencies (USD, KES, EUR, GBP, etc.)
  - Handle API failures gracefully with cached fallback
  - _Requirements: 2.1.2_

- [ ] 5.2 Add fiat conversion to all Kr displays
  - Update wallet balance display: "Kr. 1000 (≈ $12.50 USD)"
  - Update transaction history with fiat equivalents
  - Update tip amounts, subscription prices, contest prizes
  - Add user preference for display currency in settings
  - _Requirements: 2.1.2_

- [ ] 5.3 Update API responses with fiat conversion
  - Add `fiat_equivalent` field to all Kr amount responses
  - Include `exchange_rate` and `currency` in response metadata
  - Update TypeScript types for transaction responses
  - _Requirements: 2.1.2_

### 6. Locked Chat Access (Task-Based Model)

- [ ] 6.1 Implement LockedChatService
  - Create `checkChatAccess()` method to determine if user can message creator
  - Rule 1: Subscribers always have access
  - Rule 2: Active task unlocks chat
  - Rule 3: Otherwise, chat is locked (if creator enabled it)
  - Return access status with reason (SUBSCRIBED, ACTIVE_TASK, LOCKED, UNLOCKED)
  - _Requirements: 2.6.1_

- [ ] 6.2 Create locked chat unlock endpoint
  - POST `/chat/unlock-task` endpoint
  - Accept creator_id, task_description, amount_kr
  - Validate creator has locked chat enabled
  - Deduct Kr from user wallet
  - Create chat_task_unlock record with PENDING status
  - Create LOCKED_CHAT_TASK transaction with context
  - Unlock chat for user
  - _Requirements: 2.6.1_

- [ ] 6.3 Implement task completion flow
  - Create endpoint for creator to mark task as COMPLETED
  - Lock chat again after completion (unless user is subscribed)
  - Update chat_task_unlock status to COMPLETED
  - Add deliverable_url field for creator's delivery
  - _Requirements: 2.6.1_

- [ ] 6.4 Update chat endpoints with access control
  - Add middleware to check chat access before allowing messages
  - Block messages if chat is locked and no active task
  - Return clear error with unlock fee if locked
  - Allow messages for subscribers and active tasks
  - _Requirements: 2.6.1_

### 7. Shop Module Restructuring

- [ ] 7.1 Remove escrow functionality from Shop
  - Remove all escrow-related endpoints for Shop module
  - Delete escrow database records where module = 'SHOP'
  - Refund any currently held escrow funds in Shop
  - Remove "Buy Now" buttons from Shop UI
  - _Requirements: 2.7.2_

- [ ] 7.2 Convert Shop to listing-only model
  - Add "Contact Seller" button to all Shop listings
  - Remove payment processing from Shop
  - Add optional listing fee in Kr (configurable)
  - Update Shop product schema to remove escrow fields
  - _Requirements: 2.7.2_

### 8. Contest Module Compliance

- [ ] 8.1 Implement contest validation rules
  - Create `validateContestStructure()` method
  - Rule: If entry_fee_kr > 0, then voting_cost_per_vote_kr must be 0
  - Rule: If voting_cost_per_vote_kr > 0, then entry_fee_kr must be 0
  - Rule: If judging_method = JUDGES_AND_VOTES, then judge_weight + vote_weight = 100
  - Set is_legal_structure flag based on validation
  - Store validation_errors array
  - _Requirements: 2.8.1_

- [ ] 8.2 Update contest creation endpoint
  - Add validation before creating contest
  - Block illegal contest configurations
  - Return clear error messages explaining gambling compliance rules
  - Update contest creation UI to prevent invalid selections
  - _Requirements: 2.8.1_

- [ ] 8.3 Remove escrow terminology from contests
  - Update prize pool to "platform-held funds" (not escrow)
  - Make prize pool non-refundable once contest starts
  - Update Terms of Service references
  - Update contest service to reflect platform service model
  - _Requirements: 2.8.1_

### 9. Chama Module Restructuring

- [ ] 9.1 Remove investment chama type
  - Remove 'INVESTMENT' from ChamaType enum in code
  - Update chama creation UI to only show MERRY_GO_ROUND and WELFARE
  - Migrate existing investment chamas to WELFARE type
  - Send notifications to affected chama members
  - _Requirements: 2.9.1_

- [ ] 9.2 Add KYC requirements for chama
  - Validate all chama members are KYC-approved before joining
  - Validate chama creator is KYC-approved
  - Block non-KYC users from joining chamas
  - Add KYC verification check to chama join endpoint
  - _Requirements: 2.11.1_

- [ ] 9.3 Implement chama pattern detection
  - Create `detectFakeChama()` method
  - Detect chamas where all members share same device fingerprint
  - Flag chamas with circular contribution patterns
  - Monitor rapid contribution-to-payout cycles
  - Enforce 7-day cooling-off period before first payout
  - Flag chamas where one member receives disproportionate payouts
  - _Requirements: 2.11.2_

### 10. Enhanced KYC Workflows

- [ ] 10.1 Implement tiered KYC system
  - Tier 0 (No KYC): Max 10,000 Kr/month, can tip/subscribe/unlock content
  - Tier 1 (Basic KYC): Email + phone verification, max 50,000 Kr/month
  - Tier 2 (Full KYC): ID + selfie verification, max 500,000 Kr/month, can withdraw
  - Tier 3 (Enhanced KYC): Proof of income + business docs, unlimited
  - Create `checkKYCLimits()` method to enforce limits
  - _Requirements: 2.12.1_

- [ ] 10.2 Update transaction endpoints with KYC checks
  - Check user's KYC tier before processing transaction
  - Block transactions exceeding tier limits
  - Return clear error messages with KYC upgrade instructions
  - Track monthly transaction totals per user
  - _Requirements: 2.12.1_

### 11. Compliance Dashboard

- [ ] 11.1 Create compliance review endpoints
  - GET `/admin/compliance/flagged-transactions` - List flagged transactions
  - GET `/admin/compliance/transaction/:id` - View transaction details
  - POST `/admin/compliance/review` - Take action (approve, block, escalate)
  - Add filters for risk level, transaction type, date range
  - _Requirements: 2.13.1_

- [ ] 11.2 Implement suspicious activity reporting
  - Create `generateSAR()` method to create SAR templates
  - Export suspicious activity logs to CSV/PDF
  - Track which activities have been reported
  - Add SAR status tracking (PENDING, FILED, RESOLVED)
  - _Requirements: 2.13.2_

- [ ] 11.3 Build compliance dashboard UI
  - Create admin dashboard page for compliance officers
  - Display flagged transactions with risk scores
  - Show user risk profiles and patterns
  - Add action buttons for review workflow
  - Display audit log of all compliance actions
  - _Requirements: 2.13.1, 2.13.2_

### 12. Integration & Testing

- [ ] 12.1 Integrate all compliance checks into transaction flow
  - Wire TransactionContext validation
  - Wire RiskScoringService
  - Wire VelocityChecker
  - Wire PatternDetector
  - Ensure all checks run before transaction commits
  - _Requirements: 2.2.1, 2.3.1, 2.4.1, 2.4.2_

- [ ] 12.2 Update API documentation
  - Document new transaction context requirements
  - Document risk scoring system
  - Document KYC tier limits
  - Document locked chat access model
  - Document contest validation rules
  - _Requirements: All_

- [ ] 12.3 Create migration scripts
  - Script to migrate existing transactions (add default context)
  - Script to calculate initial risk scores for all users
  - Script to migrate investment chamas to welfare type
  - Script to refund Shop escrow funds
  - _Requirements: All_

- [ ] 12.4 Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 13. Frontend Updates

- [ ] 13.1 Update wallet UI
  - Remove "Send Kr" button
  - Add fiat conversion display to wallet balance
  - Update transaction history with context descriptions
  - Add KYC tier indicator and upgrade prompts
  - _Requirements: 2.1.2, 2.2.2, 2.12.1_

- [ ] 13.2 Update chat UI
  - Remove tip button from direct/private chats
  - Add "Unlock Chat for Task" button for locked chats
  - Show task unlock form with description input
  - Display active task status in chat header
  - Show "Chat locked - complete task to unlock again" message after completion
  - _Requirements: 2.2.2, 2.6.1_

- [ ] 13.3 Update contest creation UI
  - Add judging method selector (JUDGES_ONLY, VOTES_ONLY, JUDGES_AND_VOTES)
  - Disable paid voting option when entry fee > 0
  - Show validation error messages for illegal configurations
  - Add weight sliders for judge/vote percentages
  - _Requirements: 2.8.1_

- [ ] 13.4 Update Shop UI
  - Remove "Buy Now" buttons
  - Add "Contact Seller" buttons
  - Remove escrow status indicators
  - Update product listing flow to remove payment options
  - _Requirements: 2.7.2_

- [ ] 13.5 Update chama creation UI
  - Remove "Investment" option from chama type selector
  - Add KYC requirement notice
  - Show KYC verification status for members
  - Block non-KYC users from joining
  - _Requirements: 2.9.1, 2.11.1_

### 14. Final Integration & Deployment

- [ ] 14.1 Run all database migrations
  - Execute all schema update migrations
  - Run data migration scripts
  - Verify database integrity
  - _Requirements: All_

- [ ] 14.2 Deploy backend changes
  - Deploy updated API endpoints
  - Deploy compliance services
  - Configure Redis cache
  - Set up currency conversion API
  - _Requirements: All_

- [ ] 14.3 Deploy frontend changes
  - Deploy updated UI components
  - Update mobile app
  - Test all user flows
  - _Requirements: All_

- [ ] 14.4 Final checkpoint - Verify compliance
  - Verify all transactions have context
  - Verify risk scoring is working
  - Verify velocity checks are enforced
  - Verify KYC limits are enforced
  - Verify contest validation is working
  - Verify locked chat access is working
  - Verify Shop is listing-only
  - Verify chama KYC requirements
  - Ask the user if questions arise.

---

## Notes

- All tasks build incrementally on previous work
- Database schema updates must be completed before service implementation
- Compliance checks are integrated into transaction flow to catch violations early
- Frontend updates can proceed in parallel with backend after APIs are ready
- Migration scripts handle existing data gracefully
- Each task references specific requirements for traceability
- Focus on zero-budget solutions (free APIs, open-source libraries)
- Audit trail and immutable logging are critical for regulatory compliance

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "3.1", "4.1", "4.2", "5.1", "6.1", "8.1", "9.1", "10.1", "11.1", "11.2"]
    },
    {
      "id": 2,
      "tasks": ["2.2", "2.3", "2.4", "3.2", "5.2", "6.2", "7.1", "8.2", "9.2", "9.3", "10.2"]
    },
    {
      "id": 3,
      "tasks": ["3.3", "4.3", "5.3", "6.3", "6.4", "7.2", "8.3", "12.1", "12.2", "12.3"]
    },
    {
      "id": 4,
      "tasks": ["11.3", "13.1", "13.2", "13.3", "13.4", "13.5"]
    },
    {
      "id": 5,
      "tasks": ["14.1", "14.2", "14.3"]
    }
  ]
}
```
