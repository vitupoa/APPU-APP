# Sponsored Content System - Native Ad Marketplace

## Overview

Krieta uses a **native sponsored content system** instead of traditional AdMob ads. Brands pay to promote their shorts/posts as sponsored content that appears seamlessly in user feeds, identical to regular content with just a subtle "Sponsored" badge.

## Why Not AdMob?

### Problems with Traditional Ads:
- ❌ Cluttered UX (banners, interstitials break flow)
- ❌ Low revenue for small apps (need 100K+ DAU for decent eCPM)
- ❌ Poor for short-form video (kills engagement momentum)
- ❌ Looks like "ads" not content

### Benefits of Native Sponsored Content:
- ✅ Seamless in feed (looks like regular shorts)
- ✅ Higher CPM ($5-20 vs $0.50-2)
- ✅ Better user engagement
- ✅ Brands pay creators directly (platform takes 20% fee)
- ✅ Full control over ad quality and targeting

---

## Architecture

### Backend (Node.js/Express)

**Location:** `backend/src/modules/sponsored/`

**Files:**
- `sponsored.types.ts` - TypeScript types and enums
- `sponsored.service.ts` - Campaign management, targeting, analytics
- `sponsored.routes.ts` - API endpoints

**Database Schema:** `backend/prisma/schemas/sponsored-content.prisma`

**Models:**
- `SponsoredContent` - Campaign details, budget, targeting, metrics
- `SponsoredImpression` - Tracks impressions, views, engagements, clicks

### Frontend (Kotlin Multiplatform)

**Location:** `composeApp/src/commonMain/kotlin/com/krieta/feature/sponsored/`

**Files:**
- `domain/model/SponsoredModels.kt` - Data models
- `data/remote/SponsoredApi.kt` - API client
- `presentation/SponsoredContentManager.kt` - Manager class
- `presentation/SponsoredComponents.kt` - UI components (badges)

---

## How It Works

### 1. Brand Creates Campaign

```typescript
POST /api/v1/sponsored/campaigns
{
  "contentType": "short",
  "contentId": "short-uuid",
  "campaignName": "Summer Sale 2024",
  "budget": 1000,           // Kr
  "pricingModel": "CPV",    // Cost per view
  "bidAmount": 0.05,        // 0.05 Kr per view
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "targeting": {
    "ageMin": 18,
    "ageMax": 35,
    "gender": ["female"],
    "countries": ["KE", "UG", "TZ"],
    "interests": ["fashion", "beauty"]
  }
}
```

**What happens:**
- Budget (1000 Kr) is deducted from brand's wallet
- Funds held in escrow
- Campaign status: `PENDING_REVIEW`
- Admin approves → status: `ACTIVE`

### 2. User Scrolls Feed

```kotlin
// In ShortsViewModel
val sponsoredManager = SponsoredContentManager(api)

// Fetch sponsored content for user
sponsoredManager.fetchSponsoredContent("short")

// Insert into feed every N items (e.g., every 10 shorts)
val feedWithSponsored = regularShorts.toMutableList().apply {
    add(10, sponsoredManager.sponsoredContent.value)
}
```

**Targeting logic:**
- Backend filters campaigns by user's age, gender, location
- Returns highest bidder
- Sponsored short looks identical to regular short

### 3. Track Engagement

```kotlin
// When sponsored short appears on screen
sponsoredManager.recordImpression()

// When user watches 3+ seconds
sponsoredManager.recordView(watchTimeSeconds = 5)

// When user likes/comments/shares
sponsoredManager.recordEngagement("like")
```

**Billing:**
- **CPM**: Charged per 1000 impressions
- **CPV**: Charged per view (3+ seconds)
- **CPE**: Charged per engagement (like/comment/share)
- **CPC**: Charged per profile/link click

### 4. Brand Views Analytics

```typescript
GET /api/v1/sponsored/campaigns/{id}/analytics

Response:
{
  "campaignName": "Summer Sale 2024",
  "status": "ACTIVE",
  "budget": 1000,
  "spent": 245.50,
  "impressions": 12500,
  "views": 8200,
  "engagements": 450,
  "clicks": 120,
  "cpm": 19.64,
  "ctr": 0.96,
  "engagementRate": 5.49
}
```

---

## Pricing Models

| Model | Description | Use Case | Typical Cost |
|-------|-------------|----------|--------------|
| **CPM** | Cost per 1000 impressions | Brand awareness | 5-10 Kr |
| **CPV** | Cost per view (3+ seconds) | Video engagement | 0.02-0.10 Kr |
| **CPE** | Cost per engagement | Social proof | 0.10-0.50 Kr |
| **CPC** | Cost per click | Traffic/conversions | 0.50-2.00 Kr |
| **FLAT_FEE** | Fixed campaign cost | Guaranteed reach | Varies |

---

## UI Integration

### Sponsored Badge Overlay

```kotlin
@Composable
fun ShortCard(short: Short, isSponsored: Boolean) {
    Box {
        // Regular short content
        ShortVideo(short)
        
        // Sponsored badge (top-right corner)
        if (isSponsored) {
            SponsoredBadge(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp)
            )
        }
    }
}
```

### Sponsored Label (Below Username)

```kotlin
Column {
    Text("@nike", fontWeight = FontWeight.Bold)
    if (isSponsored) {
        SponsoredLabel()  // Shows "Sponsored" in gray
    }
}
```

---

## API Endpoints

### Brand Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sponsored/campaigns` | Create campaign |
| GET | `/api/v1/sponsored/campaigns/:id/analytics` | Get analytics |
| PATCH | `/api/v1/sponsored/campaigns/:id/toggle` | Pause/resume |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sponsored/feed` | Get sponsored content for feed |
| POST | `/api/v1/sponsored/impression` | Record impression |
| POST | `/api/v1/sponsored/view` | Record view (3+ seconds) |
| POST | `/api/v1/sponsored/engagement` | Record like/comment/share |

---

## Database Schema

```prisma
model SponsoredContent {
  id              String
  brandUserId     String
  contentType     SponsoredContentType  // SHORT, POST, STORY
  contentId       String
  campaignName    String
  budget          Decimal
  spent           Decimal
  pricingModel    PricingModel          // CPM, CPV, CPE, CPC
  bidAmount       Decimal
  startDate       DateTime
  endDate         DateTime
  targeting       Json
  status          SponsoredContentStatus
  impressions     Int
  views           Int
  engagements     Int
  clicks          Int
  escrowId        String
}

model SponsoredImpression {
  id          String
  campaignId  String
  userId      String
  type        String  // impression, view, like, comment, share, click
  cost        Decimal
  createdAt   DateTime
}
```

---

## Migration from AdMob

### Deprecated Files (Marked @Deprecated)

**Backend:**
- `backend/src/modules/ads/ads.service.ts` - Kept for backward compatibility
- `backend/src/modules/ads/ads.routes.ts` - Kept for backward compatibility

**Frontend:**
- `composeApp/.../ads/presentation/component/InterstitialAd.kt`
- `composeApp/.../ads/presentation/component/RewardedAd.kt`
- `composeApp/.../ads/presentation/component/NativeAdBanner.kt`
- All platform-specific implementations (Android/iOS)

### Migration Steps

1. **Remove AdMob dependencies** from `build.gradle.kts`
2. **Replace AdMob calls** with `SponsoredContentManager`
3. **Update feed logic** to inject sponsored content every N items
4. **Add sponsored badges** to UI components

---

## Revenue Model

### Platform Revenue Streams

1. **Campaign Fees** - 20% platform fee on all campaigns
2. **Premium Targeting** - Charge extra for advanced targeting
3. **Promoted Placement** - Higher bid = better placement
4. **Analytics Dashboard** - Premium analytics for brands

### Example Revenue

- Brand spends 1000 Kr on campaign
- Platform takes 200 Kr (20% fee)
- Remaining 800 Kr goes to impressions/views/engagements
- At 0.05 Kr per view → 16,000 views delivered

---

## Next Steps

### Phase 1 (Current)
- ✅ Backend API for campaigns
- ✅ Frontend manager and UI components
- ✅ Basic targeting (age, gender, location)
- ⏳ Admin approval workflow

### Phase 2 (Next)
- ⏳ Brand dashboard (create campaigns, view analytics)
- ⏳ Advanced targeting (interests, behaviors)
- ⏳ A/B testing for campaigns
- ⏳ Automated bidding

### Phase 3 (Future)
- ⏳ Creator marketplace (brands hire creators)
- ⏳ Shoppable shorts (affiliate links)
- ⏳ Performance-based pricing (CPA - cost per acquisition)
- ⏳ Self-serve ad platform

---

## Testing

### Test Campaign Creation

```bash
curl -X POST http://localhost:3000/api/v1/sponsored/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "short",
    "contentId": "test-short-id",
    "campaignName": "Test Campaign",
    "budget": 100,
    "pricingModel": "CPV",
    "bidAmount": 0.05,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }'
```

### Test Feed Fetch

```bash
curl http://localhost:3000/api/v1/sponsored/feed?contentType=short \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## FAQ

**Q: Why not use AdMob for quick revenue?**
A: AdMob requires 100K+ DAU for decent revenue. Native sponsored content generates 5-10x more revenue at smaller scale.

**Q: How do we prevent ad fatigue?**
A: Limit sponsored content to 1 per 10 regular shorts. Users can skip like regular content.

**Q: What if brands create low-quality content?**
A: Admin approval required before campaigns go live. We can reject/pause campaigns.

**Q: How do we compete with TikTok's ad platform?**
A: We offer better targeting for African markets + lower minimum budgets (100 Kr vs $500).

---

## Support

For questions or issues:
- Backend: Check `backend/src/modules/sponsored/`
- Frontend: Check `composeApp/.../feature/sponsored/`
- Database: Check `backend/prisma/schemas/sponsored-content.prisma`
