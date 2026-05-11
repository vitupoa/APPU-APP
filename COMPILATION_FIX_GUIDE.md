# Krieta Android Build Fixes

## Critical Issues Summary

Your build is failing due to:
1. **Missing CameraX dependencies** (200+ errors)
2. **Missing WebRTC dependencies** (100+ errors)  
3. **SQLDelight Boolean type issues** (13 errors)
4. **Missing expect/actual declarations** (Fixed ✓)
5. **Database schema mismatches** (50+ errors)

## ✅ Already Fixed

1. Created `HmacSha256.kt` expect declaration
2. Created `SecureConfig.kt` expect declaration
3. Fixed `WithdrawalSecurity.kt` syntax error
4. Added missing methods to `AndroidSecureKeyStorage`

## 🔧 Required Fixes

### 1. Add CameraX Dependencies

Add to `composeApp/build.gradle.kts` in `androidMain.dependencies`:

```kotlin
// CameraX
implementation("androidx.camera:camera-core:1.4.1")
implementation("androidx.camera:camera-camera2:1.4.1")
implementation("androidx.camera:camera-lifecycle:1.4.1")
implementation("androidx.camera:camera-video:1.4.1")
implementation("androidx.camera:camera-view:1.4.1")
```

### 2. Add WebRTC Dependency

```kotlin
// WebRTC
implementation("io.getstream:stream-webrtc-android:1.1.5")
```

### 3. Fix SQLDelight Boolean Issues

The generated code has `Boolean` type issues. Update your `.sq` files to use `INTEGER` instead of `BOOLEAN`:

```sql
-- Change from:
is_locked BOOLEAN NOT NULL DEFAULT 0

-- To:
is_locked INTEGER AS Boolean NOT NULL DEFAULT 0
```

### 4. Create Missing LiveType Enum

Create `composeApp/src/commonMain/kotlin/com/krieta/feature/live/domain/model/LiveType.kt`:

```kotlin
package com.krieta.feature.live.domain.model

enum class LiveType {
    STANDARD,
    SHOPPING,
    CONTEST,
    COLLABORATION
}
```

### 5. Fix Product Model Mismatch

The database schema doesn't match your domain model. Either:

**Option A:** Update domain model to match database
**Option B:** Update database schema to match domain model

Current mismatches:
- `price` vs `priceKr`
- `images` vs `imageUrls`
- `stockQuantity`, `isAvailable`, `viewsCount`, `likesCount`, `isLiked`, `updatedAt` missing

### 6. Fix Short Model Mismatch

Similar issues with Short model:
- `author` vs `creator`
- `duration`, `aspectRatio`, `sharesCount`, `viewsCount`, `isBookmarked` type mismatches

### 7. Remove/Comment Out Live Streaming Features

Since CameraX and WebRTC are complex dependencies, consider temporarily disabling:

```kotlin
// Comment out in navigation:
// - CameraManager.kt
// - WebRTCManager.kt  
// - CameraPreview.android.kt
// - StartLiveScreen.kt (LiveType references)
```

## 🚀 Quick Fix Script

Run this PowerShell script to apply minimal fixes:

```powershell
# 1. Add dependencies
$buildFile = "composeApp\build.gradle.kts"
$content = Get-Content $buildFile -Raw

$cameraXDeps = @"

            // CameraX
            implementation("androidx.camera:camera-core:1.4.1")
            implementation("androidx.camera:camera-camera2:1.4.1")
            implementation("androidx.camera:camera-lifecycle:1.4.1")
            implementation("androidx.camera:camera-video:1.4.1")
            implementation("androidx.camera:camera-view:1.4.1")
            
            // WebRTC
            implementation("io.getstream:stream-webrtc-android:1.1.5")
"@

$content = $content -replace '(// Coroutines Android\s+implementation\(libs\.kotlinx\.coroutines\.android\))', "`$1$cameraXDeps"
Set-Content $buildFile $content

Write-Host "✓ Dependencies added"

# 2. Create LiveType enum
$liveTypeDir = "composeApp\src\commonMain\kotlin\com\krieta\feature\live\domain\model"
New-Item -ItemType Directory -Force -Path $liveTypeDir | Out-Null

$liveTypeContent = @"
package com.krieta.feature.live.domain.model

enum class LiveType {
    STANDARD,
    SHOPPING,
    CONTEST,
    COLLABORATION
}
"@

Set-Content "$liveTypeDir\LiveType.kt" $liveTypeContent
Write-Host "✓ LiveType enum created"

# 3. Sync Gradle
Write-Host "`nRun: .\gradlew.bat :composeApp:assembleDebug"
```

## 📋 Step-by-Step Manual Fix

### Step 1: Update build.gradle.kts

Open `composeApp/build.gradle.kts` and add the CameraX and WebRTC dependencies shown above.

### Step 2: Create LiveType.kt

Create the file with the enum as shown above.

### Step 3: Fix SQLDelight Schema

Find all `.sq` files in `composeApp/src/commonMain/sqldelight/` and replace `BOOLEAN` with `INTEGER AS Boolean`.

### Step 4: Rebuild

```bash
.\gradlew.bat clean
.\gradlew.bat :composeApp:assembleDebug
```

## 🎯 Priority Order

1. **HIGH**: Add CameraX dependencies (fixes 200+ errors)
2. **HIGH**: Add WebRTC dependency (fixes 100+ errors)
3. **MEDIUM**: Create LiveType enum (fixes 4 errors)
4. **MEDIUM**: Fix SQLDelight Boolean types (fixes 13 errors)
5. **LOW**: Fix Product/Short model mismatches (fixes 50+ errors)

## ⚠️ Alternative: Disable Live Streaming

If you don't need live streaming immediately:

1. Comment out live streaming routes in navigation
2. Remove CameraManager and WebRTCManager from DI
3. Skip CameraX/WebRTC dependencies

This will reduce errors by ~300 and let you build the app.

## 📞 Next Steps

After applying fixes:
1. Run `.\gradlew.bat clean`
2. Run `.\gradlew.bat :composeApp:assembleDebug`
3. If errors persist, share the new error log

The expect/actual declarations are now fixed. Focus on adding the missing dependencies first.
