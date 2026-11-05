# ASPECT RATIO IMPLEMENTATION GUIDE

## Overview
Complete implementation of adaptive aspect ratio handling for videos and photos across Shorts, Discover, Admiring, and Contest tabs.

## Backend Changes

### 1. Database Schema Updates

**File**: `backend/prisma/schema.prisma`

Added three new fields to `Short` model:
```prisma
model Short {
  // ... existing fields
  mediaType    String   @default("VIDEO") @map("media_type") // VIDEO, PHOTO, CAROUSEL
  aspectRatio  Float?   @map("aspect_ratio") // width/height (e.g., 0.5625 for 9:16, 1.7778 for 16:9)
  mediaUrls    String[] @default([]) @map("media_urls") // For photo carousels
  // ... rest of fields
}
```

**Run Migration**:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 2. API Response Updates

Update shorts API to include new fields in response:
```typescript
// backend/src/modules/shorts/shorts.service.ts
{
  id: short.id,
  videoUrl: short.videoUrl,
  thumbnailUrl: short.thumbnailUrl,
  mediaType: short.mediaType,
  aspectRatio: short.aspectRatio,
  mediaUrls: short.mediaUrls,
  // ... other fields
}
```

## Frontend Changes

### 1. Domain Model Updates

**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/shorts/domain/model/ShortsModels.kt`

```kotlin
data class Short(
    val id: String,
    val creator: ShortCreator,
    val videoUrl: String,
    val thumbnailUrl: String?,
    val mediaType: String = "VIDEO", // VIDEO, PHOTO, CAROUSEL
    val aspectRatio: Float? = null, // width/height
    val mediaUrls: List<String> = emptyList(), // For photo carousels
    // ... other fields
)
```

### 2. New Components

#### AdaptiveMediaPlayer
**File**: `composeApp/src/commonMain/kotlin/com/runinga/com/core/ui/components/AdaptiveMediaPlayer.kt`

Handles different aspect ratios:
- **9:16 (Vertical)**: Fills entire screen, no letterboxing
- **16:9 (Landscape)**: Letterbox with blurred background
- **1:1 (Square)**: Letterbox with blurred background
- **Photos**: Zoomable with pinch-to-zoom support

#### PhotoCarousel
**File**: `composeApp/src/commonMain/kotlin/com/runinga/com/core/ui/components/PhotoCarousel.kt`

Features:
- Horizontal swipe navigation
- Auto-advance (3 seconds per photo)
- Progress dots indicator
- Pinch-to-zoom on each photo
- Pause on interaction

### 3. Updated ImmersivePlayer

**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/feed/presentation/components/ImmersivePlayerNew.kt`

Now accepts:
```kotlin
fun ImmersivePlayer(
    videoUrl: String,
    thumbnailUrl: String?,
    mediaType: String = "VIDEO",
    aspectRatio: Float? = null,
    mediaUrls: List<String> = emptyList(),
    // ... other parameters
)
```

## Aspect Ratio Handling

### Video Aspect Ratios

#### 9:16 (Vertical - Native)
```
┌─────────────┐
│             │
│   PERFECT   │ ← Fills entire screen
│     FIT     │   No letterboxing
│             │
└─────────────┘
```
- **Ratio**: 0.5625 (9/16)
- **Behavior**: Fills screen edge-to-edge
- **ContentScale**: Crop

#### 16:9 (Horizontal/Landscape)
```
┌─────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Blurred background
├─────────────┤
│   VIDEO     │ ← Video centered
├─────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓│ ← Blurred background
└─────────────┘
```
- **Ratio**: 1.7778 (16/9)
- **Behavior**: Letterbox with blurred background
- **Background**: Blurred/zoomed thumbnail

#### 1:1 (Square)
```
┌─────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓│
├─────────────┤
│   SQUARE    │ ← Centered
├─────────────┤
│▓▓▓▓▓▓▓▓▓▓▓▓▓│
└─────────────┘
```
- **Ratio**: 1.0
- **Behavior**: Letterbox with blurred background

### Photo Handling

#### Single Photo
- **Pinch to zoom**: 1x to 3x
- **Pan when zoomed**: Drag to explore
- **Tap to pause**: Stops auto-advance
- **Same UI**: Like, comment, share buttons

#### Photo Carousel
- **Horizontal swipe**: Navigate between photos
- **Auto-advance**: 3 seconds per photo
- **Progress dots**: Show position
- **Zoomable**: Each photo supports pinch-to-zoom

## Usage Examples

### Shorts Screen
```kotlin
ImmersivePlayer(
    videoUrl = short.videoUrl,
    thumbnailUrl = short.thumbnailUrl,
    mediaType = short.mediaType,
    aspectRatio = short.aspectRatio,
    mediaUrls = short.mediaUrls,
    // ... other parameters
)
```

### Contest Submissions
```kotlin
// For video submission
ImmersivePlayer(
    videoUrl = submission.mediaUrl,
    mediaType = "VIDEO",
    aspectRatio = submission.aspectRatio,
    // ...
)

// For photo submission
ImmersivePlayer(
    videoUrl = submission.mediaUrl, // Used as imageUrl for photos
    mediaType = "PHOTO",
    aspectRatio = submission.aspectRatio,
    // ...
)

// For photo carousel
ImmersivePlayer(
    videoUrl = "",
    mediaType = "CAROUSEL",
    mediaUrls = submission.mediaUrls,
    aspectRatio = submission.aspectRatio,
    // ...
)
```

## Aspect Ratio Calculation

### On Upload (Backend)
```typescript
// Calculate aspect ratio from video/image metadata
const aspectRatio = width / height;

// Examples:
// 1080x1920 (9:16) = 0.5625
// 1920x1080 (16:9) = 1.7778
// 1080x1080 (1:1) = 1.0
```

### Detection Logic (Frontend)
```kotlin
when {
    aspectRatio > 1.5f -> {
        // Landscape (16:9 or wider)
        // Use letterbox with blurred background
    }
    aspectRatio < 0.8f -> {
        // Vertical (9:16 or taller)
        // Fill screen
    }
    else -> {
        // Square-ish (1:1)
        // Use letterbox
    }
}
```

## Testing Checklist

### Video Tests
- [ ] 9:16 vertical video fills screen
- [ ] 16:9 landscape video shows blurred background
- [ ] 1:1 square video shows blurred background
- [ ] Video playback works correctly
- [ ] Tap to pause/play works
- [ ] Double tap to like works

### Photo Tests
- [ ] Single photo displays correctly
- [ ] Pinch to zoom works (1x to 3x)
- [ ] Pan when zoomed works
- [ ] Photo carousel swipes horizontally
- [ ] Auto-advance works (3 seconds)
- [ ] Progress dots show correctly
- [ ] Tap to pause auto-advance works

### Contest Tests
- [ ] Contest video submissions display correctly
- [ ] Contest photo submissions display correctly
- [ ] Contest photo carousels work
- [ ] All interactions work (like, comment, share)

### Discover/Admiring Tests
- [ ] Mixed content (videos + photos) displays correctly
- [ ] Vertical pager works smoothly
- [ ] Aspect ratios handled correctly
- [ ] Performance is smooth

## Performance Considerations

1. **Image Loading**: Uses Coil3 for efficient image loading
2. **Video Preloading**: Preload next 3 videos/photos
3. **Memory Management**: Release resources when not visible
4. **Blur Effect**: Cached for performance

## Future Enhancements

1. **Ken Burns Effect**: Animated zoom/pan for photos
2. **Music Sync**: Transitions match music beat
3. **Templates**: Pre-made transition styles
4. **Auto-rotate Hint**: Suggest rotating phone for landscape
5. **Pinch to Zoom Videos**: Allow zooming landscape videos

## Migration Guide

### For Existing Content
```sql
-- Set default values for existing shorts
UPDATE shorts 
SET 
  media_type = 'VIDEO',
  aspect_ratio = 0.5625, -- Assume 9:16 for existing videos
  media_urls = ARRAY[]::text[]
WHERE media_type IS NULL;
```

### For New Uploads
1. Calculate aspect ratio from video/image metadata
2. Set `mediaType` based on content type
3. For carousels, populate `mediaUrls` array
4. Store `aspectRatio` as float (width/height)

## API Contract

### Short Response
```json
{
  "id": "short_123",
  "videoUrl": "https://...",
  "thumbnailUrl": "https://...",
  "mediaType": "VIDEO", // or "PHOTO" or "CAROUSEL"
  "aspectRatio": 0.5625, // 9:16
  "mediaUrls": [], // Empty for VIDEO/PHOTO, populated for CAROUSEL
  "caption": "...",
  // ... other fields
}
```

### Contest Submission Response
```json
{
  "id": "submission_123",
  "mediaUrl": "https://...",
  "mediaType": "PHOTO",
  "aspectRatio": 1.0,
  "mediaUrls": ["https://1.jpg", "https://2.jpg"], // For carousels
  // ... other fields
}
```

## Status

✅ **Backend Schema**: Updated with new fields
✅ **Frontend Models**: Updated with new fields
✅ **AdaptiveMediaPlayer**: Created
✅ **PhotoCarousel**: Created
✅ **ImmersivePlayer**: Updated to use adaptive components
⏳ **API Updates**: Need to update backend services
⏳ **Migration**: Need to run database migration
⏳ **Testing**: Need comprehensive testing

---

**Last Updated**: 2026
**Status**: Ready for Testing
