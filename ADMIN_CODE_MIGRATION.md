# Admin Code Migration Summary

## Overview
Identified and migrated admin-only functionality from the mobile app to the standalone admin dashboard (rembrandt-rar).

## Problem
Admin management screens were incorrectly implemented in the user-facing mobile app, causing:
- Security risks (admin logic exposed in client code)
- APK bloat (unnecessary code shipped to users)
- Poor separation of concerns
- Maintenance complexity

## Actions Taken

### 1. Admin Dashboard (rembrandt-rar) - ADDED ✅

#### New Pages Created:

**`/ads` - Ad Management Dashboard**
- **Location**: `src/app/(dashboard)/ads/page.tsx`
- **Features**:
  - Config Tab: Platform revenue split (15% platform, 85% creator)
  - CPM pricing for Native/Banner/Story ads (KES 30-200 ranges)
  - Ad frequency controls (show every N posts)
  - Toggle ads on/off
  - Campaigns Tab: Approve/reject ad campaigns from advertisers
  - Analytics Tab: Platform-wide revenue, impressions, CTR stats
- **Access**: Super Admin only
- **API Endpoints Used**:
  - GET `/api/v1/admin/ads/config`
  - PUT `/api/v1/admin/ads/config/{endpoint}`
  - GET `/api/v1/admin/ads/campaigns`
  - POST `/api/v1/admin/ads/campaigns/{id}/approve`
  - POST `/api/v1/admin/ads/campaigns/{id}/reject`
  - GET `/api/v1/admin/ads/stats`

**`/locations` - Location Management**
- **Location**: `src/app/(dashboard)/locations/page.tsx`
- **Features**:
  - Manage 7 location scopes: COUNTRY → REGION → CITY → TOWN → ROAD → LANDMARK → SHOPPING_CENTER
  - Add locations with name, lat/long, population, parent location
  - Estate-level ad targeting capabilities
  - CRUD operations for all location types
- **Access**: Super Admin only
- **API Endpoints Used**:
  - GET `/api/v1/admin/locations?scope={scope}`
  - POST `/api/v1/admin/locations`
  - DELETE `/api/v1/admin/locations/{id}`

#### Sidebar Updated:
- Added "Ad Management" link (DollarSign icon, super admin only)
- Added "Locations" link (MapPin icon, super admin only)

### 2. Mobile App (composeApp) - REMOVED ❌

#### Deleted Files:
```
composeApp/src/commonMain/kotlin/com/krieta/feature/admin/
├── data/
│   └── repository/
│       └── AdManagementRepositoryImpl.kt
├── domain/
│   ├── model/
│   │   └── AdModels.kt
│   └── repository/
│       └── AdManagementRepository.kt
└── presentation/
    ├── screen/
    │   ├── AdminAdManagementScreen.kt (DELETED)
    │   └── AdminLocationManagementScreen.kt (DELETED)
    └── viewmodel/
        └── AdManagementViewModel.kt
```

**Total Removed**: Entire `/admin` feature folder (~1,500+ lines of admin-only code)

### 3. Contest Moderation - KEPT IN MOBILE APP ✅

**Files Analyzed and KEPT**:
- `ContestModerationScreen.kt` - Judge dashboard for reviewing contest submissions
- `ContestJudgeDashboardScreen.kt` - Judge's assigned contests list

**Reason**: These are legitimate user-facing features for contest creators/judges, NOT platform admin functions. Contest creators need to:
- Review participant submissions
- Approve/reject proof of completion
- Select winners within 72-hour window
- Manage their own contests

This is similar to how YouTube creators moderate their own comments - it's a creator tool, not an admin tool.

## Comparison: Admin Dashboard vs Mobile App

### Admin Dashboard (Web) - What Exists Now:
✅ User management
✅ Content moderation (posts, shorts, stories, contests, live streams)
✅ Sponsored campaign approval
✅ **Ad management (NEW)**
✅ **Location management (NEW)**
✅ Financial management (KYC, withdrawals)
✅ Bulk deductions
✅ Feature flags
✅ Auto-admire
✅ Announcements
✅ Shop moderation
✅ Chama moderation
✅ Name rules
✅ Database monitoring
✅ Settings
✅ Audit logs
✅ Admin team management

### Mobile App - What Should Exist:
✅ User feed (posts, shorts, stories)
✅ Create content
✅ Contest participation (submit, vote, judge own contests)
✅ Brand campaign creation (brands create their own campaigns)
✅ Creator sponsored post management (accept/reject brand deals)
✅ Wallet & transactions
✅ Chama participation
✅ Shop browsing/selling
✅ Profile management
❌ Platform-wide ad configuration (REMOVED)
❌ Location management (REMOVED)
❌ Campaign approval (brands can create, admins approve via dashboard)

## Security Improvements

### Before:
- Admin screens accessible in mobile app with role check
- Admin API endpoints called from mobile client
- Admin business logic in mobile codebase
- Risk of reverse engineering admin features

### After:
- Admin features only in separate web dashboard
- Mobile app has zero admin code
- Clear separation: users use mobile app, admins use web dashboard
- Reduced attack surface

## File Size Impact
- **Removed**: ~1,500+ lines of admin code
- **Estimated APK reduction**: ~50-100KB (after ProGuard/R8)
- **Maintenance**: Cleaner codebase, easier to maintain

## API Endpoints Required (Backend)

The following endpoints need to exist in your backend for the admin dashboard to work:

### Ad Management:
- `GET /api/v1/admin/ads/config`
- `PUT /api/v1/admin/ads/config/platform-cut`
- `PUT /api/v1/admin/ads/config/native-pricing`
- `PUT /api/v1/admin/ads/config/banner-pricing`
- `PUT /api/v1/admin/ads/config/story-pricing`
- `PUT /api/v1/admin/ads/config/native-frequency`
- `PUT /api/v1/admin/ads/config/banner-frequency`
- `PUT /api/v1/admin/ads/config/story-frequency`
- `GET /api/v1/admin/ads/campaigns`
- `POST /api/v1/admin/ads/campaigns/{id}/approve`
- `POST /api/v1/admin/ads/campaigns/{id}/reject`
- `GET /api/v1/admin/ads/stats`

### Location Management:
- `GET /api/v1/admin/locations?scope={scope}`
- `POST /api/v1/admin/locations`
- `DELETE /api/v1/admin/locations/{id}`

## Next Steps

1. ✅ Admin dashboard pages created
2. ✅ Mobile app admin code removed
3. ⏳ Backend API endpoints need to be implemented (if not already)
4. ⏳ Test admin dashboard functionality
5. ⏳ Deploy admin dashboard separately from mobile app

## Architecture Decision

**Mobile App**: User-facing features only
- Content creation/consumption
- Social interactions
- Wallet/transactions
- Personal settings

**Admin Dashboard**: Platform management only
- User moderation
- Content moderation
- Financial oversight
- Platform configuration
- Analytics

This separation ensures:
- Better security
- Cleaner codebases
- Independent deployment
- Appropriate access control
- Reduced mobile app size
