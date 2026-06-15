# Double Navigation Bar & Profile Tab Crash Fix

## Issues Fixed

### 1. Profile Tab Crash
**Error:** `Key com.krieta.com.core.navigation.ProfileTab:currentTab was used multiple times`

**Root Cause:** 
- ProfileTab was creating a nested Navigator with key "ProfileTabNavigator"
- This caused duplicate SaveableStateProvider keys when navigating to ProfileScreen
- Compose tracks state per screen key, and nested navigators created conflicting keys

**Solution:**
- Removed nested Navigator from ProfileTab
- ProfileTab now directly calls `ProfileScreen(userId = null).Content()`
- This prevents duplicate state keys and allows proper navigation

**File Changed:** `composeApp/src/commonMain/kotlin/com/krieta/com/core/navigation/Tabs.kt`

### 2. Double Bottom Navigation Bars
**Root Cause:**
- Same as above - nested Navigator in ProfileTab created a second navigation context
- Each Navigator can have its own Scaffold with bottom bar

**Solution:**
- Same fix - removing nested Navigator eliminates the double bottom bar issue

### 3. NumberFormatException Crash on Chama Creation
**Error:** `java.lang.NumberFormatException: empty String` at line 217 in CreateChamaViewModel

**Root Cause:**
- Code attempted to parse empty strings to Double using `toDoubleOrNull()` incorrectly
- The chain `s.contributionAmountKr.toDoubleOrNull()` would succeed returning null, but then the fallback logic still tried to parse empty strings

**Solution:**
- Added `takeIf { it.isNotBlank() }` before all string-to-number conversions
- This ensures empty strings are filtered out before parsing attempts
- Updated membershipFeeKr and penaltyAmountKr to use simpler null-safe parsing

**File Changed:** `composeApp/src/commonMain/kotlin/com/krieta/feature/chama/presentation/wizard/CreateChamaViewModel.kt`

## Code Changes

### Tabs.kt (ProfileTab)
```kotlin
// BEFORE
Navigator(
    screen = ProfileScreen(userId = null),
    key = "ProfileTabNavigator"
) {
    CurrentScreen()
}

// AFTER
ProfileScreen(userId = null).Content()
```

### CreateChamaViewModel.kt
```kotlin
// BEFORE
contributionAmountKr = s.contributionAmountKr.toDoubleOrNull() 
    ?: s.contributionAmountFiat.toDoubleOrNull()?.let { ... } 
    ?: 0.0

// AFTER
contributionAmountKr = s.contributionAmountKr.takeIf { it.isNotBlank() }?.toDoubleOrNull() 
    ?: s.contributionAmountFiat.takeIf { it.isNotBlank() }?.toDoubleOrNull()?.let { ... } 
    ?: 0.0
```

## Testing
- Sign up/sign in should no longer show double bottom navigation bars
- Tapping Profile tab should no longer crash the app
- Creating a Chama with empty optional fields should no longer crash
