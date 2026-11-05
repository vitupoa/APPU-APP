# 🎯 Brand Ad Campaign Creation Screen - Requirements

## Overview
A comprehensive screen where businesses/brands can create display ad campaigns that run across the Runinga platform (Live, Contests, Discover, Admiring, Drips tabs).

---

## 🎨 Screen Features & Information Required

### 1. **Campaign Basic Information**
```kotlin
// Required Fields
- Campaign Name: String (max 100 chars)
- Ad Type: Enum (NATIVE, BANNER, STORY, VIDEO_OVERLAY)
- Campaign Objective: Enum (BRAND_AWARENESS, TRAFFIC, CONVERSIONS, APP_INSTALLS)
```

**UI Elements:**
- Text input for campaign name
- Radio buttons or dropdown for ad type selection
- Dropdown for campaign objective

---

### 2. **Budget & Bidding**
```kotlin
// Required Fields
- Total Budget: Decimal (in KES)
- Daily Budget: Decimal (optional, in KES)
- Bidding Strategy: Enum (AUTOMATIC, MANUAL_CPM)
- CPM Bid: Decimal (if manual, in KES)
- Campaign Duration: DateRange (start date, end date)
```

**UI Elements:**
- Currency input with KES symbol
- Toggle between automatic/manual bidding
- CPM bid slider with min/max from AdConfig
- Date range picker

**Business Logic:**
- Minimum budget: KES 1,000
- CPM range: KES 30-200 (from AdConfig)
- Maximum duration: 90 days
- Show estimated reach based on budget

---

### 3. **Ad Creative**
```kotlin
// Required Fields
- Ad Title: String (max 60 chars)
- Ad Description: String (max 150 chars)
- Call-to-Action Text: String (max 20 chars)
- CTA URL: String (valid URL)
- Ad Image/Video: File Upload

// Optional Fields
- Logo: File Upload
- Background Color: Color Picker
```

**UI Elements:**
- Text inputs with character counters
- Image/video uploader with preview
- CTA button preview
- Color picker for branding

**Requirements:**
- Image: Min 1080x1080px, max 5MB, formats: JPG, PNG
- Video: Min 1080x1920px (9:16), max 30 seconds, max 50MB, format: MP4
- Logo: Min 200x200px, max 1MB, transparent PNG preferred

---

### 4. **Audience Targeting**
```kotlin
// Optional Fields (more specific = higher CPM)
- Age Range: IntRange (min 13, max 65+)
- Gender: List<String> (MALE, FEMALE, ALL)
- Locations: List<String> (countries/cities)
- Interests: List<String> (predefined categories)
- Device Types: List<String> (ANDROID, IOS, ALL)
- Language: List<String> (English, Swahili, etc.)
```

**UI Elements:**
- Age range slider
- Gender checkboxes
- Location multi-select with search
- Interest tags (Fashion, Tech, Sports, etc.)
- Device type checkboxes

**Business Logic:**
- Broader targeting = lower CPM
- Narrow targeting = higher CPM
- Show estimated audience size
- Minimum audience: 10,000 users

---

### 5. **Ad Placement**
```kotlin
// Required Field
- Placements: List<String> (where ads will show)
  - LIVE_STREAMS
  - CONTESTS
  - DISCOVER_FEED
  - ADMIRING_FEED
  - DRIPS_FEED
  - STORIES
```

**UI Elements:**
- Checkboxes for each placement
- Preview of how ad looks in each placement
- Estimated impressions per placement

**Business Logic:**
- At least one placement required
- Different placements have different CPMs
- Show performance data from similar campaigns

---

### 6. **Conversion Tracking** (Optional)
```kotlin
// Optional Fields
- Conversion Event: String (PURCHASE, SIGN_UP, ADD_TO_CART)
- Conversion Value: Decimal (in KES)
- Tracking Pixel URL: String
- UTM Parameters: Map<String, String>
```

**UI Elements:**
- Dropdown for conversion event
- Input for conversion value
- Advanced section for pixel/UTM

---

### 7. **Payment & Escrow**
```kotlin
// Required
- Payment Method: Enum (MPESA, CARD, WALLET)
- Escrow Amount: Decimal (total budget)
- Platform Fee: Decimal (15% of budget)
- Total Amount: Decimal (budget + platform fee)
```

**UI Elements:**
- Payment method selector
- Cost breakdown table
- Terms & conditions checkbox
- "Create Campaign" button

**Business Logic:**
- Funds held in escrow until campaign runs
- Auto-refund unused budget after campaign ends
- Platform takes 15% fee

---

### 8. **Campaign Review & Approval**
```kotlin
// System Fields (not user input)
- Status: Enum (PENDING, APPROVED, REJECTED, ACTIVE)
- Rejection Reason: String (if rejected)
- Approved By: String (admin ID)
- Approved At: DateTime
```

**UI Elements:**
- Status badge
- Review timeline
- Rejection reason display (if applicable)
- Edit/resubmit button

**Business Logic:**
- All campaigns require admin approval
- Review within 24 hours
- Email notification on approval/rejection

---

## 📱 Screen Layout Structure

```
┌─────────────────────────────────────┐
│  Create Ad Campaign                 │
│  [Back Button]                      │
├─────────────────────────────────────┤
│                                     │
│  Step 1: Campaign Details           │
│  ├─ Campaign Name                   │
│  ├─ Ad Type                         │
│  └─ Objective                       │
│                                     │
│  Step 2: Budget & Schedule          │
│  ├─ Total Budget                    │
│  ├─ Daily Budget                    │
│  ├─ Bidding Strategy                │
│  └─ Campaign Duration               │
│                                     │
│  Step 3: Ad Creative                │
│  ├─ Upload Image/Video              │
│  ├─ Ad Title                        │
│  ├─ Description                     │
│  ├─ CTA Text                        │
│  └─ CTA URL                         │
│                                     │
│  Step 4: Targeting                  │
│  ├─ Age Range                       │
│  ├─ Gender                          │
│  ├─ Locations                       │
│  ├─ Interests                       │
│  └─ Estimated Reach: 50K-100K       │
│                                     │
│  Step 5: Placements                 │
│  ├─ ☑ Live Streams                  │
│  ├─ ☑ Contests                      │
│  ├─ ☑ Discover Feed                 │
│  └─ ☐ Stories                       │
│                                     │
│  Step 6: Review & Payment           │
│  ├─ Campaign Summary                │
│  ├─ Cost Breakdown                  │
│  ├─ Payment Method                  │
│  └─ [Submit for Review] Button      │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔧 Backend API Endpoints Needed

### 1. Create Campaign
```typescript
POST /api/v1/ads/campaigns
Body: {
  campaignName: string
  adType: string
  budgetKes: number
  cpmBid: number
  startDate: string
  endDate: string
  title: string
  description: string
  imageUrl: string
  ctaText: string
  ctaUrl: string
  targetAgeMin?: number
  targetAgeMax?: number
  targetGenders?: string[]
  targetLocations?: string[]
  targetInterests?: string[]
  placements: string[]
}
Response: { campaignId: string, status: "PENDING" }
```

### 2. Upload Ad Creative
```typescript
POST /api/v1/ads/upload
Body: FormData (image/video file)
Response: { url: string }
```

### 3. Get Estimated Reach
```typescript
POST /api/v1/ads/estimate-reach
Body: { targeting: {...}, placements: [...] }
Response: { 
  minReach: number, 
  maxReach: number,
  estimatedCpm: number 
}
```

### 4. Get Campaign Status
```typescript
GET /api/v1/ads/campaigns/:id
Response: { 
  campaign: {...},
  status: string,
  impressions: number,
  clicks: number,
  spent: number
}
```

### 5. Pause/Resume Campaign
```typescript
PATCH /api/v1/ads/campaigns/:id/status
Body: { status: "PAUSED" | "ACTIVE" }
```

---

## 🎯 User Flow

1. **Access**: Business user clicks "Create Ad" from profile/dashboard
2. **Step 1**: Fill campaign details (name, type, objective)
3. **Step 2**: Set budget and schedule
4. **Step 3**: Upload creative and write copy
5. **Step 4**: Define target audience
6. **Step 5**: Select ad placements
7. **Step 6**: Review summary and make payment
8. **Submit**: Campaign goes to admin for review
9. **Approval**: Admin approves/rejects within 24h
10. **Launch**: Campaign goes live automatically on start date
11. **Monitor**: User can track performance in real-time
12. **Optimize**: User can pause/adjust campaign anytime

---

## 📊 Campaign Dashboard Features

After creation, users need a dashboard to:

1. **View All Campaigns**
   - List of all campaigns with status
   - Filter by status (Active, Paused, Completed)
   - Sort by date, spend, performance

2. **Campaign Analytics**
   - Impressions, Clicks, CTR
   - Spend vs Budget
   - Cost per Click (CPC)
   - Conversion tracking
   - Audience demographics
   - Placement performance

3. **Campaign Management**
   - Pause/Resume campaign
   - Edit budget (increase only)
   - Duplicate campaign
   - Download reports

---

## 🔒 Access Control

- **Who can create ads?**
  - Business accounts (AccountType.BUSINESS)
  - Verified creators with 10K+ followers
  - Any user with payment method verified

- **Restrictions:**
  - Minimum wallet balance: KES 1,000
  - KYC verification required for budgets > KES 50,000
  - Maximum 10 active campaigns per account

---

## 💰 Pricing Model

### Platform Fees
- **Platform Cut**: 15% of ad spend
- **Payment Processing**: 2.5% (M-Pesa/Card)
- **Minimum Campaign Budget**: KES 1,000
- **Minimum Daily Budget**: KES 100

### CPM Pricing (from AdConfig)
- **Native Ads**: KES 40-150 per 1000 impressions
- **Banner Ads**: KES 30-100 per 1000 impressions
- **Story Ads**: KES 80-200 per 1000 impressions
- **Video Overlay**: KES 100-250 per 1000 impressions

### Targeting Multipliers
- **Broad targeting** (all users): 1.0x base CPM
- **Age/Gender targeting**: 1.2x base CPM
- **Location targeting**: 1.3x base CPM
- **Interest targeting**: 1.5x base CPM
- **Combined targeting**: Up to 2.0x base CPM

---

## 🚀 Implementation Priority

### Phase 1 (MVP)
- ✅ Campaign creation form
- ✅ Image upload
- ✅ Basic targeting (age, gender, location)
- ✅ Payment integration
- ✅ Admin approval workflow

### Phase 2
- ✅ Video ad support
- ✅ Advanced targeting (interests, devices)
- ✅ Campaign analytics dashboard
- ✅ A/B testing

### Phase 3
- ✅ Conversion tracking
- ✅ Retargeting campaigns
- ✅ Lookalike audiences
- ✅ Automated bidding optimization

---

## 📝 Validation Rules

### Campaign Name
- Required, 3-100 characters
- Alphanumeric + spaces only

### Budget
- Minimum: KES 1,000
- Maximum: KES 10,000,000
- Must be divisible by 100

### CPM Bid
- Within AdConfig min/max range
- Automatic bidding uses platform algorithm

### Creative
- Image: 1080x1080px minimum, 5MB max
- Video: 1080x1920px, 30 seconds max, 50MB max
- Title: 60 characters max
- Description: 150 characters max
- CTA: 20 characters max

### Targeting
- At least one placement required
- Age range: 13-65+
- Estimated audience must be > 10,000

### Dates
- Start date: Today or future
- End date: After start date
- Maximum duration: 90 days

---

## 🎨 UI/UX Best Practices

1. **Progressive Disclosure**: Show advanced options only when needed
2. **Real-time Validation**: Validate inputs as user types
3. **Estimated Reach**: Update dynamically as targeting changes
4. **Preview**: Show ad preview for each placement
5. **Save Draft**: Allow saving incomplete campaigns
6. **Help Text**: Provide tooltips and examples
7. **Error Handling**: Clear error messages with solutions
8. **Success State**: Confirmation screen after submission

---

## 🔔 Notifications

Users should receive notifications for:
- Campaign submitted for review
- Campaign approved/rejected
- Campaign started
- Budget 80% spent
- Campaign completed
- Performance milestones (1K impressions, etc.)

---

## 📈 Success Metrics

Track these metrics for the ad creation flow:
- Campaign creation completion rate
- Average time to create campaign
- Approval rate
- Average budget per campaign
- Most popular ad types
- Most popular placements
- User satisfaction (post-campaign survey)

---

## 🛡️ Compliance & Safety

### Content Policy
- No misleading claims
- No prohibited products (weapons, drugs, etc.)
- No adult content
- No hate speech
- Must comply with local advertising laws

### Review Process
- Automated content moderation (AI)
- Manual review by admin
- Rejection reasons provided
- Appeal process available

---

## 💡 Additional Features (Nice to Have)

1. **Campaign Templates**: Pre-made templates for common use cases
2. **Bulk Upload**: Create multiple campaigns at once
3. **Scheduling**: Schedule campaigns in advance
4. **Auto-optimization**: AI adjusts bids for better performance
5. **Competitor Analysis**: See how similar campaigns perform
6. **Creative Library**: Save and reuse ad creatives
7. **Team Collaboration**: Multiple users manage campaigns
8. **White-label**: Agencies manage campaigns for clients

---

## 🎯 Example Campaign Flow

**Scenario**: Local restaurant wants to promote new menu

1. **Campaign Name**: "Mama Oliech New Menu Launch"
2. **Ad Type**: Native Ad
3. **Budget**: KES 10,000 (7 days)
4. **Creative**: Food photo, "Try our new Tilapia special!"
5. **CTA**: "Order Now" → WhatsApp link
6. **Targeting**: 
   - Age: 18-45
   - Location: Nairobi
   - Interests: Food, Dining
7. **Placements**: Discover Feed, Drips Feed
8. **Estimated Reach**: 15K-25K users
9. **Expected CPM**: KES 60
10. **Expected Impressions**: ~166,000

**Result**: Campaign submitted, approved in 12 hours, goes live next day.

---

This comprehensive screen will enable businesses to create professional ad campaigns on Runinga, driving platform revenue while providing value to advertisers.
