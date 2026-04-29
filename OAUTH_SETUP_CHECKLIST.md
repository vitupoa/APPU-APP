# OAuth Integration Setup Checklist

## ✅ Backend Implementation (COMPLETE)

- [x] TikTok OAuth service (`twitter.service.ts`)
- [x] Instagram OAuth service (`instagram.service.ts`)
- [x] YouTube OAuth service (`youtube.service.ts`)
- [x] Twitter/X OAuth service (`twitter.service.ts`)
- [x] Facebook OAuth service (`facebook.service.ts`)
- [x] LinkedIn OAuth service (`linkedin.service.ts`)
- [x] Twitch OAuth service (`twitch.service.ts`)
- [x] Snapchat OAuth service (`snapchat.service.ts`)
- [x] OAuth routes updated (`oauth.routes.ts`)
- [x] Social media sync worker updated (`socialMediaSync.worker.ts`)

## ✅ Frontend Implementation (COMPLETE)

- [x] Common OAuth browser interface (`OAuthBrowser.kt`)
- [x] Android OAuth browser (`AndroidOAuthBrowser.kt`)
- [x] iOS OAuth browser (`IOSOAuthBrowser.kt`)
- [x] OAuth ViewModel updated (`OAuthViewModel.kt`)
- [x] Repository methods added (`MarketplaceRepository.kt`)
- [x] API service methods added (`MarketplaceApiService.kt`)
- [x] Dependency injection configured (Android & iOS)
- [x] AndroidManifest deep link configured

## 📋 Configuration Required

### 1. Register OAuth Apps

- [ ] **TikTok**: https://developers.tiktok.com/
  - Create app
  - Get Client Key & Secret
  - Add redirect URI: `https://your-app.com/oauth/tiktok/callback`

- [ ] **Instagram**: https://developers.facebook.com/
  - Create Facebook app
  - Add Instagram Basic Display product
  - Get Client ID & Secret
  - Add redirect URI: `https://your-app.com/oauth/instagram/callback`

- [ ] **YouTube**: https://console.cloud.google.com/
  - Create project
  - Enable YouTube Data API v3
  - Create OAuth 2.0 credentials
  - Add redirect URI: `https://your-app.com/oauth/youtube/callback`

- [ ] **Twitter/X**: https://developer.twitter.com/
  - Create app
  - Enable OAuth 2.0 with PKCE
  - Get Client ID & Secret
  - Add redirect URI: `https://your-app.com/oauth/twitter/callback`

- [ ] **Facebook**: https://developers.facebook.com/
  - Create app
  - Add Facebook Login product
  - Get App ID & Secret
  - Add redirect URI: `https://your-app.com/oauth/facebook/callback`

- [ ] **LinkedIn**: https://www.linkedin.com/developers/
  - Create app
  - Get Client ID & Secret
  - Add redirect URI: `https://your-app.com/oauth/linkedin/callback`

- [ ] **Twitch**: https://dev.twitch.tv/
  - Register application
  - Get Client ID & Secret
  - Add redirect URI: `https://your-app.com/oauth/twitch/callback`

- [ ] **Snapchat**: https://kit.snapchat.com/
  - Create app
  - Get Client ID & Secret
  - Add redirect URI: `https://your-app.com/oauth/snapchat/callback`

### 2. Environment Variables

- [ ] Copy `.env.oauth.template` to `.env`
- [ ] Fill in all OAuth credentials
- [ ] Set `FRONTEND_URL` to your production domain
- [ ] Verify all credentials are correct

### 3. Database Migration

```bash
cd backend
npx prisma generate
npx prisma db push
```

- [ ] Run database migration
- [ ] Verify `social_media_accounts` table exists
- [ ] Verify `social_media_sync_logs` table exists

### 4. Backend Deployment

```bash
cd backend
npm install
npm run dev  # or npm run build && npm start
```

- [ ] Install dependencies
- [ ] Start backend server
- [ ] Verify OAuth routes are registered
- [ ] Verify sync worker starts automatically
- [ ] Check logs for any errors

### 5. Frontend Build

```bash
cd composeApp
./gradlew :composeApp:assembleDebug  # Android
# or open iosApp in Xcode for iOS
```

- [ ] Build Android app
- [ ] Build iOS app
- [ ] Verify OAuth browser integration works
- [ ] Test deep link handling (Android)

## 🧪 Testing

### Test Each Platform

For each platform (tiktok, instagram, youtube, twitter, facebook, linkedin, twitch, snapchat):

1. **Get Authorization URL**
```bash
curl -X GET "http://localhost:3000/api/v1/marketplace/oauth/PLATFORM/authorize" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. **Open URL in Browser**
   - User logs in and authorizes
   - Gets redirected with code

3. **Exchange Code for Token**
```bash
curl -X POST "http://localhost:3000/api/v1/marketplace/oauth/PLATFORM/callback" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "AUTHORIZATION_CODE",
    "state": "STATE_FROM_STEP_1"
  }'
```

4. **Verify Account Connected**
```bash
curl -X GET "http://localhost:3000/api/v1/marketplace/oauth/accounts" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

5. **Test Disconnect**
```bash
curl -X DELETE "http://localhost:3000/api/v1/marketplace/oauth/PLATFORM/disconnect" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Sync Worker

- [ ] Wait for sync worker to run (every 6 hours)
- [ ] Or manually trigger sync in code
- [ ] Check logs for sync activity
- [ ] Verify follower counts update
- [ ] Verify tokens refresh automatically

### Test Frontend

- [ ] Open app and navigate to Connect Social Accounts screen
- [ ] Click "Connect" for each platform
- [ ] Verify browser opens correctly
- [ ] Complete OAuth flow
- [ ] Verify account appears in list
- [ ] Test disconnect functionality

## 📊 Monitoring

### Check Sync Worker Logs

```bash
# Backend logs should show:
[SocialMediaSyncWorker] Starting sync...
[SocialMediaSyncWorker] Refreshing 5 tokens...
[SocialMediaSyncWorker] Syncing follower counts for 20 accounts...
[SocialMediaSyncWorker] Synced TIKTOK account: 45000 -> 46500
[SocialMediaSyncWorker] Sync complete
```

### Check Database

```sql
-- Connected accounts
SELECT platform, username, follower_count, last_synced_at, sync_status
FROM social_media_accounts
ORDER BY created_at DESC;

-- Sync logs
SELECT account_id, sync_type, status, followers_before, followers_after
FROM social_media_sync_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY synced_at DESC;

-- Influencer profiles
SELECT u.username, ip.tier, ip.total_campaigns, ip.total_earnings_kr
FROM influencer_profiles ip
JOIN users u ON u.id = ip.user_id
ORDER BY ip.total_earnings_kr DESC;
```

## 🚨 Troubleshooting

### "Invalid platform" error
- Check platform name is lowercase
- Supported: tiktok, instagram, youtube, twitter, facebook, linkedin, twitch, snapchat

### "Invalid state parameter" error
- State mismatch between request and callback
- Check user metadata is storing state correctly

### "Token expired" error
- Access token has expired
- Sync worker should auto-refresh
- User may need to reconnect

### "Failed to refresh token" error
- Refresh token invalid or expired
- User must re-authenticate

### OAuth browser not opening (Android)
- Check AndroidManifest has intent filter
- Verify Chrome Custom Tabs dependency installed
- Check deep link scheme: `krieta://oauth`

### OAuth browser not opening (iOS)
- Check Info.plist has URL scheme
- Verify ASWebAuthenticationSession permissions
- Check callback scheme: `krieta`

## 📈 Success Metrics

- [ ] All 8 platforms successfully connected
- [ ] Follower counts syncing automatically
- [ ] Tokens refreshing before expiration
- [ ] No sync errors in logs
- [ ] Influencers getting categorized by tier
- [ ] Brands can search and hire influencers
- [ ] Campaign performance tracking working

## 🎉 Production Checklist

- [ ] All OAuth apps registered in production
- [ ] Production credentials in `.env`
- [ ] Database migrated in production
- [ ] Backend deployed and running
- [ ] Frontend apps built and deployed
- [ ] Sync worker running in production
- [ ] Monitoring and logging configured
- [ ] Rate limiting enabled
- [ ] Security audit completed
- [ ] Documentation updated

## 📚 Documentation

- [x] Complete OAuth Integration Guide (`COMPLETE_OAUTH_INTEGRATION.md`)
- [x] Environment Variables Template (`.env.oauth.template`)
- [x] Setup Checklist (this file)
- [x] API Documentation (in main guide)
- [x] Frontend Integration Guide (in main guide)

## 🔗 Useful Links

- TikTok Developers: https://developers.tiktok.com/
- Facebook Developers: https://developers.facebook.com/
- Google Cloud Console: https://console.cloud.google.com/
- Twitter Developer Portal: https://developer.twitter.com/
- LinkedIn Developers: https://www.linkedin.com/developers/
- Twitch Developers: https://dev.twitch.tv/
- Snapchat Kit: https://kit.snapchat.com/

---

**Status**: Implementation Complete ✅
**Next Step**: Register OAuth apps and configure credentials
**Estimated Setup Time**: 2-3 hours (for all 8 platforms)
