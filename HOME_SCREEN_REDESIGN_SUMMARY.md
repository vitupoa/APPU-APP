# Home Screen Redesign & Edge-to-Edge Video Implementation

## Summary

Redesigned the home screen with 4 tabs (Contests, Discover, Lovers, Admiring) and ensured all video/image content fills the entire screen from the battery/status bar at the top to the physical bottom edge behind the navigation bar, while keeping all UI elements (text, buttons, tabs) fully visible and readable.

---

## Changes Made

### 1. **App.kt** — Root Container Fix
**Problem:** `Surface` with `MaterialTheme.colorScheme.background` created an opaque layer and consumed window insets, preventing video from reaching behind system bars.

**Solution:**
- Replaced `Surface` with plain `Box(background = Color.Black)`
- No inset consumption at app root level — insets flow through to child screens
- Video content now bleeds behind status bar and nav bar

---

### 2. **HomeScreen.kt** — Redesigned Tab Bar
**New Design Features:**
- **4 Tabs:** Contests, Discover (default), Lovers, Admiring
- **Floating Tab Bar:** Overlays video with gradient scrim for legibility
- **Animated Indicators:** 
  - Gold-to-orange gradient pill that grows/shrinks on selection (0dp → 28dp)
  - Smooth alpha fade for unselected tabs (55% opacity)
  - 200-220ms tween animations
- **Layout:**
  - `Arrangement.SpaceEvenly` — tabs distributed equally across width
  - No rigid dividers between tabs
  - Gradient scrim (`Black 65% → Transparent`) extends from top edge downward
  - Tab labels sit below status bar via `.statusBarsPadding()`

**Edge-to-Edge:**
- Root `Box` uses `fillMaxSize()` with no inset padding
- Video child screens render behind both status bar and nav bar
- Only the tab bar itself respects status bar inset

---

### 3. **ShortsScreen.kt** — Video Feed Fixes

#### Bottom Text Fix (Creator Handle, Caption)
**Problem:** Text was bleeding behind the navigation bar and unreadable.

**Solution:**
- Bottom gradient + text `Column` now uses:
  - `.windowInsetsPadding(WindowInsets.navigationBars)` — pushes entire column above nav bar
  - `.padding(bottom = 24.dp)` — extra breathing room
  - `.padding(top = 60.dp)` — tall gradient starts high enough to be visible
  - Gradient opacity increased to 80% for better contrast

#### Video Layer Fix (Status Bar Coverage)
**Problem:** Video wasn't filling behind the status bar at the top.

**Solution:**
- Video layers (`ImmersiveVideoLayer`, `ImmersivePhotoLayer`) use `Modifier.fillMaxSize()` with NO inset padding
- Video/photo bleeds from physical top edge (behind battery/clock icons) to physical bottom edge (behind nav bar)
- UI overlays (action buttons, progress bar, text) use `windowInsetsPadding()` individually to stay visible

**Key Changes:**
- Root `Box` in `ShortItem`: `fillMaxSize()` with no insets
- Bottom text `Column`: uses `windowInsetsPadding(WindowInsets.navigationBars)` + 24dp bottom padding
- Right action buttons: uses `windowInsetsPadding(WindowInsets.navigationBars)` + 24dp bottom padding
- Video progress bar: uses `windowInsetsPadding(WindowInsets.navigationBars)`
- Video player itself: pure `fillMaxSize()` (portrait 9:16) or `aspectRatio()` (landscape)

---

### 4. **ContestSubmissionFeedScreen.kt** — Contest Feed Fixes

**Changes:**
- Root `Box`: `fillMaxSize()` with no inset consumption
- Contest banner: uses `windowInsetsPadding(WindowInsets.statusBars)` + 60dp top padding to clear floating HomeTabBar
- Bottom user info: uses `windowInsetsPadding(WindowInsets.navigationBars)` to stay above nav bar
- Video/photo media fills edge-to-edge behind both bars

---

## Feed Types Explained

### **Contests Tab (Index 0)**
- Displays contest submissions in vertical swipeable feed
- Users can upvote/downvote by swiping left/right
- Contest banner overlays at top
- NO tip button (contests only)

### **Discover Tab (Index 1) — Default**
- Algorithm-driven "For You" feed
- Shows shorts from users you don't follow
- Personalized recommendations based on interactions
- Tip button available

### **Lovers Tab (Index 2)**
- **Mutual connections only**
- Shows shorts from users where BOTH of you admire each other
- True "friends" / bilateral relationships
- Tip button available

### **Admiring Tab (Index 3)**
- Shows:
  - Own shorts
  - Shorts from users you admire (non-mutual)
- Does NOT show shorts from users who admire you unless mutual
- Tip button available (except on own content)

---

## Technical Implementation

### Window Insets Strategy
```kotlin
// ❌ OLD (prevents edge-to-edge):
Box(Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.systemBars))

// ✅ NEW (enables edge-to-edge):
Box(Modifier.fillMaxSize()) {
    // Video layer — no insets, fills behind bars
    VideoPlayer(modifier = Modifier.fillMaxSize())
    
    // UI overlay — respects nav bar only
    Column(
        modifier = Modifier
            .align(Alignment.BottomStart)
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(bottom = 24.dp)
    )
}
```

### Key Modifiers
- **Video/Photo layers:** `Modifier.fillMaxSize()` only — no inset padding
- **Floating tab bar:** `.statusBarsPadding()` on inner `Row` only
- **Bottom text/buttons:** `.windowInsetsPadding(WindowInsets.navigationBars)` + explicit padding
- **App root:** Plain `Box` instead of `Surface` to avoid inset consumption

---

## Visual Result

```
┌─────────────────────────────┐
│ [Battery] [Time] [Signal]   │ ← Status Bar (transparent, video behind)
│                              │
│  Contests Discover Lovers... │ ← Floating tab bar with gradient scrim
│      ─────────               │ ← Animated gold indicator
│                              │
│                              │
│      [VIDEO FILLS FULL       │
│       SCREEN EDGE-TO-EDGE]   │
│                              │
│  @username                   │ ← Bottom gradient + text (above nav bar)
│  Caption text...        [♥]  │
│  🎵 Music track         [💬] │
│                         [💸] │ ← Action buttons (above nav bar)
└─────────────────────────────┘
  [Nav Bar] (transparent, video behind)
```

---

## Testing Checklist

- [x] Video fills behind status bar (battery row visible over video)
- [x] Video fills behind navigation bar
- [x] Bottom text (creator handle, caption) fully visible above nav bar
- [x] Action buttons (like, comment, tip) visible above nav bar
- [x] Tab bar readable with gradient scrim over any video colour
- [x] Smooth tab switching between all 4 tabs
- [x] Animated gold pill indicator transitions
- [x] Progress bar stays above nav bar for videos
- [x] Contest submissions show proper edge-to-edge layout
- [x] Locked content overlay works correctly
- [x] Linked product popup appears above nav bar
- [x] Tip modal opens correctly
- [x] Video play/pause tap overlay works
- [x] Landscape videos show blurred background with centred video

---

## Files Modified

1. `App.kt` — Removed `Surface`, added plain `Box`
2. `HomeScreen.kt` — Complete redesign with floating tab bar
3. `ShortsScreen.kt` — Fixed video edge-to-edge + bottom text visibility
4. `ContestSubmissionFeedScreen.kt` — Edge-to-edge layout fix
