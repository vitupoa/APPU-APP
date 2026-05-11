# Sponsored Content - Database Migration Guide

## ✅ Good News!

The Prisma schema already includes the sponsored content models! They're at the bottom of `schema.prisma`:

```prisma
model SponsoredContent {
  id           String @id @default(uuid())
  brandUserId  String @map("brand_user_id")
  contentType  String @map("content_type")
  contentId    String @map("content_id")
  campaignName String @map("campaign_name")
  // ... all fields already defined
}

model SponsoredImpression {
  id         String   @id @default(uuid())
  campaignId String   @map("campaign_id")
  userId     String   @map("user_id")
  // ... all fields already defined
}
```

---

## 🚀 Apply Migration (2 Steps)

### Step 1: Generate Prisma Client (1 min)

```bash
cd backend
npx prisma generate
```

This regenerates the Prisma client with the sponsored content models.

---

### Step 2: Create and Apply Migration (2 min)

```bash
npx prisma migrate dev --name add_sponsored_content
```

This will:
1. Create a new migration file
2. Apply it to your database
3. Create the `sponsored_content` and `sponsored_impressions` tables

---

## ✅ Verify Migration

Check that tables were created:

```bash
npx prisma studio
```

Or using psql:

```bash
psql -U postgres -d krieta -c "\dt sponsored*"
```

Expected output:
```
                List of relations
 Schema |         Name          | Type  |  Owner   
--------+-----------------------+-------+----------
 public | sponsored_content     | table | postgres
 public | sponsored_impressions | table | postgres
```

---

## 🎯 What's Already in Schema

### Enums
- ✅ `SponsoredContentStatus` (PENDING_REVIEW, ACTIVE, PAUSED, COMPLETED, REJECTED)
- ✅ `PricingModel` (CPM, CPV, CPE, CPC)

### Models
- ✅ `SponsoredContent` - Campaign data with all fields
- ✅ `SponsoredImpression` - Tracking events

### Relations
- ✅ `User.sponsoredCampaigns` → `SponsoredContent[]`
- ✅ `Short.sponsoredCampaigns` → `SponsoredContent[]`
- ✅ `Post.sponsoredCampaigns` → `SponsoredContent[]`
- ✅ `SponsoredContent.impressionLog` → `SponsoredImpression[]`

---

## 🔧 If Migration Fails

### Issue: "Column already exists"
**Solution:** Tables might already exist. Drop them first:

```sql
DROP TABLE IF EXISTS sponsored_impressions CASCADE;
DROP TABLE IF EXISTS sponsored_content CASCADE;
```

Then run migration again:
```bash
npx prisma migrate dev --name add_sponsored_content
```

---

### Issue: "Enum already exists"
**Solution:** Enums might already exist. Check:

```sql
SELECT typname FROM pg_type WHERE typname LIKE '%sponsored%';
```

If they exist, the migration will handle it automatically.

---

## 📊 Test After Migration

### 1. Check Tables Created
```bash
npx prisma studio
```

### 2. Test Campaign Creation
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
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z"
  }'
```

### 3. Verify in Database
```sql
SELECT * FROM sponsored_content;
```

---

## ✅ That's It!

The schema is already complete. Just run:

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add_sponsored_content
```

And you're done! 🎉

---

## 📚 Related Files

- Schema: `backend/prisma/schema.prisma` (already has models)
- Routes: `backend/src/modules/sponsored/sponsored.routes.ts` (already registered)
- Service: `backend/src/modules/sponsored/sponsored.service.ts` (already implemented)
- Frontend: `composeApp/.../feature/sponsored/` (already implemented)

---

**Total Time:** 3 minutes
**Status:** Schema ready, just need to apply migration
