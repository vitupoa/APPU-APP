# BACKEND API UPDATES - ASPECT RATIO SUPPORT

## Summary
Updated all backend services to return `mediaType`, `aspectRatio`, `thumbnailUrl`, and `mediaUrls` fields for adaptive aspect ratio handling.

## Database Schema Changes

### 1. Short Model
**File**: `backend/prisma/schema.prisma`

Added fields:
```prisma
model Short {
  // ... existing fields
  mediaType    String   @default("VIDEO") @map("media_type") // VIDEO, PHOTO, CAROUSEL
  aspectRatio  Float?   @map("aspect_ratio") // width/height
  mediaUrls    String[] @default([]) @map("media_urls") // For photo carousels
  // ... rest of fields
}
```

### 2. ContestSubmission Model
**File**: `backend/prisma/schema.prisma`

Added fields:
```prisma
model ContestSubmission {
  // ... existing fields
  aspectRatio Float?   @map("aspect_ratio") // width/height
  mediaUrls   String[] @default([]) @map("media_urls") // For photo carousels
  // ... rest of fields
}
```

## Service Updates

### 1. Shorts Service
**File**: `backend/src/modules/shorts/shorts.service.ts`

#### Updated Methods:

**getFeed()** - Returns:
```typescript
{
  id: string;
  creator: User;
  videoUrl: string;
  thumbnailUrl: string | null;
  mediaType: string;           // NEW
  aspectRatio: number | null;  // NEW
  mediaUrls: string[];         // NEW
  caption: string;
  musicTrack: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isLocked: boolean;
  requiredTier: string | null;
  linkedProduct: Product | null;
  createdAt: string;
}
```

**createShort()** - Accepts:
```typescript
{
  creatorId: string;
  videoUrl: string;
  thumbnailUrl?: string;        // NEW
  mediaType?: string;           // NEW (default: "VIDEO")
  aspectRatio?: number;         // NEW
  mediaUrls?: string[];         // NEW
  caption?: string;
  musicTrack?: string;
  linkedProductId?: string;
  isLocked?: boolean;
  requiredTier?: SubscriptionTierType;
}
```

### 2. Contest Service
**File**: `backend/src/modules/contests/contests.service.ts`

#### Updated Methods:

**getSubmissions()** - Returns:
```typescript
{
  id: string;
  user: User;
  contestId: string;
  mediaUrl: string;
  mediaType: string;
  aspectRatio: number | null;  // NEW
  mediaUrls: string[];         // NEW
  proofScreenshots: string[];
  votes: number;
  rank: number | null;
  createdAt: string;
}
```

**getSubmissionsFeed()** - Returns same structure with contest info

**getLeaderboard()** - Returns same structure

**submitEntry()** - Accepts:
```typescript
{
  userId: string;
  contestId: string;
  mediaUrl: string;
  mediaType: string;
  aspectRatio?: number;   // NEW
  mediaUrls?: string[];   // NEW
  proofUrls?: string[];
}
```

### 3. Feed Generation Service (Recommendation)
**File**: `backend/src/modules/recommendation/services/feedGeneration.service.ts`

#### Updated SQL Queries:

All queries now select:
```sql
SELECT 
  s.id, 
  s.user_id as "userId", 
  s.video_url as "videoUrl", 
  s.thumbnail_url as "thumbnailUrl",
  s.media_type as "mediaType",        -- NEW
  s.aspect_ratio as "aspectRatio",    -- NEW
  s.media_urls as "mediaUrls",        -- NEW
  s.caption, 
  s.created_at as "createdAt", 
  'SHORT' as type
FROM shorts s
...
```

Updated methods:
- `generateDiscoverFeed()` - All content types
- `generateAdmiringFeed()` - All content types
- `getPersonalizedContent()` - Personalized feed
- `getAdmiringContent()` - Admiring creators
- `getTrendingContent()` - Trending content
- `getDiscoveryContent()` - Discovery feed

## Migration Steps

### 1. Run Prisma Migration
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 2. Update Existing Data (Optional)
```sql
-- Set default values for existing shorts
UPDATE shorts 
SET 
  media_type = 'VIDEO',
  aspect_ratio = 0.5625,  -- Assume 9:16 for existing videos
  media_urls = ARRAY[]::text[]
WHERE media_type IS NULL;

-- Set default values for existing contest submissions
UPDATE contest_submissions
SET
  aspect_ratio = 0.5625,  -- Assume 9:16 for existing submissions
  media_urls = ARRAY[]::text[]
WHERE aspect_ratio IS NULL;
```

### 3. Restart Backend
```bash
npm run dev
```

## API Response Examples

### Shorts Feed Response
```json
{
  "items": [
    {
      "id": "short_123",
      "creator": {
        "id": "user_456",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "https://...",
        "isVerified": true
      },
      "videoUrl": "https://video.mp4",
      "thumbnailUrl": "https://thumb.jpg",
      "mediaType": "VIDEO",
      "aspectRatio": 0.5625,
      "mediaUrls": [],
      "caption": "Check this out! #viral",
      "musicTrack": "Original Sound",
      "likesCount": 1234,
      "commentsCount": 56,
      "isLiked": false,
      "isLocked": false,
      "requiredTier": null,
      "linkedProduct": null,
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ],
  "nextCursor": "short_789"
}
```

### Photo Carousel Example
```json
{
  "id": "short_456",
  "videoUrl": "",
  "thumbnailUrl": "https://thumb1.jpg",
  "mediaType": "CAROUSEL",
  "aspectRatio": 1.0,
  "mediaUrls": [
    "https://photo1.jpg",
    "https://photo2.jpg",
    "https://photo3.jpg"
  ],
  "caption": "My photo collection",
  ...
}
```

### Contest Submission Response
```json
{
  "items": [
    {
      "id": "submission_123",
      "user": {
        "id": "user_789",
        "username": "contestant",
        "displayName": "Contestant Name",
        "avatarUrl": "https://...",
        "isVerified": false
      },
      "contestId": "contest_456",
      "mediaUrl": "https://submission.mp4",
      "mediaType": "VIDEO",
      "aspectRatio": 1.7778,
      "mediaUrls": [],
      "proofScreenshots": ["https://proof1.jpg"],
      "votes": 234,
      "rank": 5,
      "createdAt": "2026-01-15T12:00:00Z"
    }
  ],
  "nextCursor": "submission_789"
}
```

## Aspect Ratio Values

Common aspect ratios:
- **0.5625** (9:16) - Vertical video (TikTok/Instagram Reels)
- **1.7778** (16:9) - Horizontal video (YouTube)
- **1.0** (1:1) - Square video/photo (Instagram)
- **0.8** (4:5) - Portrait photo
- **1.25** (5:4) - Landscape photo

## Testing Checklist

- [ ] Run database migration
- [ ] Test shorts feed API
- [ ] Test shorts creation API
- [ ] Test contest submissions API
- [ ] Test contest submission creation
- [ ] Test discover feed API
- [ ] Test admiring feed API
- [ ] Verify all fields are returned correctly
- [ ] Test with different aspect ratios
- [ ] Test photo carousels
- [ ] Test backward compatibility (existing data)

## Backward Compatibility

All new fields have default values:
- `mediaType`: Defaults to "VIDEO"
- `aspectRatio`: Nullable (null for existing content)
- `mediaUrls`: Defaults to empty array

Existing clients will continue to work, but won't receive the new fields until they update.

## Status

✅ **Schema Updated**: Short and ContestSubmission models
✅ **Shorts Service**: getFeed() and createShort() updated
✅ **Contest Service**: All submission methods updated
✅ **Feed Generation**: All recommendation queries updated
⏳ **Migration**: Ready to run
⏳ **Testing**: Needs comprehensive testing

---

**Last Updated**: 2026
**Status**: Ready for Migration & Testing
