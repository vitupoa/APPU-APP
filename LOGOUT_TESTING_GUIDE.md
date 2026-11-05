# Logout Testing Guide

## Quick Test Steps

### Test 1: Basic Logout & Login with Different Users

1. **Login as User A (admin@runinga.com)**
   - Navigate to Profile
   - Verify you see admin user details
   - Note the username, email, and Rc balance

2. **Logout User A**
   - Tap the 3-dot menu on profile
   - Select "Log Out"
   - Verify you're taken to Login screen

3. **Login as User B (different user)**
   - Enter different credentials
   - Navigate to Profile
   - **VERIFY**: You should see User B's profile, NOT User A's

### Test 2: Profile Data Persistence Check

1. Login as User A
2. Navigate to Profile → Edit Profile
3. View wallet balance
4. Logout
5. Login as User B
6. Navigate to Profile
7. **VERIFY**: 
   - Profile shows User B's name
   - Wallet shows User B's balance
   - Bio shows User B's bio
   - Avatar shows User B's image

### Test 3: Cache Wipe Feature

1. Login as any user
2. Navigate to Profile
3. Tap 3-dot menu → "Wipe Local Cache"
4. **VERIFY**: 
   - App clears all data
   - You're taken to Login screen
   - No previous user data visible

### Test 4: Tab Switching After Re-login

1. Login as User A
2. Navigate between tabs (Feed, Profile, Wallet)
3. Logout
4. Login as User B
5. Navigate between tabs
6. **VERIFY**: All tabs show User B's data correctly

### Test 5: Offline to Online Transition

1. Login as User A
2. Turn on Airplane mode
3. Navigate to Profile (should show cached data)
4. Logout (should work even offline)
5. Turn off Airplane mode
6. Login as User B
7. **VERIFY**: No User A data visible

## Expected Behavior

✅ **Correct Behavior**:
- After logout, ALL previous user data disappears
- New user sees ONLY their own data
- Profile, wallet, and all features show correct user info
- No mixing of data between users

❌ **Bug Indicators**:
- Old user's name/avatar still visible after new login
- Wrong wallet balance displayed
- "Unknown User" or error messages
- Stale bio or profile information
- Mixed data from different users

## Debug Commands

Check if cache is properly cleared by looking at logs:

### Expected Logout Log Messages:
```
🔍 ProfileViewModel: Loading own profile
✅ Cleared profile cache on logout
💾 ProfileViewModel: Cached own profile in memory - [NEW_USER_NAME]
```

### Bad Log Messages (indicates bug):
```
⚠️ Failed to clear profile cache
❌ ProfileViewModel: Not authenticated!
```

## What to Look For

1. **Profile Screen**: Display name, username, avatar should match logged-in user
2. **Wallet Screen**: Rc balance should match logged-in user
3. **Edit Profile**: All fields pre-filled with correct user data
4. **Bio Links**: Should show correct user's links
5. **Stats**: Admirers/Admiring counts should be for current user

## Test Users

### Admin User (from script)
- Email: admin@runinga.com
- Username: supaadmin
- Password: RembrandtRAR2026!
- Wallet: 1,000,000 Rc

### Other Test User (if available)
- Use any other registered user
- Different from admin to see clear distinction

## Reporting Issues

If you find data persisting after logout, report:
1. Which user you logged in as first
2. Which user you logged in as second
3. What data is incorrectly showing
4. Screenshots of the incorrect data
5. Device model and OS version
