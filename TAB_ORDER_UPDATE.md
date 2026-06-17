# Home Screen Tab Order Update

## ✅ Tab Order Changed

### New Tab Order (Left to Right):
1. **Contests** (index 0)
2. **Discover** (index 1) - Default selected
3. **Lovers** (index 2)
4. **Admiring** (index 3)

### Previous Order:
1. Contests (index 0)
2. ~~Admiring~~ (index 1)
3. ~~Lovers~~ (index 2)
4. ~~Discover~~ (index 3)

---

## Changes Made

**File**: `composeApp/src/commonMain/kotlin/com/krieta/feature/feed/presentation/screen/HomeScreen.kt`

### Change 1: Tab Labels Order (Line 23)
```kotlin
// BEFORE:
private val tabs = listOf("Contests", "Admiring", "Lovers", "Discover")

// AFTER:
private val tabs = listOf("Contests", "Discover", "Lovers", "Admiring")
```

### Change 2: Default Tab (Line 27)
```kotlin
// BEFORE:
var selectedTab by remember { mutableStateOf(1) } // Default: Admiring

// AFTER:
var selectedTab by remember { mutableStateOf(1) } // Default: Discover
```

### Change 3: Tab Content Mapping (Lines 36-47)
```kotlin
// BEFORE:
when (selectedTab) {
    0 -> ContestSubmissionFeedScreen()
    1 -> ShortsScreen(ADMIRING)
    2 -> ShortsScreen(LOVERS)
    3 -> ShortsScreen(DISCOVER)
}

// AFTER:
when (selectedTab) {
    0 -> ContestSubmissionFeedScreen()
    1 -> ShortsScreen(DISCOVER)
    2 -> ShortsScreen(LOVERS)
    3 -> ShortsScreen(ADMIRING)
}
```

---

## Result

### Home Screen Layout:
```
┌────────────────────────────────────────┐
│  [Contests] [Discover*] [Lovers] [Admiring]  │  ← Top Nav Bar
│                                        │
│                                        │
│         Feed Content Here              │
│      (Discover tab selected)           │
│                                        │
└────────────────────────────────────────┘
```

### Tab Behavior:
- **Default tab on launch**: Discover (most content for new users)
- **Tab 0 (Contests)**: Shows contest submissions from active contests
- **Tab 1 (Discover)**: Shows trending shorts from strangers (sorted by engagement)
- **Tab 2 (Lovers)**: Shows shorts from mutual admirers (last 24 hours)
- **Tab 3 (Admiring)**: Shows your shorts + people you admire (last 7 days)

---

## UX Reasoning

### Why this order?
1. **Contests first**: Special content, draws attention
2. **Discover second**: Most content available, best for new users (default)
3. **Lovers third**: Personal connections in the middle
4. **Admiring last**: Your own content + follows

### Why Discover as default?
- Most content availability for new users
- No time restrictions (all-time content)
- Sorted by engagement (best content first)
- Works for users with 0 admirers/lovers

---

## Testing

When you open the app:
1. ✅ Discover tab should be selected by default (highlighted)
2. ✅ Tabs should appear in order: Contests, Discover, Lovers, Admiring
3. ✅ Tapping each tab should show the correct content
4. ✅ Tab indicator should animate smoothly when switching

---

## Summary

The tab order is now optimized for:
- **New user discovery** (Discover as default)
- **Content hierarchy** (Contests → Public → Personal → Self)
- **Logical flow** (General → Specific)
