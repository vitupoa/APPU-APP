# Security Enhancements & RLS for Subscription and Content Lock Systems

## 📊 Current Implementation Status

### ✅ Subscription System - IMPLEMENTED
- **Database Schema**: Complete with `subscriptions` and `subscription_tiers` tables
- **Backend Service**: `subscription.service.ts` with full CRUD operations
- **Features**:
  - 4 subscription tiers (TOP_FUN, REAL_FAN, TRUE_FAN, SUPER_FAN)
  - Monthly billing with auto-renewal
  - 15% platform fee on subscriptions
  - Tier-based access control
  - Subscription status management (active, cancelled, expired)
  - Wallet integration with atomic transactions
- **Frontend**: Kotlin Multiplatform UI components created
  - `SubscriptionTierSetupScreen.kt`
  - `SubscriptionTierSetupViewModel.kt`

### ✅ Content Lock System - IMPLEMENTED
- **Database Schema**: Complete with `content_unlocks` table
- **Backend Service**: `contentLock.service.ts` with full unlock flow
- **Features**:
  - Universal locking for Shorts, Posts, and Live streams
  - One-time unlock payments
  - Real-time currency conversion (Fiat ↔ Kr)
  - 15% platform fee on unlocks
  - Access control (creator, subscriber, unlocked)
  - Atomic transactions with database locks
- **Frontend**: Kotlin Multiplatform UI components created
  - `ContentLockScreen.kt` (unlock overlay)
  - `ContentLockSettingsScreen.kt` (creator settings)
  - `LockedContentCard.kt` (feed integration)
  - `ContentLockViewModel.kt`

### ⚠️ What's Missing - SECURITY & RLS

## 🔐 Security Enhancements Needed

### 1. Row-Level Security (RLS) Policies

#### A. Subscription Tiers Table
```sql
-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can manage their own tiers
CREATE POLICY subscription_tiers_creator_manage
ON subscription_tiers
FOR ALL
USING (creator_id = current_user_id())
WITH CHECK (creator_id = current_user_id());

-- Policy: Everyone can view enabled tiers
CREATE POLICY subscription_tiers_public_read
ON subscription_tiers
FOR SELECT
USING (is_enabled = true);

-- Policy: Admins can manage all tiers
CREATE POLICY subscription_tiers_admin_manage
ON subscription_tiers
FOR ALL
USING (is_admin(current_user_id()));
```

#### B. Subscriptions Table
```sql
-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions (as subscriber)
CREATE POLICY subscriptions_subscriber_read
ON subscriptions
FOR SELECT
USING (subscriber_id = current_user_id());

-- Policy: Creators can view subscriptions to them
CREATE POLICY subscriptions_creator_read
ON subscriptions
FOR SELECT
USING (creator_id = current_user_id());

-- Policy: Only system can create subscriptions (via service)
CREATE POLICY subscriptions_system_create
ON subscriptions
FOR INSERT
WITH CHECK (is_system_user());

-- Policy: Subscribers can cancel their own subscriptions
CREATE POLICY subscriptions_subscriber_cancel
ON subscriptions
FOR UPDATE
USING (subscriber_id = current_user_id() AND status = 'active')
WITH CHECK (status = 'cancelled');

-- Policy: Admins can manage all subscriptions
CREATE POLICY subscriptions_admin_manage
ON subscriptions
FOR ALL
USING (is_admin(current_user_id()));
```

#### C. Content Unlocks Table
```sql
-- Enable RLS
ALTER TABLE content_unlocks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own unlocks
CREATE POLICY content_unlocks_user_read
ON content_unlocks
FOR SELECT
USING (user_id = current_user_id());

-- Policy: Creators can view unlocks of their content
CREATE POLICY content_unlocks_creator_read
ON content_unlocks
FOR SELECT
USING (creator_id = current_user_id());

-- Policy: Only system can create unlocks (via service)
CREATE POLICY content_unlocks_system_create
ON content_unlocks
FOR INSERT
WITH CHECK (is_system_user());

-- Policy: No updates or deletes allowed (immutable)
CREATE POLICY content_unlocks_no_modify
ON content_unlocks
FOR UPDATE
USING (false);

CREATE POLICY content_unlocks_no_delete
ON content_unlocks
FOR DELETE
USING (false);

-- Policy: Admins can view all unlocks
CREATE POLICY content_unlocks_admin_read
ON content_unlocks
FOR SELECT
USING (is_admin(current_user_id()));
```

#### D. Content Tables (Shorts, Posts, Live Streams)
```sql
-- Shorts Table
ALTER TABLE shorts ENABLE ROW LEVEL SECURITY;

-- Policy: Creators can manage their own shorts
CREATE POLICY shorts_creator_manage
ON shorts
FOR ALL
USING (user_id = current_user_id())
WITH CHECK (user_id = current_user_id());

-- Policy: Users can view unlocked or public shorts
CREATE POLICY shorts_user_read
ON shorts
FOR SELECT
USING (
  is_locked = false OR
  user_id = current_user_id() OR
  has_subscription_access(current_user_id(), user_id, required_tier) OR
  has_unlocked_content(current_user_id(), id, 'SHORT')
);

-- Similar policies for Posts and Live Streams
-- (Repeat above pattern for posts and live_streams tables)
```

### 2. Database Functions for RLS

```sql
-- Function: Get current user ID from JWT context
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_user_id', true)::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user is system user
CREATE OR REPLACE FUNCTION is_system_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('app.is_system', true)::BOOLEAN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check subscription access
CREATE OR REPLACE FUNCTION has_subscription_access(
  subscriber_id UUID,
  creator_id UUID,
  required_tier TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  tier_order TEXT[] := ARRAY['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN'];
  required_index INT;
  subscribed_index INT;
BEGIN
  -- If no tier required, no subscription needed
  IF required_tier IS NULL THEN
    RETURN false;
  END IF;

  -- Get tier indexes
  required_index := array_position(tier_order, required_tier);
  
  -- Check active subscription
  SELECT array_position(tier_order, tier) INTO subscribed_index
  FROM subscriptions
  WHERE subscriber_id = subscriber_id
    AND creator_id = creator_id
    AND status = 'active'
  LIMIT 1;

  -- Return true if subscribed tier >= required tier
  RETURN subscribed_index IS NOT NULL AND subscribed_index >= required_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if content is unlocked
CREATE OR REPLACE FUNCTION has_unlocked_content(
  user_id UUID,
  content_id UUID,
  content_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM content_unlocks
    WHERE user_id = user_id
      AND content_id = content_id
      AND content_type = content_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Application-Level Security Enhancements

#### A. Rate Limiting
```typescript
// Add to contentLock.routes.ts and subscription.routes.ts
import rateLimit from 'express-rate-limit';

// Prevent unlock spam
const unlockLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 unlocks per minute
  message: 'Too many unlock attempts, please try again later'
});

router.post('/unlock', authenticate, unlockLimiter, async (req, res, next) => {
  // ... existing code
});

// Prevent subscription spam
const subscribeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 subscriptions per minute
  message: 'Too many subscription attempts, please try again later'
});

router.post('/subscribe', authenticate, subscribeLimiter, async (req, res, next) => {
  // ... existing code
});
```

#### B. Input Validation & Sanitization
```typescript
// Add to contentLock.service.ts
import { z } from 'zod';

const UnlockSchema = z.object({
  contentId: z.string().uuid(),
  contentType: z.enum(['SHORT', 'POST', 'LIVE']),
});

const PriceSchema = z.object({
  unlockAmountKr: z.number().positive().max(1000000),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
});

// Use in service methods
static async unlockContent(userId: string, contentId: string, contentType: ContentType, userCurrency: string) {
  // Validate inputs
  UnlockSchema.parse({ contentId, contentType });
  
  // ... existing code
}
```

#### C. Idempotency Keys
```typescript
// Add to contentLock.service.ts
import crypto from 'crypto';

interface UnlockOptions {
  idempotencyKey?: string;
}

static async unlockContent(
  userId: string,
  contentId: string,
  contentType: ContentType,
  userCurrency: string,
  options?: UnlockOptions
): Promise<UnlockResult> {
  const idempotencyKey = options?.idempotencyKey || crypto.randomUUID();
  
  // Check if this unlock was already processed
  const existingUnlock = await prisma.contentUnlock.findFirst({
    where: {
      userId,
      contentId,
      contentType,
      metadata: { path: ['idempotencyKey'], equals: idempotencyKey }
    }
  });
  
  if (existingUnlock) {
    // Return cached result
    return {
      success: true,
      unlockAmountKr: Number(existingUnlock.amountKr),
      // ... other fields
    };
  }
  
  // ... proceed with unlock
}
```

#### D. Fraud Detection
```typescript
// Add to contentLock.service.ts
class FraudDetectionService {
  static async checkUnlockFraud(userId: string, contentId: string): Promise<boolean> {
    // Check for rapid unlocks
    const recentUnlocks = await prisma.contentUnlock.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 60000) } // Last minute
      }
    });
    
    if (recentUnlocks > 10) {
      throw new Error('Suspicious activity detected. Please contact support.');
    }
    
    // Check for unlock-refund patterns
    const unlockRefundCount = await prisma.transaction.count({
      where: {
        userId,
        type: { in: ['content_unlock_paid', 'refund'] },
        createdAt: { gte: new Date(Date.now() - 86400000) } // Last 24 hours
      }
    });
    
    if (unlockRefundCount > 20) {
      throw new Error('Account flagged for review. Please contact support.');
    }
    
    return true;
  }
}

// Use in unlockContent
static async unlockContent(...) {
  await FraudDetectionService.checkUnlockFraud(userId, contentId);
  // ... proceed with unlock
}
```

#### E. Audit Logging
```typescript
// Add to contentLock.service.ts
class AuditLogger {
  static async logUnlock(data: {
    userId: string;
    contentId: string;
    contentType: string;
    amountKr: number;
    success: boolean;
    error?: string;
  }) {
    await prisma.auditLog.create({
      data: {
        action: 'CONTENT_UNLOCK',
        userId: data.userId,
        targetType: data.contentType,
        targetId: data.contentId,
        details: {
          amountKr: data.amountKr,
          success: data.success,
          error: data.error
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });
  }
}

// Use in unlockContent
static async unlockContent(...) {
  try {
    const result = await withDeadlockRetry(async () => {
      // ... unlock logic
    });
    
    await AuditLogger.logUnlock({
      userId,
      contentId,
      contentType,
      amountKr: unlockAmountKr,
      success: true
    });
    
    return result;
  } catch (error) {
    await AuditLogger.logUnlock({
      userId,
      contentId,
      contentType,
      amountKr: unlockAmountKr,
      success: false,
      error: error.message
    });
    throw error;
  }
}
```

### 4. Subscription-Specific Security

#### A. Prevent Subscription Abuse
```typescript
// Add to subscription.service.ts
class SubscriptionSecurityService {
  static async checkSubscriptionEligibility(subscriberId: string, creatorId: string): Promise<void> {
    // Prevent self-subscription
    if (subscriberId === creatorId) {
      throw new Error('Cannot subscribe to yourself');
    }
    
    // Check for rapid subscribe-unsubscribe patterns
    const recentCancellations = await prisma.subscription.count({
      where: {
        subscriberId,
        creatorId,
        status: 'cancelled',
        cancelledAt: { gte: new Date(Date.now() - 86400000) } // Last 24 hours
      }
    });
    
    if (recentCancellations > 3) {
      throw new Error('Too many subscription changes. Please wait 24 hours.');
    }
    
    // Check for insufficient balance patterns
    const failedAttempts = await prisma.transaction.count({
      where: {
        userId: subscriberId,
        type: 'subscription_paid',
        status: 'failed',
        createdAt: { gte: new Date(Date.now() - 3600000) } // Last hour
      }
    });
    
    if (failedAttempts > 5) {
      throw new Error('Multiple failed attempts. Please check your balance.');
    }
  }
}

// Use in subscribe method
static async subscribe(subscriberId: string, creatorId: string, tierType: string) {
  await SubscriptionSecurityService.checkSubscriptionEligibility(subscriberId, creatorId);
  // ... proceed with subscription
}
```

#### B. Subscription Renewal Security
```typescript
// Add to subscription.service.ts
class SubscriptionRenewalService {
  static async renewSubscription(subscriptionId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { subscriber: true, subscriptionTier: true }
    });
    
    if (!subscription || subscription.status !== 'active') {
      return; // Skip inactive subscriptions
    }
    
    // Check if renewal is due
    if (subscription.nextBillingAt && subscription.nextBillingAt > new Date()) {
      return; // Not due yet
    }
    
    try {
      // Attempt renewal with retry logic
      await withDeadlockRetry(async () => {
        return prisma.$transaction(async (tx) => {
          // Lock wallets
          const wallets = await lockWalletsForUpdate(tx, [
            subscription.subscriberId,
            subscription.creatorId
          ]);
          
          const subscriberWallet = wallets.find(w => w.user_id === subscription.subscriberId);
          
          if (!subscriberWallet || Number(subscriberWallet.kr_balance) < Number(subscription.krAmount)) {
            // Insufficient balance - cancel subscription
            await tx.subscription.update({
              where: { id: subscriptionId },
              data: { status: 'cancelled', cancelledAt: new Date() }
            });
            
            // Notify user
            await this.notifySubscriptionCancelled(subscription.subscriberId, 'insufficient_balance');
            return;
          }
          
          // Process renewal payment
          const platformFee = subscription.krAmount.mul(0.15);
          const creatorCredit = subscription.krAmount.sub(platformFee);
          
          await tx.wallet.update({
            where: { userId: subscription.subscriberId },
            data: { krBalance: { decrement: subscription.krAmount } }
          });
          
          await tx.wallet.update({
            where: { userId: subscription.creatorId },
            data: { krBalance: { increment: creatorCredit } }
          });
          
          // Update next billing date
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);
          
          await tx.subscription.update({
            where: { id: subscriptionId },
            data: { nextBillingAt: nextBilling }
          });
          
          // Record transactions
          await tx.transaction.createMany({
            data: [
              {
                userId: subscription.subscriberId,
                type: 'subscription_renewal',
                amountKr: subscription.krAmount,
                status: 'completed',
                provider: 'platform',
                counterpartyId: subscription.creatorId
              },
              {
                userId: subscription.creatorId,
                type: 'subscription_earned',
                amountKr: creatorCredit,
                status: 'completed',
                provider: 'platform',
                counterpartyId: subscription.subscriberId
              }
            ]
          });
        });
      });
    } catch (error) {
      // Log renewal failure
      await AuditLogger.logSubscriptionRenewal({
        subscriptionId,
        success: false,
        error: error.message
      });
    }
  }
}
```

### 5. Content Lock-Specific Security

#### A. Price Manipulation Prevention
```typescript
// Add to contentLock.service.ts
class PriceSecurityService {
  static async validateUnlockPrice(contentId: string, contentType: ContentType, expectedPrice: number): Promise<void> {
    let actualPrice: number;
    
    switch (contentType) {
      case 'SHORT':
        const short = await prisma.short.findUnique({
          where: { id: contentId },
          select: { unlockAmountKr: true }
        });
        actualPrice = short?.unlockAmountKr ? Number(short.unlockAmountKr) : 0;
        break;
      // ... similar for POST and LIVE
    }
    
    if (actualPrice !== expectedPrice) {
      throw new Error('Price mismatch. Content price may have changed.');
    }
  }
}

// Use in unlockContent
static async unlockContent(...) {
  // Validate price hasn't changed
  await PriceSecurityService.validateUnlockPrice(contentId, contentType, unlockAmountKr);
  // ... proceed with unlock
}
```

#### B. Content Availability Check
```typescript
// Add to contentLock.service.ts
class ContentAvailabilityService {
  static async checkContentAvailable(contentId: string, contentType: ContentType): Promise<void> {
    let content: any;
    
    switch (contentType) {
      case 'SHORT':
        content = await prisma.short.findUnique({
          where: { id: contentId },
          select: { id: true, userId: true }
        });
        break;
      // ... similar for POST and LIVE
    }
    
    if (!content) {
      throw new Error('Content not found or has been deleted');
    }
    
    // Check if creator account is active
    const creator = await prisma.user.findUnique({
      where: { id: content.userId || content.hostId },
      select: { isSuspended: true }
    });
    
    if (creator?.isSuspended) {
      throw new Error('Content creator account is suspended');
    }
  }
}

// Use in unlockContent
static async unlockContent(...) {
  await ContentAvailabilityService.checkContentAvailable(contentId, contentType);
  // ... proceed with unlock
}
```

## 📋 Implementation Checklist

### Database Security
- [ ] Enable RLS on all sensitive tables
- [ ] Create RLS policies for subscription_tiers
- [ ] Create RLS policies for subscriptions
- [ ] Create RLS policies for content_unlocks
- [ ] Create RLS policies for content tables (shorts, posts, live_streams)
- [ ] Create helper functions for RLS (current_user_id, is_admin, etc.)
- [ ] Test RLS policies with different user roles

### Application Security
- [ ] Add rate limiting to unlock endpoints
- [ ] Add rate limiting to subscription endpoints
- [ ] Implement input validation with Zod
- [ ] Add idempotency key support
- [ ] Implement fraud detection for unlocks
- [ ] Implement fraud detection for subscriptions
- [ ] Add comprehensive audit logging
- [ ] Implement subscription renewal security
- [ ] Add price manipulation prevention
- [ ] Add content availability checks

### Monitoring & Alerts
- [ ] Set up alerts for suspicious unlock patterns
- [ ] Set up alerts for subscription abuse
- [ ] Monitor failed transaction rates
- [ ] Track unlock/subscription conversion rates
- [ ] Monitor platform fee collection
- [ ] Set up dashboards for revenue tracking

### Testing
- [ ] Test RLS policies with different user roles
- [ ] Test rate limiting effectiveness
- [ ] Test fraud detection triggers
- [ ] Test idempotency key handling
- [ ] Test subscription renewal flow
- [ ] Test price change scenarios
- [ ] Test content deletion scenarios
- [ ] Load test unlock endpoints
- [ ] Load test subscription endpoints

## 🚨 Critical Security Considerations

### 1. Never Trust Client Input
- Always validate unlock amounts server-side
- Always check subscription tier eligibility server-side
- Never rely on client-side access checks

### 2. Atomic Transactions
- All payment operations must be atomic
- Use database locks to prevent race conditions
- Implement retry logic for deadlocks

### 3. Audit Everything
- Log all unlock attempts (success and failure)
- Log all subscription changes
- Log all price changes
- Retain logs for compliance

### 4. Rate Limiting
- Prevent brute force unlock attempts
- Prevent subscription spam
- Implement exponential backoff

### 5. Fraud Detection
- Monitor for unusual patterns
- Flag accounts with high refund rates
- Implement velocity checks

## 📊 Monitoring Metrics

### Key Metrics to Track
1. **Unlock Metrics**
   - Total unlocks per day
   - Failed unlock attempts
   - Average unlock amount
   - Unlock conversion rate

2. **Subscription Metrics**
   - New subscriptions per day
   - Subscription cancellations
   - Renewal success rate
   - Average subscription value

3. **Security Metrics**
   - Rate limit violations
   - Fraud detection triggers
   - Failed authentication attempts
   - Suspicious activity flags

4. **Revenue Metrics**
   - Platform fees collected
   - Creator earnings
   - Refund rates
   - Chargeback rates

## 🔄 Regular Security Audits

### Monthly
- Review audit logs for anomalies
- Check fraud detection effectiveness
- Review rate limiting thresholds
- Analyze failed transaction patterns

### Quarterly
- Penetration testing
- Security code review
- RLS policy review
- Update security documentation

### Annually
- Full security audit
- Compliance review
- Disaster recovery testing
- Security training for team

## 📞 Incident Response

### If Security Breach Detected
1. **Immediate Actions**
   - Disable affected endpoints
   - Lock affected accounts
   - Notify security team
   - Preserve audit logs

2. **Investigation**
   - Analyze audit logs
   - Identify attack vector
   - Assess damage
   - Document findings

3. **Remediation**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Notify affected users
   - Update security measures

4. **Post-Incident**
   - Conduct post-mortem
   - Update security policies
   - Implement additional safeguards
   - Train team on lessons learned

## 🎯 Summary

### What's Implemented ✅
- Complete subscription system with 4 tiers
- Universal content locking for Shorts, Posts, Live
- Real-time currency conversion
- Atomic transactions with database locks
- Platform fee collection (15%)
- Kotlin Multiplatform UI components

### What's Needed ⚠️
- Row-Level Security (RLS) policies
- Rate limiting on endpoints
- Input validation & sanitization
- Idempotency key support
- Fraud detection mechanisms
- Comprehensive audit logging
- Subscription renewal security
- Price manipulation prevention
- Content availability checks
- Monitoring & alerting setup

### Priority Order
1. **Critical** (Implement immediately)
   - RLS policies
   - Rate limiting
   - Input validation
   - Audit logging

2. **High** (Implement within 1 week)
   - Fraud detection
   - Idempotency keys
   - Subscription renewal security
   - Price validation

3. **Medium** (Implement within 1 month)
   - Monitoring dashboards
   - Alert system
   - Load testing
   - Security documentation

4. **Low** (Ongoing)
   - Regular security audits
   - Performance optimization
   - User education
   - Feature enhancements
