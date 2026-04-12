# Fix Auth, Navigation, Content Creation & Feed Rendering

## Problem Summary

Multiple critical issues need to be addressed:

1. **Hardcoded currency** — Registration uses `country = "US"`, `currency = "USD"` instead of device locale
2. **Bottom nav floating** — The bottom navigation bar is vertically centered instead of anchored to the bottom
3. **Create Post is text-only** — No image picker, no posting logic (just `navigator.pop()`)  
4. **Create Short is fake** — Shows static "Camera Preview..." text, no camera or gallery picker
5. **Create Product can't pick images** — Only accepts pasted URLs, no device gallery picker
6. **Create Contest has no posting logic** — Just `navigator.pop()` on "Launch"
7. **None of the create buttons actually post** — They all just dismiss the screen

---

## Proposed Changes

### 1. Dynamic Currency via LocationProvider

#### [MODIFY] [RegisterViewModel.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/auth/presentation/viewmodel/RegisterViewModel.kt)

- Inject `LocationProvider` via constructor
- Replace hardcoded `country = "US"` / `currency = "USD"` with `locationProvider.getCurrentCountry()` / `locationProvider.getCurrentCurrency()`

#### [MODIFY] [AppModule.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/com/core/di/AppModule.kt)

- No change needed — `LocationProvider()` already registered as singleton

---

### 2. Fix Bottom Navigation Floating

#### [MODIFY] [MainScreen.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/com/core/navigation/MainScreen.kt)

- The `KrietaBottomBar` is inside `NavigationBar` which uses `Row` with `weight(1f)`. The center "+" button uses `fillMaxHeight()` which inside a `NavigationBar` can cause layout issues.
- Fix: Wrap the entire `Content()` in a `Box(Modifier.fillMaxSize())` and position bottom bar as overlay, OR fix the Scaffold content padding chain. The likely issue is the content `Box` not filling available space.
- Change content box to use `Modifier.fillMaxSize().padding(innerPadding)` explicitly.

---

### 3. Create Post — Support Text + Image + Posting

#### [MODIFY] [CreatePostScreen.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/feed/presentation/screen/CreatePostScreen.kt)

- Add Android image picker via `ActivityResultContracts.PickMultipleVisualMedia`
- Display selected image thumbnails in horizontal row
- Wire "Post" button to actually call `FeedApi.createPost()` via repository
- Support text-only, image-only, or combined posts

> [!IMPORTANT]
> Since this is KMP, we need an `expect/actual` pattern for the image picker. For MVP, we'll use Android's `ActivityResultContracts` via a Composable launcher. The backend requires `imageUrls` (uploaded URLs), so we need a strategy for image upload. **For now, we'll allow text-only posts by making `imageUrls` optional on the backend, and add a URL paste option for images until a proper upload service (Cloudinary) is integrated.**

#### [MODIFY] [feed.routes.ts](file:///C:/Users/ADMIN/appu/backend/src/modules/feed/feed.routes.ts)

- Make `imageUrls` optional (allow text-only posts): change `.min(1)` to `.optional().default([])`

#### [MODIFY] [FeedApi.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/feed/data/remote/FeedApi.kt)

- Add `createPost(caption, imageUrls)` method

#### [MODIFY] [FeedRepository.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/feed/domain/repository/FeedRepository.kt) & [FeedRepositoryImpl.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/feed/data/repository/FeedRepositoryImpl.kt)

- Add `createPost()` method to interface and implementation

---

### 4. Create Short — Real Camera/Gallery Picker

#### [MODIFY] [CreateShortScreen.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/shorts/presentation/screen/CreateShortScreen.kt)

- Replace fake camera UI with two options: "Record Video" (launches native camera intent) and "Pick from Gallery" (launches video picker)
- Use Android `ActivityResultContracts.CaptureVideo` and `PickVisualMedia(VideoOnly)`
- Once video is selected, show preview and caption input
- Wire "Post" button to call shorts API (requires video URL — for MVP use a URL input for the uploaded video URL)

---

### 5. Product Image Picker  

#### [MODIFY] [CreateListingScreen.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/shop/presentation/screen/CreateListingScreen.kt)

- Replace URL-paste approach with image picker button using `PickMultipleVisualMedia`
- Keep URL input as fallback option
- Ensure "List Product" button calls the actual shop API (it already does via `viewModel.save()` → `repository.createProduct()`)

---

### 6. Create Contest — Wire Posting Logic

#### [MODIFY] [CreateContestScreen.kt](file:///C:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/contests/presentation/screen/CreateContestScreen.kt)

- Add all required fields from the backend Zod schema (description, mediaType, category, prizeKr, requiredActions, maxWinners, prizeDistribution, judgingCriteria, deadline)
- Wire "Launch" button to call contests API

---

## Implementation Strategy

> [!WARNING]  
> **Image Upload Limitation:** The backend requires image/video **URLs** (not raw binary uploads). Full Cloudinary integration is a separate task. For this iteration, we will:
> 1. Allow **text-only posts** (make imageUrls optional on backend)
> 2. Provide a **URL paste option** for images alongside the device picker (picker previews locally but requires a URL for the backend)
> 3. For shorts, provide a URL input for the video URL

This keeps all buttons functional and posting actually working, while the Cloudinary upload pipeline can be built in a future iteration.

---

## Verification Plan

### Automated Tests
- `.\gradlew :composeApp:assembleDebug` — must compile cleanly

### Manual Verification
- User creates text-only post → appears in feed
- User creates post with image URL → appears in feed  
- User lists product → appears in shop
- User launches contest → appears in contests
- Bottom nav bar is anchored to bottom of screen
- Currency shown matches device locale
