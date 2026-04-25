# BRAND MARKETPLACE - QUICK REFERENCE

## 🚀 Quick Start

### 1. Database Setup (5 minutes)
```bash
# Add schema to prisma/schema.prisma
# Copy content from brand-marketplace-schema.prisma

# Run migration
npx prisma migrate dev --name add_brand_marketplace
npx prisma generate
```

### 2. Register Routes (2 minutes)
```typescript
// In backend/src/index.ts
import marketplaceRoutes from './modules/marketplace/marketplace.routes.js';
app.use('/api/v1/marketplace', marketplaceRoutes);
```

### 3. Test API (3 minutes)
```bash
# Search influencers
GET /api/v1/marketplace/influencers?tier=MICRO&categories=Fashion

# Create campaign
POST /api/v1/marketplace/campaigns
{
  "title": "Test Campaign",
  "type": "SPONSORED_POST",
  "budgetKr": 5000,
  ...
}

# Track purchase
POST /api/v1/marketplace/contests/:id/track-purchase
{
  "orderId": "order-123",
  "purchaseAmount": 100,
  "productIds": ["prod-1"]
}
```

---

## 📋 Key Concepts

### Contest vs Campaign vs Sponsorship

| Feature | Contest | Campaign | Sponsorship |
|---------|---------|----------|-------------|
| **Creator** | Anyone | Brand | Brand |
| **Participants** | Users | Influencers | N/A |
| **Goal** | Win prize | Create content | Brand visibility |
| **Payment** | Prize pool | Per deliverable | One-time fee |
| **Duration** | Fixed deadline | Campaign period | Sponsorship period |

### Legal: Gambling vs Skill-Based

| Gambling ❌ | Skill-Based ✅ |
|------------|---------------|
| Paid entry required | Free entry available |
| Random winner | Votes/judges decide |
| No product value | Purchase gives product |
| More money = better odds | Purchase doesn't affect odds |

---

## 🔌 API Quick Reference

### Influencer Marketplace
```typescript
// Search influencers
GET /api/v1/marketplace/influencers
  ?tier=MICRO,NANO
  &categories=Fashion,Beauty
  &minFollowers=10000
  &minEngagementRate=3.5
  &sortBy=engagement

// Get profile
GET /api/v1/marketplace/influencers/:id
```

### Brand Campaigns
```typescript
// Create campaign
POST /api/v1/marketplace/campaigns
Body: {
  title, description, type,
  targetTiers, budgetKr,
  compensationPerInfluencer,
  maxInfluencers, deliverables
}

// Publish campaign
POST /api/v1/marketplace/campaigns/:id/publish

// Browse campaigns (influencer view)
GET /api/v1/marketplace/campaigns
  ?type=SPONSORED_POST
  &minCompensation=500

// Apply to campaign
POST /api/v1/marketplace/campaigns/:id/apply
Body: { influencerId, pitch }

// Review application
POST /api/v1/marketplace/applications/:id/review
Body: { decision: "ACCEPTED" | "REJECTED" }
```

### Contest Sponsorships
```typescript
// Browse contests
GET /api/v1/marketplace/contests
  ?category=DANCE
  &minParticipants=1000

// Sponsor contest
POST /api/v1/marketplace/contests/:id/sponsor
Body: {
  type: "CONTEST_PRIZE",
  sponsorshipKr: 5000,
  benefits: ["Logo", "Mention"]
}
```

### Sales Funnel
```typescript
// Track purchase entry
POST /api/v1/marketplace/contests/:id/track-purchase
Body: { orderId, purchaseAmount, productIds }

// Track engagement action
POST /api/v1/marketplace/contests/:id/track-action
Body: { actionType, targetUrl, proofUrl }

// Create conversion campaign
POST /api/v1/marketplace/contests/:id/conversion-campaign
Body: {
  type: "POST_CONTEST_DISCOUNT",
  targetSegment: "LOSERS",
  discountPercent: 20
}

// Track campaign interaction
POST /api/v1/marketplace/conversion-campaigns/:id/track
Body: { action: "OPENED" | "CLICKED" | "CONVERTED" }

// Get funnel analytics
GET /api/v1/marketplace/contests/:id/funnel

// Get ROI metrics
GET /api/v1/marketplace/contests/:id/roi
```

### Gamification
```typescript
// Get my stats
GET /api/v1/marketplace/gamification/me

// Award points (internal)
await SalesFunnelService.awardPoints({
  userId,
  activityType: "CONTEST_WIN",
  category: "ENGAGEMENT",
  pointsEarned: 1000
});
```

---

## 💾 Database Models

### Key Tables
```
influencer_profiles          - Influencer data
brand_campaigns              - Campaign details
campaign_applications        - Influencer applications
campaign_deliverables        - Content submissions
contest_sponsorships         - Contest sponsors
contest_engagement_actions   - User actions
contest_purchase_entries     - Purchase tracking
conversion_campaigns         - Post-contest campaigns
sales_funnel_events          - Funnel tracking
gamification_points          - User points
```

### Key Relations
```
User → InfluencerProfile (1:1)
User → BrandCampaigns (1:N)
BrandCampaign → Applications (1:N)
Contest → Sponsorships (1:N)
Contest → PurchaseEntries (1:N)
Contest → ConversionCampaigns (1:N)
User → GamificationPoints (1:1)
```

---

## 🎯 Common Use Cases

### Use Case 1: Brand Creates Campaign
```typescript
// 1. Create campaign
const campaign = await BrandMarketplaceService.createCampaign({
  brandId: "brand-123",
  title: "Promote New Product",
  type: "SPONSORED_POST",
  targetTiers: ["MICRO", "NANO"],
  budgetKr: 10000,
  compensationPerInfluencer: 500,
  maxInfluencers: 20
});

// 2. Publish
await BrandMarketplaceService.publishCampaign(campaign.id, "brand-123");

// 3. Review applications
await BrandMarketplaceService.reviewApplication({
  applicationId: "app-456",
  brandId: "brand-123",
  decision: "ACCEPTED"
});
```

### Use Case 2: Purchase-to-Enter Contest
```typescript
// 1. User makes purchase
const order = await createOrder({ userId, products, total: 100 });

// 2. Track purchase entry
await SalesFunnelService.trackPurchaseEntry({
  contestId: "contest-789",
  userId: "user-123",
  orderId: order.id,
  purchaseAmount: 100,
  productIds: ["prod-1", "prod-2"]
});

// 3. Award points
await SalesFunnelService.awardPoints({
  userId: "user-123",
  activityType: "PURCHASE_TO_ENTER",
  category: "SALES",
  pointsEarned: 10
});
```

### Use Case 3: Post-Contest Conversion
```typescript
// 1. Contest ends
await ContestService.distributeContestPrizes(contestId, winnerIds);

// 2. Create conversion campaign
const campaign = await SalesFunnelService.createConversionCampaign({
  contestId,
  type: "POST_CONTEST_DISCOUNT",
  targetSegment: "LOSERS",
  discountPercent: 20,
  discountCode: "CONTEST20"
});

// 3. Track conversions
await SalesFunnelService.trackCampaignInteraction({
  campaignId: campaign.id,
  userId: "user-123",
  action: "CONVERTED",
  orderId: "order-456",
  revenueKr: 150
});
```

### Use Case 4: Winner → Influencer Transition
```typescript
// After user wins 3rd contest
const transitioned = await SalesFunnelService.checkInfluencerTransition("user-123");

if (transitioned) {
  // User now has influencer profile
  // Can apply to campaigns
  // Can set rates
}
```

---

## 🔍 Debugging Tips

### Check Contest Eligibility
```typescript
const contest = await prisma.contest.findUnique({
  where: { id: contestId },
  include: { purchaseEntries: true }
});

console.log("Entry fee:", contest.entryFeeKr);
console.log("Purchase entries:", contest.purchaseEntries.length);
```

### Verify Funnel Tracking
```typescript
const events = await prisma.salesFunnelEvent.findMany({
  where: { contestId, userId },
  orderBy: { createdAt: 'asc' }
});

console.log("User journey:", events.map(e => e.stage));
```

### Check ROI Calculation
```typescript
const roi = await SalesFunnelService.getContestROI(contestId);
console.log("Investment:", roi.investment);
console.log("Revenue:", roi.revenue);
console.log("ROI:", roi.metrics.roi);
```

---

## ⚠️ Common Pitfalls

### ❌ Don't: Make contests gambling
```typescript
// WRONG - This is gambling
const contest = {
  entryFee: 10,              // Paid entry required
  judgingCriteria: "RANDOM", // Random winner
  noPurchaseOption: false    // No free entry
};
```

### ✅ Do: Keep contests skill-based
```typescript
// CORRECT - This is legal
const contest = {
  entryFee: 0,                    // Free entry
  judgingCriteria: "COMBINATION", // Votes + judges
  purchaseToEnter: {
    optional: true,               // Optional purchase
    givesProductValue: true       // User gets product
  }
};
```

### ❌ Don't: Forget to track funnel events
```typescript
// WRONG - No tracking
await ContestService.joinContest(userId, contestId);
```

### ✅ Do: Track every action
```typescript
// CORRECT - Track everything
await ContestService.joinContest(userId, contestId);
await SalesFunnelService.trackFunnelEvent({
  userId,
  contestId,
  stage: "CONSIDERATION",
  eventType: "contest_join"
});
```

---

## 📊 Monitoring

### Key Metrics to Watch
```typescript
// Platform health
- Total campaigns created
- Total influencers active
- Total contests sponsored
- Platform revenue

// Campaign performance
- Application rate
- Acceptance rate
- Deliverable completion rate
- Average ROI

// Contest performance
- Participation rate
- Purchase conversion rate
- Post-contest conversion rate
- Viral coefficient

// User engagement
- Daily active users
- Average session time
- Repeat participation rate
- Influencer transition rate
```

### Alerts to Set Up
```
- Campaign budget depleted
- Contest deadline approaching
- Low conversion rate (<5%)
- High refund rate (>10%)
- Suspicious voting patterns
- Payment failures
```

---

## 🆘 Troubleshooting

### Issue: Campaign not visible to influencers
```typescript
// Check status
const campaign = await prisma.brandCampaign.findUnique({
  where: { id: campaignId }
});

// Must be "OPEN" status
if (campaign.status !== "OPEN") {
  await BrandMarketplaceService.publishCampaign(campaignId, brandId);
}
```

### Issue: Purchase not auto-entering contest
```typescript
// Verify contest has purchase-to-enter enabled
const contest = await prisma.contest.findUnique({
  where: { id: contestId }
});

if (!contest.entryFeeKr || contest.entryFeeKr.equals(0)) {
  throw new Error("Contest doesn't have purchase-to-enter");
}

// Check minimum purchase amount
if (purchaseAmount < Number(contest.entryFeeKr)) {
  throw new Error("Purchase below minimum");
}
```

### Issue: ROI calculation incorrect
```typescript
// Verify all revenue sources tracked
const roi = await SalesFunnelService.getContestROI(contestId);

// Check each component
console.log("Purchase revenue:", roi.revenue.purchaseRevenue);
console.log("Conversion revenue:", roi.revenue.conversionRevenue);
console.log("Sponsorship revenue:", roi.revenue.sponsorshipRevenue);

// Verify costs
console.log("Prize cost:", roi.investment.prizeCost);
console.log("Platform fee:", roi.investment.platformFee);
```

---

## 📚 Additional Resources

- **Full Implementation Guide**: `BRAND_MARKETPLACE_IMPLEMENTATION_GUIDE.md`
- **Executive Summary**: `BRAND_MARKETPLACE_EXECUTIVE_SUMMARY.md`
- **Database Schema**: `backend/prisma/brand-marketplace-schema.prisma`
- **Service Code**: `backend/src/modules/marketplace/`

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: 2024
