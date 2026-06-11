# Drips/Posts - Profile & Admire Implementation

## Summary
Successfully implemented profile picture navigation and admire functionality in the Drips/Posts feed (DripsScreen), matching the implementation from the Shorts feed and Contests tab.

## Changes Made

### File: `DripsScreen.kt`

#### 1. Added Imports
- `ProfileScreen` - For profile navigation
- `ProfileRepository` - For admire functionality
- `offset` - For plus button positioning
- `border` - For profile picture border

#### 2. Updated Content() Composable
- Added `profileRepository` injection via `koinInject<ProfileRepository>()`

#### 3. Updated PostCard Parameters
Added two new callback parameters:
- `onProfileClick: () -> Unit` - Navigate to profile callback
- `onAdmire: () -> Unit` - Admire creator callback

#### 4. Updated PostCard Invocations
Both regular and sponsored post cards now pass:
- `onProfileClick = { navigator.push(ProfileScreen(post.creator.id)) }`
- `onAdmire = { scope.launch { profileRepository.admire(post.creator.id) } }`

#### 5. Updated SponsoredPostCard Parameters
Added same two callback parameters:
- `onProfileClick: () -> Unit`
- `onAdmire: () -> Unit`

#### 6. Modified PostCard Header Layout
Replaced simple avatar display with conditional logic:

**For Other Users' Posts:**
```kotlin
ProfileActionButton(
    avatarUrl = post.creator.avatarUrl,
    onProfileClick = onProfileClick,
    onAdmireClick = onAdmire
)
```

**For Own Posts:**
```kotlin
AsyncImage(
    // Simple clickable avatar without plus button
)
```

#### 7. Added ProfileActionButton Composable
Created new composable function adapted for card layout:

```kotlin
@Composable
private fun ProfileActionButton(
    avatarUrl: String?,
    onProfileClick: () -> Unit,
    onAdmireClick: () -> Unit
)
```

**Features:**
- 40dp circular profile picture (fits card layout)
- 2dp colored border using `MaterialTheme.colorScheme.primary`
- Clickable to navigate to user profile
- 16dp red plus button (+) overlay at bottom
- Plus button offset 2dp below avatar
- Red color (#FF3B5C) matching TikTok/Shorts style
- Clickable to admire/love the creator

## Implementation Details

### Profile Picture Behavior
- **Click**: Navigates to creator's profile screen
- **Style**: Circular with theme primary color border
- **Size**: 40dp diameter (smaller for card layout)
- **Position**: Top-left of post card header

### Plus Button Behavior
- **Click**: Calls `profileRepository.admire(creatorId)`
- **Style**: Small circular red button with "+" symbol
- **Size**: 16dp diameter (proportional to 40dp avatar)
- **Position**: Overlaid at bottom of profile picture (2dp offset)
- **Color**: #FF3B5C (vibrant red)
- **Font Size**: 12sp (proportional to button size)

### Conditional Display
- Profile with plus button shows when viewing others' posts
- Simple clickable profile (no plus button) shows for own posts
- Both options navigate to profile on click

## Size Adjustments for Card Layout

The ProfileActionButton was adapted for the card-based layout with smaller, more proportional sizing:

| Component | Shorts/Contests | Drips/Posts | Reason |
|-----------|----------------|-------------|---------|
| Avatar | 48dp | 40dp | Fits card header better |
| Plus Button | 20dp | 16dp | Proportional to smaller avatar |
| Plus Text | 16sp | 12sp | Readable at smaller size |
| Offset | 4dp | 2dp | Balanced for smaller avatar |

## User Experience Flow

1. **User scrolls through drips feed**
2. **Sees creator's profile picture** in post header
3. **Notices small red plus button** overlaid on avatar (if not own post)
4. **Taps profile picture** → Navigates to creator's profile
5. **Taps plus button** → Admires/Loves the creator
6. **Own posts** → No plus button, but avatar still clickable

## Consistency Across App

The implementation maintains consistency while adapting to different layouts:

### Shorts Feed (Full Screen)
- ✅ 48dp avatar at right side action bar
- ✅ 20dp plus button
- ✅ White border
- ✅ Hidden for own content

### Contests Tab (Full Screen)
- ✅ 48dp avatar at right side action bar
- ✅ 20dp plus button
- ✅ White border
- ✅ Hidden for own content

### Drips/Posts Feed (Card Layout)
- ✅ 40dp avatar in card header
- ✅ 16dp plus button
- ✅ Theme color border
- ✅ Shows for all content, but plus button only for others

## Backend Integration
- Uses `profileRepository.admire(userId)` - existing backend endpoint
- Uses `ProfileScreen(userId)` - existing profile navigation
- Uses `tokenManager.getUserId()` - existing authentication for own content detection

## Visual Comparison

**Before:**
```
┌────────────────────────────┐
│ 👤  @username              │  ← Simple avatar
│     Display Name           │
│                            │
│ [Post Content]             │
└────────────────────────────┘
```

**After (Others' Posts):**
```
┌────────────────────────────┐
│ 👤+ @username              │  ← Avatar with plus button
│     Display Name           │
│                            │
│ [Post Content]             │
└────────────────────────────┘
```

**After (Own Posts):**
```
┌────────────────────────────┐
│ 👤  @username              │  ← Clickable avatar, no plus
│     Display Name           │
│                            │
│ [Post Content]             │
└────────────────────────────┘
```

## Testing Checklist
- [ ] Profile picture displays correctly for post creators
- [ ] Tapping profile picture navigates to profile screen (all posts)
- [ ] Plus button displays overlaid on profile picture (others' posts only)
- [ ] Tapping plus button calls admire endpoint
- [ ] Plus button hidden for own posts
- [ ] Profile picture remains clickable for own posts
- [ ] Sizing looks proportional in card layout
- [ ] Works for both regular and sponsored posts
- [ ] Works on both Android and iOS

## Complete! ✅
The Drips/Posts feed now has the same profile navigation and admire functionality as the Home tab's Shorts feed and the Contests tab, with appropriate size adjustments for the card-based layout.
