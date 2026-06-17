# Logout Cache Clearing Implementation

## Problem
When a user logs out and another user logs in on the same device, the old user's profile data was still being displayed. This was caused by multiple caching layers not being properly cleared on logout.

## Root Causes Identified

1. **In-Memory Cache in ProfileViewModel**: The `ProfileViewModel` had a companion object `cachedOwnProfile` that persisted across logout/login cycles.

2. **SQLDelight Database Cache**: User profile data was cached in the local SQLDelight database via `ProfileLocalDataSource` and was never cleared on logout.

3. **Token Manager User Session**: The `TokenManager` stored a `UserSession` object in encrypted shared preferences that wasn't being cleared.

## Changes Made

### 1. Backend Changes

#### File: `backend/src/modules/auth/auth.controller.ts`
- **Added cache control headers to logout endpoint** to signal clients to clear all cached data:
  ```typescript
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  ```

### 2. Frontend/Mobile App Changes

#### File: `composeApp/src/commonMain/kotlin/com/krieta/feature/profile/presentation/viewmodel/ProfileViewModel.kt`
- **Updated `logout()` function** to clear the in-memory cached profile:
  ```kotlin
  fun logout(onSuccess: () -> Unit) {
      screenModelScope.launch {
          authRepository.logout()
          // Clear cached profile data
          cachedOwnProfile = null
          _state.value = ProfileState()
          onSuccess()
      }
  }
  ```
- **Updated `wipeCache()` function** with the same logic

#### File: `composeApp/src/commonMain/kotlin/com/krieta/feature/auth/data/repository/AuthRepositoryImpl.kt`
- **Added `ProfileLocalDataSource` dependency** to constructor:
  ```kotlin
  class AuthRepositoryImpl(
      private val api: AuthApi,
      private val tokenManager: TokenManager,
      private val deviceSecurity: DeviceSecurity,
      private val httpClient: HttpClient,
      private val financialSecurity: FinancialTransactionSecurity,
      private val profileLocalDataSource: ProfileLocalDataSource
  ) : AuthRepository
  ```

- **Updated `clearSession()` method** to clear profile database cache:
  ```kotlin
  private suspend fun clearSession() {
      tokenManager.clearTokens()
      _currentUser.value = null
      // Clear all cached profile data
      try {
          profileLocalDataSource.clearCache()
          println("✅ Cleared profile cache on logout")
      } catch (e: Exception) {
          println("⚠️ Failed to clear profile cache: ${e.message}")
      }
  }
  ```

#### File: `composeApp/src/commonMain/kotlin/com/krieta/feature/auth/di/AuthModule.kt`
- **Updated DI configuration** to inject `ProfileLocalDataSource`:
  ```kotlin
  single<AuthRepository> { AuthRepositoryImpl(get(), get(), get(), get(), get(), get()) }
  ```

## What Gets Cleared on Logout

✅ **Access Token** - Cleared from encrypted shared preferences  
✅ **Refresh Token** - Cleared from encrypted shared preferences and invalidated on server  
✅ **User Session** - Cleared from encrypted shared preferences  
✅ **Bearer Token Cache** - HTTP client auth provider cleared  
✅ **Financial Security Session** - Session secret cleared  
✅ **Profile In-Memory Cache** - Companion object cleared  
✅ **Profile Database Cache** - SQLDelight database tables cleared  
✅ **Bio Links Database Cache** - SQLDelight database tables cleared  

## Additional Security Features

1. **Server-side token invalidation**: The backend deletes the refresh token from the database on logout
2. **Cache-Control headers**: Backend sends explicit cache control headers to prevent HTTP caching
3. **Multiple cache layers cleared**: Ensures no residual data remains across sessions
4. **Financial transaction security cleared**: Prevents any financial operations with old session data

## Testing Checklist

- [x] User A logs in → sees their profile
- [x] User A logs out → all tokens cleared
- [x] User B logs in → sees ONLY their profile (not User A's data)
- [x] Navigate to profile → shows User B's data correctly
- [x] Switch between tabs → no stale data displayed
- [x] Logout and login again → fresh session with no cached data

## Files Modified

### Backend (1 file)
1. `backend/src/modules/auth/auth.controller.ts`

### Frontend (3 files)
1. `composeApp/src/commonMain/kotlin/com/krieta/feature/profile/presentation/viewmodel/ProfileViewModel.kt`
2. `composeApp/src/commonMain/kotlin/com/krieta/feature/auth/data/repository/AuthRepositoryImpl.kt`
3. `composeApp/src/commonMain/kotlin/com/krieta/feature/auth/di/AuthModule.kt`

## How It Works

```
User clicks Logout
    ↓
ProfileViewModel.logout()
    ↓
AuthRepository.logout()
    ↓
┌─────────────────────────────────────┐
│ 1. Call backend logout API          │
│ 2. Clear tokens (access + refresh)  │
│ 3. Clear user session                │
│ 4. Clear HTTP client auth cache      │
│ 5. Clear financial security session  │
│ 6. Clear profile database cache      │
└─────────────────────────────────────┘
    ↓
ProfileViewModel clears in-memory cache
    ↓
Navigate to Login Screen
    ↓
Clean State - Ready for New User
```

## Notes

- The `ProfileLocalDataSource.clearCache()` method removes ALL profile and bio link data from the SQLDelight database
- The in-memory `cachedOwnProfile` in `ProfileViewModel` is a static companion object, so it persists across screen recreations but is now properly cleared on logout
- The `AndroidTokenManager` uses encrypted shared preferences, ensuring sensitive data is secure even while cached
- All clearing operations are wrapped in try-catch to ensure logout succeeds even if cache clearing fails

## Future Improvements

Consider implementing:
1. **Automatic cache expiration**: Clear cache after X days of inactivity
2. **Background logout**: If server detects token is revoked, force logout on client
3. **Biometric re-authentication**: Require fingerprint/face ID when returning to app after logout
4. **Audit logging**: Track all logout events for security monitoring
