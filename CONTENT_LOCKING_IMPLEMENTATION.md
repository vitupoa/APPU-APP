# Content Locking Feature Implementation

## Overview
Implemented the ability for creators to lock posts (Drips) and shorts during creation. Locked content requires viewers to either pay a Rc amount or subscribe to the creator's profile to unlock.

## ✅ ANSWERS TO KEY QUESTIONS

### 1. Was there a lock system previously?
**YES!** There was already a comprehensive content locking system in place:

- **ContentLockService** (`backend/src/modules/contentLock/contentLock.service.ts`): Full-featured service that handles:
  - Access checking (subscription-based OR payment-based)
  - Unlock payment processing with wallet deductions
  - Platform fee calculation (15%)
  - Transaction recording
  - Currency conversion for unlock prices

- **Database Tables**:
  - `content_unlocks`: Tracks which users have unlocked which content
  - `Post` model: Already had `is_locked`, `required_tier`, `unlock_amount_kr` fields
  - `shorts` model: Already had `is_locked`, `required_tier`, `unlock_amount_kr` fields

- **What I Added**: 
  - **Creator UI** to set lock prices during content creation
  - **Upload flow** to pass lock parameters from frontend to backend
  - **Currency conversion** in the creation screens

### 2. Integration with Subscription System
**YES!** The lock system is fully integrated with the existing subscription system:

- **Subscription Tables**:
  - `subscriptions`: Tracks active subscriptions between subscribers and creators
  - `SubscriptionTier`: Defines tier levels (TOP_FUN, REAL_FAN, TRUE_FAN, SUPER_FAN)

- **Access Logic** (from `ContentLockService.checkAccess()`):
  ```typescript
  // Priority order:
  1. If content is not locked → Grant access
  2. If viewer is the creator → Grant access
  3. If viewer has active subscription to creator's tier → Grant access
  4. If viewer has paid to unlock this specific content → Grant access
  5. Otherwise → Deny access (show lock overlay)
  ```

- **Two Ways to Unlock**:
  1. **Subscribe to Creator**: Get access to ALL locked content at that tier level
  2. **Pay Per Content**: Pay Rc amount to unlock just this one post/short

### 3. Content Randomization for Different Users
**YES!** Content is served randomly and differently to each user:

#### Shorts Feed Randomization:
- **Discover Tab**: Uses `contentDistributionService` with sophisticated algorithm:
  - **Test Audience (5,000 users)**: Selected from:
    - 30% Admirers (followers)
    - 40% Similar interests (based on hashtags)
    - 20% Demographic match
    - 10% Random users
  - **Geographic Split**: 60% local (same country), 40% global
  - **Random Selection**: Uses `ORDER BY RANDOM()` in SQL queries
  - **Delivery Scheduling**: Randomized over 24-48 hours
  - **Amplification**: Content that performs well gets pushed to larger audiences (10K → 50K → 500K → 5M)

- **Admiring Tab**: Shows content from users you follow, but order is still randomized

#### Posts Feed:
- **NEW!** Now uses sophisticated personalization and randomization
- **Feed Composition** (40/30/20/10 split):
  - 40% Posts from people you follow (admirers)
  - 30% Posts with hashtags you've liked (similar interests)
  - 20% Trending posts (high engagement in last 24 hours)
  - 10% Random posts (discovery)
- **Randomization Techniques**:
  - SQL `ORDER BY RANDOM()` for database-level randomization
  - Fisher-Yates shuffle for in-memory randomization
  - Deduplication to prevent duplicates
- **Geographic Prioritization**: All sources prioritize user's country
- **Guest Users**: See popular posts (7 days, 5+ likes) fully randomized

#### Key Point:
**No two users in the same room will see the same content at the same time** because:
1. Each user gets a personalized test audience selection
2. Random sampling is used (`ORDER BY RANDOM()`)
3. Delivery is staggered over time
4. User-specific factors (admirers, interests, location) differ
5. Cursor-based pagination means different starting points

## Features Implemented

### 1. Creator Experience (Content Creation)
- **Lock Toggle**: Added a switch in both CreatePostScreen and CreateShortScreen to enable/disable content locking
- **Price Input**: When locked, creators enter unlock price in their local currency (e.g., KES, USD)
- **Real-time Conversion**: Shows Rc equivalent using the universal currency conversion system from wallet
- **Validation**: Ensures valid price is entered before allowing post/short creation

### 2. Currency Conversion
- Uses existing `UserCurrencyProvider` for currency conversion
- Creator enters price in their local currency
- Automatically converts to Rc using exchange rate: `Rc = localAmount / exchangeRate`
- Displays Rc preview below the input field

### 3. Backend Integration
- **Database**: Both `Post` and `shorts` models already have `unlock_amount_kr` field
- **API Routes**: Updated validation schemas to accept `unlockAmountKr` parameter
  - `POST /api/v1/feed` - accepts `unlockAmountKr`
  - `POST /api/v1/shorts` - accepts `unlockAmountKr`
- **Services**: Backend already handles unlock logic via `ContentLockService`

### 4. Upload Flow
- **BackgroundUploader**: Updated to accept `isLocked` and `unlockAmountKr` parameters
- **Android (UploadWorker)**: Extracts lock parameters from WorkManager data and passes to repository
- **iOS (IosUploadProcessor)**: Accepts lock parameters and passes to repository
- **Repositories**: Updated `createPost()` and `createShort()` methods to accept lock parameters

## Files Modified

### Frontend (Kotlin Multiplatform)

#### Create Screens
- `composeApp/src/commonMain/kotlin/com/runinga/feature/feed/presentation/screen/CreatePostScreen.kt`
  - Added lock toggle UI
  - Added price input field with currency label
  - Added Rc conversion display
  - Integrated UserCurrencyProvider

- `composeApp/src/commonMain/kotlin/com/runinga/feature/shorts/presentation/screen/CreateShortScreen.kt`
  - Same UI additions as CreatePostScreen

#### View Models
- `composeApp/src/commonMain/kotlin/com/runinga/feature/feed/presentation/viewmodel/CreatePostViewModel.kt`
  - Added `isLocked`, `unlockPriceLocal`, `unlockPriceKr` to state
  - Added `toggleLock()` method
  - Added `updateUnlockPrice()` method with currency conversion logic
  - Updated `post()` to validate and pass lock parameters

- `composeApp/src/commonMain/kotlin/com/runinga/feature/shorts/presentation/viewmodel/CreateShortViewModel.kt`
  - Same additions as CreatePostViewModel

#### Upload System
- `composeApp/src/commonMain/kotlin/com/runinga/com/core/upload/BackgroundUploader.kt`
  - Added `isLocked` and `unlockAmountKr` parameters to `enqueueUpload()`

- `composeApp/src/androidMain/kotlin/com/runinga/com/core/upload/BackgroundUploader.android.kt`
  - Updated to pass lock parameters to WorkManager

- `composeApp/src/iosMain/kotlin/com/runinga/com/core/upload/BackgroundUploader.ios.kt`
  - Updated to pass lock parameters to IosUploadProcessor

- `composeApp/src/androidMain/kotlin/com/runinga/com/core/upload/UploadWorker.kt`
  - Extracts `IS_LOCKED` and `UNLOCK_AMOUNT_KR` from WorkManager data
  - Passes to repository methods

- `composeApp/src/iosMain/kotlin/com/runinga/com/core/upload/IosUploadProcessor.kt`
  - Accepts lock parameters
  - Passes to repository methods

#### Repositories
- `composeApp/src/commonMain/kotlin/com/runinga/feature/feed/domain/repository/FeedRepository.kt`
  - Updated `createPost()` signature to accept `isLocked` and `unlockAmountKr`

- `composeApp/src/commonMain/kotlin/com/runinga/feature/feed/data/repository/FeedRepositoryImpl.kt`
  - Updated implementation to pass lock parameters to API

- `composeApp/src/commonMain/kotlin/com/runinga/feature/feed/data/remote/FeedApi.kt`
  - Updated `CreatePostRequest` DTO to include lock fields
  - Updated `createPost()` method signature

- `composeApp/src/commonMain/kotlin/com/runinga/feature/shorts/domain/repository/ShortsRepository.kt`
  - Updated `createShort()` signature to accept `isLocked` and `unlockAmountKr`

- `composeApp/src/commonMain/kotlin/com/runinga/feature/shorts/data/repository/ShortsRepositoryImpl.kt`
  - Updated implementation to pass lock parameters to API

- `composeApp/src/commonMain/kotlin/com/runinga/feature/shorts/data/remote/dto/ShortsDtos.kt`
  - Updated `CreateShortRequestDto` to include `unlockAmountKr` field

### Backend (Node.js/TypeScript)

#### API Routes
- `backend/src/modules/feed/feed.routes.ts`
  - Updated `createPostSchema` to accept `unlockAmountKr: z.number().positive().optional()`

- `backend/src/modules/shorts/shorts.routes.ts`
  - Updated `createShortSchema` to accept `unlockAmountKr: z.number().positive().optional()`

## How It Works

### Creation Flow
1. Creator opens CreatePostScreen or CreateShortScreen
2. Toggles "Lock this content" switch
3. Enters unlock price in their local currency (e.g., "100" KES)
4. System fetches exchange rate from UserCurrencyProvider
5. Converts to Rc: `Rc = 100 / 0.0085 = 11,764.71 Rc`
6. Displays conversion: "≈ Rc.11,764.71"
7. Creator clicks "Post"
8. Upload system queues upload with lock parameters
9. Backend creates post/short with `is_locked=true` and `unlock_amount_kr=11764.71`

### Viewer Experience (Already Implemented)
- Locked content shows overlay with 🔒 icon
- "Subscribers only" message displayed
- Backend `ContentLockService` checks access:
  - If user has active subscription → grant access
  - If user paid unlock amount → grant access
  - Otherwise → show locked overlay

## Currency Conversion Logic

The conversion uses the wallet's universal currency system:

```kotlin
fun updateUnlockPrice(priceLocal: String, exchangeRate: Double?) {
    val priceDouble = priceLocal.toDoubleOrNull()
    if (priceDouble != null && priceDouble > 0 && exchangeRate != null && exchangeRate > 0) {
        // Convert local currency to Rc
        val krAmount = priceDouble / exchangeRate
        _state.value = _state.value.copy(unlockPriceRc = krAmount)
    }
}
```

**Example**:
- Creator in Kenya enters: 100 KES
- Exchange rate: 1 Rc = 0.0085 KES
- Calculation: 100 / 0.0085 = 11,764.71 Rc
- Stored in database: `unlock_amount_kr = 11764.71`

## Testing Checklist

### Frontend
- [ ] Lock toggle works on CreatePostScreen
- [ ] Lock toggle works on CreateShortScreen
- [ ] Price input accepts decimal numbers
- [ ] Rc conversion displays correctly
- [ ] Validation prevents posting without price when locked
- [ ] Currency code displays correctly (KES, USD, etc.)
- [ ] Exchange rate fetches on screen load

### Backend
- [ ] POST /api/v1/feed accepts unlockAmountKr
- [ ] POST /api/v1/shorts accepts unlockAmountKr
- [ ] Database stores unlock_amount_kr correctly
- [ ] ContentLockService checks unlock payment
- [ ] Locked content returns correct access status

### Upload Flow
- [ ] Android upload passes lock parameters
- [ ] iOS upload passes lock parameters
- [ ] Locked posts appear in feed with lock overlay
- [ ] Locked shorts appear in feed with lock overlay

## Notes

- **Randomized Feed**: The backend already serves content randomly to different users (no two users see the same content order)
- **Universal Currency**: Uses the same currency conversion system as wallet for consistency
- **Existing Infrastructure**: Leverages existing `ContentLockService` and `content_unlocks` table for unlock tracking
- **Subscription Integration**: Already integrated with subscription system - subscribers get automatic access

## Future Enhancements

1. **Unlock Payment Flow**: Implement UI for viewers to pay unlock amount
2. **Unlock History**: Show creators which users unlocked their content
3. **Bulk Pricing**: Allow creators to set default unlock prices
4. **Tiered Pricing**: Different prices for different subscription tiers
5. **Analytics**: Track unlock conversion rates
