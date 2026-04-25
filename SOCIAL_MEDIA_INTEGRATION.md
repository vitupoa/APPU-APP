# Social Media Integration for Influencer Marketing

## Overview

Creators/influencers can connect their social media accounts (TikTok, YouTube, Instagram, Facebook, Twitter, etc.) to:
- **Showcase their reach** to brands
- **Auto-fetch follower/subscriber counts**
- **Display engagement metrics**
- **Verify their influence** across platforms
- **Increase campaign opportunities**

## Supported Platforms

| Platform | Follower Metric | Auth Required | API Used |
|----------|----------------|---------------|----------|
| 🎵 **TikTok** | Followers | No (optional) | TikTok API / RapidAPI |
| ▶️ **YouTube** | Subscribers | No | YouTube Data API v3 |
| 📷 **Instagram** | Followers | Yes (OAuth) | Instagram Graph API |
| 👥 **Facebook** | Followers/Fans | Yes (OAuth) | Facebook Graph API |
| 🐦 **Twitter/X** | Followers | No | Twitter API v2 |
| 🎮 **Twitch** | Followers | No | Twitch API |
| 💼 **LinkedIn** | Connections | Yes (OAuth) | LinkedIn API |
| 👻 **Snapchat** | Followers | No | Snapchat API |

## Features

### 1. **Add Social Accounts**
- Creators add accounts by username
- System auto-fetches metrics
- Supports multiple accounts per platform

### 2. **Auto-Sync Metrics**
- Follower/subscriber counts
- Video/post counts
- Total views
- Average views per post
- Average likes
- Engagement rate
- Verification status

### 3. **Display Options**

#### For Influencer Profiles (Brand View)
- **Horizontal scrollable row** with platform cards
- Shows follower count, engagement rate
- Verified badges
- Click to view platform profile

#### For Campaign Applications
- **Inline compact display** (4 platforms max)
- Shows platform icon + follower count
- "+X more" indicator

#### For Influencer Dashboard
- **Total reach card** (sum of all followers)
- **Average engagement** across platforms
- **Platform breakdown** list
- **Sync status** indicators

### 4. **Primary Account**
- Influencers can set one account as "primary"
- Primary account used for tier calculation
- Highlighted with badge

### 5. **Tier Calculation**
Based on **total followers across all platforms**:
- **NANO**: 1K - 10K
- **MICRO**: 10K - 100K
- **MID**: 100K - 500K
- **MACRO**: 500K - 1M
- **MEGA**: 1M+

## Backend Implementation

### Database Schema

```prisma
model SocialMediaAccount {
  id                String         @id @default(uuid())
  influencerId      String
  platform          SocialPlatform // TIKTOK, YOUTUBE, INSTAGRAM, etc.
  
  // Account Details
  username          String
  profileUrl        String
  displayName       String?
  
  // Metrics (auto-fetched)
  followerCount     Int            @default(0)
  subscriberCount   Int            @default(0)
  videoCount        Int            @default(0)
  totalViews        BigInt         @default(0)
  avgViews          Int            @default(0)
  avgLikes          Int            @default(0)
  engagementRate    Decimal        @default(0)
  
  // Verification
  isVerified        Boolean        @default(false)
  isPrimary         Boolean        @default(false)
  
  // Sync Status
  lastSyncedAt      DateTime?
  syncStatus        String         @default("pending")
  syncError         String?
  
  // API Credentials (encrypted)
  accessToken       String?
  refreshToken      String?
  tokenExpiresAt    DateTime?
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
}
```

### API Endpoints

```typescript
// Add social account
POST /api/v1/marketplace/social-accounts
Body: {
  influencerId: string
  platform: "TIKTOK" | "YOUTUBE" | "INSTAGRAM" | ...
  username: string
  accessToken?: string // For OAuth platforms
}

// Get influencer's accounts
GET /api/v1/marketplace/social-accounts/:influencerId

// Sync account metrics
POST /api/v1/marketplace/social-accounts/:accountId/sync

// Set primary account
PATCH /api/v1/marketplace/social-accounts/:accountId/primary

// Delete account
DELETE /api/v1/marketplace/social-accounts/:accountId

// Sync all accounts (cron job)
POST /api/v1/marketplace/social-accounts/sync-all
```

### Service Methods

```typescript
class SocialMediaService {
  // Add account and trigger initial sync
  async addSocialAccount(influencerId, platform, username, accessToken?)
  
  // Fetch metrics from platform APIs
  async syncAccountMetrics(accountId)
  
  // Platform-specific fetchers
  private async fetchTikTokMetrics(username, accessToken?)
  private async fetchYouTubeMetrics(username, accessToken?)
  private async fetchInstagramMetrics(username, accessToken)
  private async fetchFacebookMetrics(username, accessToken)
  private async fetchTwitterMetrics(username, accessToken?)
  
  // Update influencer tier based on total followers
  private async updateInfluencerTier(influencerId)
  
  // Get all accounts for influencer
  async getInfluencerSocialAccounts(influencerId)
  
  // Set primary account
  async setPrimaryAccount(accountId, influencerId)
  
  // Delete account
  async deleteSocialAccount(accountId)
  
  // Sync all accounts (cron job - runs daily)
  async syncAllAccounts()
}
```

## Frontend Implementation

### Screens

#### 1. **SocialMediaManagementScreen**
Full-screen management interface for influencers:
- Total reach card (sum of all followers)
- List of connected accounts with metrics
- Sync, set primary, delete options
- Grid of available platforms to add
- Add account dialog

#### 2. **SocialMediaComponents**
Reusable components for displaying accounts:

**SocialMediaAccountsRow**
- Horizontal scrollable cards
- Used in influencer profiles
- Shows platform, followers, engagement

**SocialMediaAccountsInline**
- Compact inline display
- Shows up to 4 platforms
- Used in lists/cards

**SocialMediaStatsCard**
- Detailed stats card
- Total reach, avg engagement, total views
- Platform breakdown

### Usage Examples

```kotlin
// In Influencer Profile Screen
SocialMediaAccountsRow(
    accounts = influencer.socialAccounts,
    onAccountClick = { account ->
        // Open platform URL
        openUrl(account.profileUrl)
    }
)

// In Campaign Application Card
SocialMediaAccountsInline(
    accounts = applicant.socialAccounts
)

// In Influencer Dashboard
SocialMediaStatsCard(
    accounts = myAccounts
)

// Navigate to management screen
navigator.push(SocialMediaManagementScreen(influencerId))
```

## API Integration

### Environment Variables

```env
# YouTube
YOUTUBE_API_KEY=your_youtube_api_key

# Twitter/X
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# RapidAPI (for TikTok public scraping)
RAPIDAPI_KEY=your_rapidapi_key

# Instagram/Facebook (OAuth)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

### Rate Limits

Platform rate limits are tracked in database:

```prisma
model PlatformRateLimit {
  platform          SocialPlatform
  requestsPerHour   Int
  requestsRemaining Int
  resetAt           DateTime
}
```

### Sync Strategy

**Manual Sync**: User clicks "Sync Now" button
**Auto Sync**: Cron job runs daily at 2 AM
**Smart Sync**: Only sync accounts not synced in last 24 hours

## OAuth Flow (Instagram, Facebook, LinkedIn)

### 1. Initiate OAuth
```typescript
// Redirect user to platform OAuth page
const authUrl = `https://api.instagram.com/oauth/authorize?
  client_id=${CLIENT_ID}&
  redirect_uri=${REDIRECT_URI}&
  scope=user_profile,user_media&
  response_type=code`;
```

### 2. Handle Callback
```typescript
// Exchange code for access token
const response = await axios.post('https://api.instagram.com/oauth/access_token', {
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  grant_type: 'authorization_code',
  redirect_uri: REDIRECT_URI,
  code: authCode
});

const { access_token, user_id } = response.data;
```

### 3. Store Token
```typescript
await prisma.socialMediaAccount.create({
  data: {
    influencerId,
    platform: 'INSTAGRAM',
    username,
    accessToken: encrypt(access_token), // Encrypt before storing
    tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
  }
});
```

## Benefits for Stakeholders

### For Influencers
- ✅ **Showcase reach** across all platforms
- ✅ **Auto-update metrics** (no manual entry)
- ✅ **Increase credibility** with verified accounts
- ✅ **Get better campaigns** (brands see total reach)
- ✅ **Track growth** over time

### For Brands
- ✅ **See real metrics** (not self-reported)
- ✅ **Compare influencers** across platforms
- ✅ **Verify authenticity** (verified badges)
- ✅ **Make data-driven decisions**
- ✅ **Find right influencers** by platform

### For Platform
- ✅ **Accurate tier classification**
- ✅ **Better matching** (brands ↔ influencers)
- ✅ **Reduced fraud** (verified metrics)
- ✅ **Competitive advantage** (unique feature)

## Security Considerations

### 1. **Token Encryption**
- Access tokens encrypted before storage
- Use AES-256 encryption
- Store encryption key in secure vault

### 2. **Token Refresh**
- Implement refresh token flow
- Auto-refresh before expiration
- Handle revoked tokens gracefully

### 3. **Rate Limiting**
- Track API usage per platform
- Implement exponential backoff
- Queue sync requests

### 4. **Data Privacy**
- Only fetch public metrics
- Don't store sensitive data
- Allow users to disconnect accounts

## Error Handling

### Common Errors

**Account Not Found**
```typescript
{
  error: "Account not found",
  platform: "TIKTOK",
  username: "@example",
  suggestion: "Check username spelling"
}
```

**Rate Limit Exceeded**
```typescript
{
  error: "Rate limit exceeded",
  platform: "YOUTUBE",
  resetAt: "2024-01-15T14:00:00Z",
  suggestion: "Try again in 2 hours"
}
```

**OAuth Required**
```typescript
{
  error: "OAuth authentication required",
  platform: "INSTAGRAM",
  authUrl: "https://...",
  suggestion: "Click to authenticate"
}
```

**Token Expired**
```typescript
{
  error: "Access token expired",
  platform: "FACEBOOK",
  suggestion: "Reconnect your account"
}
```

## Testing

### Manual Testing Checklist

- [ ] Add TikTok account (public API)
- [ ] Add YouTube account (API key)
- [ ] Add Instagram account (OAuth)
- [ ] Sync account metrics
- [ ] Set primary account
- [ ] Delete account
- [ ] View in influencer profile
- [ ] View in campaign application
- [ ] Test rate limiting
- [ ] Test error handling

### Test Accounts

Use these test accounts for development:
- TikTok: `@charlidamelio` (public)
- YouTube: `@MrBeast` (public)
- Instagram: Requires OAuth (use test account)
- Twitter: `@elonmusk` (public)

## Deployment

### 1. Database Migration
```bash
cd backend
npx prisma migrate dev --name add_social_media_accounts
```

### 2. Environment Variables
Add API keys to `.env` file

### 3. Cron Job Setup
```typescript
// In backend/src/workers/socialMediaSyncWorker.ts
import cron from 'node-cron';
import { SocialMediaService } from '../modules/marketplace/social-media.service.js';

const service = new SocialMediaService();

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting social media sync...');
  const results = await service.syncAllAccounts();
  console.log(`Synced ${results.length} accounts`);
});
```

### 4. Register Worker
```typescript
// In backend/src/index.ts
import { startSocialMediaSyncWorker } from './workers/socialMediaSyncWorker.js';

httpServer.listen(PORT, () => {
  // ... existing workers
  startSocialMediaSyncWorker();
});
```

## Future Enhancements

### Phase 2
- [ ] Historical metrics tracking (growth charts)
- [ ] Audience demographics (age, gender, location)
- [ ] Content performance analytics
- [ ] Competitor comparison
- [ ] AI-powered insights

### Phase 3
- [ ] Direct posting to platforms
- [ ] Unified inbox (DMs from all platforms)
- [ ] Collaboration tools
- [ ] Contract management
- [ ] Payment integration

## Support

### API Documentation
- TikTok: https://developers.tiktok.com/
- YouTube: https://developers.google.com/youtube/v3
- Instagram: https://developers.facebook.com/docs/instagram-api
- Facebook: https://developers.facebook.com/docs/graph-api
- Twitter: https://developer.twitter.com/en/docs/twitter-api

### Troubleshooting

**Q: Metrics not updating?**
A: Check sync status, verify API keys, check rate limits

**Q: OAuth failing?**
A: Verify redirect URI, check app permissions, ensure HTTPS

**Q: Wrong follower count?**
A: Some platforms cache data, wait 24 hours for update

**Q: Account not found?**
A: Verify username format (with/without @), check privacy settings

---

## Summary

Social media integration transforms influencer marketing by:
- **Automating** metric collection
- **Verifying** influencer reach
- **Enabling** data-driven decisions
- **Increasing** trust between brands and influencers
- **Scaling** the marketplace efficiently

**Status**: ✅ Fully implemented and ready for deployment
