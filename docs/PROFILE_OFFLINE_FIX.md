# Profile Offline Error Fix

## Problem
When the internet connection is down, navigating to the Profile tab shows a misleading error message:
> "Unable to load profile. Your session may have expired. Please logout and login again."

This error message is incorrect because:
- The actual issue is **no internet connection**, not an expired session
- The error comes from the data mapper, not the network layer
- Cached profile data exists but isn't being used effectively

## Root Cause
1. **Network call fails** due to no internet → Returns `NetworkResult.Error` with IOException
2. **Mapper validation** throws misleading "session expired" error when it receives null data
3. **No offline fallback** → Cached data is ignored when network errors occur

## Solution Implemented

### 1. Fixed ProfileRepositoryImpl.kt
**Before:**
```kotlin
override suspend fun getMyProfile(): NetworkResult<UserProfile> =
    safeApiCall { api.getMyProfile().toDomain() }
```

**After:**
```kotlin
override suspend fun getMyProfile(): NetworkResult<UserProfile> {
    return when (val result = safeApiCall { api.getMyProfile() }) {
        is NetworkResult.Success -> {
            try {
                NetworkResult.Success(result.data.toDomain())
            } catch (e: Exception) {
                NetworkResult.Error(message = "Invalid profile data received from server")
            }
        }
        is NetworkResult.Error -> result
        is NetworkResult.Loading -> result
    }
}
```

**Changes:**
- Separated network call from data mapping
- Network errors are handled before attempting to map data
- Mapping errors are caught and converted to proper error messages
- Removed misleading "session expired" error from mapper

### 2. Improved Error Messages in NetworkResult.kt
**Changes:**
- `401` → "Your session has expired. Please log in again."
- `403` → "Access denied. You don't have permission to view this."
- `404` → "The requested resource was not found."
- `IOException` → "No internet connection. Please check your network."
- Generic errors → "Something went wrong. Please try again."

### 3. Enhanced ProfileViewModel.kt Offline Support
**Key improvements:**
```kotlin
private fun loadProfile() {
    // Don't show loading if we have cached data
    val hasCache = isOwnProfile && cachedOwnProfile != null
    _state.value = _state.value.copy(
        isLoading = !hasCache,
        profile = if (hasCache) cachedOwnProfile else _state.value.profile
    )
    
    // ... network call ...
    
    when (profileResult) {
        is NetworkResult.Error -> {
            // If we have cached data and it's a network error, keep showing cached data
            if (hasCache && profileResult.code == null) {
                _state.value = ProfileState(
                    profile = cachedOwnProfile,
                    isLoading = false,
                    error = null // Don't show error if we have cached data
                )
            } else {
                _state.value = ProfileState(
                    isLoading = false, 
                    error = profileResult.message
                )
            }
        }
    }
}
```

**Changes:**
- Show cached profile immediately while loading fresh data
- When network error occurs (code == null), keep showing cached profile
- Only show error screen if no cached data is available
- Distinguish between network errors (no code) and API errors (401, 403, etc.)

### 4. Updated ProfileScreen.kt
**Before:**
```kotlin
if (isLoading) { /* show loading */ }
else if (error != null) { /* show error */ }
else if (profile != null) { /* show profile */ }
```

**After:**
```kotlin
if (isLoading && profile == null) { /* show loading */ }
else if (error != null && profile == null) { /* show error */ }
else if (profile != null) { /* show profile */ }
```

**Changes:**
- Only show loading spinner if no profile data exists
- Only show error screen if no profile data exists
- If cached profile exists, show it even during loading or errors

## User Experience Improvements

### Before Fix:
1. User opens app with internet
2. Profile loads successfully
3. Internet disconnects
4. User switches to another tab and back to Profile
5. ❌ **Error: "Your session may have expired. Please logout and login again."**
6. User is confused and may unnecessarily log out

### After Fix:
1. User opens app with internet
2. Profile loads successfully and is cached
3. Internet disconnects
4. User switches to another tab and back to Profile
5. ✅ **Profile shows immediately from cache**
6. No error message shown (offline mode is transparent)
7. When internet returns, profile refreshes automatically

### Error Scenarios:

| Scenario | Before | After |
|----------|--------|-------|
| No internet + cached data | ❌ "Session expired" error | ✅ Shows cached profile |
| No internet + no cache | ❌ "Session expired" error | ✅ "No internet connection" error |
| 401 Unauthorized | ❌ "Session expired" error | ✅ "Your session has expired" error |
| 403 Forbidden | ❌ "Session expired" error | ✅ "Access denied" error |
| 404 Not Found | ❌ "Session expired" error | ✅ "Resource not found" error |
| 500 Server Error | ❌ Generic error | ✅ "Server error. Try again later" |

## Technical Benefits

1. **Offline-First Architecture**: App works without internet when cached data exists
2. **Better Error Handling**: Network layer handles errors before data mapping
3. **Accurate Error Messages**: Users see the real reason for failures
4. **Improved UX**: No unnecessary loading spinners or error screens
5. **Separation of Concerns**: Network errors ≠ Data validation errors

## Testing Checklist

- [x] Profile loads successfully with internet
- [x] Profile shows cached data when offline
- [x] Error message is accurate for network failures
- [x] Error message is accurate for 401 (session expired)
- [x] Tab switching doesn't cause unnecessary reloads
- [x] Retry button works correctly
- [x] Profile refreshes when internet returns

## Future Enhancements

Consider implementing:
1. **Persistent Storage**: Save profile to database (SQLDelight) for true offline support
2. **Network Status Indicator**: Show subtle "offline" badge when no internet
3. **Pull-to-Refresh**: Allow manual refresh with visual feedback
4. **Cache Expiration**: Invalidate cache after X hours
5. **Optimistic Updates**: Update UI immediately, sync with server later
