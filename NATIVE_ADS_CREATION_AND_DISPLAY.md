# Native Ads Creation & Display Flow in Krieta

## Overview

Krieta has a **Sponsored Content System** that allows creators and businesses to promote their existing content (Shorts, Drips/Posts) as native ads across the platform. This is different from traditional banner ads - the content looks like regular posts but is marked as "Sponsored".

---

## 🎯 How Native Ads Work

### Concept
Native ads in Krieta are **existing user content** (Shorts or Posts) that businesses/creators pay to promote. They appear seamlessly in feeds with a "Sponsored" badge.

**Example:**
- A creator posts a Short about a new restaurant
- The restaurant pays to promote that Short
- The Short appears in other users' feeds with a "Sponsored" badge
- Users can like, comment, and engage normally

---

## 👥 Who Can Create Native Ads?

### 1. **Creators** (Sponsored Posts)
- Must have 1,000+ followers
- Must have 10+ posts
- Account must be >30 days old
- No community guideline violations

### 2. **Businesses** (Sponsored Campaigns)
- Any verified business account
- Minimum budget: KES 500 (100 Kr)
- Must pass content moderation

---

## 📱 How Users Create Native Ads

### Flow 1: Creator Sponsored Posts

```
1. Creator posts regular content (Short/Drip)
   ↓
2. Brand discovers content and sends collaboration offer
   ↓
3. Creator receives offer in dashboard
   ↓
4. Creator accepts/declines/counter-offers
   ↓
5. If accepted, post is marked as sponsored
   ↓
6. Post appears in feeds with "Sponsored" badge
   ↓
7. Creator gets paid (85% of deal, platform gets 15%)
```

**Current Status:** ❌ Not fully implemented (brand discovery system pending)

---

### Flow 2: Business Self-Serve Campaigns (IMPLEMENTED)

#### Step 1: Navigate to Krieta Ads Manager
```
User clicks "Learn More" on dummy ad in Drips
   ↓
Opens KrietaAdsManagerScreen
   ↓
Selects "Sponsored Content" tab
   ↓
Clicks "Create Sponsored Campaign"
```

#### Step 2: Create Campaign Screen
**File:** `CreateCampaignScreen.kt`

**Form Fields:**
1. **Campaign Name** - Internal name for tracking
2. **Content Type** - Choose "Short" or "Post"
3. **Content ID** - ID of the Short/Post to promote
4. **Budget (KR)** - Total campaign budget
5. **Pricing Model** - CPM/CPV/CPE/CPC
   - **CPM** - Cost per 1,000 impressions
   - **CPV** - Cost per view (3+ seconds)
   - **CPE** - Cost per engagement (like/comment)
   - **CPC** - Cost per click
6. **Bid Amount (KR)** - How much to pay per action
7. **Targeting (Optional)**
   - Min Age / Max Age
   - Gender (future)
   - Location (future)
   - Interests (future)

**Example:**
```
Campaign Name: "New Restaurant Launch"
Content Type: Short
Content ID: "short_abc123"
Budget: 5000 KR
Pricing Model: CPV
Bid Amount: 0.05 KR (5 cents per view)
Age: 18-45
```

#### Step 3: Submit Campaign
```kotlin
// CreateCampaignScreen.kt
val request = CreateSponsoredCampaignRequest(
    contentType = SponsoredContentType.SHORT,
    contentId = "short_abc123",
    campaignName = "New Restaurant Launch",
    budget = 5000.0,
    pricingModel = PricingModel.CPV,
    bidAmount = 0.05,
    startDate = "2024-01-01",
    endDate = "2024-12-31",
    targeting = SponsoredTargeting(
        ageMin = 18,
        ageMax = 45
    )
)

api.createCampaign(request)
```

#### Step 4: Backend Processing
**File:** `backend/src/modules/sponsored/sponsored.service.ts`

```typescript
// 1. Validate content exists
const content = await prisma.short.findUnique({ where: { id: contentId } })

// 2. Create escrow for budget
const escrow = await prisma.escrow.create({
    data: {
        userId: brandUserId,
        amount: budget,
        purpose: 'SPONSORED_CAMPAIGN'
    }
})

// 3. Create campaign
const campaign = await prisma.sponsoredContent.create({
    data: {
        contentType: 'SHORT',
        contentId: contentId,
        campaignName: 'New Restaurant Launch',
        budget: 5000,
        pricingModel: 'CPV',
        bidAmount: 0.05,
        status: 'PENDING_APPROVAL',
        targeting: { ageMin: 18, ageMax: 45 }
    }
})

// 4. Send for admin approval
await notifyAdmins(campaign.id)
```

#### Step 5: Admin Approval
**File:** `AdminSponsoredApprovalScreen.kt`

Admin reviews:
- Content quality
- Brand safety
- Compliance with guidelines
- Targeting appropriateness

**Actions:**
- ✅ Approve → Campaign goes live
- ❌ Reject → Budget refunded
- 🔄 Request changes

---

## 📺 How Native Ads Are Displayed

### Current Implementation Status

#### ✅ Drips Screen (IMPLEMENTED)
**File:** `DripsScreen.kt`

**Display Logic:**
```kotlin
// Dummy ads shown every 6, 15, 20 posts
val postsWithAds = mutableListOf<Any>()
state.items.forEachIndexed { index, post ->
    postsWithAds.add(post)
    
    if ((index + 1) % 6 == 0) {
        postsWithAds.add("NATIVE_AD_$index")
    }
}

// Render in LazyColumn
items(postsWithAds) { item ->
    when (item) {
        is Post -> PostCard(post)
        is String && item.startsWith("NATIVE_AD") -> NativeAdCard()
    }
}
```

**NativeAdCard Component:**
```kotlin
@Composable
private fun NativeAdCard() {
    Card {
        SponsoredBadge() // "Sponsored" badge
        
        Row {
            Image(80dp) // Ad creative
            Column {
                Text("Your Brand Here")
                Text("Reach 200k+ users. Start from KES 500")
            }
        }
        
        Button("Learn More") {
            navigator.push(KrietaAdsManagerScreen())
        }
    }
}
```

**Current Status:** Shows **dummy placeholder ads** - not real campaigns yet

---

#### ❌ Shorts Screen (NOT IMPLEMENTED)
**File:** `ShortsScreen.kt`

**What Needs to Be Done:**

1. **Fetch Sponsored Shorts**
```kotlin
// In ShortsViewModel.kt
val sponsoredManager = SponsoredContentManager(api)

init {
    viewModelScope.launch {
        // Fetch sponsored shorts for user
        sponsoredManager.fetchSponsoredContent("short")
    }
}
```

2. **Inject into Feed**
```kotlin
// Mix sponsored shorts with regular shorts
val feedWithSponsored = buildList {
    regularShorts.forEachIndexed { index, short ->
        add(short)
        
        // Insert sponsored short every 10 items
        if ((index + 1) % 10 == 0) {
            sponsoredManager.sponsoredContent.value?.let { sponsored ->
                add(sponsored.copy(isSponsored = true))
            }
        }
    }
}
```

3. **Display with Badge**
```kotlin
@Composable
private fun ShortItem(short: Short, isSponsored: Boolean) {
    Box {
        VideoPlayer(short.videoUrl)
        
        // Show sponsored badge
        if (isSponsored) {
            SponsoredBadge(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp)
            )
        }
        
        // Creator info
        Column {
            if (isSponsored) {
                Text("Sponsored", color = Color.White.copy(0.7f))
            }
            Text("@${short.creator.username}")
        }
    }
}
```

4. **Track Metrics**
```kotlin
// Track impression when short appears
LaunchedEffect(short.id, isSponsored) {
    if (isSponsored) {
        sponsoredManager.trackImpression(short.id)
    }
}

// Track view after 3 seconds
LaunchedEffect(watchTime) {
    if (isSponsored && watchTime >= 3) {
        sponsoredManager.trackView(short.id)
    }
}

// Track engagement on like/comment
fun onLike() {
    if (isSponsored) {
        sponsoredManager.trackEngagement(short.id, "like")
    }
}
```

**Current Status:** ❌ No sponsored shorts displayed yet

---

#### ❌ Contests Screen (NOT IMPLEMENTED)
**File:** `ContestFeedScreen.kt`

**What Needs to Be Done:**

Similar to Shorts, but for contest submissions:

1. Fetch sponsored contest entries
2. Inject into contest feed
3. Display with "Sponsored" badge
4. Track impressions/views/engagements

**Current Status:** ❌ No sponsored contests yet

---

## 🔄 Complete User Journey

### For Businesses/Creators

```
1. User scrolls Drips feed
   ↓
2. Sees dummy ad "Your Brand Here"
   ↓
3. Clicks "Learn More"
   ↓
4. Opens Krieta Ads Manager
   ↓
5. Explores 3 tabs:
   - Display Ads (banner/native ads)
   - Sponsored Content (promote existing content)
   - Boost Content (increase reach)
   ↓
6. Selects "Sponsored Content"
   ↓
7. Clicks "Create Sponsored Campaign"
   ↓
8. Fills form:
   - Campaign name
   - Content type (Short/Post)
   - Content ID
   - Budget
   - Pricing model
   - Bid amount
   - Targeting
   ↓
9. Submits campaign
   ↓
10. Backend creates campaign (PENDING_APPROVAL)
   ↓
11. Admin reviews and approves
   ↓
12. Campaign goes ACTIVE
   ↓
13. Content appears in feeds with "Sponsored" badge
   ↓
14. Users engage (view/like/comment)
   ↓
15. Metrics tracked in real-time
   ↓
16. Budget depletes based on pricing model
   ↓
17. Campaign ends when budget exhausted or end date reached
   ↓
18. Business views analytics dashboard
```

---

## 📊 Backend API Flow

### 1. Create Campaign
```http
POST /api/v1/sponsored/campaigns
Authorization: Bearer {token}
Content-Type: application/json

{
  "contentType": "short",
  "contentId": "short_abc123",
  "campaignName": "New Restaurant Launch",
  "budget": 5000,
  "pricingModel": "CPV",
  "bidAmount": 0.05,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "targeting": {
    "ageMin": 18,
    "ageMax": 45
  }
}
```

### 2. Get Sponsored Content for Feed
```http
GET /api/v1/sponsored/feed?contentType=short
Authorization: Bearer {token}

Response:
{
  "id": "campaign_123",
  "contentType": "short",
  "contentId": "short_abc123",
  "content": {
    "id": "short_abc123",
    "videoUrl": "https://...",
    "caption": "Check out this new restaurant!",
    "creator": { ... }
  },
  "isSponsored": true
}
```

### 3. Track Impression
```http
POST /api/v1/sponsored/impression
Authorization: Bearer {token}
Content-Type: application/json

{
  "campaignId": "campaign_123",
  "contentId": "short_abc123"
}
```

### 4. Track View (3+ seconds)
```http
POST /api/v1/sponsored/view
Authorization: Bearer {token}
Content-Type: application/json

{
  "campaignId": "campaign_123",
  "contentId": "short_abc123",
  "watchDuration": 5000
}
```

### 5. Track Engagement
```http
POST /api/v1/sponsored/engagement
Authorization: Bearer {token}
Content-Type: application/json

{
  "campaignId": "campaign_123",
  "contentId": "short_abc123",
  "engagementType": "like"
}
```

### 6. Get Analytics
```http
GET /api/v1/sponsored/campaigns/{campaignId}/analytics
Authorization: Bearer {token}

Response:
{
  "impressions": 10000,
  "views": 8000,
  "engagements": 500,
  "clicks": 200,
  "spent": 400,
  "remaining": 4600,
  "cpm": 40,
  "ctr": 2.5,
  "engagementRate": 6.25
}
```

---

## 🎨 UI Components

### SponsoredBadge
```kotlin
@Composable
fun SponsoredBadge(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(4.dp),
        color = Color.Black.copy(alpha = 0.6f),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.3f))
    ) {
        Text(
            "Sponsored",
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            color = Color.White,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium
        )
    }
}
```

### SponsoredLabel
```kotlin
@Composable
fun SponsoredLabel(modifier: Modifier = Modifier) {
    Text(
        "Sponsored",
        modifier = modifier,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        fontSize = 12.sp,
        fontWeight = FontWeight.Normal
    )
}
```

---

## 📈 Pricing Models Explained

### CPM (Cost Per Mille)
- **Definition:** Cost per 1,000 impressions
- **When to use:** Brand awareness campaigns
- **Example:** KES 40 CPM = KES 0.04 per impression
- **Budget:** 5,000 KR = 125,000 impressions

### CPV (Cost Per View)
- **Definition:** Cost per view (3+ seconds)
- **When to use:** Video engagement campaigns
- **Example:** KES 0.05 per view
- **Budget:** 5,000 KR = 100,000 views

### CPE (Cost Per Engagement)
- **Definition:** Cost per engagement (like/comment/share)
- **When to use:** Engagement campaigns
- **Example:** KES 0.10 per engagement
- **Budget:** 5,000 KR = 50,000 engagements

### CPC (Cost Per Click)
- **Definition:** Cost per click on CTA
- **When to use:** Traffic/conversion campaigns
- **Example:** KES 0.20 per click
- **Budget:** 5,000 KR = 25,000 clicks

---

## ✅ What's Implemented

### Backend
- ✅ Campaign creation API
- ✅ Sponsored content feed API
- ✅ Impression tracking
- ✅ View tracking (3+ seconds)
- ✅ Engagement tracking
- ✅ Analytics API
- ✅ Pause/resume campaigns
- ✅ Budget escrow system

### Frontend
- ✅ Krieta Ads Manager screen
- ✅ Create Campaign screen
- ✅ Sponsored badge component
- ✅ Sponsored label component
- ✅ SponsoredContentManager class
- ✅ API client (SponsoredApi)
- ✅ Data models

### Drips Screen
- ✅ Dummy ad placeholders
- ✅ Navigation to Ads Manager
- ✅ Ad insertion logic (every 6, 15, 20 posts)

---

## ❌ What's Missing

### Critical
- ❌ Database migration (add SponsoredContent tables)
- ❌ Register sponsored routes in Express app
- ❌ Inject real sponsored content into Drips feed
- ❌ Inject sponsored shorts into Shorts feed
- ❌ Inject sponsored contests into Contest feed
- ❌ Admin approval workflow

### Important
- ❌ Brand dashboard (view campaigns, analytics)
- ❌ Creator earnings dashboard
- ❌ Content selection UI (pick which Short/Post to promote)
- ❌ Payment integration (M-Pesa for ad purchases)
- ❌ Budget top-up system

### Nice to Have
- ❌ A/B testing for campaigns
- ❌ Automated bidding optimization
- ❌ Lookalike audiences
- ❌ Retargeting
- ❌ Conversion tracking
- ❌ Frequency capping

---

## 🚀 Next Steps to Make It Work

### Phase 1: Backend Setup (1 hour)
1. Run database migration
2. Register sponsored routes
3. Test API endpoints

### Phase 2: Feed Integration (4 hours)
1. Update ShortsViewModel to fetch sponsored content
2. Inject sponsored shorts into feed
3. Add sponsored badge to UI
4. Track impressions/views/engagements

### Phase 3: Drips Integration (2 hours)
1. Replace dummy ads with real campaigns
2. Track metrics for Drips ads

### Phase 4: Admin Approval (4 hours)
1. Build admin approval screen
2. Add approve/reject actions
3. Implement content moderation

### Phase 5: Brand Dashboard (8 hours)
1. Campaign list screen
2. Campaign analytics screen
3. Budget management
4. Payment integration

**Total Time to MVP:** ~20 hours

---

## 💡 Key Insights

### Why Native Ads?
- **Better UX:** Blends with feed, less disruptive
- **Higher Engagement:** 3-5x better than banner ads
- **Creator Revenue:** 85% goes to creators (industry-leading)
- **Platform Control:** Full control over ad quality and targeting

### Why Not AdMob?
- **Low Revenue:** $50-100/month at 10K DAU
- **No Control:** Google decides what ads to show
- **Poor UX:** Disruptive banners and interstitials
- **No Creator Revenue:** All money goes to platform

### Competitive Advantage
- **20-40% cheaper** than Facebook/Instagram
- **Hyper-local targeting** (estate-level)
- **M-Pesa integration** (no credit card needed)
- **Simplified dashboard** (one-click campaigns)
- **Creator-first** (85/15 revenue split)

---

## 📞 Support

For questions about implementing native ads:
1. Check `SPONSORED_CONTENT_SYSTEM.md` for full documentation
2. Review `CreateCampaignScreen.kt` for UI implementation
3. Check `sponsored.service.ts` for backend logic
4. Test API with Postman/curl

**Files to Reference:**
- Backend: `backend/src/modules/sponsored/`
- Frontend: `composeApp/.../feature/sponsored/`
- Database: `backend/prisma/schemas/sponsored-content.prisma`
- Docs: `SPONSORED_CONTENT_SYSTEM.md`, `ADS_IMPLEMENTATION_SUMMARY.md`
