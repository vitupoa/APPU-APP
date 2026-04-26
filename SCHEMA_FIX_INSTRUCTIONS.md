# INSTRUCTIONS: Add Missing Models to Schema

## Files Created:
1. `backend/prisma/schemas/live-session.prisma` - LiveSession models
2. `backend/prisma/schemas/sponsored-content-complete.prisma` - SponsoredContent models
3. `backend/src/modules/sponsored/sponsored.service.RESTORED.ts` - Full working service

## Steps to Fix:

### 1. Add LiveSession Models to schema.prisma

Copy the content from `backend/prisma/schemas/live-session.prisma` and paste it at the end of your `backend/prisma/schema.prisma` file (before the closing).

Then add these relations to existing models:

**In User model**, add:
```prisma
liveSessions LiveSession[] @relation("LiveSessionHost")
```

**In Product model**, add:
```prisma
liveSessionProducts LiveSessionProduct[] @relation("LiveSessionProducts")
```

### 2. Add SponsoredContent Models to schema.prisma

Copy the content from `backend/prisma/schemas/sponsored-content-complete.prisma` and paste it at the end of your `backend/prisma/schema.prisma` file.

Then add these relations to existing models:

**In User model**, add:
```prisma
sponsoredCampaigns SponsoredContent[] @relation("SponsoredContentBrand")
```

**In Short model**, add:
```prisma
sponsoredCampaigns SponsoredContent[] @relation("SponsoredShort")
```

**In Post model**, add:
```prisma
sponsoredCampaigns SponsoredContent[] @relation("SponsoredPost")
```

### 3. Replace Sponsored Service

Replace the content of `backend/src/modules/sponsored/sponsored.service.ts` with the content from `backend/src/modules/sponsored/sponsored.service.RESTORED.ts`

### 4. Run Prisma Generate

After adding all models to schema.prisma:

```bash
cd backend
npx prisma generate
```

### 5. Create Migration (Optional)

If you want to apply to database:

```bash
npx prisma migrate dev --name add_live_session_and_sponsored_content
```

## Summary

The backend build was failing because:
- ❌ Budget models (correctly removed - not in schema)
- ❌ LiveSession models (NOW CREATED - add to schema)
- ❌ SponsoredContent models (NOW CREATED - add to schema)
- ✅ Type errors (FIXED)

After adding these models to your schema and running `prisma generate`, the backend will build successfully!
