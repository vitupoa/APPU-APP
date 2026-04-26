# Material Icons Extended Migration Guide

## Overview
This guide helps migrate from deprecated `compose.materialIconsExtended` to Material Symbols using vector resources.

## Why Migrate?
- **Size Reduction**: Material Icons Extended adds ~8-12MB to APK
- **Deprecated**: The library is deprecated and pinned to version 1.7.3
- **Flexibility**: Vector resources are more flexible and future-proof

## Migration Strategy

### Before (Material Icons Extended)
```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.Settings

Icon(
    imageVector = Icons.Filled.Home,
    contentDescription = "Home"
)
```

### After (Material Symbols - Vector Resources)
```kotlin
import org.jetbrains.compose.resources.vectorResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.ic_home

Icon(
    painter = painterResource(Res.drawable.ic_home),
    contentDescription = "Home"
)
```

## Step-by-Step Migration

### 1. Download Required Icons
Download SVG icons from [Material Symbols](https://fonts.google.com/icons) and place them in:
```
composeApp/src/commonMain/composeResources/drawable/
```

### 2. Naming Convention
- Use lowercase with underscores: `ic_home.xml`, `ic_settings.xml`
- Prefix with `ic_` for consistency
- Match the original icon name for easy mapping

### 3. Update Imports
Replace:
```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
```

With:
```kotlin
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.* // Import specific icons
```

### 4. Update Icon Usage

#### Simple Icon
```kotlin
// Before
Icon(Icons.Filled.Home, "Home")

// After
Icon(painterResource(Res.drawable.ic_home), "Home")
```

#### Icon Button
```kotlin
// Before
IconButton(onClick = { }) {
    Icon(Icons.Filled.Menu, "Menu")
}

// After
IconButton(onClick = { }) {
    Icon(painterResource(Res.drawable.ic_menu), "Menu")
}
```

#### Navigation Icons
```kotlin
// Before
BottomNavigationItem(
    icon = { Icon(Icons.Filled.Home, "Home") },
    selected = true,
    onClick = { }
)

// After
BottomNavigationItem(
    icon = { Icon(painterResource(Res.drawable.ic_home), "Home") },
    selected = true,
    onClick = { }
)
```

## Common Icon Mappings

| Material Icons Extended | Material Symbol Resource |
|------------------------|-------------------------|
| Icons.Filled.Home | Res.drawable.ic_home |
| Icons.Filled.Settings | Res.drawable.ic_settings |
| Icons.Filled.Person | Res.drawable.ic_person |
| Icons.Filled.Search | Res.drawable.ic_search |
| Icons.Filled.Add | Res.drawable.ic_add |
| Icons.Filled.Delete | Res.drawable.ic_delete |
| Icons.Filled.Edit | Res.drawable.ic_edit |
| Icons.Filled.Close | Res.drawable.ic_close |
| Icons.Filled.Check | Res.drawable.ic_check |
| Icons.Filled.ArrowBack | Res.drawable.ic_arrow_back |
| Icons.Filled.MoreVert | Res.drawable.ic_more_vert |
| Icons.Outlined.* | Res.drawable.ic_*_outlined |

## Files Requiring Migration (60+ files)

### Core Navigation (3 files)
- `ChatsTab.kt`
- `MainScreen.kt`
- `Tabs.kt`

### Core UI Components (4 files)
- `ContentPaywall.kt`
- `EmptyState.kt`
- `ErrorState.kt`
- `TippingModal.kt`

### Feature Modules (53+ files)
- Analytics (1 file)
- Auth (1 file)
- Calls (1 file)
- Chama (8 files)
- Chat (1 file)
- Comments (1 file)
- Contests (9 files)
- Feed (2 files)
- Live (2 files)
- Marketplace (7 files)
- Profile (5 files)
- Shop (3 files)
- Shorts (2 files)
- Sponsored (4 files)
- Stories (2 files)
- Wallet (4 files)

## Automated Migration Script

Create a helper script to identify all icon usages:

```bash
# Find all Material Icons imports
findstr /s /i "androidx.compose.material.icons" *.kt

# Find all Icons.Filled usages
findstr /s /i "Icons.Filled" *.kt

# Find all Icons.Outlined usages
findstr /s /i "Icons.Outlined" *.kt
```

## Testing Checklist

After migration, verify:
- [ ] All screens render correctly
- [ ] No missing icons
- [ ] APK size reduced by ~8-12MB
- [ ] No compilation errors
- [ ] Icons display at correct sizes
- [ ] Icon colors match theme

## Rollback Plan

If issues occur:
1. Revert `build.gradle.kts` changes
2. Re-add `implementation(compose.materialIconsExtended)`
3. Restore original imports

## Expected Benefits

- **APK Size**: Reduce from 68.4MB to ~56-60MB
- **Build Time**: Faster builds without deprecated library
- **Maintenance**: Future-proof with official Material Symbols
- **Flexibility**: Easier to customize icons

## Resources

- [Material Symbols](https://fonts.google.com/icons)
- [Compose Resources Documentation](https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-images-resources.html)
- [SVG to Vector Drawable Converter](https://svg2vector.com/)

## Notes

- This is a **manual migration** requiring updates to 60+ files
- Prioritize high-traffic screens first (Home, Profile, Wallet)
- Test thoroughly on both Android and iOS
- Consider creating a custom Icon wrapper component to simplify future changes
