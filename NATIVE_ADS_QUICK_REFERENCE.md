# Native Ads Quick Reference

## 🎯 What Are Native Ads in Krieta?

Native ads are **existing user content** (Shorts or Posts) that businesses pay to promote. They look like regular posts but have a "Sponsored" badge.

---

## 📱 How to Create Native Ads (User Flow)

### Step 1: Access Ads Manager
```
Drips Feed → See dummy ad → Click "Learn More" → Krieta Ads Manager
```

### Step 2: Choose Campaign Type
```
Krieta Ads Manager → 3 Tabs:
├── Display Ads (banner/native ads)
├── Sponsored Content (promote existing content) ← SELECT THIS
└── Boost Content (increase reach)
```

### Step 3: Create Campaign
```
Click "Create Sponsored Campaign" → Fill Form:
├── Campaign Name: "New Restaurant Launch"
├── Content Type: Short or Post
├── Content ID: "short_abc123"
├── Budget: 5000 KR
├── Pricing Model: CPM/CPV/CPE/CPC
├── Bid Amount: 0.05 KR
└── Targeting: Age 18-45
```

### Step 4: Submit & Wait for Approval
```
Submit → Backend creates campaign → Admin reviews → Approved → Goes live
```

---

## 📺 How Native Ads Are Displayed

### Drips Screen (✅ IMPLEMENTED)
```
Post 1
Post 2
Post 3
Post 4
Post 5
Post 6
[NATIVE AD] ← Dummy placeholder (not real campaigns yet)
Post 7
Post 8
...
```

**Current Status:** Shows dummy ads with "Learn More" button

---

### Shorts Screen (❌ NOT IMPLEMENTED)
```
Short 1
Short 2
Short 3
...
Short 10
[SPONSORED SHORT] ← Should appear here with "Sponsored" badge
Short 11
...
```

**What's Missing:**
1. Fetch sponsored shorts from API
2. Inject into feed every N shorts
3. Display with "Sponsored" badge
4. Track impressions/views/engagements

---

### Contests Screen (❌ NOT IMPLEMENTED)
```
Contest 1
Contest 2
...
Contest 10
[SPONSORED CONTEST ENTRY] ← Should appear here
Contest 11
...
```

**What's Missing:** Same as Shorts

---

## 🔧 Technical Implementation

### Backend API (✅ IMPLEMENTED)
```
POST   /api/v1/sponsored/campaigns          - Create campaign
GET    /api/v1/sponsored/feed                - Get sponsored content
POST   /api/v1/sponsored/impression          - Track impression
POST   /api/v1/sponsored/view                - Track view (3+ sec)
POST   /api/v1/sponsored/engagement          - Track engagement
GET    /api/v1/sponsored/campaigns/:id/analytics - Get analytics
```

### Frontend Components (✅ IMPLEMENTED)
```kotlin
// UI Components
SponsoredBadge()        - "Sponsored" badge overlay
SponsoredLabel()        - Text label below username

// Manager Class
SponsoredContentManager - Fetch & track sponsored content

// Screens
KrietaAdsManagerScreen  - Main ads hub
CreateCampaignScreen    - Campaign creation form
```

---

## ❌ What's Missing to Make It Work

### Critical (Must Have)
1. **Database Migration** - Add SponsoredContent tables
2. **Register Routes** - Add sponsored routes to Express app
3. **Feed Integration** - Replace dummy ads with real campaigns
4. **Shorts Integration** - Inject sponsored shorts into feed
5. **Admin Approval** - Review and approve campaigns

### Important (Should Have)
6. **Brand Dashboard** - View campaigns and analytics
7. **Content Picker** - UI to select which Short/Post to promote
8. **Payment Integration** - M-Pesa for ad purchases

### Nice to Have
9. **A/B Testing** - Test multiple ad creatives
10. **Automated Bidding** - Optimize bids automatically
11. **Frequency Capping** - Limit impressions per user

---

## 💰 Pricing Models

| Model | Definition | Best For | Example |
|-------|-----------|----------|---------|
| **CPM** | Cost per 1,000 impressions | Brand awareness | KES 40 CPM |
| **CPV** | Cost per view (3+ seconds) | Video engagement | KES 0.05/view |
| **CPE** | Cost per engagement | Interactions | KES 0.10/engagement |
| **CPC** | Cost per click | Traffic | KES 0.20/click |

---

## 📊 Current Status Summary

### ✅ What Works
- Krieta Ads Manager screen
- Create Campaign screen
- Backend API (all endpoints)
- Sponsored badge components
- Dummy ads in Drips (placeholders)

### ❌ What Doesn't Work
- Real campaigns not displayed (only dummies)
- No sponsored shorts in Shorts feed
- No sponsored contests in Contest feed
- No admin approval workflow
- No brand dashboard
- No payment integration

### 🔄 What's Needed
1. Run database migration (30 min)
2. Register routes in Express (5 min)
3. Replace dummy ads with real campaigns (2 hours)
4. Inject sponsored shorts (4 hours)
5. Build admin approval (4 hours)
6. Build brand dashboard (8 hours)

**Total Time to MVP:** ~20 hours

---

## 🚀 Quick Start (For Developers)

### 1. Run Migration
```bash
cd backend
npx prisma migrate dev --name add_sponsored_content
```

### 2. Register Routes
```typescript
// backend/src/index.ts
import sponsoredRoutes from './modules/sponsored/sponsored.routes.js';
app.use('/api/v1/sponsored', sponsoredRoutes);
```

### 3. Test API
```bash
curl -X POST http://localhost:3000/api/v1/sponsored/campaigns \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "short",
    "contentId": "test-short-id",
    "campaignName": "Test Campaign",
    "budget": 100,
    "pricingModel": "CPV",
    "bidAmount": 0.05
  }'
```

### 4. Integrate in Shorts Feed
```kotlin
// ShortsViewModel.kt
val sponsoredManager = SponsoredContentManager(api)

init {
    viewModelScope.launch {
        sponsoredManager.fetchSponsoredContent("short")
    }
}

// Mix sponsored with regular shorts
val feedWithSponsored = buildList {
    regularShorts.forEachIndexed { index, short ->
        add(short)
        if ((index + 1) % 10 == 0) {
            sponsoredManager.sponsoredContent.value?.let { add(it) }
        }
    }
}
```

---

## 📚 Documentation Files

- **Full Guide:** `NATIVE_ADS_CREATION_AND_DISPLAY.md`
- **System Docs:** `SPONSORED_CONTENT_SYSTEM.md`
- **Implementation:** `ADS_IMPLEMENTATION_SUMMARY.md`
- **Revenue Analysis:** `DRIPS_COMPREHENSIVE_AD_SYSTEM.md`

---

## 💡 Key Takeaways

1. **Native ads = Promoted user content** (not banner ads)
2. **Creation flow exists** (Ads Manager → Create Campaign)
3. **Backend is ready** (API fully implemented)
4. **Display is partial** (Drips has dummies, Shorts/Contests have nothing)
5. **Missing pieces:** Database migration, route registration, feed integration
6. **Time to MVP:** ~20 hours of focused work

---

## 🎯 Priority Order

1. **Database migration** (blocks everything)
2. **Register routes** (enables API)
3. **Replace Drips dummies** (quick win)
4. **Inject Shorts ads** (high impact)
5. **Admin approval** (quality control)
6. **Brand dashboard** (self-serve)
7. **Payment integration** (monetization)

---

**Bottom Line:** The system is 70% built. The creation flow works, backend is ready, but the display integration is incomplete. Main blocker is database migration + route registration.
