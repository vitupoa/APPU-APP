# KRIETA - DEVELOPER QUICK REFERENCE

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend
```bash
cd composeApp
# Android
./gradlew :composeApp:assembleDebug
# iOS
open iosApp/iosApp.xcodeproj
```

---

## 📁 Project Structure

```
Krieta/
├── backend/                    # Node.js + Express + Prisma
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/
│   │   │   ├── shorts/
│   │   │   ├── contests/
│   │   │   ├── recommendation/
│   │   │   └── wallet/
│   │   ├── shared/            # Shared services
│   │   └── config/            # Configuration
│   └── prisma/
│       └── schema.prisma      # Database schema
│
└── composeApp/                # Kotlin Multiplatform
    ├── src/
    │   ├── commonMain/        # Shared code
    │   ├── androidMain/       # Android-specific
    │   └── iosMain/           # iOS-specific
    └── build.gradle.kts
```

---

## 🔑 Key Features Status

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Shorts Feed | ✅ Complete | P0 | With aspect ratio support |
| Contests | ✅ Complete | P0 | With judge system |
| Recommendation | 🟡 95% | P0 | Needs upload integration |
| Wallet | 🟡 Partial | P1 | Services exist, need completion |
| Live Streaming | 🔴 Stubbed | P0 | Socket.io needed |
| Chama | 🟡 Backend | P1 | Frontend needs wiring |
| Shop | ✅ Complete | P1 | Multi-category marketplace |
| Social Auth | 🔴 Missing | P2 | OAuth needed |

---

## 🎨 Aspect Ratio Support

### Usage in Frontend
```kotlin
ImmersivePlayer(
    videoUrl = short.videoUrl,
    thumbnailUrl = short.thumbnailUrl,
    mediaType = short.mediaType,      // "VIDEO", "PHOTO", "CAROUSEL"
    aspectRatio = short.aspectRatio,  // 0.5625 (9:16), 1.7778 (16:9), etc.
    mediaUrls = short.mediaUrls,      // For carousels
    // ... other params
)
```

### Backend Response
```json
{
  "videoUrl": "https://...",
  "thumbnailUrl": "https://...",
  "mediaType": "VIDEO",
  "aspectRatio": 0.5625,
  "mediaUrls": []
}
```

---

## 🔐 Security

### iOS Keychain (Secure Token Storage)
```kotlin
// Automatically uses Keychain on iOS
val tokenManager: TokenManager = get()
tokenManager.saveAccessToken(token)
val token = tokenManager.getAccessToken()
```

### Android EncryptedSharedPreferences
```kotlin
// Automatically uses EncryptedSharedPreferences on Android
val tokenManager: TokenManager = get()
tokenManager.saveAccessToken(token)
```

---

## 🔔 Notifications

### Send Judge Invite
```typescript
import { NotificationService } from './shared/services/notification.service';

await NotificationService.sendJudgeInvite(judgeId, contestId, inviteId);
```

### Send Contest Winner
```typescript
await NotificationService.notifyContestWinner(userId, contestId, rank, prizeKr);
```

### Send Tip Notification
```typescript
await NotificationService.notifyTipReceived(recipientId, senderId, amountKr, message);
```

---

## 📊 Recommendation System

### Initialize Distribution (On Upload)
```typescript
import { contentDistributionService } from './modules/recommendation/services/contentDistribution.service';

await contentDistributionService.initializeDistribution(
  contentId,
  'SHORT',
  userId,
  { hashtags: ['viral', 'trending'], location: 'Kenya' }
);
```

### Track Interaction
```typescript
import { feedGenerationService } from './modules/recommendation/services/feedGeneration.service';

await feedGenerationService.trackInteraction(
  userId,
  contentId,
  'SHORT',
  {
    signalType: 'VIEW',
    watchDuration: 15000,
    totalDuration: 30000
  }
);
```

### Get Feed
```typescript
// Discover feed (60% personalized, 20% admiring, 10% trending, 10% discovery)
const discoverFeed = await feedGenerationService.generateDiscoverFeed(userId, 20);

// Admiring feed (90% unseen, 7% trending, 3% favorites)
const admiringFeed = await feedGenerationService.generateAdmiringFeed(userId, 20);
```

---

## 💰 Wallet Operations

### Top-up (M-Pesa)
```typescript
import { MpesaService } from './modules/wallet/services/mpesa.service';

const result = await MpesaService.initiateSTKPush(
  phoneNumber,
  amount,
  userId
);
```

### Withdrawal
```typescript
import { WalletService } from './modules/wallet/wallet.service';

const result = await WalletService.requestWithdrawal(
  userId,
  amountKr,
  provider,
  accountDetails
);
```

---

## 🎯 Contest System

### Create Contest
```typescript
const contest = await ContestService.createContest({
  creatorId: userId,
  title: 'Dance Challenge',
  prizeKr: 10000,
  maxWinners: 3,
  judgingCriteria: 'COMBINATION',
  deadline: new Date('2026-12-31'),
  // ... other fields
});
```

### Invite Judges
```typescript
const result = await ContestService.inviteJudges(contestId, [
  'judge1_id',
  'judge2_id',
  'judge3_id'
]);
```

### Submit Entry
```typescript
const submission = await ContestService.submitEntry({
  userId,
  contestId,
  mediaUrl: 'https://...',
  mediaType: 'VIDEO',
  aspectRatio: 0.5625,
  proofUrls: ['https://proof1.jpg']
});
```

---

## 🎥 Video Player

### Android (ExoPlayer)
```kotlin
// Automatically uses ExoPlayer
VideoPlayer(
    url = videoUrl,
    isPlaying = true,
    onPlaybackStateChanged = { isPlaying -> },
    onProgressUpdate = { position, duration -> }
)
```

### iOS (AVPlayer) - TODO
```kotlin
// TODO: Implement AVPlayer
// Currently stubbed
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Shorts
- `GET /api/v1/shorts/feed/:type` - Get feed (discover/admiring)
- `POST /api/v1/shorts` - Create short
- `POST /api/v1/shorts/:id/like` - Toggle like

### Contests
- `GET /api/v1/contests` - List contests
- `POST /api/v1/contests` - Create contest
- `POST /api/v1/contests/:id/join` - Join contest
- `POST /api/v1/contests/:id/submit` - Submit entry
- `POST /api/v1/contests/judges/invite` - Invite judges

### Recommendation
- `GET /api/v1/recommendation/feed/discover` - Discover feed
- `GET /api/v1/recommendation/feed/admiring` - Admiring feed
- `POST /api/v1/recommendation/interactions/track` - Track interaction
- `POST /api/v1/recommendation/distribution/initialize` - Initialize distribution

### Wallet
- `GET /api/v1/wallet/balance` - Get balance
- `POST /api/v1/wallet/topup` - Top-up wallet
- `POST /api/v1/wallet/withdraw` - Request withdrawal

---

## 🗄️ Database

### Connection
```typescript
import { prisma } from './config/database';

const users = await prisma.user.findMany();
```

### Common Queries
```typescript
// Get user with relations
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    wallet: true,
    shorts: true,
    admirers: true
  }
});

// Create short with distribution
const short = await prisma.short.create({
  data: {
    userId,
    videoUrl,
    mediaType: 'VIDEO',
    aspectRatio: 0.5625,
    caption
  }
});
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd composeApp
./gradlew test
```

### E2E Tests
```bash
# TODO: Setup E2E testing
```

---

## 🐛 Common Issues

### Issue: Prisma client not generated
```bash
npx prisma generate
```

### Issue: Database out of sync
```bash
npx prisma db push
```

### Issue: iOS build fails
```bash
cd iosApp
pod install
```

### Issue: Redis connection error
```bash
# Check Railway Redis is running
# Verify REDIS_URL in .env
```

---

## 📚 Documentation

- `README.md` - Project overview
- `RECOMMENDATION_INTEGRATION_GUIDE.md` - Recommendation system
- `ASPECT_RATIO_IMPLEMENTATION.md` - Aspect ratio guide
- `BACKEND_API_UPDATES.md` - API changes
- `INCOMPLETE_FEATURES_ROADMAP.md` - Implementation roadmap
- `IMPLEMENTATION_SUMMARY.md` - Completion status

---

## 🔧 Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# JWT
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

# Payment Providers
MPESA_CONSUMER_KEY=...
PAYPAL_CLIENT_ID=...
PAYSTACK_SECRET_KEY=...

# Firebase (for notifications)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

---

## 🚦 Deployment

### Backend (Railway)
```bash
git push railway main
```

### Frontend (App Stores)
```bash
# Android
./gradlew :composeApp:bundleRelease

# iOS
# Build in Xcode and upload to App Store Connect
```

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Team**: Slack #krieta-dev

---

**Last Updated**: 2026
**Version**: 1.0.0
