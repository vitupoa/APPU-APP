# Story Ring Indicator Implementation

## Summary
Successfully implemented story ring indicators around profile pictures in both Contests tab and Drips/Posts feed, showing yellow/orange gradient rings for unwatched stories and grey rings for watched stories. Own content never shows a story ring.

## Changes Made

### 1. ContestFeedSwipeScreen.kt

#### Added Imports
- `Brush` - For gradient story ring
- `SolidColor` - For grey ring on watched stories

#### New Composable: ProfileActionButtonWithStories
Created new version that fetches and displays story status:

```kotlin
@Composable
private fun ProfileActionButtonWithStories(
    creatorId: String,
    avatarUrl: String?,
    onProfileClick: () -> Unit,
    onAdmireClick: () -> Unit,
    profileRepository: ProfileRepository
)
```

**Features:**
- Fetches `hasUnwatchedStories` from user profile via API
- Shows yellow/orange gradient ring for unwatched stories
- Shows grey ring for watched stories
- 52dp outer ring with 2dp border and 2dp padding
- Plus button overlay remains unchanged
- LaunchedEffect fetches story status on creator change

#### Updated Usage
- Replaced `ProfileActionButton` with `ProfileActionButtonWithStories`
- Passes `profileRepository` to fetch story status
- Only shows for non-own content (already conditional)

### 2. DripsScreen.kt

#### Added Imports
- `Brush` - For gradient story ring
- `SolidColor` - For grey ring on watched stories

#### New Composable: ProfileActionButtonWithStories
Created adapted version for card layout:

```kotlin
@Composable
private fun ProfileActionButtonWithStories(
    creatorId: String,
    avatarUrl: String?,
    onProfileClick: () -> Unit,
    onAdmireClick: () -> Unit,
    profileRepository: ProfileRepository
)
```

**Features:**
- Fetches `hasUnwatchedStories` from user profile via API
- Shows yellow/orange gradient ring for unwatched stories
- Shows grey ring for watched stories
- 44dp outer ring (proportional to card layout)
- Plus button overlay remains unchanged
- LaunchedEffect fetches story status on creator change

#### Updated Usage
- Replaced `ProfileActionButton` with `ProfileActionButtonWithStories` in `PostCard`
- Passes `profileRepository` and `post.creator.id`
- Only shows for non-own content

## Implementation Details

### Story Ring Colors

**Unwatched Stories:**
```kotlin
Brush.sweepGradient(
    colors = listOf(
        Color(0xFFFFCC00), // Yellow
        Color(0xFFFF6B00), // Orange
        Color(0xFFFFCC00)  // Yellow
    )
)
```

**Watched Stories:**
```kotlin
SolidColor(Color.LightGray)
```

### Ring Sizes

| Screen | Outer Ring | Border | Padding | Avatar | Plus Button |
|--------|-----------|--------|---------|--------|-------------|
| **Contests** | 52dp | 2dp | 2dp | 48dp | 20dp |
| **Drips** | 44dp | 2dp | 2dp | 40dp | 16dp |
| **Shorts** | 52dp | 2dp | 2dp | 48dp | 20dp |

### Data Flow

1. **Component renders** with `creatorId`
2. **LaunchedEffect** triggers on `creatorId` change
3. **API call** to `profileRepository.getProfile(creatorId)`
4. **Extract** `hasUnwatchedStories` from response
5. **Update state** with `hasUnwatchedStories` value
6. **Render ring** with appropriate color based on state

### Conditional Display Logic

| Condition | Display |
|-----------|---------|
| Own content | No profile action button (hidden) |
| Other's content + unwatched stories | Yellow/orange gradient ring |
| Other's content + watched stories | Grey ring |
| Other's content + no stories | Grey ring (default) |
| API failure | Grey ring (safe default) |

## Backend Integration

### API Endpoint
- `GET /api/user/profile/:userId`
- Returns `hasUnwatchedStories: boolean` field

### hasUnwatchedStories Logic (Backend)
```typescript
// Returns true if:
// 1. User has active stories (not expired)
// 2. Viewer hasn't seen those stories
// 3. Viewer is not the story owner
```

## User Experience Flow

### Contests Tab
1. User scrolls through contest feed
2. Sees creator's profile picture in right action bar
3. **Yellow/orange gradient ring** = Creator has unwatched stories
4. **Grey ring** = Creator's stories already watched
5. Tap profile → Navigate to profile
6. Tap plus → Admire creator
7. Own contests → No profile button shown

### Drips/Posts Feed
1. User scrolls through drips feed
2. Sees creator's profile picture in post header
3. **Yellow/orange gradient ring** = Creator has unwatched stories
4. **Grey ring** = Creator's stories already watched
5. Tap profile → Navigate to profile
6. Tap plus → Admire creator
7. Own posts → Simple avatar (no plus, no story ring)

## Consistency Across App

All feeds now have consistent story ring implementation:

### ✅ Shorts Feed (Home Tab)
- Yellow/orange gradient for unwatched
- Grey for watched
- Hidden for own content

### ✅ Contests Tab
- Yellow/orange gradient for unwatched
- Grey for watched
- Hidden for own content

### ✅ Drips/Posts Feed
- Yellow/orange gradient for unwatched
- Grey for watched
- Shown for others (own posts have simple avatar)

### ✅ Stories Row Component
- Yellow/orange gradient for unwatched
- Grey for watched
- Special "My Story" indicator for own stories

## Performance Considerations

- **LaunchedEffect**: Only fetches when `creatorId` changes
- **Silent failures**: API errors don't crash UI, default to grey ring
- **Minimal re-composition**: Story status cached in remember state
- **Non-blocking**: UI renders immediately, ring updates when data loads

## Visual Indicators

```
Unwatched Stories:
┌─────────────┐
│   🟡🟠🟡    │  ← Yellow/orange gradient ring
│   ╱👤╲      │
│  │  + │     │  ← Red plus button
└─────────────┘

Watched Stories:
┌─────────────┐
│   ⚪⚪⚪    │  ← Grey ring
│   ╱👤╲      │
│  │  + │     │  ← Red plus button
└─────────────┘

Own Content:
┌─────────────┐
│    👤       │  ← Simple avatar (Drips)
│             │    OR completely hidden (Contests)
└─────────────┘
```

## Testing Checklist
- [ ] Story ring shows yellow/orange gradient for unwatched stories (Contests)
- [ ] Story ring shows grey for watched stories (Contests)
- [ ] Story ring shows yellow/orange gradient for unwatched stories (Drips)
- [ ] Story ring shows grey for watched stories (Drips)
- [ ] No story ring on own content (both screens)
- [ ] Ring updates when viewing stories
- [ ] API failures don't crash UI
- [ ] Plus button still works correctly
- [ ] Profile navigation still works
- [ ] Ring size proportional to layout
- [ ] Performance is smooth during scrolling

## Complete! ✅
Both Contests tab and Drips/Posts feed now display story ring indicators matching the Shorts feed implementation, providing consistent visual feedback across the entire app for story status.
