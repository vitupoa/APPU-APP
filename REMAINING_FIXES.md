# Remaining Compilation Fixes

## Status
✅ Fixed:
1. Kermit dependency added to build.gradle.kts
2. SafeConversion.kt - Kermit logger restored
3. FeedApi.kt - Serialization error fixed
4. MarketplaceModels.kt - OAuth DTOs added
5. ChamaDtos.kt - Missing DTOs added
6. ContributeViewModel.kt - When expressions fixed

## Remaining Fixes Needed

### 1. PayoutViewModel.kt
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/chama/presentation/payout/PayoutViewModel.kt`

**Changes needed**:
```kotlin
// Line 54: Change from
reason = reason

// To:
recipientUserId = recipientUserId,
amountRc = amountKr

// Add Loading branch to when expressions at lines 57, 84
is NetworkResult.Loading -> {}
```

### 2. DefaultersViewModel.kt
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/chama/presentation/defaulters/DefaultersViewModel.kt`

**Changes needed**:
```kotlin
// Add Loading branch to when expressions at lines 35, 56, 75
is NetworkResult.Loading -> {}

// Line 38: Change from
defaulters = result.data.defaulters

// To:
defaulters = result.data
```

### 3. SettingsViewModel.kt
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/chama/presentation/settings/SettingsViewModel.kt`

**Changes needed**:
```kotlin
// Add Loading branch to when expressions at lines 38, 77, 99, 121
is NetworkResult.Loading -> {}

// Line 41: Change from
chama = result.data.chama

// To:
chama = result.data

// Line 70: Change parameter name from
contributionAmountRc = contributionAmountKr

// To:
contributionAmountRc = newAmount
```

### 4. WithdrawViewModel.kt
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/wallet/presentation/withdraw/WithdrawViewModel.kt`

**Changes needed**:
```kotlin
// Add Loading branch to when expressions at lines 60, 187
is NetworkResult.Loading -> {}
```

### 5. OAuthViewModel.kt
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/marketplace/presentation/oauth/OAuthViewModel.kt`

**Changes needed**:
```kotlin
// Add Loading branch to when expressions at lines 47, 78, 110, 127
is NetworkResult.Loading -> {}

// Line 50: Change from
accounts = result.data.accounts

// To:
accounts = result.data

// Line 52-58: Change from
it.tiktok, it.instagram, etc.

// To:
accounts.find { it.platform == "tiktok" }?.isConnected ?: false
accounts.find { it.platform == "instagram" }?.isConnected ?: false
// etc for each platform

// Line 80: Change from
authUrl = result.data.authUrl

// To:
authUrl = result.data
```

### 6. Material Icons - Add imports to all affected files

Add these imports to files with icon errors:
```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape
```

**Files needing icon imports**:
- ChamaListScreen.kt
- CreateChamaScreen.kt
- DefaultersListScreen.kt
- JudgeInvitationsScreen.kt
- SubmitContestScreen.kt
- Step1DetailsAndDates.kt
- Step5ReviewAndJudges.kt
- CommentsScreen.kt
- ShortsScreen.kt
- MilestonesScreen.kt
- SocialMediaManagementScreen.kt
- CreateListingScreen.kt

### 7. Missing foundationStroke imports

Add to files with foundationStroke errors:
```kotlin
import androidx.compose.foundation.BorderStroke
```

**Files**:
- CreateChamaScreen.kt
- Step3TasksAndConnectors.kt
- Step4PrizesAndValidation.kt
- Step5ReviewAndJudges.kt
- JudgeInvitationsScreen.kt
- ProfileScreen.kt
- TopupScreen.kt
- WithdrawScreen.kt

### 8. DefaultersListScreen.kt specific fixes

**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/chama/presentation/defaulters/DefaultersListScreen.kt`

**Changes**:
```kotlin
// Line 29: Add import
import cafe.adriel.voyager.koin.koinScreenModel

// Line 32-33: Change from
error?.let { ... }

// To:
when (val currentState = state) {
    is DefaultersState.Loading -> { /* loading */ }
    is DefaultersState.Error -> { /* error */ }
    is DefaultersState.Success -> { /* success */ }
}

// Line 50: Change icon from
ic_refresh

// To:
Icons.Default.Refresh

// Line 59: Change from
isLoading

// To:
state is DefaultersState.Loading

// Line 106, 134: Change from
defaulters

// To:
currentState.defaulters

// Line 136: Change from
defaulters.forEachIndexed { index, defaulter ->

// To:
currentState.defaulters.forEachIndexed { index, defaulter ->

// Line 176: Change from
defaulter.userName

// To:
defaulter.user?.username ?: "Unknown"

// Line 188: Change from
defaulter.amountOwedKr

// To:
defaulter.amountOwedKr.toDoubleOrNull() ?: 0.0
```

### 9. AndroidOAuthBrowser.kt

**File**: `composeApp/src/androidMain/kotlin/com/runinga/com/core/oauth/AndroidOAuthBrowser.kt`

**Add import**:
```kotlin
import androidx.browser.customtabs.CustomTabsIntent
```

### 10. UploadWorker.kt

**File**: `composeApp/src/androidMain/kotlin/com/runinga/com/core/upload/UploadWorker.kt`

**Line 60**: Cast to String:
```kotlin
val url = inputData.getString("url") ?: return Result.failure()
```

### 11. Tabs.kt

**File**: `composeApp/src/commonMain/kotlin/com/runinga/com/core/navigation/Tabs.kt`

**Lines 664, 670**: Change from
```kotlin
SecondaryContainer
OnSecondaryContainer
```

**To**:
```kotlin
secondaryContainer
onSecondaryContainer
```

### 12. ImmersivePlayerNew.kt

**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/feed/presentation/components/ImmersivePlayerNew.kt`

**Add imports**:
```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
```

### 13. LiveSocketManager.kt

**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/data/socket/LiveSocketManager.kt`

**Line 113**: Wrap in coroutine:
```kotlin
scope.launch {
    incoming.collect { frame ->
        handleFrame(frame)
    }
}
```

### 14. ViewerLiveScreen.kt

**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/presentation/screen/ViewerLiveScreen.kt`

**Line 229**: Add missing parameters:
```kotlin
sendGift(giftType = selectedGift, message = "")
```

### 15. HostLiveScreen.kt

**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/presentation/screen/HostLiveScreen.kt`

**Lines 160, 163, 166, 169**: Change Painter to ImageVector or use painterResource

### 16. ShortsScreen.kt

**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/shorts/presentation/screen/ShortsScreen.kt`

**Line 300**: Remove VideoProgressBar or add implementation
**Line 396**: Change Border to BorderStroke

### 17. ConnectSocialAccountsScreen.kt

**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/marketplace/presentation/oauth/ConnectSocialAccountsScreen.kt`

**Lines 33-37**: Fix state handling:
```kotlin
val authUrl by viewModel.authUrl.collectAsState()

LaunchedEffect(authUrl) {
    authUrl?.let { url ->
        // Handle OAuth
        viewModel.clearAuthUrl()
    }
}
```

**Lines 108, 121, 134**: Change icons from ic_tiktok, ic_instagram, ic_youtube to proper icons

## Quick Fix Script

Run this Gradle sync after making changes:
```bash
./gradlew clean
./gradlew :composeApp:compileDebugKotlinAndroid
```

## Priority Order

1. **High Priority** (Blocking compilation):
   - Material Icons imports
   - When expression exhaustiveness
   - Missing DTOs (already fixed)

2. **Medium Priority** (Type mismatches):
   - ViewModel property access
   - Parameter name fixes
   - Cast operations

3. **Low Priority** (Minor issues):
   - Icon resource names
   - Painter vs ImageVector

## Estimated Time

- High Priority: 30 minutes
- Medium Priority: 20 minutes
- Low Priority: 10 minutes
- **Total**: ~1 hour

All fixes are straightforward and follow the patterns shown above.
