# Compliance System - Quick Reference Guide

## 🎯 Overview

This is a quick reference for developers working with the compliance system.

## 📊 Risk Scoring

### Risk Levels
- **LOW (0-29)**: Standard monitoring
- **MEDIUM (30-49)**: Enhanced monitoring, suggest KYC
- **HIGH (50-69)**: Require KYC, limit transactions, flag for review
- **CRITICAL (70-100)**: Suspend account, block withdrawals, require manual review

### Risk Factors (Total: 100 points)
1. **KYC Status** (0-30 points)
   - NOT_STARTED: 30 points
   - PENDING: 15 points
   - REJECTED: 50 points (critical)
   - APPROVED: 0 points

2. **Account Age** (0-10 points)
   - < 7 days: 10 points
   - < 30 days: 5 points
   - ≥ 30 days: 0 points

3. **Geographic Risk** (0-20 points)
   - High-risk country: 15 points
   - IP country mismatch: 10 points

4. **Transaction Velocity** (0-20 points)
   - > 20 tx/hour: 20 points
   - > 10 tx/hour: 10 points
   - > 100 tx/24h: 10 points

5. **Transaction Volume** (0-15 points)
   - > 100,000 Rc/24h: 15 points
   - > 50,000 Rc/24h: 10 points

6. **Self-Tipping** (0-25 points)
   - Shared device + tips to shared users: 25 points
   - Shared device only: 10 points

7. **Circular Tipping** (0-20 points)
   - > 5 reciprocal tips: 20 points
   - > 2 reciprocal tips: 10 points

8. **Recipient Diversity** (0-10 points)
   - < 20% diversity: 10 points
   - < 40% diversity: 5 points

### Usage

```typescript
import { riskScoringService } from './services/compliance/riskScoring.service.js';

// Calculate risk score
const riskData = await riskScoringService.calculateUserRiskScore(userId);
console.log(riskData.score); // 0-100
console.log(riskData.level); // LOW, MEDIUM, HIGH, CRITICAL
console.log(riskData.flags); // Array of flag reasons

// Get cached risk profile
const profile = await riskScoringService.getUserRiskProfile(userId);
if (profile.withdrawal_blocked) {
  // Block withdrawal
}
```

## 🔒 Transaction Validation

### Valid Transaction Types
- `CONTENT_TIP` - Tip on post/short/video
- `LOCKED_CHAT_TASK` - Pay for task-based chat access
- `SUBSCRIPTION` - Monthly subscription
- `CONTENT_UNLOCK` - Unlock locked content
- `CONTEST_ENTRY` - Contest entry fee
- `CONTEST_VOTE` - Paid vote (only if entry_fee = 0)
- `CONTEST_PRIZE` - Prize distribution
- `CHAMA_CONTRIBUTION` - Group savings contribution
- `CHAMA_PAYOUT` - Group savings payout
- `PLATFORM_REWARD` - Platform-funded reward
- `WITHDRAWAL` - Cash out to fiat
- `TOP_UP` - Buy Rc with fiat
- `SHOP_LISTING_FEE` - Shop listing fee

### Blocked Transaction Types
- ❌ `WALLET_TRANSFER` - Direct wallet-to-wallet transfers
- ❌ `CHAT_TIP` - Tips in direct/private chats
- ❌ `ESCROW` - Escrow for physical goods
- ❌ `VIRTUAL_GIFT` - Virtual gifts (not needed)

### Velocity Limits
- **Tips**: Max 10 per minute
- **All Transactions**: Max 50 per hour
- **Volume (non-KYC)**: Max 100,000 Rc per 24 hours
- **Volume (KYC)**: Max 500,000 Rc per 24 hours

### Usage

```typescript
import { transactionValidationService } from './services/compliance/transactionValidation.service.js';

// Validate before processing
const validation = await transactionValidationService.validateTransaction({
  user_id: userId,
  type: 'CONTENT_TIP',
  amount_kr: 100,
  counterparty_id: creatorId,
  context_type: 'CONTENT_TIP',
  context_ref_id: postId,
  context_desc: 'Tip on post: Amazing content!'
});

if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// Flag suspicious transaction
await transactionValidationService.flagTransaction(
  transactionId,
  userId,
  'VELOCITY',
  'Too many transactions in short time',
  'HIGH'
);
```

## 💬 Locked Chat Tasks

### Access Rules
1. **Subscribers**: Always have access (no payment needed)
2. **Active Task**: Can message during task period
3. **Locked**: Must pay to unlock for a task
4. **Unlocked**: Creator hasn't enabled locked chat

### Task Lifecycle
1. User pays to unlock chat for specific task
2. Chat unlocks until deadline
3. Creator delivers task
4. Creator marks task as "Done"
5. Chat locks again (unless user is subscriber)

### Usage

```typescript
import { lockedChatTaskService } from './services/compliance/lockedChatTask.service.js';

// Check if user can message creator
const access = await lockedChatTaskService.canUserMessageCreator(userId, creatorId);
if (!access.canMessage) {
  console.log(`Chat locked. Fee: ${access.unlockFeeKr} Rc`);
}

// Unlock chat for a task
const result = await lockedChatTaskService.unlockChatForTask({
  user_id: userId,
  creator_id: creatorId,
  task_description: 'Record a birthday message for my friend',
  amount_kr: 100,
  deadline_hours: 24
});

// Complete task
await lockedChatTaskService.completeTask(
  taskId,
  creatorId,
  'https://cloudinary.com/video.mp4'
);

// Get creator settings
const settings = await lockedChatTaskService.getCreatorSettings(creatorId);
console.log(settings.is_locked); // true/false
console.log(settings.task_fee_kr); // Fee amount
```

## 🏆 Contest Validation

### Gambling Compliance Rules
- ✅ **Free Entry + Free Voting**: Always allowed
- ✅ **Free Entry + Paid Voting**: Allowed (skill-based)
- ✅ **Paid Entry + Free Voting**: Allowed
- ❌ **Paid Entry + Paid Voting**: BLOCKED (gambling)

### Judging Methods
- `JUDGES_ONLY` - Judges score submissions
- `VOTES_ONLY` - Public voting
- `JUDGES_AND_VOTES` - Combined (weighted)

### Usage

```typescript
import { contestValidationService } from './services/compliance/contestValidation.service.js';

// Validate contest configuration
const validation = await contestValidationService.validateContestConfig({
  entry_fee_kr: 100,
  voting_enabled: true,
  voting_cost_per_vote_kr: 0, // Must be 0 if entry_fee > 0
  judging_method: 'JUDGES_AND_VOTES',
  judge_weight_percentage: 60,
  vote_weight_percentage: 40
});

if (!validation.isValid) {
  console.error(validation.errors);
}

// Calculate final scores
await contestValidationService.calculateFinalScores(contestId);
```

## 🛡️ OFAC Screening

### When to Screen
- User registration (optional)
- KYC verification (recommended)
- High-value transactions (optional)
- Manual admin review

### Usage

```typescript
import { ofacScreeningService } from './services/compliance/ofacScreening.service.js';

// Screen user's name
const result = await ofacScreeningService.screenUser(userId);
if (result.isBlocked) {
  console.error(`OFAC match: ${result.reason}`);
  // Block user account
}

// Screen any name
const nameResult = await ofacScreeningService.screenName('John Doe');
console.log(nameResult.isMatch); // true/false
console.log(nameResult.matchScore); // 0-100
```

## 📱 Device Fingerprinting

### Automatic Tracking
Device fingerprints are automatically tracked for all authenticated requests via middleware.

### Manual Usage

```typescript
import { deviceFingerprintService } from './services/compliance/deviceFingerprint.service.js';

// Track device (usually automatic)
await deviceFingerprintService.trackDevice(userId, req);

// Check for suspicious patterns
const suspicion = await deviceFingerprintService.checkDeviceSuspicion(userId);
if (suspicion.isSuspicious) {
  console.log(suspicion.reasons);
  console.log(`Shared devices: ${suspicion.sharedDevices}`);
}
```

## 🔧 Middleware

### Track Device Fingerprint
Automatically applied to all requests:
```typescript
app.use(trackDeviceFingerprint);
```

### Check Risk Level
Apply to sensitive operations:
```typescript
router.post('/withdraw', authenticate, checkRiskLevel, withdrawController);
```

### Validate Withdrawal
Apply to withdrawal endpoints:
```typescript
router.post('/withdraw', authenticate, validateWithdrawal, withdrawController);
```

### Enforce Transaction Limits
Apply to transaction endpoints:
```typescript
router.post('/tip', authenticate, enforceTransactionLimits, tipController);
```

## 📅 Cron Jobs

### Schedule
- **Every hour**: Expire overdue locked chat tasks
- **Every 6 hours**: Recalculate risk scores for high-risk users
- **Sunday 2 AM**: Update OFAC SDN list
- **Daily 3 AM**: Clean up expired OFAC cache
- **Daily 4 AM**: Generate compliance reports

### Manual Trigger
```typescript
import { ComplianceCronService } from './services/compliance/compliance.cron.js';

// Run all jobs immediately (for testing)
await ComplianceCronService.runAllJobsNow();
```

## 🎛️ Admin Dashboard

### Flagged Transactions
```bash
GET /api/v1/compliance/flagged-transactions?status=PENDING&severity=HIGH
```

### Review Transaction
```bash
PUT /api/v1/compliance/flagged-transactions/:flagId/review
{
  "status": "APPROVED",
  "review_note": "Legitimate transaction",
  "action_taken": "NONE"
}
```

### Suspicious Activity Logs
```bash
GET /api/v1/compliance/suspicious-activity?severity=CRITICAL
```

### Screen User
```bash
POST /api/v1/compliance/screen-user/:userId
```

## 🚨 Common Scenarios

### Scenario 1: User Tries to Send Direct Wallet Transfer
```typescript
// Transaction validation will block it
const validation = await transactionValidationService.validateTransaction({
  type: 'WALLET_TRANSFER', // Blocked type
  // ...
});
// validation.isValid = false
// validation.errors = ['Direct wallet transfers are not allowed for compliance']
```

### Scenario 2: User Tries Paid Voting with Entry Fee
```typescript
// Contest validation will block it
const validation = await contestValidationService.validateContestConfig({
  entry_fee_kr: 100,
  voting_cost_per_vote_kr: 10 // Not allowed!
});
// validation.isValid = false
// validation.errors = ['Paid voting is only allowed for free-entry contests']
```

### Scenario 3: High-Risk User Tries to Withdraw
```typescript
// Middleware will block it
router.post('/withdraw', authenticate, validateWithdrawal, async (req, res) => {
  // This code won't execute if user is blocked
});
// Response: 403 Forbidden
// { error: 'Withdrawals are blocked due to compliance concerns' }
```

### Scenario 4: User Wants to Message Creator
```typescript
const access = await lockedChatTaskService.canUserMessageCreator(userId, creatorId);

if (access.reason === 'SUBSCRIBED') {
  // Allow messaging (subscriber)
} else if (access.reason === 'ACTIVE_TASK') {
  // Allow messaging (has active task)
} else if (access.reason === 'LOCKED') {
  // Show unlock UI with fee: access.unlockFeeKr
} else {
  // Allow messaging (creator hasn't enabled locked chat)
}
```

## 📝 Database Queries

### Get High-Risk Users
```sql
SELECT user_id, risk_score, risk_level, flagged_reasons
FROM user_risk_profiles
WHERE risk_level IN ('HIGH', 'CRITICAL')
ORDER BY risk_score DESC;
```

### Get Flagged Transactions
```sql
SELECT ft.*, t.amount_kr, t.type, t.created_at
FROM flagged_transactions ft
JOIN transactions t ON ft.transaction_id = t.id
WHERE ft.status = 'PENDING'
ORDER BY ft.severity DESC, ft.created_at DESC;
```

### Get Suspicious Devices
```sql
SELECT fingerprint_hash, COUNT(DISTINCT user_id) as user_count, 
       array_agg(DISTINCT user_id) as users
FROM device_fingerprints
GROUP BY fingerprint_hash
HAVING COUNT(DISTINCT user_id) > 1;
```

### Get Active Locked Chat Tasks
```sql
SELECT lct.*, u.username as user_name, c.username as creator_name
FROM locked_chat_tasks lct
JOIN "user" u ON lct.user_id = u.id
JOIN "user" c ON lct.creator_id = c.id
WHERE lct.status IN ('PENDING', 'IN_PROGRESS')
  AND lct.deadline > NOW()
ORDER BY lct.created_at ASC;
```

## 🔍 Debugging

### Check if Services are Running
```bash
# Check logs
railway logs --tail 100 | grep -i "compliance\|ofac\|cron"

# Should see:
# ✅ OFAC screening service initialized
# ✅ Compliance cron jobs initialized
```

### Test Risk Scoring
```bash
curl -X POST https://your-api.railway.app/api/v1/compliance/risk-profile/USER_ID/recalculate \
  -H "Authorization: Bearer TOKEN"
```

### Test Device Tracking
```bash
# Make any authenticated request
curl https://your-api.railway.app/api/v1/users/me \
  -H "Authorization: Bearer TOKEN"

# Check database
SELECT * FROM device_fingerprints WHERE user_id = 'USER_ID';
```

### Test OFAC Screening
```bash
curl -X POST https://your-api.railway.app/api/v1/compliance/screen-user/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 📚 Related Documentation

- **Full Implementation**: `COMPLIANCE_IMPLEMENTATION.md`
- **Deployment Guide**: `COMPLIANCE_DEPLOYMENT_GUIDE.md`
- **Requirements**: `.kiro/specs/wallet-compliance-restructuring/requirements.md`
- **API Routes**: `backend/src/modules/compliance/compliance.routes.ts`

## 🆘 Support

For issues or questions:
1. Check logs: `railway logs`
2. Review this guide
3. Check implementation docs
4. Contact development team

---

**Last Updated**: 2024
**Version**: 1.0.0
