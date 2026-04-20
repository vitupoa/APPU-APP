# Judge Search Implementation Summary

## Overview
Implemented real-time user search functionality for adding judges to contests with avatar display, username, and name. Users can search and add judges with a single click.

## Changes Made

### 1. CreateContestViewModel Updates

**File**: `CreateContestViewModel.kt`

#### Added to CreateContestState:
- `judgeSearchResults: List<SocialUser>` - Stores real-time search results
- `isSearchingJudges: Boolean` - Loading state for search operation

#### Updated Judge Data Class:
```kotlin
data class Judge(
    val userId: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null  // NEW: Avatar support
)
```

#### Added ProfileRepository Dependency:
```kotlin
class CreateContestViewModel(
    private val repository: ContestsRepository,
    private val cloudinaryUploader: CloudinaryUploader,
    private val currencyProvider: UserCurrencyProvider,
    private val profileRepository: ProfileRepository  // NEW
) : ScreenModel
```

#### New Functions:
1. **`updateJudgeSearchQuery(query: String)`**
   - Triggers real-time search when query length >= 2 characters
   - Clears results when query is too short

2. **`searchJudges(query: String)`** (private)
   - Performs async user search via ProfileRepository
   - Filters out users already added as judges
   - Updates state with search results or empty list on error

3. **`addJudgeFromSearchResult(user: SocialUser)`**
   - Converts SocialUser to Judge with avatar
   - Adds to judges list
   - Clears search query and results after adding

#### Updated Functions:
- **`addJudge(judge: Judge)`**
  - Now clears search query and results after adding
  - Prevents duplicate additions

### 2. Step5ReviewAndJudges Component Updates

**File**: `Step5ReviewAndJudges.kt`

#### Added Imports:
```kotlin
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.material.icons.filled.CheckCircle
import coil3.compose.AsyncImage
```

#### Updated JudgeSearchField Component:
- **Real-time search results display**
  - Shows up to 5 search results
  - Displays loading indicator during search
  - Shows "No users found" message when no results
  - Only shows results when query length >= 2 characters

- **Search result items include**:
  - User avatar (AsyncImage or initial letter fallback)
  - Display name with verified badge if applicable
  - Username (@username)
  - Add button (+) to add as judge

#### New Component: UserSearchResultItem
```kotlin
@Composable
private fun UserSearchResultItem(
    user: SocialUser,
    onAddClick: () -> Unit
)
```

**Features**:
- 40dp circular avatar with fallback to initial letter
- Display name with verified badge (blue checkmark)
- Username in gray color
- Add button with yellow accent color
- Responsive layout with proper spacing

#### Updated JudgeListItem Component:
- **Added avatar display**:
  - Shows user avatar if available
  - Falls back to initial letter in circular background
  - 40dp size matching search results
  - Proper spacing and alignment

### 3. Dependency Injection Updates

**File**: `ContestsModule.kt`

#### Updated Factory:
```kotlin
factory { 
    CreateContestViewModel(get(), get(), get(), get())  // Added 4th parameter for ProfileRepository
}
```

## Features Implemented

### ✅ Real-Time User Search
- Search triggers automatically when user types (minimum 2 characters)
- Debounced search to avoid excessive API calls
- Loading indicator shows during search
- Results update in real-time as user types

### ✅ Search Results Display
- Shows up to 5 matching users
- Each result includes:
  - User avatar (or initial letter fallback)
  - Display name
  - Username (@username)
  - Verified badge (if applicable)
  - Add button (+)

### ✅ Smart Filtering
- Automatically filters out users already added as judges
- Prevents duplicate judge additions
- Clears search after successful addition

### ✅ Avatar Support
- Displays user avatars in search results
- Displays user avatars in judges list
- Fallback to initial letter in colored circle
- Consistent 40dp size across all displays

### ✅ User Experience
- Clear visual feedback during search
- "No users found" message when no results
- Search field disabled when 15 judges limit reached
- Smooth add/remove operations
- Automatic search clearing after adding judge

## Design System Compliance

All components follow the Krieta design system:
- **Yellow Accent (#F5A623)**: Add buttons, verified badges, loading indicators
- **Dark Background (#0A0A0F)**: Main container
- **Dark Surface (#1A1A1F)**: Cards, search results
- **Gray (#3A3A3F)**: Inactive states, borders, avatar fallback
- **Blue (#0A84FF)**: Verified badge
- **12dp rounded corners**: Cards and input fields
- **Proper spacing**: 8dp, 12dp, 16dp as per design system

## API Integration

### ProfileRepository.searchUsers(query: String)
- **Endpoint**: `/api/v1/wallet/search-users`
- **Method**: GET
- **Parameters**: `query` (string)
- **Returns**: `NetworkResult<List<SocialUser>>`

### SocialUser Model
```kotlin
data class SocialUser(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean,
    val isLovers: Boolean
)
```

## Next Steps (Not Implemented Yet)

### Judge Invite System
The following features are mentioned in the requirements but not yet implemented:

1. **Judge Invite Notifications**
   - Backend endpoint to send judge invitations
   - Notification system for invited judges
   - Accept/Decline functionality

2. **Judge Dashboard Access Control**
   - Invitation acceptance flow
   - Access control for judge dashboard
   - Contest-specific judge permissions

3. **Backend API Endpoints Needed**:
   ```
   POST /api/v1/contests/:contestId/judges/invite
   POST /api/v1/contests/:contestId/judges/accept
   POST /api/v1/contests/:contestId/judges/decline
   GET /api/v1/contests/judge/invitations
   ```

### Existing Judge Dashboard
The `ContestJudgeDashboardScreen` already exists and shows:
- List of contests assigned to the judge
- Contest analytics
- Submission review interface
- 72-hour review deadline warnings

**Note**: The invite/accept flow needs to be implemented to grant judges access to this dashboard.

## Testing Recommendations

1. **Search Functionality**
   - Test with various query lengths (1, 2, 3+ characters)
   - Test with special characters and spaces
   - Test with no results
   - Test with slow network (loading state)

2. **Add/Remove Judges**
   - Test adding judges from search results
   - Test removing judges from list
   - Test 15-judge limit enforcement
   - Test duplicate prevention

3. **Avatar Display**
   - Test with users who have avatars
   - Test with users without avatars (fallback)
   - Test avatar loading states
   - Test on different screen sizes

4. **Edge Cases**
   - Test with network errors
   - Test with empty search results
   - Test rapid typing (debouncing)
   - Test clearing search after adding

## Files Modified

1. `CreateContestViewModel.kt` - Added search functionality and ProfileRepository integration
2. `Step5ReviewAndJudges.kt` - Updated UI with real-time search and avatar display
3. `ContestsModule.kt` - Updated DI configuration

## Files Created

1. `JUDGE_SEARCH_IMPLEMENTATION.md` - This documentation file
