# Complete Implementation Summary - Action Panel Redesign

## ✅ COMPLETED

### 1. Frontend - ShortsScreen.kt (Discover, Lovers, Admiring)
**Action buttons from top to bottom:**
1. **Profile Picture + Plus (Admire)** - ✅ Implemented
   - 48dp profile with white border
   - **YELLOW** (+) button overlay (20dp, #FFD700 color)
   - Profile tap → Navigate to ProfileScreen
   - Plus tap → Call `profileRepository.admire(creatorId)`
   - **Hides when users are LOVERS** (mutual admiration)
   - **Hides on own content**
   - **Story ring logic:** Yellow ring when creator has unwatched stories, grey when watched
   
2. **Heart (Like)** - ✅ Existing
3. **Comment** - ✅ Existing
4. **Tip** - ✅ Existing (hidden on contests/own/locked)
5. **Bookmark** - ✅ Implemented (TODO: backend integration)
6. **Share** - ✅ Implemented (TODO: platform share sheet)

### 2. Frontend - ContestSubmissionFeedScreen.kt (Contests)
**Action buttons from top to bottom:**
1. **Profile Picture with Plus** - ✅ Implemented
   - Profile view only initially
   - **Plus button added** that navigates to creator profile
   - **Yellow plus button** (not red)
   - NO admire functionality in contests
   
2. **Upvote** - ✅ Existing
3. **Comment** - ✅ Existing
4. **Bookmark** - ✅ Implemented
5. **Share** - ✅ Implemented

### 3. Backend - Bookmark System
**Database Migration:** ✅ Created
- File: `backend/prisma/migrations/20240101000000_add_bookmarks/migration.sql`
- Table: `user_bookmarks`
- Columns: id, user_id, content_id, content_type, collection_id, created_at
- Indexes: unique constraint, user queries, collection lookups

**Backend Service:** ✅ Created
- File: `backend/src/modules/bookmarks/bookmarks.service.ts`
- Methods:
  - `toggleBookmark(userId, contentId, contentType)` - Add/remove bookmark
  - `getUserBookmarks(userId, contentType?, cursor?)` - Get paginated bookmarks
  - `isBookmarked(userId, contentId, contentType)` - Check bookmark status

**Backend Routes:** ✅ Created
- File: `backend/src/modules/bookmarks/bookmarks.routes.ts`
- Endpoints:
  - `POST /api/v1/bookmarks/toggle` - Toggle bookmark
  - `GET /api/v1/bookmarks` - Get user bookmarks
  - `GET /api/v1/bookmarks/check/:contentId/:contentType` - Check if bookmarked

---

## 🚧 TODO: IMMEDIATE ACTIONS NEEDED

### 1. Backend Setup

#### A. Run Database Migration
```bash
cd backend
npx prisma migrate deploy
# or
npx prisma db push
```

#### B. Register Bookmark Routes in API
Edit `backend/src/routes/api.ts`:
```typescript
import bookmarkRoutes from '../modules/bookmarks/bookmarks.routes.js';

// Add this line with other routes
router.use('/bookmarks', bookmarkRoutes);
```

#### C. Update Shorts API Response
Edit `backend/src/modules/shorts/shorts.service.ts` to include `isBookmarked` field:
```typescript
// In getFeed and getShortById methods:
const isBookmarked = viewerId 
  ? await BookmarkService.isBookmarked(viewerId, short.id, 'SHORT')
  : false;

return {
  ...short,
  isBookmarked
};
```

#### D. Update User Profile API
Edit `backend/src/modules/user/user.service.ts` in `getProfile` method:
```typescript
// Add story status check
const hasUnwatchedStories = viewerId && viewerId !== userId
  ? await this.checkUnwatchedStories(viewerId, userId)
  : false;

return {
  ...baseProfile,
  hasUnwatchedStories
};

// Add helper method:
private async checkUnwatchedStories(viewerId: string, creatorId: string): Promise<boolean> {
  const stories = await prisma.story.findMany({
    where: {
      creator_id: creatorId,
      expires_at: { gt: new Date() }
    },
    select: { id: true }
  });

  if (stories.length === 0) return false;

  const viewedStories = await prisma.story_view.count({
    where: {
      viewerId: viewerId,
      storyId: { in: stories.map(s => s.id) }
    }
  });

  return viewedStories < stories.length;
}
```

### 2. Frontend - Update Models

#### A. Update Short Model
Edit `composeApp/src/commonMain/kotlin/com/krieta/feature/shorts/domain/model/ShortsModels.kt`:
```kotlin
data class ShortCreator(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean,
    val accountType: String,
    val relationshipStatus: String = "NONE", // NEW: NONE, ADMIRING, ADMIRED_BY, LOVERS
    val hasUnwatchedStories: Boolean = false // NEW
)

data class Short(
    // ... existing fields
    val isBookmarked: Boolean = false, // NEW
    // ... rest
)
```

#### B. Create Platform Share Manager

**Android Implementation:**
File: `composeApp/src/androidMain/kotlin/com/krieta/com/platform/ShareManager.android.kt`
```kotlin
package com.krieta.com.platform

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat.startActivity

actual class ShareManager(private val context: Context) {
    actual fun shareContent(title: String, url: String, text: String?) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TITLE, title)
            putExtra(Intent.EXTRA_TEXT, text ?: "$title\n$url")
        }
        context.startActivity(Intent.createChooser(intent, "Share via"))
    }
}
```

**iOS Implementation:**
File: `composeApp/src/iosMain/kotlin/com/krieta/com/platform/ShareManager.ios.kt`
```kotlin
package com.krieta.com.platform

import platform.UIKit.UIActivityViewController
import platform.UIKit.UIApplication
import platform.Foundation.NSURL

actual class ShareManager {
    actual fun shareContent(title: String, url: String, text: String?) {
        val items = listOfNotNull(
            text ?: title,
            NSURL.URLWithString(url)
        )
        
        val activityVC = UIActivityViewController(
            activityItems = items,
            applicationActivities = null
        )
        
        UIApplication.sharedApplication.keyWindow?.rootViewController?.presentViewController(
            activityVC,
            animated = true,
            completion = null
        )
    }
}
```

**Common Expect Declaration:**
File: `composeApp/src/commonMain/kotlin/com/krieta/com/platform/ShareManager.kt`
```kotlin
package com.krieta.com.platform

expect class ShareManager {
    fun shareContent(title: String, url: String, text: String? = null)
}
```

### 3. Frontend - Update Repositories

#### A. Add Bookmark Methods to ShortsRepository
```kotlin
interface ShortsRepository {
    // ... existing methods
    suspend fun toggleBookmark(shortId: String): NetworkResult<Boolean>
    suspend fun getBookmarks(cursor: String?): NetworkResult<BookmarksResult>
}

// In implementation:
override suspend fun toggleBookmark(shortId: String): NetworkResult<Boolean> = safeApiCall {
    api.toggleBookmark(shortId, "SHORT").bookmarked
}
```

#### B. Update ProfileRepository
Already has `admire()` method, just need to update UI to use relationship status.

### 4. Frontend - Update ViewModels

#### A. ShortsViewModel
Add bookmark toggle method:
```kotlin
fun toggleBookmark(shortId: String) {
    screenModelScope.launch {
        when (val result = shortsRepository.toggleBookmark(shortId)) {
            is NetworkResult.Success -> {
                val updatedItems = _state.value.items.map { short ->
                    if (short.id == shortId) {
                        short.copy(isBookmarked = result.data)
                    } else short
                }
                _state.value = _state.value.copy(items = updatedItems)
            }
            else -> {}
        }
    }
}
```

---

## 🎨 UI SPECIFICATIONS

### Profile Action Button States

#### Yellow Ring (Unwatched Stories)
```kotlin
if (creator.hasUnwatchedStories) {
    Box(
        modifier = Modifier.size(52.dp)
            .border(
                width = 2.dp,
                brush = Brush.linearGradient(
                    colors = listOf(Color(0xFFFFD700), Color(0xFFFFA500))
                ),
                shape = CircleShape
            )
    ) {
        AsyncImage(/* profile pic */)
    }
}
```

#### Grey Ring (Watched Stories)
```kotlin
if (creator.hasUnwatchedStories == false && hasStories) {
    Box(modifier = Modifier.size(52.dp).border(2.dp, Color.Gray, CircleShape))
}
```

#### Yellow Plus Button
```kotlin
Box(
    modifier = Modifier
        .size(20.dp)
        .clip(CircleShape)
        .background(Color(0xFFFFD700)) // YELLOW not red
        .clickable(onClick = onAdmireClick)
)
```

#### Hide Plus When Lovers
```kotlin
val relationshipStatus = short.creator.relationshipStatus

if (!isOwnContent && relationshipStatus != "LOVERS") {
    ProfileActionButton(
        avatarUrl = short.creator.avatarUrl,
        hasUnwatchedStories = short.creator.hasUnwatchedStories,
        onProfileClick = onProfileClick,
        onAdmireClick = onAdmire
    )
}
```

---

## 📝 API ENDPOINTS SUMMARY

### Bookmarks
- `POST /api/v1/bookmarks/toggle` - Body: `{ contentId, contentType }`
- `GET /api/v1/bookmarks?contentType=SHORT&cursor=abc`
- `GET /api/v1/bookmarks/check/:contentId/:contentType`

### Admire (Already Exists)
- `POST /api/v1/users/:id/admire` - Returns `{ admired: true, isLovers: boolean }`
- `DELETE /api/v1/users/:id/admire`

### Profile (Already Exists)
- `GET /api/v1/users/:id` - Returns profile with `relationshipStatus`

---

## 🧪 TESTING CHECKLIST

- [ ] Run database migration
- [ ] Register bookmark routes in API
- [ ] Test bookmark toggle endpoint
- [ ] Test get bookmarks endpoint
- [ ] Update Short model with isBookmarked field
- [ ] Update ShortCreator model with relationshipStatus and hasUnwatchedStories
- [ ] Implement ShareManager for Android
- [ ] Implement ShareManager for iOS
- [ ] Yellow plus button (not red) ✓
- [ ] Plus button hides when lovers
- [ ] Plus button navigates to profile in contests
- [ ] Story ring: yellow for unwatched, grey for watched
- [ ] Profile ring tap navigates to profile
- [ ] Bookmark icon toggles filled/outline
- [ ] Share opens platform share sheet
- [ ] Action panel positioned at bottom: 80dp from edge
- [ ] All buttons visible above nav bar

---

## 📐 POSITIONING

```
Column(
    modifier = Modifier
        .align(Alignment.BottomEnd)
        .windowInsetsPadding(WindowInsets.navigationBars)
        .padding(end = 12.dp, bottom = 80.dp), // 80dp prevents nav bar overlap
    verticalArrangement = Arrangement.spacedBy(16.dp)
)
```

---

## 🎯 KEY POINTS

1. **Yellow plus button**, not red (#FFD700)
2. **Hide plus when LOVERS** (mutual admiration)
3. **Story ring** on profile picture (yellow = unwatched, grey = watched)
4. **Contests:** Plus button navigates to profile (no admire)
5. **Bookmark** needs backend integration
6. **Share** needs platform-specific implementation
7. **Position:** 80dp from bottom edge to clear nav bar
