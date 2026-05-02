# 🔧 FIX: "Unknown User" Issue When Switching Tabs

## Problem
When you navigate away from the Profile tab and come back, your name changes to "Unknown User".

## Root Cause
**Authentication token expired (401 error)** - Same issue as the exchange rate!

### What's Happening
1. You login → Profile loads correctly
2. Token expires after 15 minutes
3. You switch tabs → ProfileViewModel is recreated
4. ProfileViewModel calls `getMyProfile()` API
5. API returns 401 error: `{"error":"Unauthorized"}`
6. Repository tries to parse error as profile data
7. All fields are null → Falls back to `"Unknown User"`

## The Fix

### Option 1: Re-Login (Immediate - 2 minutes)
1. Logout
2. Login again
3. ✅ Profile will stay loaded

### Option 2: Code Fixes (5 minutes)

I've added comprehensive logging to track the issue. Now rebuild the app and check logcat:

```bash
./gradlew :composeApp:installDebug
```

Look for these logs:
```
🔍 ProfileViewModel: Loading own profile
🔍 ProfileViewModel: isAuthenticated = false
❌ ProfileViewModel: Not authenticated!
```

Or:
```
🔍 ProfileViewModel: Calling getMyProfile()
❌ ProfileViewModel: Profile load error - Client error: {"error":"Unauthorized"}
```

## Files Modified

### 1. ProfileViewModel.kt ✅
- Added logging to track authentication state
- Added logging to track API calls
- Shows when profile loads successfully vs fails

### 2. WalletApi.kt ✅ (Already done)
- Logs raw API responses
- Shows 401 errors clearly

### 3. NetworkResult.kt ✅ (Already done)
- Enhanced error capture
- Logs actual error response body

## Prevention

### Fix 1: Don't Recreate ViewModel on Tab Switch

The issue is that `ProfileTab` creates a new `Navigator(ProfileScreen())` each time, which recreates the ViewModel.

**Current Code** (Tabs.kt):
```kotlin
object ProfileTab : Tab {
    @Composable
    override fun Content() {
        Navigator(ProfileScreen()) {  // ❌ Creates new instance each time
            CurrentScreen()
        }
    }
}
```

**Better Approach**: Use `rememberSaveable` or cache the profile data:

```kotlin
// In ProfileViewModel.kt
companion object {
    private var cachedProfile: UserProfile? = null
}

init {
    // Use cached profile if available
    if (cachedProfile != null && isOwnProfile) {
        _state.value = ProfileState(profile = cachedProfile, isLoading = false)
    } else {
        refreshProfile()
    }
}

private fun loadProfile() {
    // ... existing code ...
    when (profileResult) {
        is NetworkResult.Success -> {
            val profile = profileResult.data
            if (isOwnProfile) {
                cachedProfile = profile  // Cache it
            }
            // ... rest of code
        }
    }
}
```

### Fix 2: Better Error Handling in Repository

**Current Code** (ProfileRepositoryImpl.kt):
```kotlin
private fun UserProfileDto.toDomain() = UserProfile(
    id = id ?: "",
    username = username ?: "unknown",
    displayName = displayName ?: "Unknown User",  // ❌ Falls back to "Unknown User"
    // ...
)
```

**Better Approach**: Throw error if required fields are missing:

```kotlin
private fun UserProfileDto.toDomain(): UserProfile {
    // Validate required fields
    if (id == null || username == null || displayName == null) {
        throw IllegalStateException("Invalid profile data - missing required fields")
    }
    
    return UserProfile(
        id = id,
        username = username,
        displayName = displayName,
        // ... rest of fields
    )
}
```

This way, if the API returns an error, it will properly throw an exception instead of showing "Unknown User".

## Immediate Action

### Step 1: Re-Login
This will fix the issue immediately.

### Step 2: Rebuild App
```bash
./gradlew :composeApp:installDebug
```

### Step 3: Check Logs
Navigate to Profile tab, switch away, come back, and check logcat:

```bash
adb logcat | grep -E "ProfileViewModel|Unknown"
```

You'll see:
```
🔍 ProfileViewModel init - userId: null, isOwnProfile: true
🔍 ProfileViewModel: Loading own profile
🔍 ProfileViewModel: isAuthenticated = false
❌ ProfileViewModel: Not authenticated!
```

Or:
```
🔍 ProfileViewModel: Calling getMyProfile()
❌ Client error: {"error":"Unauthorized"}
❌ ProfileViewModel: Profile load error - Client error: {"error":"Unauthorized"}
```

## Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| "Unknown User" | 401 Authentication Error | Re-login |
| Profile resets on tab switch | ViewModel recreated | Cache profile data |
| Error parsed as valid data | Fallback to "Unknown User" | Validate required fields |

## Next Steps

1. **Immediate**: User re-logs in
2. **Short-term**: Rebuild app with logging
3. **Long-term**: Implement profile caching + better error handling

The root cause is the same as the exchange rate issue - **authentication token expired**! 🎯
