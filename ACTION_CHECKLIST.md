# 📋 Action Checklist - Dependency Cleanup & Icon Migration

## ✅ Phase 1: Completed
- [x] Remove Budget models from Prisma schema
- [x] Remove Material Icons Extended from build.gradle.kts
- [x] Create migration documentation
- [x] Create analysis scripts
- [x] Create sample icon resources
- [x] Create drawable directory

---

## 🔄 Phase 2: Database Migration (5 minutes)

### Step 1: Update Prisma Database
```bash
cd backend
npx prisma migrate dev --name remove_budget_models
npx prisma generate
```

**Verification**:
- [ ] Migration runs successfully
- [ ] No errors in console
- [ ] Prisma client regenerated

---

## 🎨 Phase 3: Icon Migration (4-6 hours)

### Step 1: Download Core Icons (30 minutes)
Visit https://fonts.google.com/icons and download these icons:

**Navigation Icons** (Priority 1):
- [ ] home
- [ ] search
- [ ] person
- [ ] favorite
- [ ] campaign
- [ ] close
- [ ] chevron_right
- [ ] arrow_back

**Common Icons** (Priority 2):
- [ ] settings
- [ ] add
- [ ] delete
- [ ] edit
- [ ] check
- [ ] more_vert
- [ ] share
- [ ] send
- [ ] notifications
- [ ] menu

**Feature Icons** (Priority 3):
- [ ] shopping_cart
- [ ] store
- [ ] attach_money
- [ ] date_range
- [ ] access_time
- [ ] location_on
- [ ] phone
- [ ] email
- [ ] image
- [ ] video_library
- [ ] camera
- [ ] mic
- [ ] play_arrow
- [ ] pause
- [ ] volume_up
- [ ] visibility
- [ ] visibility_off
- [ ] thumb_up
- [ ] comment
- [ ] info
- [ ] warning
- [ ] error
- [ ] check_circle

### Step 2: Convert & Place Icons (30 minutes)
- [ ] Convert SVGs to Android Vector Drawable at https://svg2vector.com/
- [ ] Rename to `ic_[name].xml` format
- [ ] Place in `composeApp/src/commonMain/composeResources/drawable/`
- [ ] Verify files are in correct location

### Step 3: Migrate Core Navigation (1 hour)
**Files** (3 files):
- [ ] `ChatsTab.kt`
- [ ] `MainScreen.kt`
- [ ] `Tabs.kt`

**For each file**:
- [ ] Replace import statements
- [ ] Update all Icon() usages
- [ ] Update IconButton() usages
- [ ] Update Tab icons
- [ ] Build and test

### Step 4: Migrate Core UI Components (30 minutes)
**Files** (4 files):
- [ ] `ContentPaywall.kt`
- [ ] `EmptyState.kt`
- [ ] `ErrorState.kt`
- [ ] `TippingModal.kt`

### Step 5: Migrate Feature Modules (2-3 hours)

**Analytics** (1 file):
- [ ] `AnalyticsScreen.kt`

**Auth** (1 file):
- [ ] `RegisterScreen.kt`

**Calls** (1 file):
- [ ] `ActiveCallScreen.kt`

**Chama** (8 files):
- [ ] `ChamaListScreen.kt`
- [ ] `ChamaContributeScreen.kt`
- [ ] `ChamaDashboardScreen.kt`
- [ ] `DefaultersListScreen.kt`
- [ ] `ChamaElectionScreen.kt`
- [ ] `ChamaPayoutScreen.kt`
- [ ] `ChamaSettingsScreen.kt`
- [ ] `CreateChamaScreen.kt`

**Chat** (1 file):
- [ ] `ChatRoomScreen.kt`

**Comments** (1 file):
- [ ] `CommentsScreen.kt`

**Contests** (9 files):
- [ ] `ContestDetailScreen.kt`
- [ ] `ContestFeedScreen.kt`
- [ ] `ContestSubmissionFeedScreen.kt`
- [ ] `CreateContestScreen.kt`
- [ ] `JudgeInvitationsScreen.kt`
- [ ] `SubmitContestScreen.kt`
- [ ] `Step1DetailsAndDates.kt`
- [ ] `Step3TasksAndConnectors.kt`
- [ ] `Step5ReviewAndJudges.kt`

**Feed** (2 files):
- [ ] `CreatePostScreen.kt`
- [ ] `DripsScreen.kt`

**Live** (2 files):
- [ ] `HostLiveScreen.kt`
- [ ] `ViewerLiveScreen.kt`

**Marketplace** (7 files):
- [ ] `CampaignScreens.kt`
- [ ] `InfluencerSearchScreen.kt`
- [ ] `MarketplaceHomeScreen.kt`
- [ ] `MarketplaceNavigation.kt`
- [ ] `SocialMediaComponents.kt`
- [ ] `SocialMediaManagementScreen.kt`
- [ ] `SponsorAndGamificationScreens.kt`

**Profile** (5 files):
- [ ] `EditProfileScreen.kt`
- [ ] `MilestonesScreen.kt`
- [ ] `ProfileScreen.kt`
- [ ] `SocialListScreen.kt`
- [ ] `SubscriptionTierSetupScreen.kt`

**Shop** (3 files):
- [ ] `CreateListingScreen.kt`
- [ ] `ProductDetailScreen.kt`
- [ ] `ShopScreen.kt`

**Shorts** (2 files):
- [ ] `CreateShortScreen.kt`
- [ ] `ShortsScreen.kt`

**Sponsored** (4 files):
- [ ] `AdminSponsoredApprovalScreen.kt`
- [ ] `BrandDashboardScreen.kt`
- [ ] `CampaignAnalyticsScreen.kt`
- [ ] `CreateCampaignScreen.kt`

**Stories** (2 files):
- [ ] `CreateStoryScreen.kt`
- [ ] `StoryViewerScreen.kt`

**Wallet** (4 files):
- [ ] `TopupScreen.kt`
- [ ] `WalletPinScreen.kt`
- [ ] `WalletScreen.kt`
- [ ] `WithdrawScreen.kt`

---

## 🧪 Phase 4: Testing (2-3 hours)

### Build Verification
- [ ] Project builds without errors
- [ ] No missing icon errors
- [ ] No import errors
- [ ] Gradle sync successful

### Visual Testing
- [ ] All icons display correctly
- [ ] Icon sizes are consistent (24dp)
- [ ] Icon colors match theme
- [ ] Icons work in light theme
- [ ] Icons work in dark theme

### Functional Testing
**Core Navigation**:
- [ ] Bottom navigation icons display
- [ ] Tab switching works
- [ ] Navigation icons are clickable

**High-Traffic Screens**:
- [ ] Home screen icons
- [ ] Profile screen icons
- [ ] Wallet screen icons
- [ ] Shop screen icons
- [ ] Chat screen icons

**Feature Screens**:
- [ ] Contest screens
- [ ] Chama screens
- [ ] Marketplace screens
- [ ] Live streaming screens
- [ ] Stories screens

### Platform Testing
- [ ] Test on Android device/emulator
- [ ] Test on iOS simulator (if available)
- [ ] Test on different screen sizes
- [ ] Test on different Android versions

---

## 📊 Phase 5: Verification (30 minutes)

### APK Size Check
- [ ] Build release APK
- [ ] Measure APK size
- [ ] Verify size reduction (~8-12MB)
- [ ] Document actual savings

**Expected**:
- Before: 68.4MB
- After: ~56-60MB
- Savings: ~8-12MB

### Final Checks
- [ ] No deprecated dependencies
- [ ] No compilation warnings
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Git commit with clear message

---

## 📝 Phase 6: Documentation (15 minutes)

### Update Project Docs
- [ ] Update README with new icon system
- [ ] Document icon migration completion
- [ ] Update dependency list
- [ ] Note APK size improvement

### Clean Up
- [ ] Remove old migration scripts (optional)
- [ ] Archive migration documentation
- [ ] Update CHANGELOG

---

## 🎉 Success Criteria

All checkboxes above are checked AND:
- ✅ Build completes without errors
- ✅ All screens display correctly
- ✅ APK size reduced by 8-12MB
- ✅ No deprecated dependencies
- ✅ Database schema updated
- ✅ All tests pass
- ✅ Both Android and iOS work

---

## ⏱️ Time Estimates

| Phase | Estimated Time |
|-------|----------------|
| Database Migration | 5 minutes |
| Download Icons | 30 minutes |
| Convert & Place Icons | 30 minutes |
| Migrate Core Navigation | 1 hour |
| Migrate Core UI | 30 minutes |
| Migrate Features | 2-3 hours |
| Testing | 2-3 hours |
| Verification | 30 minutes |
| Documentation | 15 minutes |
| **TOTAL** | **6-9 hours** |

---

## 🆘 Troubleshooting

### Build Fails
- Check all imports are updated
- Verify icon files exist
- Rebuild project (Clean & Rebuild)

### Icons Not Displaying
- Check file names match imports
- Verify files in correct directory
- Check XML format is correct

### Size Not Reduced
- Verify Material Icons Extended removed
- Check no other large dependencies
- Build release APK (not debug)

---

## 📞 Quick Reference

- **Migration Guide**: `MATERIAL_ICONS_MIGRATION.md`
- **Quick Reference**: `ICON_MIGRATION_QUICK_REFERENCE.md`
- **Detailed Summary**: `DEPENDENCY_CLEANUP_SUMMARY.md`
- **This Checklist**: `ACTION_CHECKLIST.md`

---

**Start Date**: _____________
**Completion Date**: _____________
**Actual Time Taken**: _____________
**APK Size Before**: 68.4MB
**APK Size After**: _____________
**Actual Savings**: _____________

---

Good luck! 🚀
