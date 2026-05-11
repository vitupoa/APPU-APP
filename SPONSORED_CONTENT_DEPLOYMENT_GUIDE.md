# Sponsored Content - Quick Deployment Guide

## 🚀 Deploy in 3 Steps (30 minutes)

### Step 1: Apply Database Migration (5 min)

```bash
cd backend

# Option A: Using psql directly
psql -U postgres -d krieta < prisma/migrations/add_sponsored_content.sql

# Option B: Using Prisma (recommended)
npx prisma migrate dev --name add_sponsored_content

# Verify tables created
psql -U postgres -d krieta -c "\dt sponsored*"
```

**Expected Output:**
```
                List of relations
 Schema |         Name          | Type  |  Owner   
--------+-----------------------+-------+----------
 public | sponsored_content     | table | postgres
 public | sponsored_impressions | table | postgres
```

---

### Step 2: Restart Backend (2 min)

```bash
# Backend is already configured, just restart
cd backend
npm run dev
```

**Verify routes registered:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","service":"krieta-api","version":"1.0.0"}
```

---

### Step 3: Test Campaign Creation (5 min)

```bash
# 1. Get auth token (login first)
TOKEN="your_auth_token_here"

# 2. Create test campaign
curl -X POST http://localhost:3000/api/v1/sponsored/campaigns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "short",
    "contentId": "existing_short_id",
    "campaignName": "Test Campaign",
    "budget": 100,
    "pricingModel": "CPV",
    "bidAmount": 0.05,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "targeting": {
      "ageMin": 18,
      "ageMax": 45
    }
  }'

# 3. Verify campaign created
curl http://localhost:3000/api/v1/sponsored/campaigns/my \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Verification Checklist

### Database
- [ ] Tables created: `sponsored_content`, `sponsored_impressions`
- [ ] Enums created: `SponsoredContentType`, `SponsoredContentStatus`, `PricingModel`
- [ ] Indexes created for performance

### Backend
- [ ] Server starts without errors
- [ ] Routes registered: `/api/v1/sponsored/*`
- [ ] Campaign creation works
- [ ] Feed API returns sponsored content

### Frontend
- [ ] App builds successfully
- [ ] Campaign creation screen works
- [ ] Fiat currency conversion displays
- [ ] Sponsored content appears in feeds
- [ ] "Sponsored" badge displays
- [ ] Metrics tracked

---

## 🧪 Test Scenarios

### Scenario 1: Create Campaign
1. Open app
2. Navigate to Drips → Click dummy ad → "Learn More"
3. Select "Sponsored Content" tab
4. Click "Create Sponsored Campaign"
5. Fill form:
   - Campaign Name: "Test Restaurant"
   - Content Type: Short
   - Content ID: (paste existing short ID)
   - Budget: 5000 KES
   - Pricing Model: CPV
   - Bid Amount: 5 KES
   - Age: 18-45
6. Submit
7. Verify campaign created

### Scenario 2: Approve Campaign (Manual)
```sql
-- Connect to database
psql -U postgres -d krieta

-- Find pending campaigns
SELECT id, campaign_name, status FROM sponsored_content WHERE status = 'PENDING_REVIEW';

-- Approve campaign
UPDATE sponsored_content SET status = 'ACTIVE' WHERE id = 'campaign_id_here';
```

### Scenario 3: View Sponsored Content
1. Open Shorts feed
2. Scroll through shorts
3. Every 7th short should be sponsored
4. Verify "Sponsored" badge displays
5. Like the sponsored short
6. Check database for tracked engagement

```sql
-- Check impressions
SELECT * FROM sponsored_impressions WHERE campaign_id = 'campaign_id_here';
```

---

## 🐛 Troubleshooting

### Issue: Tables not created
**Solution:**
```bash
# Check Prisma schema includes sponsored-content.prisma
cat backend/prisma/schema.prisma | grep "sponsored-content"

# Regenerate Prisma client
npx prisma generate

# Re-run migration
npx prisma migrate dev --name add_sponsored_content --force
```

### Issue: Campaign creation fails with "Insufficient balance"
**Solution:**
```sql
-- Add balance to test user
UPDATE wallets SET kr_balance = 1000 WHERE user_id = 'your_user_id';
```

### Issue: Sponsored content not appearing in feed
**Solution:**
1. Verify campaign is ACTIVE:
```sql
SELECT id, campaign_name, status FROM sponsored_content WHERE status = 'ACTIVE';
```

2. Check content exists:
```sql
SELECT id FROM shorts WHERE id = 'content_id_from_campaign';
```

3. Check targeting matches user:
```sql
SELECT targeting FROM sponsored_content WHERE id = 'campaign_id';
-- Verify user age/location matches targeting
```

### Issue: "Sponsored" badge not showing
**Solution:**
- Check `SponsoredBadge` component imported
- Verify `isSponsored` flag passed correctly
- Check `viewModel.isSponsored(index)` returns true

---

## 📊 Monitor Performance

### Check Campaign Stats
```sql
SELECT 
  campaign_name,
  status,
  budget,
  spent,
  impressions,
  views,
  engagements,
  clicks,
  CASE 
    WHEN impressions > 0 THEN (spent / impressions * 1000)
    ELSE 0 
  END as cpm,
  CASE 
    WHEN impressions > 0 THEN (clicks::float / impressions * 100)
    ELSE 0 
  END as ctr
FROM sponsored_content
WHERE status = 'ACTIVE'
ORDER BY created_at DESC;
```

### Check Impression Tracking
```sql
SELECT 
  type,
  COUNT(*) as count,
  SUM(cost) as total_cost
FROM sponsored_impressions
WHERE campaign_id = 'campaign_id_here'
GROUP BY type;
```

---

## 🎯 Success Criteria

### Campaign Creation
✅ User can create campaign with fiat currency
✅ KR conversion displays correctly
✅ Wallet balance deducted
✅ Escrow created
✅ Campaign status is PENDING_REVIEW

### Feed Integration
✅ Sponsored shorts appear every 7 items
✅ Sponsored posts appear every 5 items
✅ Sponsored contests appear every 6 items
✅ "Sponsored" badge displays
✅ Impressions tracked
✅ Views tracked (3+ seconds)
✅ Engagements tracked (like/comment)

### Performance
✅ Feed loads in <2 seconds
✅ Sponsored injection adds <100ms
✅ Tracking is non-blocking
✅ No errors in logs

---

## 📈 Expected Metrics (First Week)

### Campaigns
- Created: 5-10
- Approved: 3-7
- Active: 2-5

### Impressions
- Per campaign: 1,000-5,000
- Total: 5,000-25,000

### Engagement
- CTR: 1.5-3%
- View rate: 60-80%
- Engagement rate: 5-10%

### Revenue
- Per campaign: KES 500-5,000
- Total: KES 2,500-25,000

---

## 🔄 Rollback Plan

If something goes wrong:

### Step 1: Disable Sponsored Injection
```kotlin
// In ShortsViewModel.kt, FeedViewModel.kt, ContestFeedViewModel.kt
private suspend fun injectSponsoredContent(items: List<T>): List<T> {
    return items // Disable injection temporarily
}
```

### Step 2: Pause All Campaigns
```sql
UPDATE sponsored_content SET status = 'PAUSED' WHERE status = 'ACTIVE';
```

### Step 3: Rollback Database (if needed)
```sql
DROP TABLE IF EXISTS sponsored_impressions;
DROP TABLE IF EXISTS sponsored_content;
DROP TYPE IF EXISTS "SponsoredContentType";
DROP TYPE IF EXISTS "SponsoredContentStatus";
DROP TYPE IF EXISTS "PricingModel";
```

---

## 📞 Support

### Logs to Check
```bash
# Backend logs
tail -f backend/logs/app.log | grep sponsored

# Database logs
tail -f /var/log/postgresql/postgresql-*.log | grep sponsored
```

### Useful Queries
```sql
-- Active campaigns
SELECT * FROM sponsored_content WHERE status = 'ACTIVE';

-- Recent impressions
SELECT * FROM sponsored_impressions ORDER BY created_at DESC LIMIT 100;

-- Campaign performance
SELECT 
  sc.campaign_name,
  COUNT(DISTINCT si.user_id) as unique_users,
  COUNT(*) as total_impressions,
  SUM(si.cost) as total_spent
FROM sponsored_content sc
LEFT JOIN sponsored_impressions si ON sc.id = si.campaign_id
WHERE sc.status = 'ACTIVE'
GROUP BY sc.id, sc.campaign_name;
```

---

## ✅ Deployment Complete!

Once all steps are done:
1. ✅ Database migrated
2. ✅ Backend running
3. ✅ Campaign created and approved
4. ✅ Sponsored content appearing in feeds
5. ✅ Metrics being tracked

**Next:** Build admin approval workflow and brand dashboard.

---

**Estimated Time:** 30 minutes
**Difficulty:** Easy
**Risk:** Low (can rollback easily)
