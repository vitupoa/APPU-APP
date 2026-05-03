# Security Implementation Guide - Complete Setup

## 📋 Overview

This guide provides step-by-step instructions to implement all critical security features:
1. Row-Level Security (RLS)
2. Rate Limiting
3. Fraud Detection
4. Comprehensive Audit Logging

## 🚀 Implementation Steps

### Step 1: Database Setup (RLS Policies)

#### 1.1 Run the RLS Migration

```bash
# Connect to your PostgreSQL database
psql -U your_username -d krieta_db

# Run the RLS migration
\i backend/prisma/migrations/add_rls_policies.sql

# Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'subscription_tiers', 
  'subscriptions', 
  'content_unlocks', 
  'shorts', 
  'posts', 
  'live_streams',
  'wallets',
  'transactions'
);
```

#### 1.2 Verify RLS Policies

```sql
-- List all policies
SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename IN (
  'subscription_tiers', 
  'subscriptions', 
  'content_unlocks', 
  'shorts', 
  'posts', 
  'live_streams',
  'wallets',
  'transactions'
)
ORDER BY tablename, policyname;
```

### Step 2: Install Required Dependencies

```bash
cd backend

# Install rate limiting dependencies
npm install express-rate-limit rate-limit-redis ioredis

# Install validation library
npm install zod

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Step 3: Environment Configuration

Add to your `.env` file:

```env
# Redis Configuration for Rate Limiting
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_RATE_LIMIT_DB=1

# Security Settings
ENABLE_RLS=true
ENABLE_FRAUD_DETECTION=true
ENABLE_AUDIT_LOGGING=true

# Rate Limit Settings (optional overrides)
UNLOCK_RATE_LIMIT=10
SUBSCRIPTION_RATE_LIMIT=5
CONVERSION_RATE_LIMIT=30
```

### Step 4: Update Main Application File

Update your `src/index.ts` or main server file:

```typescript
import express from 'express';
import { setRLSContext, clearRLSContext } from './middleware/rls.js';
import { globalRateLimiter } from './middleware/rateLimiting.js';
import contentLockRoutes from './modules/contentLock/contentLock.routes.js';
import subscriptionRoutes from './modules/user/subscription.routes.js';

const app = express();

// Apply global rate limiter
app.use(globalRateLimiter);

// Apply RLS context middleware (after authentication)
app.use(setRLSContext);

// Register routes
app.use('/api/content-lock', contentLockRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Clear RLS context after request
app.use(clearRLSContext);

// ... rest of your app setup
```

### Step 5: Update Prisma Client Usage

For all database operations that should respect RLS, ensure you're using the authenticated context:

```typescript
// ✅ CORRECT - Uses RLS context set by middleware
router.get('/my-data', authenticate, setRLSContext, async (req, res) => {
  const data = await prisma.subscription.findMany({
    where: { subscriberId: req.user.id }
  });
  res.json(data);
});

// ❌ INCORRECT - Bypasses RLS (only use for system operations)
const data = await prisma.subscription.findMany({
  where: { subscriberId: userId }
});
```

### Step 6: System Operations (Bypassing RLS)

For internal operations (cron jobs, system tasks) that need to bypass RLS:

```typescript
import { withSystemContext } from './middleware/rls.js';

// Example: Subscription renewal cron job
async function renewSubscriptions() {
  await withSystemContext(async () => {
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        nextBillingAt: { lte: new Date() }
      }
    });
    
    for (const sub of dueSubscriptions) {
      await SubscriptionService.renewSubscription(sub.id);
    }
  });
}
```

### Step 7: Testing RLS Policies

Create a test file `tests/rls.test.ts`:

```typescript
import { prisma } from '../src/config/database.js';

describe('RLS Policies', () => {
  it('should prevent users from viewing other users wallets', async () => {
    // Set user context
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_user_id = 'user1-id'`);
    
    // Try to query another user's wallet
    const wallets = await prisma.wallet.findMany({
      where: { userId: 'user2-id' }
    });
    
    // Should return empty array due to RLS
    expect(wallets).toHaveLength(0);
  });
  
  it('should allow users to view their own subscriptions', async () => {
    await prisma.$executeRawUnsafe(`SET LOCAL app.current_user_id = 'user1-id'`);
    
    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: 'user1-id' }
    });
    
    // Should return user's subscriptions
    expect(subscriptions.length).toBeGreaterThan(0);
  });
  
  it('should allow system context to bypass RLS', async () => {
    await prisma.$executeRawUnsafe(`SET LOCAL app.is_system = 'true'`);
    
    const allWallets = await prisma.wallet.findMany();
    
    // Should return all wallets
    expect(allWallets.length).toBeGreaterThan(0);
  });
});
```

Run tests:
```bash
npm test tests/rls.test.ts
```

### Step 8: Monitoring Setup

#### 8.1 Create Monitoring Dashboard

Create `src/routes/admin/security.routes.ts`:

```typescript
import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { AuditLogService } from '../../services/auditLog.service.js';
import { getRateLimitStatus } from '../../middleware/rateLimiting.js';

const router = Router();

router.use(authenticate, requireAdmin);

// Get audit log statistics
router.get('/audit-stats', async (req, res) => {
  const stats = await AuditLogService.getStatistics({
    startDate: new Date(Date.now() - 86400000), // Last 24 hours
  });
  res.json(stats);
});

// Get suspicious activities
router.get('/suspicious-activities', async (req, res) => {
  const activities = await req.prisma.suspiciousActivity.findMany({
    where: { isResolved: false },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(activities);
});

// Get rate limit status for user
router.get('/rate-limit/:userId', async (req, res) => {
  const { userId } = req.params;
  
  const statuses = await Promise.all([
    getRateLimitStatus('rl:unlock:', userId),
    getRateLimitStatus('rl:subscription:', userId),
    getRateLimitStatus('rl:conversion:', userId),
  ]);
  
  res.json({
    unlock: statuses[0],
    subscription: statuses[1],
    conversion: statuses[2],
  });
});

export default router;
```

#### 8.2 Set Up Alerts

Create `src/services/alerting.service.ts`:

```typescript
import { prisma } from '../config/database.js';

export class AlertingService {
  static async checkAndAlert() {
    // Check for high fraud scores
    const highRiskActivities = await prisma.suspiciousActivity.count({
      where: {
        severity: 'critical',
        isResolved: false,
        createdAt: { gte: new Date(Date.now() - 3600000) }
      }
    });
    
    if (highRiskActivities > 10) {
      await this.sendAlert('CRITICAL', `${highRiskActivities} critical fraud alerts in last hour`);
    }
    
    // Check for rate limit violations
    // Add more checks as needed
  }
  
  private static async sendAlert(severity: string, message: string) {
    // Implement your alerting mechanism (email, Slack, PagerDuty, etc.)
    console.error(`[${severity}] ${message}`);
  }
}
```

### Step 9: Deployment Checklist

Before deploying to production:

- [ ] Run RLS migration on production database
- [ ] Verify all RLS policies are active
- [ ] Test RLS with different user roles
- [ ] Configure Redis for rate limiting
- [ ] Set up monitoring dashboards
- [ ] Configure alerting system
- [ ] Test fraud detection thresholds
- [ ] Review audit log retention policy
- [ ] Set up log aggregation (e.g., ELK stack)
- [ ] Configure backup for audit logs
- [ ] Test rate limiting under load
- [ ] Document security procedures
- [ ] Train team on security features

### Step 10: Ongoing Maintenance

#### Daily Tasks
- Review suspicious activity logs
- Check for rate limit violations
- Monitor fraud detection alerts

#### Weekly Tasks
- Analyze audit log statistics
- Review and adjust fraud detection thresholds
- Check RLS policy effectiveness
- Review rate limit configurations

#### Monthly Tasks
- Security audit of all policies
- Review and update fraud detection rules
- Analyze attack patterns
- Update security documentation

## 🔍 Verification Commands

### Verify RLS is Working

```sql
-- Test as regular user
SET LOCAL app.current_user_id = 'test-user-id';
SELECT * FROM wallets; -- Should only see own wallet

-- Test as admin
SET LOCAL app.current_user_id = 'admin-user-id';
SET LOCAL app.is_admin = 'true';
SELECT * FROM wallets; -- Should see all wallets

-- Test as system
SET LOCAL app.is_system = 'true';
SELECT * FROM wallets; -- Should see all wallets
```

### Verify Rate Limiting

```bash
# Test unlock rate limit (should block after 10 requests)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/content-lock/unlock \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"contentId":"test-id","contentType":"SHORT"}'
  echo ""
done
```

### Verify Fraud Detection

```bash
# Trigger fraud detection with rapid unlocks
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/content-lock/unlock \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"contentId":"content-'$i'","contentType":"SHORT"}'
  echo ""
done
```

### Verify Audit Logging

```sql
-- Check recent audit logs
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 100;

-- Check fraud detection logs
SELECT * FROM suspicious_activities 
WHERE is_resolved = false 
ORDER BY created_at DESC;
```

## 🚨 Troubleshooting

### RLS Not Working

**Problem**: Users can see data they shouldn't

**Solution**:
1. Verify RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'your_table';`
2. Check if context is being set: Add logging to `setRLSContext` middleware
3. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`

### Rate Limiting Not Working

**Problem**: Rate limits not being enforced

**Solution**:
1. Check Redis connection: `redis-cli ping`
2. Verify middleware is applied: Check route definitions
3. Check Redis keys: `redis-cli KEYS "rl:*"`

### Fraud Detection Too Sensitive

**Problem**: Legitimate users being blocked

**Solution**:
1. Review fraud detection thresholds in `fraudDetection.service.ts`
2. Adjust risk scores for specific checks
3. Add whitelist for trusted users
4. Review and resolve false positives

### Audit Logs Not Being Created

**Problem**: No audit logs in database

**Solution**:
1. Check if `AuditLogService.log()` is being called
2. Verify database permissions
3. Check for errors in application logs
4. Ensure audit_logs table exists

## 📊 Performance Considerations

### RLS Performance

- RLS policies add overhead to queries
- Use indexes on columns used in RLS policies
- Monitor query performance with `EXPLAIN ANALYZE`
- Consider caching for frequently accessed data

### Rate Limiting Performance

- Redis is fast but adds network latency
- Use connection pooling for Redis
- Monitor Redis memory usage
- Consider using Redis Cluster for high traffic

### Fraud Detection Performance

- Fraud checks add latency to requests
- Cache fraud check results for short periods
- Use async processing for non-critical checks
- Monitor fraud detection query performance

## 🎯 Success Metrics

Track these metrics to measure security effectiveness:

1. **RLS Effectiveness**
   - Unauthorized access attempts blocked
   - Policy violations detected
   - Query performance impact

2. **Rate Limiting**
   - Rate limit violations per day
   - Legitimate vs malicious blocks
   - Average response time impact

3. **Fraud Detection**
   - Fraud attempts detected
   - False positive rate
   - True positive rate
   - Average detection time

4. **Audit Logging**
   - Logs created per day
   - Log storage growth
   - Query performance on logs
   - Incident response time

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review error logs
3. Check monitoring dashboards
4. Contact security team

## ✅ Final Checklist

Before marking implementation complete:

- [ ] All RLS policies deployed and tested
- [ ] Rate limiting active on all endpoints
- [ ] Fraud detection integrated and tuned
- [ ] Audit logging capturing all events
- [ ] Monitoring dashboards configured
- [ ] Alerting system active
- [ ] Team trained on security features
- [ ] Documentation updated
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled
