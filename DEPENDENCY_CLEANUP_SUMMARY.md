# Dependency Cleanup & Migration Summary

## Date: 2026-04-26

## Changes Completed

### 1. ✅ Prisma Schema - Budget Models Removed

**File**: `backend/prisma/schema.prisma`

**Removed**:
- `Budget` model (with BudgetPeriod, BudgetStatus enums)
- `BudgetCategory` model
- `Expense` model (with ExpenseRecurrence enum)
- User relations: `budgets` and `expenses` fields

**Impact**: 
- Database schema cleaned up
- Need to run: `npx prisma migrate dev --name remove_budget_models`
- Need to run: `npx prisma generate` to update Prisma client

### 2. ✅ Build Configuration - Dependency Removed

**File**: `composeApp/build.gradle.kts`

**Removed**:
```kotlin
implementation(compose.materialIconsExtended)
```

**Impact**:
- Removes ~8-12MB from APK size
- 60 Kotlin files need migration to Material Symbols
- Build will fail until icon imports are updated

### 3. ✅ Migration Documentation Created

**Files Created**:
1. `MATERIAL_ICONS_MIGRATION.md` - Comprehensive migration guide
2. `analyze_icons.ps1` - PowerShell script to analyze icon usages
3. `icon_migration_report.txt` - Generated analysis report

## Current Status

### ✅ Completed
- Budget feature completely removed from Kotlin codebase (all source sets)
- Budget models removed from Prisma schema
- Material Icons Extended dependency removed from build.gradle.kts
- Migration documentation created

### ⚠️ Pending - Manual Migration Required

**Material Icons Extended → Material Symbols Migration**

**Scope**: 60 files need manual updates

**Files by Category**:

1. **Core Navigation (3 files)**
   - `ChatsTab.kt` - Uses: Home, Search, Person, Close, ChevronRight
   - `MainScreen.kt`
   - `Tabs.kt` - Uses: Home, Favorite, Search, Campaign, Person, Close, ChevronRight

2. **Core UI Components (4 files)**
   - `ContentPaywall.kt`
   - `EmptyState.kt`
   - `ErrorState.kt`
   - `TippingModal.kt`

3. **Feature Modules (53 files)**
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

## Migration Steps

### Step 1: Update Prisma Database
```bash
cd backend
npx prisma migrate dev --name remove_budget_models
npx prisma generate
```

### Step 2: Material Icons Migration (Manual)

**Option A: Gradual Migration (Recommended)**
1. Start with high-priority screens (Home, Profile, Wallet)
2. Download required icons from https://fonts.google.com/icons
3. Place SVG files in: `composeApp/src/commonMain/composeResources/drawable/`
4. Update imports file by file
5. Test each screen after migration

**Option B: Bulk Migration**
1. Download all required icons at once
2. Create a custom Icon wrapper component
3. Update all 60 files in one go
4. Comprehensive testing required

### Step 3: Common Icon Replacements

```kotlin
// Before
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
Icon(Icons.Filled.Home, "Home")

// After
import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.ic_home
Icon(painterResource(Res.drawable.ic_home), "Home")
```

### Step 4: Commonly Used Icons (from Tabs.kt example)

Based on the code analysis, these icons are frequently used:
- `Icons.Default.Home` → `ic_home.xml`
- `Icons.Default.Search` → `ic_search.xml`
- `Icons.Default.Person` → `ic_person.xml`
- `Icons.Default.Favorite` → `ic_favorite.xml`
- `Icons.Default.Campaign` → `ic_campaign.xml`
- `Icons.Default.Close` → `ic_close.xml`
- `Icons.Default.ChevronRight` → `ic_chevron_right.xml`
- `Icons.AutoMirrored.Filled.ArrowBack` → `ic_arrow_back.xml`

## Expected Benefits

### APK Size Reduction
- **Before**: 68.4MB
- **After**: ~56-60MB (estimated)
- **Savings**: ~8-12MB

### Build Performance
- Faster builds without deprecated library
- Smaller dependency graph

### Maintenance
- Future-proof with official Material Symbols
- No deprecation warnings
- Easier to customize icons

## Rollback Plan

If issues occur during migration:

1. **Revert build.gradle.kts**:
```kotlin
implementation(compose.materialIconsExtended)
```

2. **Revert Prisma schema** (if needed):
```bash
git checkout backend/prisma/schema.prisma
npx prisma migrate dev
```

3. **Restore icon imports** in affected files

## Testing Checklist

After migration:
- [ ] All screens render correctly
- [ ] No missing icons
- [ ] APK size reduced by ~8-12MB
- [ ] No compilation errors
- [ ] Icons display at correct sizes
- [ ] Icon colors match theme
- [ ] Navigation works correctly
- [ ] Test on both Android and iOS

## Resources

- [Material Symbols](https://fonts.google.com/icons)
- [Compose Resources Documentation](https://www.jetbrains.com/help/kotlin-multiplatform-dev/compose-images-resources.html)
- [SVG to Vector Drawable Converter](https://svg2vector.com/)

## Next Actions

1. **Immediate**: Run Prisma migrations to update database
2. **High Priority**: Migrate core navigation files (3 files)
3. **Medium Priority**: Migrate high-traffic features (Profile, Wallet, Shop)
4. **Low Priority**: Migrate remaining features
5. **Final**: Test thoroughly and measure APK size reduction

## Notes

- Material Icons Extended was deprecated and pinned to version 1.7.3
- The migration is **manual** and requires careful testing
- Consider creating a custom Icon wrapper component to simplify future changes
- Budget feature removal is complete and irreversible (unless restored from git)
- Room Database and ML Kit dependencies were already removed in previous cleanup

## Files Modified

1. `backend/prisma/schema.prisma` - Budget models removed
2. `composeApp/build.gradle.kts` - Material Icons Extended removed
3. `MATERIAL_ICONS_MIGRATION.md` - Created
4. `analyze_icons.ps1` - Created
5. `icon_migration_report.txt` - Generated
6. `DEPENDENCY_CLEANUP_SUMMARY.md` - This file

## Estimated Time for Complete Migration

- **Prisma Migration**: 5 minutes
- **Icon Migration (60 files)**: 4-6 hours (depending on approach)
- **Testing**: 2-3 hours
- **Total**: 6-9 hours

## Success Criteria

✅ Build completes without errors
✅ All screens display correctly
✅ APK size reduced by 8-12MB
✅ No deprecated dependencies
✅ Database schema updated
✅ All tests pass
