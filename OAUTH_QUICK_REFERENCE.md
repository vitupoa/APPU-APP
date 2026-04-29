# OAuth Platforms - Quick Reference

## 🎯 8 Platforms Implemented

| Platform  | OAuth Type | Token Refresh | Follower API | Engagement API | Special Notes |
|-----------|------------|---------------|--------------|----------------|---------------|
| TikTok    | OAuth 2.0  | ✅ Yes        | ✅ Yes       | ✅ Yes         | Video metrics |
| Instagram | OAuth 2.0  | ✅ Yes (60d)  | ✅ Yes       | ✅ Yes         | Via Facebook  |
| YouTube   | OAuth 2.0  | ✅ Yes        | ✅ Yes       | ✅ Yes         | Subscriber count |
| Twitter   | OAuth 2.0  | ✅ Yes        | ✅ Yes       | ❌ No          | Requires PKCE |
| Facebook  | OAuth 2.0  | ✅ Yes (60d)  | ✅ Yes       | ❌ No          | Page metrics  |
| LinkedIn  | OAuth 2.0  | ❌ No         | ✅ Yes       | ❌ No          | Re-auth needed |
| Twitch    | OAuth 2.0  | ✅ Yes        | ✅ Yes       | ❌ No          | Streaming platform |
| Snapchat  | OAuth 2.0  | ✅ Yes        | ❌ No        | ❌ No          | No follower API |

## 📋 Quick Commands

### Test OAuth Flow
```bash
# 1. Get auth URL
curl -X GET "http://localhost:3000/api/v1/marketplace/oauth/PLATFORM/authorize" \
  -H "Authorization: Bearer TOKEN"

# 2. Exchange code
curl -X POST "http://localhost:3000/api/v1/marketplace/oauth/PLATFORM/callback" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"code":"CODE","state":"STATE"}'

# 3. List accounts
curl -X GET "http://localhost:3000/api/v1/marketplace/oauth/accounts" \
  -H "Authorization: Bearer TOKEN"

# 4. Disconnect
curl -X DELETE "http://localhost:3000/api/v1/marketplace/oauth/PLATFORM/disconnect" \
  -H "Authorization: Bearer TOKEN"
```

Replace `PLATFORM` with: `tiktok`, `instagram`, `youtube`, `twitter`, `facebook`, `linkedin`, `twitch`, `snapchat`

## 🔑 Environment Variables

```env
TIKTOK_CLIENT_KEY=xxx
TIKTOK_CLIENT_SECRET=xxx

INSTAGRAM_CLIENT_ID=xxx
INSTAGRAM_CLIENT_SECRET=xxx

YOUTUBE_CLIENT_ID=xxx
YOUTUBE_CLIENT_SECRET=xxx

TWITTER_CLIENT_ID=xxx
TWITTER_CLIENT_SECRET=xxx

FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx

LINKEDIN_CLIENT_ID=xxx
LINKEDIN_CLIENT_SECRET=xxx

TWITCH_CLIENT_ID=xxx
TWITCH_CLIENT_SECRET=xxx

SNAPCHAT_CLIENT_ID=xxx
SNAPCHAT_CLIENT_SECRET=xxx

FRONTEND_URL=https://your-app.com
```

## 🌐 Developer Portals

| Platform  | Registration URL |
|-----------|------------------|
| TikTok    | https://developers.tiktok.com/ |
| Instagram | https://developers.facebook.com/ |
| YouTube   | https://console.cloud.google.com/ |
| Twitter   | https://developer.twitter.com/ |
| Facebook  | https://developers.facebook.com/ |
| LinkedIn  | https://www.linkedin.com/developers/ |
| Twitch    | https://dev.twitch.tv/ |
| Snapchat  | https://kit.snapchat.com/ |

## 📱 Redirect URIs

All platforms use the same pattern:
```
https://your-app.com/oauth/{platform}/callback
```

Examples:
- `https://your-app.com/oauth/tiktok/callback`
- `https://your-app.com/oauth/twitter/callback`
- `https://your-app.com/oauth/linkedin/callback`

## 🔄 Sync Worker

**Frequency**: Every 6 hours

**Operations**:
1. Refresh tokens expiring within 7 days
2. Update follower counts
3. Sync engagement metrics

**Check Logs**:
```bash
# Look for:
[SocialMediaSyncWorker] Starting sync...
[SocialMediaSyncWorker] Syncing follower counts for 20 accounts...
[SocialMediaSyncWorker] Synced TIKTOK account: 45000 -> 46500
[SocialMediaSyncWorker] Sync complete
```

## 📊 Database Queries

```sql
-- Connected accounts
SELECT platform, username, follower_count, last_synced_at
FROM social_media_accounts
ORDER BY created_at DESC;

-- Sync logs
SELECT account_id, sync_type, status, follower_change
FROM social_media_sync_logs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Influencer tiers
SELECT u.username, ip.tier, COUNT(sma.id) as connected_accounts
FROM influencer_profiles ip
JOIN users u ON u.id = ip.user_id
LEFT JOIN social_media_accounts sma ON sma.influencer_id = ip.id
GROUP BY u.username, ip.tier;
```

## 🎯 Influencer Tiers

| Tier   | Follower Range |
|--------|----------------|
| NANO   | 1K - 10K       |
| MICRO  | 10K - 100K     |
| MID    | 100K - 500K    |
| MACRO  | 500K - 1M      |
| MEGA   | 1M+            |

## 🚀 Quick Setup

```bash
# 1. Backend
cd backend
npm install
npx prisma db push
npm run dev

# 2. Add credentials to .env

# 3. Test
curl http://localhost:3000/api/v1/marketplace/oauth/tiktok/authorize \
  -H "Authorization: Bearer TOKEN"
```

## 📱 Frontend Usage

```kotlin
// Connect account
viewModel.connectAccount("tiktok")

// Disconnect account
viewModel.disconnectAccount("tiktok")

// Load accounts
viewModel.loadAccounts()
```

## 🔐 Security Checklist

- [x] State parameter for CSRF
- [x] PKCE for Twitter
- [x] Token encryption in DB
- [x] Secure browsers (Custom Tabs, ASWebAuthenticationSession)
- [x] Deep link validation
- [x] Rate limiting ready

## 📚 Documentation Files

1. `COMPLETE_OAUTH_INTEGRATION.md` - Full guide
2. `OAUTH_SETUP_CHECKLIST.md` - Setup steps
3. `OAUTH_IMPLEMENTATION_SUMMARY.md` - Summary
4. `.env.oauth.template` - Env vars template

## ✅ Status

**Implementation**: 100% Complete
**Platforms**: 8/8 Implemented
**API Endpoints**: All Connected
**Sync Worker**: Automated
**Documentation**: Complete
**Production**: Ready after config

---

**Quick Start**: Register OAuth apps → Add credentials → Test → Deploy
