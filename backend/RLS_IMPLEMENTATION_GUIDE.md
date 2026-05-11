# RLS Context Implementation Guide

## ✅ What Was Done

### 1. Updated Authentication Middleware (`src/middleware/auth.ts`)
- **authMiddleware**: Now automatically sets RLS context for authenticated users
- **optionalAuth**: Sets RLS context if user is authenticated
- Uses secure parameterized queries to prevent SQL injection

### 2. Updated RLS Middleware (`src/middleware/rls.ts`)
- Fixed SQL injection vulnerability (replaced `$executeRawUnsafe` with `$executeRaw`)
- Added helper functions for system and user context
- Added comprehensive usage examples

## 🔐 How RLS Works Now

### Automatic Context Setting
When a user authenticates, the middleware automatically:
1. Verifies JWT token
2. Extracts user ID and admin status
3. Sets PostgreSQL session variables:
   - `app.current_user_id` = user's ID
   - `app.is_admin` = 'true' (if admin)

### Database Security
PostgreSQL RLS policies now enforce:
- Users can only see their own data
- Subscription-based content access
- Pay-per-unlock content protection
- Wallet and transaction isolation

## 📝 Usage Examples

### 1. Regular Authenticated Routes
```typescript
import { authMiddleware } from '../middleware/auth.js';

// RLS context is automatically set
router.get('/profile', authMiddleware, async (req, res) => {
  // User can only see their own profile due to RLS
  const user = await prisma.user.findUnique({
    where: { id: req.userId }
  });
  res.json(user);
});

router.get('/wallet', authMiddleware, async (req, res) => {
  // User can only see their own wallet
  const wallet = await prisma.wallet.findUnique({
    where: { user_id: req.userId }
  });
  res.json(wallet);
});
```

### 2. System Operations (Bypass RLS)
```typescript
import { withSystemContext } from '../middleware/rls.js';

// Cron job to process payments
async function processPayments() {
  await withSystemContext(async () => {
    // This bypasses RLS and can modify any wallet
    const pendingPayments = await prisma.transaction.findMany({
      where: { status: 'pending' }
    });

    for (const payment of pendingPayments) {
      await prisma.wallet.update({
        where: { user_id: payment.user_id },
        data: { kr_balance: { increment: payment.amount_kr } }
      });
    }
  });
}

// Background task to send notifications
async function sendDailyNotifications() {
  await withSystemContext(async () => {
    const users = await prisma.user.findMany({
      where: { fcm_token: { not: null } }
    });
    // Send notifications...
  });
}
```

### 3. Admin Operations on Behalf of Users
```typescript
import { withUserContext } from '../middleware/rls.js';
import { authMiddleware, adminAuth } from '../middleware/auth.js';

// Admin endpoint to update user profile
router.post('/admin/users/:userId/update', 
  authMiddleware, 
  adminAuth, 
  async (req, res) => {
    const { userId } = req.params;
    
    await withUserContext(userId, async () => {
      // This runs as the target user
      const user = await prisma.user.update({
        where: { id: userId },
        data: req.body
      });
      res.json(user);
    }, true); // true = isAdmin
  }
);
```

### 4. Content Access Control
```typescript
// Check if user can access locked content
router.get('/shorts/:id', optionalAuth, async (req, res) => {
  const short = await prisma.short.findUnique({
    where: { id: req.params.id }
  });

  if (!short) {
    return res.status(404).json({ error: 'Short not found' });
  }

  // RLS automatically handles access control:
  // - If short is locked and user doesn't have access, query returns null
  // - If user has subscription or unlocked content, query succeeds
  
  if (!short) {
    return res.status(403).json({ 
      error: 'Content locked',
      requiresSubscription: short.required_tier,
      unlockPrice: short.unlock_amount_kr
    });
  }

  res.json(short);
});
```

### 5. Subscription-Based Access
```typescript
// User subscribes to creator
router.post('/subscribe/:creatorId', authMiddleware, async (req, res) => {
  const { creatorId } = req.params;
  const { tier } = req.body;

  await withSystemContext(async () => {
    // Create subscription (system context needed to bypass RLS)
    const subscription = await prisma.subscription.create({
      data: {
        subscriber_id: req.userId,
        creator_id: creatorId,
        tier,
        status: 'active'
      }
    });

    // Deduct payment from wallet
    await prisma.wallet.update({
      where: { user_id: req.userId },
      data: { kr_balance: { decrement: tierPrice } }
    });

    res.json(subscription);
  });
});

// Now user can access creator's locked content
router.get('/creators/:creatorId/posts', authMiddleware, async (req, res) => {
  // RLS automatically filters posts based on subscription
  const posts = await prisma.post.findMany({
    where: { user_id: req.params.creatorId }
  });
  // Only returns posts user has access to
  res.json(posts);
});
```

### 6. Content Unlock (Pay-per-view)
```typescript
// Unlock specific content
router.post('/content/unlock', authMiddleware, async (req, res) => {
  const { contentId, contentType } = req.body;

  await withSystemContext(async () => {
    // Get content price
    const content = await prisma[contentType].findUnique({
      where: { id: contentId }
    });

    // Deduct from wallet
    await prisma.wallet.update({
      where: { user_id: req.userId },
      data: { kr_balance: { decrement: content.unlock_amount_kr } }
    });

    // Create unlock record
    await prisma.contentUnlock.create({
      data: {
        user_id: req.userId,
        content_id: contentId,
        content_type: contentType,
        amount_kr: content.unlock_amount_kr,
        creator_id: content.user_id
      }
    });

    res.json({ success: true });
  });
});
```

## 🚨 Important Notes

### When to Use System Context
Use `withSystemContext()` for:
- ✅ Cron jobs and scheduled tasks
- ✅ Background processing
- ✅ Payment processing
- ✅ Admin operations that modify multiple users
- ✅ System-level analytics

### When NOT to Use System Context
Don't use for:
- ❌ Regular user operations
- ❌ User-initiated requests (use authMiddleware instead)
- ❌ Public endpoints

### Security Best Practices
1. **Always validate user input** before database operations
2. **Use authMiddleware** for all authenticated routes
3. **Use adminAuth** for admin-only operations
4. **Use withSystemContext** sparingly and only when necessary
5. **Log all system context operations** for audit trail

## 🧪 Testing RLS

### Test User Isolation
```typescript
// Test that users can't see other users' data
describe('RLS User Isolation', () => {
  it('should not allow user to see other user wallets', async () => {
    // Set context as user1
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${user1Id}, false)`;
    
    // Try to get user2's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { user_id: user2Id }
    });
    
    // Should return null due to RLS
    expect(wallet).toBeNull();
  });
});
```

### Test Subscription Access
```typescript
describe('RLS Subscription Access', () => {
  it('should allow access to subscribed content', async () => {
    // Create subscription
    await withSystemContext(async () => {
      await prisma.subscription.create({
        data: {
          subscriber_id: userId,
          creator_id: creatorId,
          tier: 'REAL_FAN',
          status: 'active'
        }
      });
    });

    // Set user context
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, false)`;
    
    // Should be able to access locked posts
    const posts = await prisma.post.findMany({
      where: { 
        user_id: creatorId,
        required_tier: 'REAL_FAN'
      }
    });
    
    expect(posts.length).toBeGreaterThan(0);
  });
});
```

## 📊 Monitoring

### Log RLS Context
```typescript
// Add logging middleware
app.use(async (req, res, next) => {
  if (req.userId) {
    console.log(`[RLS] User: ${req.userId}, Admin: ${req.isAdmin}`);
  }
  next();
});
```

### Monitor RLS Denials
```sql
-- Check for RLS policy violations in PostgreSQL logs
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%policy%' 
ORDER BY calls DESC;
```

## 🔧 Troubleshooting

### Issue: "Permission denied" errors
**Solution**: Check if RLS context is being set correctly
```typescript
// Debug RLS context
router.get('/debug/rls', authMiddleware, async (req, res) => {
  const result = await prisma.$queryRaw`
    SELECT 
      current_setting('app.current_user_id', true) as user_id,
      current_setting('app.is_admin', true) as is_admin,
      current_setting('app.is_system', true) as is_system
  `;
  res.json(result);
});
```

### Issue: System operations failing
**Solution**: Ensure you're using `withSystemContext()`
```typescript
// Wrong - will fail due to RLS
await prisma.wallet.update({ ... });

// Correct - bypasses RLS
await withSystemContext(async () => {
  await prisma.wallet.update({ ... });
});
```

### Issue: Content not accessible after subscription
**Solution**: Check subscription status and tier hierarchy
```typescript
// Verify subscription
const subscription = await prisma.subscription.findFirst({
  where: {
    subscriber_id: userId,
    creator_id: creatorId,
    status: 'active'
  }
});

// Check tier hierarchy: TOP_FUN < REAL_FAN < TRUE_FAN < SUPER_FAN
```

## ✅ Verification Checklist

- [x] Authentication middleware sets RLS context
- [x] Optional auth sets RLS context when authenticated
- [x] System operations use `withSystemContext()`
- [x] Admin operations use `withUserContext()` when needed
- [x] All SQL injection vulnerabilities fixed
- [x] RLS policies applied to all sensitive tables
- [x] Helper functions documented with examples
- [ ] Test RLS with different user roles
- [ ] Test subscription-based access
- [ ] Test content unlock flow
- [ ] Monitor RLS performance in production
