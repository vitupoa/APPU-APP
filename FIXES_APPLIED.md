# Build Fixes Applied

## Summary
Fixed critical compilation errors in the Kotlin Multiplatform project.

## Files Fixed

### 1. ChatMediaUploadService.kt
- Changed `data class Validating` to `data object Validating` (sealed class member must be object if no parameters)
- Replaced `.body()` calls with explicit JSON deserialization using `bodyAsText()`
- Removed `onUpload` callback (not supported in current Ktor version)

### 2. CommentsRepositoryImpl.kt
- Added null safety operators (`?: false`, `?: 0`) for Boolean nullable types in CommentDto.toDomain()
- Fixed type mismatches for: isLiked, isPinned, isEdited, canDelete, canEdit, canPin, canReply
- Added null safety for CommentSettings fields

### 3. CampaignScreens.kt
- Fixed Duration type mismatch in Instant.plus() method
- Changed from `now.plus(30, DateTimeUnit.DAY, TimeZone.UTC)` to `now.plus(Duration.parse("P30D"))`

### 4. CreateCampaignScreen.kt
- Fixed collectAsState() delegation issue
- Changed from `by currencyProvider.exchangeRate.collectAsState()` to `.collectAsState().value`

### 5. WithdrawalRateLimiter.kt
- Fixed Duration type inference issues
- Added fully qualified `kotlin.time.Duration.parse()` calls
- Fixed Duration construction in multiple locations

### 6. CreateListingScreen.kt
- Added `@OptIn(ExperimentalMaterial3Api::class)` annotations for all ExposedDropdownMenuBox usages
- Suppressed experimental API warnings

### 7. AdminAdManagementScreen.kt
- Replaced `String.format()` with `formatString()` utility function
- Added import for formatString utility
- Fixed 2 occurrences of format calls

### 8. CreateChamaScreen.kt
- Replaced `String.format()` with `formatString()` utility function
- Fixed 1 occurrence

### 9. CreateChamaViewModel.kt
- Replaced `String.format()` with `formatString()` utility function
- Fixed 4 occurrences in currency conversion methods

### 10. ChamaDashboardViewModel.kt
- Replaced deprecated `String(ByteArray)` constructor with `ByteArray.decodeToString()`
- Fixed JWT token decoding

## Platform-Specific Issues Not Fixed
The following iOS-specific issues remain and require platform-specific implementations:

- IosBiometricAuthenticator.kt: Needs @OptIn for ExperimentalForeignApi
- IosFallbackAuthenticator.kt: Needs @OptIn for ExperimentalForeignApi
- IosSecureKeyStorage.kt: NSData type mismatches
- IosTokenManager.kt: Missing getAdminRole() implementation
- VideoPlayer.ios.kt: CPointed.readValue() signature issues
- FileStreamer.ios.kt: Unresolved NSFileHandle methods
- ImageCropper.ios.kt: Missing expect declaration
- Platform.ios.kt: Unresolved timeIntervalSince1970
- StringFormat.ios.kt: NSString.create() overload ambiguity
- DeviceSecurityChecker.ios.kt: C preprocessor directives not supported
- MediaPicker.ios.kt: UIImage type mismatches

## Notes
- All `System.currentTimeMillis()` references already use the expect/actual pattern via `currentTimeMillis()` utility
- All `String.format()` calls now use the platform-specific `formatString()` utility
- iOS-specific errors require Xcode and iOS SDK to properly fix
- Android build should now compile with fewer errors
