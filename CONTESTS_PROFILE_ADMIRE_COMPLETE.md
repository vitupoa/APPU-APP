# Contests Tab - Profile & Admire Implementation

## Summary
Successfully implemented profile picture navigation and admire functionality in the Contests tab (ContestFeedSwipeScreen), matching the exact implementation from the Shorts feed in the Home tab.

## Changes Made

### File: `ContestFeedSwipeScreen.kt`

#### 1. Added Imports
- `ProfileScreen` - For profile navigation
- `ProfileRepository` - For admire functionality
- `koinInject` - For dependency injection
- `launch` - For coroutine scope
- `clickable`, `clip`, `border` - For UI interactions
- `AsyncImage` - For avatar display
- `ContentScale` - For image scaling
- `offset` - For plus button positioning

#### 2. Updated Content() Composable
- Added `profileRepository` injection
- Added `tokenManager` injection  
- Added `scope` for coroutine launch
- Added `currentUserId` state to detect own content
- Added `LaunchedEffect` to fetch current user ID

#### 3. Updated SwipeableContestCard Parameters
- Added `isOwnContent: Boolean` - Hides profile/admire button for own contests
- Added `onProfileClick: () -> Unit` - Navigate to profile callback
- Added `onAdmire: () -> Unit` - Admire creator callback

#### 4. Updated SwipeableContestCard Invocation
- Pass `isOwnContent = currentUserId == contest.creator.id`
- Pass `onProfileClick = { navigator.push(ProfileScreen(contest.creator.id)) }`
- Pass `onAdmire = { scope.launch { profileRepository.admire(contest.creator.id) } }`

#### 5. Added ProfileActionButton Composable
Created new composable function exactly matching ShortsScreen implementation:

```kotlin
@Composable
private fun ProfileActionButton(
    avatarUrl: String?,
    onProfileClick: () -> Unit,
    onAdmireClick: () -> Unit
)
```

**Features:**
- 48dp circular profile picture with 2dp white border
- Clickable to navigate to user profile
- 20dp red plus button (+) overlay at bottom
- Plus button offset 4dp below avatar
- Red color (#FF3B5C) matching TikTok/Shorts style
- Clickable to admire/love the creator

#### 6. Updated Action Buttons Layout
- Added ProfileActionButton at the top of the vertical action bar
- Only shows when `!isOwnContent` (not viewing own contest)
- Positioned above existing upvote and share buttons
- Maintains consistent spacing (24.dp)

## Implementation Details

### Profile Picture Behavior
- **Click**: Navigates to creator's profile screen
- **Style**: Circular with white border
- **Size**: 48dp diameter
- **Position**: Top of right-side action bar

### Plus Button Behavior
- **Click**: Calls `profileRepository.admire(creatorId)`
- **Style**: Small circular red button with "+" symbol
- **Size**: 20dp diameter
- **Position**: Overlaid at bottom of profile picture
- **Color**: #FF3B5C (vibrant red)

### Conditional Display
- Profile and plus button only show when viewing others' contests
- Hidden when viewing your own contests (`isOwnContent = true`)

## User Experience Flow

1. **User scrolls through contest feed**
2. **Sees creator's profile picture** at top of action bar
3. **Taps profile picture** → Navigates to creator's profile
4. **Taps plus button** → Admires/Loves the creator
5. **Own contests** → No profile/plus button shown

## Consistency with Home Tab

The implementation is **identical** to the Shorts feed:
- ✅ Same ProfileActionButton component structure
- ✅ Same sizes (48dp avatar, 20dp plus button)
- ✅ Same colors (white border, red plus button)
- ✅ Same positioning (overlay at bottom with 4dp offset)
- ✅ Same behavior (profile navigation + admire action)
- ✅ Same conditional logic (hide for own content)

## Backend Integration
- Uses `profileRepository.admire(userId)` - existing backend endpoint
- Uses `ProfileScreen(userId)` - existing profile navigation
- Uses `tokenManager.getUserId()` - existing authentication

## Testing Checklist
- [ ] Profile picture displays correctly for contest creators
- [ ] Tapping profile picture navigates to profile screen
- [ ] Plus button displays overlaid on profile picture
- [ ] Tapping plus button calls admire endpoint
- [ ] Profile/plus button hidden for own contests
- [ ] Layout matches Shorts feed exactly
- [ ] Works on both Android and iOS

## Visual Comparison

**Before:** Only upvote and share buttons on right side

**After:** Profile picture with plus button at top, followed by upvote and share buttons

```
┌──────────────────┐
│                  │
│   Contest Feed   │  ┌─────┐
│                  │  │ 👤+ │  ← Profile + Plus
│                  │  ├─────┤
│                  │  │  ⬆️  │  ← Upvotes
│                  │  ├─────┤
│                  │  │  📤  │  ← Share
│                  │  └─────┘
└──────────────────┘
```

## Complete! ✅
The Contests tab now has the exact same profile and admire functionality as the Home tab's Discover, Lovers, and Admiring feeds.
