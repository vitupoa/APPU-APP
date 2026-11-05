# Migration Summary - Runinga Backend

## ✅ Completed Migrations

### 1. Prisma Schema Updates
Added the following tables and fields to `schema.prisma`:

#### New Tables:
- **ContentUnlock** - Tracks paid content unlocks (shorts, posts, live streams)
- **AdConfig** - Platform-wide ad configuration settings
- **AdCampaign** - Brand advertising campaigns (Native, Banner, Story ads)
- **SponsoredPostRequest** - Creator collaboration/sponsorship requests
- **AdAnalytics** - Daily ad performance metrics
- **IdempotencyKey** - Prevents duplicate financial transactions
- **Message** - Messaging system with forwarding support

#### Updated Tables:
- **User** - Added `fcm_token` and `device_platform` for push notifications
- **Post** - Added `unlock_amount_kr` for paid content
- **Short** - Added `unlock_amount_kr` for paid content
- **LiveStream** - Already had `unlock_amount_kr`

#### New Enums:
- `AdType` (NATIVE, BANNER, STORY)
- `AdCampaignStatusType` (PENDING, APPROVED, ACTIVE, PAUSED, COMPLETED, REJECTED)
- `SponsoredPostStatus` (PENDING, ACCEPTED, REJECTED, IN_PROGRESS, SUBMITTED, APPROVED, PAYMENT_RELEASED, COMPLETED)

### 2. Row-Level Security (RLS) Policies
Applied PostgreSQL RLS to secure sensitive tables:

#### Protected Tables:
- **User** - Users can only view/edit their own profile
- **SubscriptionTier** - Creators manage their tiers, public can view enabled tiers
- **subscriptions** - Subscribers and creators can view their subscriptions
- **content_unlocks** - Users can view their unlocks, creators can view their content unlocks
- **shorts** - Access based on lock status, subscription tier, or unlock payment
- **Post** - Access based on lock status, subscription tier, or unlock payment
- **LiveStream** - Access based on unlock payment
- **wallets** - Users can only view their own wallet, system can modify
- **transactions** - Users can view their own transactions, system can create

#### Helper Functions Created:
- `current_user_id()` - Gets user ID from session context
- `is_admin(user_id)` - Checks if user is admin
- `is_system_user()` - Checks if operation is system-level
- `has_subscription_access(subscriber_id, creator_id, tier)` - Validates subscription access
- `has_unlocked_content(user_id, content_id, type)` - Validates content unlock

## 🔧 Implementation Required

### Setting User Context in Your Application

You MUST set the user context at the start of each authenticated request:

```typescript
// In your authentication middleware
import { prisma } from './prisma';

export async function authMiddleware(req, res, next) {
  const userId = req.user?.id; // From JWT or session
  
  if (userId) {
    // Set user context for RLS
    await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, false)`;
  }
  
  next();
}
```

### For System Operations

When performing system-level operations (e.g., cron jobs, admin tasks):

```typescript
// Set system context
await prisma.$executeRaw`SELECT set_config('app.is_system', 'true', false)`;

// Perform system operations
await prisma.wallet.update({
  where: { user_id: userId },
  data: { kr_balance: newBalance }
});

// Clear system context after operation
await prisma.$executeRaw`SELECT set_config('app.is_system', 'false', false)`;
```

## 📊 Database Changes

### Tables Created:
- `content_unlocks` - Content unlock tracking
- `ad_config` - Ad platform configuration
- `ad_campaigns` - Brand ad campaigns
- `sponsored_post_requests` - Creator sponsorships
- `ad_analytics` - Ad performance metrics
- `idempotency_keys` - Transaction safety
- `messages` - Messaging with forwarding

### Indexes Created:
- `idx_subscriptions_access` - Fast subscription lookups
- `idx_content_unlocks_access` - Fast unlock checks
- `idx_shorts_locked` - Locked shorts queries
- `idx_posts_locked` - Locked posts queries
- `idx_live_streams_locked` - Locked streams queries
- `User_fcm_token_idx` - FCM token lookups

## 🔐 Security Features

### Row-Level Security Benefits:
1. **Defense in Depth** - Security at database level, not just application
2. **Prevents Data Leaks** - Even if application has bugs, database enforces access
3. **Audit Trail** - All access is logged and controlled
4. **Multi-tenant Safe** - Users can never access other users' data

### Content Access Control:
- Free content: Accessible to all
- Subscription-locked: Requires active subscription of correct tier
- Pay-per-unlock: Requires one-time payment
- Creator content: Always accessible to creator

## 📝 Next Steps

1. **Update Authentication Middleware**
   - Add `set_config('app.current_user_id', ...)` call
   - Test with different user roles

2. **Update System Operations**
   - Add `set_config('app.is_system', 'true')` for cron jobs
   - Add for admin operations that need elevated access

3. **Test RLS Policies**
   - Verify users can only see their own data
   - Test subscription access control
   - Test content unlock access

4. **Implement Ad System**
   - Create ad campaign management endpoints
   - Implement ad serving logic
   - Track impressions and clicks

5. **Implement Content Unlocks**
   - Add unlock payment flow
   - Check unlock status before serving content
   - Track unlock analytics

## 🚀 Migration Commands Used

```bash
# 1. Install dependencies
npm install pg

# 2. Run Prisma migration
node run-migrations.mjs

# 3. Run RLS migration
node run-rls-final.mjs

# 4. Generate Prisma Client
npx prisma generate
```

## 📚 Files Created

- `run-migrations.mjs` - Prisma migration runner
- `run-rls-final.mjs` - RLS migration runner
- `check-tables.mjs` - Database table checker
- `prisma/migrations/add_rls_policies_corrected.sql` - RLS policies
- `prisma/migrations/20260511084952_add_missing_features/` - Prisma migration

## ⚠️ Important Notes

1. **Database URL**: Updated `.env` to use public URL for local development
2. **Table Names**: RLS uses actual table names (User, Post, LiveStream, SubscriptionTier)
3. **ID Types**: Changed from UUID to TEXT for compatibility
4. **System Context**: Required for wallet/transaction modifications
5. **Testing**: Test RLS policies thoroughly before production deployment

## 🔍 Verification

To verify RLS is working:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('User', 'wallets', 'transactions', 'subscriptions');

-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## 📞 Support

If you encounter issues:
1. Check user context is being set correctly
2. Verify RLS policies with SQL queries above
3. Check Prisma logs for access denied errors
4. Test with `is_admin()` function for debugging
