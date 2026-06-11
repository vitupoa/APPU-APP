# Right-Side Action Panel Redesign — Complete Implementation

## Overview

Redesigned the vertical action panel on all tabs (Contests, Discover, Lovers, Admiring) with proper positioning above the navigation bar and consistent UI across all feed types.

---

## Action Buttons by Tab

### **Discover, Lovers, Admiring Tabs (ShortsScreen)**

From top to bottom:

1. **Profile Picture + Plus (Admire/Love)** — NEW ✅
   - 48dp circular profile picture with 2dp white border
   - Red circular plus button (20dp) overlaid at bottom
   - Tap profile → Navigate to creator's profile
   - Tap plus (+) → Instantly admire/love creator
   - Auto-promotes to "Lovers" if mutual (backend handles this)
   - **Hidden when viewing own content**
   - **No unadmire (-) button** — once admired, stays admired

2. **Heart (Like)** — EXISTING ✅
   - Filled red heart when liked, outline when not
   - Shows like count (formatted: 1K, 1M, etc.)
   - Double-tap video also triggers like

3. **Comment (Chat Bubble)** — EXISTING ✅
   - Opens comments screen
   - Shows comment count

4. **Tip Icon** — EXISTING ✅
   - Opens tipping modal
   - **Hidden when:**
     - Content is locked (subscribers only)
     - Viewing own shorts
   - **Never shown on Contests tab**

5. **Bookmark/Favorites** — NEW ✅
   - Bookmark outline icon
   - Label: "Save"
   - Saves to personal collections
   - **TODO:** Backend integration needed

6. **Share** — NEW ✅
   - Arrow/share icon
   - Label: "Share"
   - Opens share sheet (device, social, friends)
   - **TODO:** Share functionality implementation needed

---

### **Contests Tab (ContestSubmissionFeedScreen)**

From top to bottom:

1. **Profile Picture (View Only)** — NEW ✅
   - 48dp circular profile picture with 2dp white border
   - Tap → Navigate to user's profile
   - **NO plus button** — no admiring in contests
   - **NO tip button** — tipping not allowed in contests

2. **Upvote (Thumbs Up)** — EXISTING ✅
   - Shows vote count
   - Swipe right also triggers upvote

3. **Comment (Chat Bubble)** — EXISTING ✅
   - Opens comments for contest submission
   - Shows "Comment" label

4. **Bookmark/Favorites** — NEW ✅
   - Same as shorts tabs
   - Saves contest submission

5. **Share** — NEW ✅
   - Same as shorts tabs
   - Shares contest submission

**Missing from Contests (by design):**
- ❌ Admire button (contests are competition, not social)
- ❌ Like/Heart (use Upvote instead)
- ❌ Tip (no tipping in contests)

---

## UI Design Specifications

### Positioning
- **Container:** Column aligned to `Alignment.BottomEnd`
- **Padding:** 
  - `end = 12.dp` (from right edge)
  - `bottom = 80.dp` (from bottom edge)
  - Uses `windowInsetsPadding(WindowInsets.navigationBars)` to sit above nav bar
- **Spacing:** `16.dp` between buttons (using `Arrangement.spacedBy(16.dp)`)

### Button Styling
- **Icon Size:** 32dp for all action icons
- **Profile Picture:** 48dp diameter
- **Plus Button:** 20dp diameter, red background (#FF3B5C), white "+" text (16sp bold)
- **Text Labels:** 11sp, Medium weight, white color
- **No ripple effect:** `indication = null` for clean tap interaction

### Count Formatting
```kotlin
fun formatCount(count: Int): String {
    return when {
        count >= 1_000_000 -> "${count / 1_000_000}M"
        count >= 1_000 -> "${count / 1_000}K"
        else -> count.toString()
    }
}
```

---

## Backend Integration

### Admire/Love System

**Endpoints (already implemented):**
- `POST /api/v1/users/:id/admire` — Admire a user
- `DELETE /api/v1/users/:id/admire` — Unadmire a user
- `DELETE /api/v1/users/:id/love` — Unlove (break lovers but keep admiring)
- `GET /api/v1/users/:id/admirers` — Get list of admirers
- `GET /api/v1/users/:id/admiring` — Get list of people user admires
- `GET /api/v1/users/:id/lovers` — Get mutual admirers (lovers)

**Logic Flow:**
1. User taps plus (+) on creator's profile
2. Frontend calls `profileRepository.admire(creatorId)`
3. Backend creates admire record
4. Backend checks if reverse admire exists
5. If mutual → both records get `is_lovers: true`
6. Response returns `{ admired: true, isLovers: boolean }`

**Relationship States:**
- `NONE` — No connection
- `ADMIRING` — You admire them (one-way)
- `ADMIRED_BY` — They admire you (one-way)
- `LOVERS` — Mutual admiration (both admire each other)

---

## TODO: Missing Implementations

### 1. Bookmark/Favorites Backend
**Need to implement:**
- Backend API endpoint: `POST /api/v1/users/me/bookmarks`
- Database schema: `user_bookmarks` table
- Repository method: `bookmarkShort(shortId: String)`
- UI state: Track bookmark status per short

**Schema suggestion:**
```sql
CREATE TABLE user_bookmarks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user(id),
  content_id UUID,
  content_type VARCHAR(20), -- 'SHORT', 'CONTEST_SUBMISSION'
  collection_id UUID, -- Optional: group into collections
  created_at TIMESTAMP
);
```

### 2. Share Functionality
**Need to implement:**
- Platform-specific share sheet (Android `Intent.ACTION_SEND`, iOS `UIActivityViewController`)
- Share URL generation: `https://krieta.app/shorts/:shortId`
- Deep linking support for in-app navigation
- Share to social platforms (WhatsApp, Twitter, etc.)
- Copy link to clipboard
- Save video to device (with permission)

**Example flow:**
```kotlin
expect class ShareManager {
    fun shareShort(shortId: String, caption: String, videoUrl: String)
    fun shareContestSubmission(submissionId: String, contestTitle: String, mediaUrl: String)
}
```

### 3. Admire Status in UI
**Current limitation:**
- Plus button always shows (when not own content)
- No visual feedback showing if already admiring/lovers

**Enhancement needed:**
- Add `relationshipStatus` field to `Short` model
- Change plus button visual based on status:
  - Not admiring: Red plus button
  - Admiring: Gold/yellow button with checkmark
  - Lovers: Pink/purple button with heart

### 4. Bookmark Status in UI
**Need:**
- Add `isBookmarked: Boolean` field to `Short` and `ContestSubmission` models
- Toggle bookmark icon: filled when bookmarked, outline when not
- Local state management for instant UI feedback

---

## Visual Layout

```
                                    ┌─────────────────┐
                                    │  Battery Time   │ ← Status bar
┌────────────────────────────────┐  └─────────────────┘
│                                │  
│   Contests  Discover  Lovers   │  ← Floating tab bar
│        ────────                │
│                                │
│                                │
│     [VIDEO FULL SCREEN]        │
│                                │
│                           [👤] │  ← Profile + Plus
│                           [+]  │
│                                │
│                           [♥]  │  ← Like + count
│                           1.2K │
│                                │
│                           [💬] │  ← Comment + count
│  @username                457  │
│  Caption text...               │
│  🎵 Music track          [💸] │  ← Tip (if allowed)
│                           Tip  │
│                                │
│                           [🔖] │  ← Bookmark
│                           Save │
│                                │
│                           [↗]  │  ← Share
│                           Share│
└────────────────────────────────┘
      [Navigation Bar]            ← Nav bar (transparent)
```

---

## Files Modified

1. **ShortsScreen.kt**
   - Added `ProfileActionButton` composable (profile + plus)
   - Added `onAdmire`, `onBookmark`, `onShare` callbacks
   - Added `ProfileRepository` injection
   - Repositioned action panel: `bottom = 80.dp` (was 24.dp)
   - Added count formatting utility

2. **ContestSubmissionFeedScreen.kt**
   - Added `ProfileViewButton` composable (profile only, no plus)
   - Added `onBookmark`, `onShare` callbacks
   - Removed old `ActionButton` with `IconButton`, replaced with consistent design
   - Repositioned action panel: `bottom = 80.dp`
   - Added count formatting utility

---

## Testing Checklist

- [x] Profile + Plus button appears on Discover/Lovers/Admiring tabs
- [x] Profile + Plus hidden on own content
- [x] Profile button (view only) appears on Contests tab
- [x] Tip button hidden on Contests tab
- [x] Tip button hidden on own shorts
- [x] Tip button hidden on locked content
- [x] Bookmark button appears on all tabs
- [x] Share button appears on all tabs
- [x] Action panel sits above navigation bar (no overlap)
- [x] Count formatting works (1K, 1M)
- [ ] Admire API call succeeds and updates UI
- [ ] Bookmark API call succeeds and updates UI
- [ ] Share sheet opens with correct content
- [ ] Double-tap video triggers like
- [ ] Profile picture tap navigates to profile screen
- [ ] Plus button tap calls admire API
- [ ] All buttons have proper touch targets (48dp minimum)

---

## Known Limitations

1. **No unadmire UI** — By design, once you admire someone, you can't unadmire from the feed. Users must go to profile screen to manage relationships.

2. **No admire status indicator** — Plus button doesn't change visual state based on current relationship (not admiring vs admiring vs lovers). This is a future enhancement.

3. **Bookmark not implemented** — Tapping bookmark logs to console. Backend and local state management needed.

4. **Share not implemented** — Tapping share logs to console. Platform-specific share sheet needed.

5. **No animation** — Action buttons appear instantly. Could add slide-in animations on tab switch.

---

## Future Enhancements

1. **Smart button hiding:** Only show 4-5 most relevant buttons based on context, hide others in overflow menu
2. **Long-press menus:** Hold action button for more options (e.g., "Report", "Not interested")
3. **Haptic feedback:** Vibrate on button tap for tactile confirmation
4. **Button badges:** Show red dot on profile picture if user is online/live
5. **Collections UI:** When bookmarking, show sheet to select which collection to save to
6. **Share analytics:** Track share sources (WhatsApp, Twitter, etc.) for creator insights
