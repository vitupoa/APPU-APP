# Wallet & Platform Compliance Restructuring - Requirements

## 1. Overview

### 1.1 Purpose
Restructure the platform's wallet system, marketplace, contest module, and transaction features to achieve regulatory compliance and minimize legal risk while maintaining core functionality.

### 1.2 Current Risk Assessment

**Critical Issues:**
- Peer-to-peer wallet transfers without context (money transmission)
- Physical goods escrow (payment processing + escrow licensing)
- Contest module with paid voting (gambling risk)
- Private chat payments (illicit activity risk)
- Chama group savings (money pooling risk)

**Regulatory Classification:**
- Current: Money transmitter + Payment processor + Escrow agent
- Target: Platform currency provider + Marketplace facilitator

### 1.3 Business Model
- Platform currency (Kr coin) for digital services
- Users buy Kr with fiat (converted in real-time)
- Creators earn Kr through tips, subscriptions, content unlocks, task-based locked chats
- Creators withdraw Kr to fiat
- Shop for physical goods (listing only - no payment processing)
- Marketplace for brand deals and creator partnerships (separate module, unchanged)
- Contest platform for marketing campaigns
- **Global operation** - Users from any country can participate

### 1.4 Budget Constraints
- **Zero budget MVP** - No compliance budget available
- Must use free/open-source solutions where possible
- Paid services only if absolutely critical and low-cost
- Focus on structural compliance over expensive certifications
- Defer expensive compliance measures (SOC 2, paid sanctions screening) to post-funding phase

---

## 2. Core Requirements

### 2.1 Platform Currency (Kr) Restructuring

#### 2.1.1 Currency Definition
**User Story:** As a platform operator, I need Kr to be legally defined as a non-redeemable platform currency (not money) to avoid money transmitter classification.

**Acceptance Criteria:**
- [x] Kr is defined in Terms of Service as "platform reward token"
- [x] Kr has no cash value outside the platform
- [ ] Platform controls Kr exchange rates
- [ ] Kr cannot be transferred to external wallets
- [ ] One-way conversion: Fiat → Kr (buy), Kr → Fiat (withdraw for creators only)

**Correctness Properties:**
```
Property: Kr_Is_Not_Money
∀ transaction t: t.currency = "KR" → 
  t.is_platform_internal = true ∧
  t.external_transferable = false ∧
  t.has_independent_value = false
```

#### 2.1.2 Currency Display with Fiat Conversion
**User Story:** As a user, I need to see the real-time fiat equivalent of Kr amounts so I understand the actual value of transactions.

**Acceptance Criteria:**
- [ ] All Kr amounts display fiat equivalent in user's local currency
- [ ] Format: "Kr. 1000 (≈ $12.50 USD)" or "Kr. 1000 (≈ KES 1,250)"
- [ ] Exchange rates update in real-time (or cached for max 1 hour)
- [ ] Conversion shown in: wallet balance, tips, subscriptions, contest prizes, all transactions
- [ ] User can select preferred display currency in settings

**Correctness Properties:**
```
Property: Fiat_Conversion_Always_Displayed
∀ kr_display d: d.shows_kr_amount = true →
  d.shows_fiat_equivalent = true ∧
  d.exchange_rate_age < 1_hour ∧
  d.currency = user.preferred_currency
```

---

### 2.2 Transaction Context Requirements

#### 2.2.1 Mandatory Transaction Context
**User Story:** As a compliance officer, I need every transaction to have a clear business context to distinguish legitimate platform activity from money transmission.

**Acceptance Criteria:**
- [ ] All transactions must have a `context` object
- [ ] Context includes: type, content_id/message_id/service_id, description
- [ ] No "blank" transfers allowed
- [ ] Context is immutable once transaction is created
- [ ] Context is logged for audit trail

**Transaction Types:**
```typescript
type TransactionType = 
  | 'CONTENT_TIP'        // Tip on post/short/video
  | 'LOCKED_CHAT_TASK'   // Pay to unlock chat for a specific task (locks again after completion)
  | 'SUBSCRIPTION'       // Monthly subscription
  | 'CONTENT_UNLOCK'     // Pay to unlock locked content
  | 'CONTEST_ENTRY'      // Contest entry fee
  | 'CONTEST_VOTE'       // Paid vote on contest (only if entry_fee = 0)
  | 'CONTEST_PRIZE'      // Contest prize distribution
  | 'CHAMA_CONTRIBUTION' // Group savings contribution (merry-go-round or welfare)
  | 'CHAMA_PAYOUT'       // Group savings payout
  | 'PLATFORM_REWARD'    // Platform-funded reward
  | 'WITHDRAWAL'         // Cash out to fiat
  | 'TOP_UP'             // Buy Kr with fiat
  | 'SHOP_LISTING_FEE'   // Fee to list product in shop (optional)
```

**Removed Transaction Types (No longer allowed):**
- ❌ 'WALLET_TRANSFER' - Direct wallet-to-wallet transfers
- ❌ 'CHAT_TIP' - Tips in direct/private chats
- ❌ 'ESCROW' - Escrow for physical goods
- ❌ 'VIRTUAL_GIFT' - Not needed (no livestreaming feature)

**Correctness Properties:**
```
Property: All_Transactions_Have_Context
∀ transaction t: 
  t.context ≠ null ∧
  t.context.type ∈ ValidTransactionTypes ∧
  t.context.reference_id ≠ null ∧
  t.context.description.length > 0
```

#### 2.2.2 Remove Wallet-to-Wallet Transfers and Direct Chat Tips
**User Story:** As a compliance officer, I need to eliminate direct wallet-to-wallet transfers and chat tips to avoid money transmission classification.

**Acceptance Criteria:**
- [ ] Remove "Send Kr" feature from wallet UI
- [ ] Remove "Tip" feature from direct/private chats
- [ ] Block API endpoints for direct wallet transfers
- [ ] Block API endpoints for direct chat tips
- [ ] All Kr transfers must go through platform services (content tips, subscriptions, locked chat access, etc.)
- [ ] Existing wallet transfer functionality redirects to content tipping

**Correctness Properties:**
```
Property: No_Direct_Wallet_Transfers
∀ transaction t: t.type = 'WALLET_TRANSFER' → 
  t.is_blocked = true ∧
  t.requires_context = true

Property: No_Direct_Chat_Tips
∀ transaction t: t.type = 'CHAT_TIP' ∧ t.chat.type = 'DIRECT' → 
  t.is_blocked = true
```

---

### 2.3 Risk Scoring System

#### 2.3.1 User Risk Profile
**User Story:** As a compliance officer, I need to automatically assess user risk levels to identify suspicious activity and prevent money laundering.

**Acceptance Criteria:**
- [ ] Every user has a risk score (0-100)
- [ ] Risk level: LOW (0-29), MEDIUM (30-49), HIGH (50-69), CRITICAL (70-100)
- [ ] Risk score recalculated on every transaction
- [ ] High-risk users face automatic restrictions
- [ ] Risk factors include: KYC status, account age, geography, transaction patterns, behavioral signals

**Risk Factors & Weights:**
```typescript
interface RiskFactors {
  // Profile Risk (30 points)
  kyc_status: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  account_age_days: number;
  email_verified: boolean;
  phone_verified: boolean;
  
  // Geographic Risk (20 points)
  country: string;
  is_high_risk_country: boolean;
  ip_country_mismatch: boolean;
  vpn_detected: boolean;
  
  // Transaction Risk (30 points)
  volume_24h_kr: number;
  volume_30d_kr: number;
  rapid_transactions_1h: number;
  large_transactions_count: number;
  
  // Behavioral Risk (20 points)
  self_tipping_score: number; // 0-100
  circular_tipping_score: number; // 0-100
  recipient_diversity: number; // unique recipients
  withdrawal_frequency: number;
}
```

**Correctness Properties:**
```
Property: Risk_Score_Bounds
∀ user u: 0 ≤ u.risk_score ≤ 100

Property: High_Risk_Users_Restricted
∀ user u: u.risk_score ≥ 70 →
  u.withdrawal_blocked = true ∧
  u.requires_manual_review = true
```

#### 2.3.2 Automated Risk Actions
**User Story:** As a platform operator, I need the system to automatically restrict high-risk users to prevent fraud and money laundering.

**Acceptance Criteria:**
- [ ] CRITICAL (70-100): Suspend account, block withdrawals, require manual review
- [ ] HIGH (50-69): Require KYC, limit transactions, flag for review
- [ ] MEDIUM (30-49): Enhanced monitoring, suggest KYC
- [ ] LOW (0-29): Standard monitoring

**Correctness Properties:**
```
Property: Automatic_Risk_Mitigation
∀ user u: u.risk_score ≥ 50 →
  (u.kyc_required = true ∨ u.transaction_limit_reduced = true)
```

---

### 2.4 Suspicious Activity Detection

#### 2.4.1 Self-Tipping Detection
**User Story:** As a compliance officer, I need to detect users tipping themselves through multiple accounts to launder money.

**Acceptance Criteria:**
- [ ] Track device fingerprints across accounts
- [ ] Detect accounts that only tip each other
- [ ] Flag rapid buy-tip-withdraw cycles
- [ ] Identify circular tipping patterns (A→B→C→A)
- [ ] Calculate self-tipping score (0-100)

**Detection Patterns:**
```typescript
interface SelfTippingPatterns {
  // Same device, multiple accounts
  shared_device_fingerprint: boolean;
  
  // Accounts only interact with each other
  interaction_exclusivity: number; // 0-100%
  
  // Rapid cycling
  buy_to_withdraw_time: number; // minutes
  
  // Circular patterns
  circular_path_detected: boolean;
  circular_path_length: number;
}
```

**Correctness Properties:**
```
Property: Self_Tipping_Flagged
∀ user u: u.self_tipping_score > 70 →
  u.flagged_for_review = true ∧
  u.risk_score += 25
```

#### 2.4.2 Velocity Checks
**User Story:** As a compliance officer, I need to limit transaction velocity to prevent rapid money laundering.

**Acceptance Criteria:**
- [ ] Max 10 tips per minute per user
- [ ] Max 50 transactions per hour per user
- [ ] Max 100,000 Kr per 24 hours for non-KYC users
- [ ] Max 500,000 Kr per 24 hours for KYC-approved users
- [ ] Cooling-off period: 24 hours for new accounts before first withdrawal

**Correctness Properties:**
```
Property: Velocity_Limits_Enforced
∀ user u, time_window w:
  count(u.transactions, w) > limit(w) →
    next_transaction(u).blocked = true
```

---

### 2.6 Locked Chat Access (Task-Based Service Model)

#### 2.6.1 Task-Based Locked Chat
**User Story:** As a creator, I can offer task-based services (like Cameo/Fiverr) where users pay to unlock a chat for a specific task, and the chat locks again once the task is complete.

**Acceptance Criteria:**
- [ ] Creators can toggle "Locked Chat" on/off on their profile
- [ ] When enabled, users must pay to unlock chat for a specific task/request
- [ ] User pays Kr and describes the task they want (e.g., "Record a birthday message", "Give feedback on my design")
- [ ] Chat unlocks for that specific task with a timeline/deadline
- [ ] Creator delivers the task (video, message, file, etc.)
- [ ] Once creator marks task as "Done" or timeline expires, chat locks again
- [ ] For next task, user must pay again
- [ ] **Exception:** Subscribed users can message without paying (chat is always unlocked for subscribers)
- [ ] Transaction type: LOCKED_CHAT_TASK

**Locked Chat Model:**
```typescript
interface LockedChatSettings {
  creator_id: string;
  is_locked: boolean; // Creator toggles this on/off
  task_fee_kr: number; // Fee per task
  typical_delivery_time: string; // e.g., "24 hours", "3 days"
}

interface ChatTaskUnlock {
  id: string;
  user_id: string;
  creator_id: string;
  amount_kr: number;
  task_description: string; // What user wants
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  deadline: Date;
  deliverable_url?: string; // Creator's delivery
  created_at: Date;
  completed_at?: Date;
}

interface ChatAccess {
  user_id: string;
  creator_id: string;
  
  // Check if user can message creator
  can_message: boolean;
  reason: 'SUBSCRIBED' | 'ACTIVE_TASK' | 'LOCKED';
  
  // If locked, show unlock option
  unlock_fee_kr?: number;
}
```

**Access Rules:**
```typescript
function canUserMessageCreator(user: User, creator: User): ChatAccessResult {
  // Rule 1: Subscribers always have access
  if (user.isSubscribedTo(creator)) {
    return { can_message: true, reason: 'SUBSCRIBED' };
  }
  
  // Rule 2: Active task unlocks chat
  const activeTask = getActiveTask(user.id, creator.id);
  if (activeTask && activeTask.status !== 'COMPLETED' && activeTask.status !== 'EXPIRED') {
    return { can_message: true, reason: 'ACTIVE_TASK', task: activeTask };
  }
  
  // Rule 3: Otherwise, chat is locked (if creator enabled it)
  if (creator.locked_chat_settings.is_locked) {
    return { 
      can_message: false, 
      reason: 'LOCKED',
      unlock_fee_kr: creator.locked_chat_settings.task_fee_kr 
    };
  }
  
  // Rule 4: Creator hasn't enabled locked chat
  return { can_message: true, reason: 'UNLOCKED' };
}
```

**Correctness Properties:**
```
Property: Subscribers_Always_Have_Access
∀ user u, creator c: u.isSubscribedTo(c) = true →
  u.can_message(c) = true

Property: Task_Based_Access
∀ user u, creator c: u.has_active_task(c) = true →
  u.can_message(c) = true ∧
  u.task.status ∈ {'PENDING', 'IN_PROGRESS'}

Property: Chat_Locks_After_Task_Complete
∀ task t: t.status = 'COMPLETED' →
  user.can_message(creator) = false ∧
  (user.isSubscribedTo(creator) = false)

Property: No_Chat_Tipping
∀ transaction t: t.chat.type = 'DIRECT' →
  t.type ≠ 'CHAT_TIP'
```

**UI Flow:**
```
1. User clicks "Message Creator"
2. System checks access:
   - If subscribed → Open chat
   - If active task → Open chat
   - If locked → Show unlock screen
3. Unlock screen:
   - "Unlock chat for a task: [X] Kr"
   - "Describe your request: [text area]"
   - "Typical delivery: 24 hours"
   - [Pay & Unlock] button
4. After payment:
   - Chat unlocks
   - Creator sees task request
   - Creator delivers task
   - Creator marks "Done"
5. After completion:
   - Chat locks again (unless subscribed)
   - User can unlock for new task
```

---

### 2.7 Shop/Marketplace Clarification

#### 2.7.1 Module Distinction
**Important:** The platform has TWO separate modules:

**Marketplace Module (Brand Deals & Creator Listings):**
- Brand campaigns and sponsored content
- Creator marketplace for brand partnerships
- **NO CHANGES** - This module remains as-is
- Not in scope for this compliance restructuring

**Shop Module (Physical Goods Listings):**
- User-generated product listings (cars, electronics, household items, etc.)
- Currently has escrow functionality
- **REQUIRES RESTRUCTURING** - Remove escrow, make listing-only

#### 2.7.2 Remove Escrow from Shop
**User Story:** As a platform operator, I need to remove escrow functionality from the Shop module to avoid payment processor and escrow agent licensing requirements.

**Acceptance Criteria:**
- [ ] Remove all escrow-related code and database tables for Shop
- [ ] Refund any currently held escrow funds in Shop
- [ ] Update Shop to "listing only" model
- [ ] Remove "Buy Now" buttons that process payments
- [ ] Add "Contact Seller" button for all Shop listings
- [ ] Optional: Charge listing fees in Kr for Shop listings

**Correctness Properties:**
```
Property: No_Shop_Escrow
∀ transaction t: t.module = 'SHOP' →
  t.type ≠ 'ESCROW' ∧
  t.payment_method = 'EXTERNAL'
```

---

### 2.8 Contest Module Compliance

#### 2.8.1 Remove Contest Escrow
**User Story:** As a platform operator, I need to remove escrow from contests and instead hold prize pools as part of the platform service.

**Acceptance Criteria:**
- [ ] Remove "escrow" terminology and classification from contests
- [ ] Prize pools are "platform-held funds" not "escrow"
- [ ] Prize pool is a non-refundable service fee once contest starts
- [ ] Platform distributes prizes as part of contest service
- [ ] Update Terms of Service to reflect this distinction

**Legal Distinction:**
```typescript
// BEFORE (Escrow - Regulated)
interface ContestPrizePool {
  type: 'ESCROW'; // ❌ Requires escrow license
  refundable: true;
  platform_role: 'NEUTRAL_THIRD_PARTY';
}

// AFTER (Platform Service - Less Regulated)
interface ContestPrizePool {
  type: 'PLATFORM_SERVICE_FEE'; // ✅ Part of platform service
  refundable: false; // Non-refundable once contest starts
  platform_role: 'SERVICE_PROVIDER';
  purpose: 'CONTEST_PRIZE_DISTRIBUTION';
}
```

#### 2.8.2 Paid Voting Rules
**User Story:** As a contest creator, I can enable paid voting only if the contest has no entry fee, to comply with gambling regulations.

**Acceptance Criteria:**
- [ ] Paid voting option only appears if entry_fee_kr = 0
- [ ] If entry_fee_kr > 0, voting must be free
- [ ] System validates and blocks illegal combinations
- [ ] UI prevents creators from selecting invalid configurations
- [ ] Error message explains gambling compliance rules

**Validation Logic:**
```typescript
function validateContestVoting(contest: Contest): ValidationResult {
  // Rule: Cannot charge both entry fee AND voting fee
  if (contest.entry_fee_kr > 0 && contest.voting.cost_per_vote > 0) {
    return {
      valid: false,
      error: 'Paid voting is only allowed for free-entry contests (gambling compliance)'
    };
  }
  
  return { valid: true };
}
```

**UI Behavior:**
```typescript
// In contest creation form
if (entry_fee_kr > 0) {
  voting_options = {
    enabled: true,
    cost_per_vote: 0, // Locked to 0
    disabled_message: 'Voting must be free when charging entry fee'
  };
} else {
  voting_options = {
    enabled: true,
    cost_per_vote: number, // Can set any amount
  };
}
```

**Correctness Properties:**
```
Property: No_Paid_Voting_With_Entry_Fee
∀ contest c: c.entry_fee_kr > 0 →
  c.voting.cost_per_vote = 0

Property: Paid_Voting_Requires_Free_Entry
∀ contest c: c.voting.cost_per_vote > 0 →
  c.entry_fee_kr = 0
```

---

### 2.9 Chama (Group Savings) Restructuring

#### 2.9.1 Remove Investment Chama Type
**User Story:** As a platform operator, I need to remove the investment chama type to avoid securities regulations.

**Acceptance Criteria:**
- [ ] Remove 'INVESTMENT' from ChamaType enum
- [ ] Only allow 'MERRY_GO_ROUND' and 'WELFARE' types
- [ ] Migrate existing investment chamas to welfare or close them
- [ ] Update UI to only show merry-go-round and welfare options

**Chama Types:**
```typescript
// BEFORE
enum ChamaType {
  MERRY_GO_ROUND,  // Rotating savings
  WELFARE,         // Emergency fund
  INVESTMENT       // ❌ REMOVE - Securities regulations
}

// AFTER
enum ChamaType {
  MERRY_GO_ROUND,  // Rotating savings (each member gets payout in rotation)
  WELFARE          // Emergency fund (payouts for emergencies/needs)
}
```

**Merry-Go-Round Model:**
```typescript
interface MerryGoRoundChama {
  type: 'MERRY_GO_ROUND';
  contribution_amount_kr: number;
  contribution_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  
  // Members take turns receiving the pot
  rotation_order: string[]; // User IDs in order
  current_recipient_index: number;
  
  // Each cycle, one member receives all contributions
  cycle_payout: number; // = contribution_amount * member_count
}
```

**Welfare Model:**
```typescript
interface WelfareChama {
  type: 'WELFARE';
  contribution_amount_kr: number;
  contribution_frequency: 'WEEKLY' | 'MONTHLY';
  
  // Payouts for emergencies/needs (requires approval)
  payout_requests: {
    member_id: string;
    amount_kr: number;
    reason: string;
    requires_approval: true;
    min_approvals: number;
  }[];
}
```

**Correctness Properties:**
```
Property: Only_Allowed_Chama_Types
∀ chama c: c.type ∈ {'MERRY_GO_ROUND', 'WELFARE'}

Property: No_Investment_Chamas
∀ chama c: c.type ≠ 'INVESTMENT'
```

---

### 2.10 Gifting System (REMOVED - Not Needed)

#### 2.10.1 Virtual Gifts Removed
**Rationale:** Virtual gifts are typically used during livestreaming (like TikTok Live, YouTube Live). Since the platform does not have a livestreaming feature, virtual gifts are not necessary.

**Alternative:** Users can tip creators on their content (posts, shorts, videos) which serves the same purpose of showing appreciation.

**Acceptance Criteria:**
- [ ] Remove virtual gift feature (if it exists)
- [ ] Content tips remain as the primary way to support creators
- [ ] No need for gift catalog, animations, or gift-related UI

**Budget Consideration:** Eliminates need for:
- Gift icon/animation assets
- Gift catalog management
- Additional transaction types
- UI complexity

---

### 2.11 Chama (Group Savings) Controls

#### 2.11.1 KYC Requirements for Chama
**User Story:** As a contest creator, I can create skill-based contests with judges and/or voting that comply with gambling regulations.

**Acceptance Criteria:**
- [ ] Contest creator selects judging method: JUDGES_ONLY, VOTES_ONLY, or JUDGES_AND_VOTES
- [ ] Entry fee is optional (can be 0)
- [ ] Voting is always FREE if entry fee > 0
- [ ] Paid voting only allowed if entry fee = 0
- [ ] Up to 15 judges can be selected
- [ ] Judge weight and vote weight can be configured (must sum to 100%)
- [ ] System validates contest legality before creation

**Judging Methods:**
```typescript
type JudgingMethod = 
  | 'JUDGES_ONLY'        // Judges score submissions (skill-based)
  | 'VOTES_ONLY'         // Public voting (free if entry fee charged)
  | 'JUDGES_AND_VOTES';  // Combined (weighted average)

interface Contest {
  entry_fee_kr: number; // Optional, can be 0
  judging_method: JudgingMethod;
  
  judges?: {
    users: User[]; // Max 15
    weight: number; // 0-100%
  };
  
  voting?: {
    enabled: boolean;
    cost_per_vote: number; // MUST be 0 if entry_fee > 0
    weight: number; // 0-100%
    max_votes_per_user: number;
  };
}
```

**Correctness Properties:**
```
Property: No_Paid_Voting_With_Entry_Fee
∀ contest c: c.entry_fee_kr > 0 →
  c.voting.cost_per_vote = 0

Property: Weights_Sum_To_100
∀ contest c: c.judging_method = 'JUDGES_AND_VOTES' →
  c.judges.weight + c.voting.weight = 100
```

#### 2.7.2 Prize Pool Management
**User Story:** As a contest creator, I deposit a prize pool that is held by the platform and distributed to winners after the contest ends.

**Acceptance Criteria:**
- [ ] Creator deposits prize pool when creating contest
- [ ] Prize pool deducted from creator's wallet
- [ ] Held in platform wallet (not escrow - this is a service fee)
- [ ] Non-refundable once contest starts
- [ ] Distributed to winners after contest ends and winners are approved
- [ ] Distribution: 1st place (50-100%), 2nd place (0-30%), 3rd place (0-20%)

**Correctness Properties:**
```
Property: Prize_Pool_Fully_Distributed
∀ contest c: c.status = 'COMPLETED' →
  sum(c.prize_distributions) = c.prize_pool_kr
```

#### 2.7.3 Participation Rewards (Platform-Funded)
**User Story:** As a user, I receive daily/weekly rewards from the platform (not contest creator) for participating in contests.

**Acceptance Criteria:**
- [ ] Platform (not contest creator) funds participation rewards
- [ ] Daily reward: 10-50 Kr for submitting entry or voting
- [ ] Weekly milestones: Day 7 (100 Kr), Day 14 (200 Kr), Day 21 (500 Kr)
- [ ] Max rewards per user per contest
- [ ] Rewards come from platform marketing budget
- [ ] Separate from contest prize pool

**Correctness Properties:**
```
Property: Participation_Rewards_Platform_Funded
∀ reward r: r.type = 'PARTICIPATION_REWARD' →
  r.funded_by = 'PLATFORM' ∧
  r.source ≠ contest.prize_pool
```

---

### 2.8 Chama (Group Savings) Controls

#### 2.8.1 KYC Requirements for Chama
**User Story:** As a compliance officer, I need all chama members to be KYC-verified to prevent money laundering through group savings.

**Acceptance Criteria:**
- [ ] All chama members must complete KYC before joining
- [ ] Chama creator must be KYC-approved
- [ ] Max 20 members per chama
- [ ] Chama purpose must be stated and legitimate
- [ ] Contributions and payouts are monitored for circular patterns

**Correctness Properties:**
```
Property: Chama_Members_KYC_Verified
∀ chama c, member m ∈ c.members:
  m.kyc_status = 'APPROVED'
```

#### 2.11.2 Chama Pattern Detection
**User Story:** As a compliance officer, I need to detect fake chamas used for money laundering.

**Acceptance Criteria:**
- [ ] Detect chamas where all members are from same device
- [ ] Flag chamas with circular contribution patterns
- [ ] Monitor rapid contribution-to-payout cycles
- [ ] Require 7-day cooling-off period before first payout
- [ ] Flag chamas where one member receives disproportionate payouts

**Correctness Properties:**
```
Property: Chama_Cooling_Off_Period
∀ chama c: c.first_payout_date ≥ c.created_date + 7_days
```

---

### 2.12 Enhanced KYC Workflows

#### 2.12.1 Tiered KYC Requirements
**User Story:** As a user, I face different KYC requirements based on my activity level and risk.

**Acceptance Criteria:**
- [ ] Tier 0 (No KYC): Can tip, subscribe, unlock content (max 10,000 Kr/month)
- [ ] Tier 1 (Basic KYC): Email + phone verification (max 50,000 Kr/month)
- [ ] Tier 2 (Full KYC): ID + selfie verification (max 500,000 Kr/month, can withdraw)
- [ ] Tier 3 (Enhanced KYC): Proof of income, business docs (unlimited)

**Correctness Properties:**
```
Property: KYC_Limits_Enforced
∀ user u: u.kyc_tier = 0 →
  u.monthly_transaction_limit ≤ 10000_kr
```

---

### 2.13 Compliance Dashboard

#### 2.13.1 Flagged Transactions Review
**User Story:** As a compliance officer, I need a dashboard to review flagged transactions and take action.

**Acceptance Criteria:**
- [ ] List of all flagged transactions with risk scores
- [ ] Filter by risk level, transaction type, date range
- [ ] View transaction details, user profiles, related transactions
- [ ] Actions: Approve, Block, Request more info, Escalate
- [ ] Audit log of all compliance actions

#### 2.13.2 Suspicious Activity Reports
**User Story:** As a compliance officer, I need to generate reports of suspicious activity for regulatory filing.

**Acceptance Criteria:**
- [ ] Export suspicious activity logs
- [ ] Generate SAR (Suspicious Activity Report) templates
- [ ] Track which activities have been reported
- [ ] Integration with regulatory reporting systems (future)

---

## 3. Non-Functional Requirements

### 3.1 Performance
- Risk score calculation: < 100ms
- Currency conversion: < 50ms (cached)
- Transaction validation: < 200ms

### 3.2 Security
- All financial transactions use HMAC-SHA256 signatures
- Nonce-based replay attack prevention
- Rate limiting on all financial endpoints
- Encrypted audit logs

### 3.3 Compliance
- GDPR-compliant data handling
- Audit trail retention: 7 years
- Transaction logs immutable
- Regular compliance audits

### 3.4 Scalability
- Support 1M+ users
- Handle 10K+ transactions per minute
- Real-time risk scoring
- Distributed transaction processing

---

## 4. Success Criteria

### 4.1 Legal Compliance
- [ ] Platform classified as "platform currency provider" (not money transmitter)
- [ ] No escrow or payment processing for physical goods in Shop module
- [ ] Marketplace module (brand deals) unchanged
- [ ] All contests comply with gambling regulations (paid voting only with free entry)
- [ ] Locked chat access follows Cameo/Talkroom model (one-time access fee)
- [ ] Only merry-go-round and welfare chamas allowed (no investment type)
- [ ] Terms of Service reviewed by legal counsel

### 4.2 Risk Mitigation
- [ ] 95%+ of transactions have valid context
- [ ] Self-tipping detection accuracy > 90%
- [ ] High-risk users automatically restricted
- [ ] Suspicious activity flagged within 1 hour
- [ ] No direct wallet transfers or chat tips allowed
- [ ] All chama members KYC-verified

### 4.3 User Experience
- [ ] Fiat conversion displayed everywhere Kr is shown
- [ ] Clear transaction descriptions for all transactions
- [ ] Smooth KYC onboarding flow
- [ ] No disruption to legitimate users
- [ ] Locked chat access works like Cameo/Talkroom
- [ ] Contest creators understand paid voting rules
- [ ] Shop listings easy to browse with "Contact Seller" button

---

## 5. Out of Scope

- Multi-country money transmitter licensing (too expensive for MVP)
- SOC 2 / ISO 27001 certification (deferred to Series A funding)
- Automated regulatory reporting (deferred to post-funding)
- Paid sanctions screening API integration (using free OFAC list instead)
- PCI DSS compliance (using payment processors handles this)
- Legal counsel review (deferred to post-funding)
- Virtual gifts feature (not needed without livestreaming)
- Permanent chat access model (using task-based model instead)

---

## 6. Assumptions

- Platform will use third-party payment processors (Stripe, PayPal, M-Pesa) for fiat top-ups
- Platform operates globally with users from any country
- **Zero budget for compliance** - Must use free/open-source solutions
- Legal counsel review deferred to post-funding (document structure designed for easy review)
- Expensive compliance measures (SOC 2, paid sanctions screening) deferred to Series A
- Shop is listing-only with no payment processing
- No livestreaming feature (virtual gifts not needed)
- Locked chat is task-based service model (not permanent access)

---

## 7. Dependencies

- Payment processor integration (Stripe/PayPal/M-Pesa) - existing or new
- KYC verification service (existing system)
- Device fingerprinting library (free/open-source: FingerprintJS or ClientJS)
- **Currency conversion API** - Already configured: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies`
- **OFAC Sanctions List** - Free download from: `https://www.treasury.gov/ofac/downloads/sdnlist.txt`
- Legal counsel review (deferred to post-funding)

---

## 8. Risks

### 8.1 Technical Risks
- Risk scoring algorithm may have false positives
- Currency conversion API downtime
- Performance impact of real-time risk calculation

### 8.2 Business Risks
- User pushback on removing wallet-to-wallet transfers
- Reduced engagement from KYC requirements
- **Zero budget limits compliance depth** - Can only implement structural changes, not paid services
- Global operation increases regulatory complexity
- Task-based locked chat may need user education

### 8.3 Legal Risks
- Regulatory interpretation may differ by jurisdiction (operating globally)
- Contest legality varies by country
- Chama structure may be regulated in some countries
- **No legal counsel review** - Relying on best practices and common patterns
- Sanctions screening limited to free OFAC list (not comprehensive)

---

## 9. Regulatory References

- FATF 40 Recommendations (https://www.fatf-gafi.org/)
- FinCEN Guidance on Virtual Currencies
- EU 5th Anti-Money Laundering Directive (5AMLD)
- Kenya Proceeds of Crime and Anti-Money Laundering Act
- US Bank Secrecy Act (BSA)
- State money transmitter laws (varies by state)
