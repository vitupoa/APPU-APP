# Backend Database Schema Issues - URGENT FIXES NEEDED

## Date: 2026-06-11
## Status: CRITICAL - Blocking App Functionality

## Issues Found in Production Logs

### 1. **Missing Table: `user_bookmarks`**
**Error**: `relation "user_bookmarks" does not exist`
**Impact**: Shorts feed failing to load
**Location**: Multiple queries in feed service

**Solution**: 
- Check if table was renamed or removed from schema
- If feature is still needed, create migration to add table:
```sql
CREATE TABLE user_bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, content_id, content_type)
);
```
- OR: Remove all references to `user_bookmarks` from backend code

### 2. **Wrong Table Name: `chama_members` → `chama_member`**
**Error**: `Unknown argument 'chama_members'. Did you mean 'chama_member'?`
**Location**: Chama queries (likely in `chama.service.ts` or `chama.controller.ts`)

**Fix Required**:
```typescript
// WRONG:
where: {
  chama_members: {  // ❌
    some: { ... }
  }
}

// CORRECT:
where: {
  chama_member: {   // ✅
    some: { ... }
  }
}
```

**Files to check**:
- `backend/src/modules/chama/chama.service.ts`
- `backend/src/modules/chama/chama-finance.service.ts`
- Any file with `chama_members` references

### 3. **Wrong Field in Story _count: `views` → `story_view`**
**Error**: `Unknown field 'views' for select statement on model 'StoryCountOutputType'`
**Location**: Story feed queries

**Fix Required**:
```typescript
// WRONG:
_count: {
  select: {
    views: true  // ❌
  }
}

// CORRECT:
_count: {
  select: {
    story_view: true  // ✅
  }
}
```

**Files to check**:
- `backend/src/modules/story/story.service.ts`
- `backend/src/modules/story/story.controller.ts`
- Any file querying Story with `_count`

### 4. **Wrong Include Argument: `creator` → proper relation**
**Error**: `Unknown argument 'creator'. Did you mean 'creator_id'?`
**Location**: Story feed queries

**Fix Required**:
```typescript
// WRONG:
include: {
  creator: {  // ❌
    select: { ... }
  }
}

// CORRECT:
include: {
  user: {     // ✅ (the relation name in schema is 'user', not 'creator')
    select: { ... }
  }
}
```

## Prisma Schema Reference

From `schema.prisma`:
```prisma
model story {
  id         String       @id
  creator_id String
  media_url  String
  media_type String
  text       String?
  privacy    StoryPrivacy @default(PUBLIC)
  expires_at DateTime
  created_at DateTime     @default(now())
  user       user         @relation(fields: [creator_id], references: [id], onDelete: Cascade)
  story_view story_view[]

  @@index([creator_id, created_at])
  @@index([expires_at])
}

model story_view {
  id         String   @id
  storyId    String
  viewerId   String
  viewedAt   DateTime @default(now())
  isTipped   Boolean  @default(false)
  tip_amount Decimal? @db.Decimal(18, 4)
  story      story    @relation(fields: [storyId], references: [id], onDelete: Cascade)

  @@unique([storyId, viewerId])
  @@index([storyId])
  @@index([viewerId])
}

model chama_member {
  id                 String               @id
  chama_id           String
  user_id            String
  role               Chama_Member_Role
  status             Chama_Member_Status  @default(ACTIVE)
  // ...
  
  @@unique([chama_id, user_id])
  @@index([chama_id])
  @@index([user_id])
}
```

## Action Items

1. **Search and replace** in all backend files:
   - `chama_members` → `chama_member`
   - Story queries: `views:` → `story_view:` (in _count context)
   - Story queries: `creator:` → `user:` (in include context)

2. **Decide on bookmarks table**:
   - Either create the table with proper migration
   - Or remove all `user_bookmarks` references from code

3. **Test all endpoints** after fixes:
   - `/api/v1/stories/feed`
   - `/api/v1/stories/me`
   - `/api/v1/chama/*` endpoints
   - `/api/v1/shorts/feed`

## Priority: CRITICAL
These errors are currently preventing:
- ✅ Shorts feed from working properly
- ✅ Story feeds from loading
- ✅ Chama functionality

## Next Steps
1. Fix all Prisma query syntax errors
2. Run database migration if creating `user_bookmarks`
3. Restart Railway deployment
4. Verify all endpoints work

## Android App Impact
The locked shorts fix in `ShortsScreen.kt` is correct, but won't work until backend stops returning errors.
