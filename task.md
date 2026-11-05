# Phase 1: Core Infrastructure

## Gradle Configuration
- [ ] Update libs.versions.toml (all deps)
- [ ] Update settings.gradle.kts
- [ ] Update root build.gradle.kts
- [ ] Update composeApp/build.gradle.kts
- [ ] Update gradle.properties

## Core — commonMain
- [ ] core/network/NetworkResult.kt
- [ ] core/network/ApiConstants.kt
- [/] core/network/KtorClient.kt
- [/] core/theme/Colors.kt
- [/] core/theme/Type.kt
- [/] core/theme/KrietaTheme.kt
- [/] core/di/AppModule.kt
- [/] Redesign the Cover Photo & Header Area (scrim gradient overlay, transparent top bar, dynamic stretch & parallax)
- [/] Implement the modern profile details container (elevated card with subtle border)
- [/] Implement card layout content:
  - [/] Start-aligned avatar with professional double-ring border
  - [/] Right-stacked name, verified badge, username, and account type pill
  - [/] Left-aligned bio and styled niches flow row
- [/] Implement the 4-column Stats panel (Admirers, Admiring, Lovers, Contests Won) with click navigation to SocialListScreen
- [/] Polish Action Buttons (Edit Profile, Wallet, Admire, Message) with modern capsule styling
- [/] Redesign Tabs navigation (capsule-shaped active state) and tab content empty-states (with custom themed empty layouts and CTA buttons)
- [ ] Verify build and compile with `./gradlew :composeApp:installDebug`
- [ ] Create walkthrough.md and finalize version catalog for KMP, Ktor, Koin, Voyager, SQLDelight, Coil, Media3, Security.
- [ ] core/location/LocationProvider.kt (expect)
- [ ] core/location/CurrencyMapper.kt
- [ ] core/security/TokenManager.kt (interface)
- [ ] core/security/DeviceSecurity.kt (interface)
- [ ] core/datastore/PreferencesManager.kt
- [ ] core/util/KrCurrencyFormatter.kt
- [ ] core/util/DateTimeUtil.kt
- [ ] core/navigation/AppNavigator.kt
- [ ] core/navigation/tabs/ (Home, Discover, Contests, Shop, Profile)
- [ ] core/ui/components/KrAmountDisplay.kt
- [ ] core/ui/components/KrAmountInput.kt
- [ ] core/ui/components/LoadingIndicator.kt
- [ ] core/ui/components/ErrorState.kt
- [ ] core/ui/components/EmptyState.kt
- [x] **Gradle Setup**: Configure version catalog for KMP, Ktor, Koin, Voyager, SQLDelight, Coil, Media3, Security.
- [x] **Ktor Client**: Implement `KtorClientFactory` with content negotiation, bearer token auth, timeout, and URL base setting.
- [x] **DI Setup**: Create base Koin modules (`coreModule`, platform modules expect/actual).
- [x] **Theme**: Define `KrietaTheme`, `KrietaColors`, and Typography.
- [x] **Utilities**: 
  - [x] `KrCurrencyFormatter` (Crucial for `. Kr` representation).
  - [x] `DateTimeUtil` for time-ago, localized formatting.
  - [x] `CurrencyMapper` (ISO logic for unsupported payments).
- [x] **Core Interfaces**: `TokenManager`, `DeviceSecurity`, `LocationProvider` (expect/actual definitions and Android/iOS implementations).
- [x] **Main Screens**: `MainScreen` & `Tabs` (Voyager Tab Navigator).
- [x] **UI Components**: `KrAmountDisplay`, `KrAmountInput`, `TipConfirmDialog`, `ContentPaywall`, `ErrorState`, `EmptyState`, `LoadingIndicator`.
- [x] **Manifest**: Update `AndroidManifest.xml` (Permissions, Network config).
- [x] **Backend Skeleton**: Init Express, Prisma schema (with required business logic rules mapping), rate limiter, errorHandler, JWT auth middleware.

# Phase 2: Authentication
## Backend
- [x] **Auth Routes**: Express routes for login, register, OAuth, refresh tokens and logout.
- [x] **Auth Service**: Business logic mapping Prisma DB queries for user authentication.
- [x] **Auth Middleware**: Admin and Auth express headers verification logic.
- [x] **Schema Configurations**: Prisma user updates for `googleId` and `appleId`.

## Mobile Application (KMP)
- [x] **Auth API**: Ktor client requests resolving to backend schema.
- [x] **Auth Repository**: Central storage interfacing network logic cleanly.
- [x] **Auth ViewModels**: StateFlow management connected to Voyager core.
- [x] **Signup UI**: Compose screen strictly enforcing username restrictions and Account Type locking banner.
- [x] **Login UI**: User, pass, and OAuth login view UI setup cleanly.

# Phase 3: Wallet Module
## Backend
- [x] **Service Layer**: ExchangeService mapping `fiat <-> USD <-> Kr` efficiently utilizing real-time APIs alongside static 4.5% platform margins.
- [x] **Transaction Mapping**: Secure atomic Prisma database operations accurately deducting sender, incrementing recipient, generating activity logs implicitly triggering `isWalletUnlocked = true`.
- [x] **Validation Schemas**: Zod Topup, withdraw, tip endpoints validating user inputs.

## Mobile Application (KMP)
- [x] **Wallet UI**: Compose displaying Total Balance with `KrCurrencyFormatter` providing `Kr.XX (~USD YY)` format.
- [x] **Repository Layer**: Automatic caching logic parsing response parameters for frontend stability.

## Audit Fixes (Phase 2 & 3)
- [x] **wallet.routes.ts**: Fixed `requireAuth` → `authMiddleware` (wrong export name).
- [x] **wallet.controller.ts**: Fixed `req.user!.userId` → `req.userId!` (matching `AuthRequest` interface).
- [x] **AuthRepositoryImpl**: Made `isAuthenticated()` and `clearSession()` suspend. Injected `DeviceSecurity` removing hardcoded device IDs.
- [x] **AuthRepository interface**: Updated `isAuthenticated()` to suspend.
- [x] **AuthModule DI**: Added `DeviceSecurity` as third dependency.

# Phase 3.5: Payment Providers
## Backend (All pure REST — no expect/actual needed)
- [x] **M-Pesa Daraja**: STK Push initiation, status query, callback parser.
- [x] **PayPal Orders v2**: Order creation, capture flow.
- [x] **Paystack**: Transaction init, verify, webhook signature validation.
- [x] **Payment Routes**: Unified `/payments/topup`, `/payments/mpesa/callback`, `/payments/paypal/capture`, `/payments/paystack/webhook`.
- [x] **index.ts**: Mounted payment routes.

## Mobile Application (KMP)
- [x] **TopupScreen**: UI for selecting provider and entering fiat amount with real-time Kr conversion.
- [x] **WithdrawScreen**: UI for withdrawal destination entry with balance sufficiency check.
- [x] **WalletScreen**: Wired Top Up / Withdraw buttons to navigate to new screens.
- [x] **WalletModule DI**: Registered TopupViewModel and WithdrawViewModel.

# Phase 4: Content Discovery (Shorts, Feed, Contests)

## Backend — Shorts Module
- [x] **shorts.service.ts**: Feed algorithm (engagement-weighted discover, chronological admiring, contest-only home), like toggle (atomic with compound unique), comments with count increment, view counting, collections. All fields match Prisma schema exactly (userId, likesCount, commentsCount, musicTitle/musicArtist, sortOrder).
- [x] **shorts.validation.ts**: Zod schemas for feed query, short creation, comments, collections.
- [x] **shorts.routes.ts**: GET feed (optionalAuth), POST create, POST/DELETE like toggle, POST comment, GET comments, POST view, GET/POST collections.

## Backend — Feed Module
- [x] **feed.service.ts**: Chronological feed, post creation (multi-image up to 10), like toggle (atomic with compound unique postId_userId), comment with count increment. All fields match Prisma schema (userId, likesCount, commentsCount, imageUrls).
- [x] **feed.routes.ts**: GET feed (optionalAuth), POST create, POST/DELETE like toggle, POST comment.

## Backend — Contests Module
- [x] **contests.service.ts**: Full lifecycle — create with prize escrow + 15% fee (atomic wallet deduction, escrow record), list (with join status), detail (with actions + distributions), join (atomic with totalParticipants increment), submit entry (with proof, totalSubmissions increment), submissions (always visible), leaderboard, admin prize distribution (with ContestWinner records, wallet unlock). All fields match Prisma schema (prizeTotalKr, category, totalParticipants, totalSubmissions, votesCount, proofUrls, submittedAt).
- [x] **contests.routes.ts**: Full CRUD with proper auth guards and admin-only distribute endpoint.
- [x] **index.ts**: Mounted shorts, feed, contests routes.

## KMP — Shorts Module (8 files)
- [x] **ShortsDtos.kt**: ShortDto, ShortsFeedResponseDto, CommentDto, CommentsResponseDto, ShortCollectionDto, CreateShortRequestDto, ToggleLikeResponseDto. All camelCase, zero @SerialName.
- [x] **ShortsModels.kt**: Short, ShortCreator, ShortComment, ShortCollection domain models.
- [x] **ShortsApi.kt**: Ktor client for all shorts endpoints.
- [x] **ShortsRepository.kt**: Interface with getFeed, toggleLike, getComments, addComment, incrementView.
- [x] **ShortsRepositoryImpl.kt**: DTO-to-domain mapping with private toDomain() extension.
- [x] **ShortsViewModel.kt**: Tab state (Home/Discover/Admiring), paginated feed with preload-on-scroll, view increment, optimistic like toggle.
- [x] **ShortsScreen.kt**: Full-screen VerticalPager with tab bar, per-short overlays, like/comment/tip buttons (tip hidden on locked), subscription paywall, pagination.
- [x] **ShortsModule.kt**: Koin DI registration.

## KMP — Feed Module (8 files)
- [x] **FeedDtos.kt**: PostDto, FeedResponseDto, PostCommentDto, ToggleLikeResponseDto. All camelCase.
- [x] **FeedModels.kt**: Post, PostCreator domain models.
- [x] **FeedApi.kt**: Ktor client for feed, like, comment endpoints.
- [x] **FeedRepository.kt**: Interface with getFeed, toggleLike, addComment.
- [x] **FeedRepositoryImpl.kt**: DTO-to-domain mapping.
- [x] **FeedViewModel.kt**: Initial load, pull-to-refresh, infinite scroll, optimistic like toggle.
- [x] **FeedScreen.kt**: Photo carousel (HorizontalPager), animated like button, locked post paywall overlay, tip button (hidden on locked), infinite scroll.
- [x] **FeedModule.kt**: Koin DI registration.

## KMP — Contests Module (8 files)
- [x] **ContestsDtos.kt**: ContestDto, ContestListResponseDto, ContestSubmissionDto, SubmissionsResponseDto, CreateContestRequestDto, SubmitEntryRequestDto. All camelCase.
- [x] **ContestsModels.kt**: Contest, ContestSubmission, ContestCreator, RequiredAction + enums (ContestMediaType, ContestCategory, JudgingCriteria, ContestStatus).
- [x] **ContestsApi.kt**: Ktor client for all contest endpoints.
- [x] **ContestsRepository.kt**: Interface with listContests, getContest, joinContest, getSubmissions, getLeaderboard.
- [x] **ContestsRepositoryImpl.kt**: DTO-to-domain mapping with safe enum parsing (graceful fallback for unknown backend values).
- [x] **ContestFeedViewModel.kt**: Filter support, pagination, pull-to-refresh.
- [x] **ContestDetailViewModel.kt**: Contest + submissions parallel load, optimistic join state, paginated submissions.
- [x] **ContestFeedScreen.kt**: Filter chips (All/Active/Completed), paginated lazy list, contest cards with prize Kr format, status badge, join indicator.
- [x] **ContestDetailScreen.kt**: Prize pool card, stats, description, rules, join/submit buttons, always-visible submissions list.
- [x] **ContestsModule.kt**: Koin DI with parametersOf for ContestDetailViewModel.

## AppModule Integration
- [x] **AppModule.kt**: Fixed import ordering, wired shortsModule, feedModule, contestsModule.

# Phase 4B: Profile Module + New Features (Product Link, Contest Sponsor)

## Prisma Schema Updates
- [x] **Short model**: Added `linkedProductId` field + `linkedProduct` Product relation for shop product popup in shorts.
- [x] **Contest model**: Added `sponsorName` + `sponsorUrl` fields for "Sponsored by [NAME]" clickable text.
- [x] **Product model**: Added `linkedShorts` back-relation to Short.

## Backend — User/Profile Module
- [x] **user.service.ts**: Full profile with relationship status (NONE/ADMIRING/ADMIRED_BY/LOVERS), identity lock enforcement (rejects name/username changes when `isWalletUnlocked=true`), atomic admire/unadmire with mutual lover detection, paginated admirers/admiring/lovers lists, bio link management, milestone progress tracking.
- [x] **subscription.service.ts**: Tier CRUD for creators, subscribe with atomic wallet charge (subscriber deducted, creator credited minus 15% platform fee, wallet unlock), unsubscribe, tier access validation (ordered TOP_FUN < REAL_FAN < TRUE_FAN < SUPER_FAN).
- [x] **user.routes.ts**: Full CRUD with proper auth guards (GET/PUT /me, GET /:id with optionalAuth, POST/DELETE /:id/admire, GET /:id/admirers|admiring|lovers, GET /me/milestones, GET/PUT /me/subscription-tiers, GET /:id/subscription-tiers, POST/DELETE /:id/subscribe).
- [x] **index.ts**: Mounted user routes at `/api/v1/users`.

## Backend — Shorts & Contests Updates
- [x] **shorts.service.ts**: Added `linkedProductId` to createShort, included `linkedProduct` relation in feed query, mapped to `{ id, title, imageUrl, priceKr }` response.
- [x] **shorts.validation.ts**: Added `linkedProductId` to createShortSchema.
- [x] **contests.service.ts**: Added `sponsorName`/`sponsorUrl` to createContest and all response mappings.
- [x] **contests.routes.ts**: Added `sponsorName`/`sponsorUrl` to createContestSchema Zod validation.

## KMP — Profile Module (16 files)
- [x] **ProfileDtos.kt**: UserProfileDto, BioLinkDto, AdmireResponseDto, SocialUserDto, SocialListResponseDto, MilestoneDto, SubscriptionTierDto, UpdateProfileRequestDto, BioLinkRequestDto, UpdateTierRequestDto, SubscribeRequestDto. All camelCase.
- [x] **ProfileModels.kt**: UserProfile, ProfileStats, BioLink, SocialUser, Milestone, SubscriptionTier + enums (RelationshipStatus, AccountType, SubscriptionTierType).
- [x] **ProfileApi.kt**: Ktor client for all endpoints (profile CRUD, admire/unadmire, social lists, milestones, subscription tiers).
- [x] **ProfileRepository.kt**: Interface for all profile operations.
- [x] **ProfileRepositoryImpl.kt**: DTO-to-domain mapping with safe enum parsing.
- [x] **ProfileViewModel.kt**: Own vs. other profile loading, relationship toggle (optimistic), subscribe, tier loading.
- [x] **EditProfileViewModel.kt**: Per-field change handlers, diff-based save (only sends changed fields).
- [x] **SocialListViewModel.kt**: Reusable for Admirers/Admiring/Lovers with pagination.
- [x] **MilestonesViewModel.kt**: Loads all user milestones.
- [x] **SubscriptionTierSetupViewModel.kt**: 4 tier drafts with toggle/amount/benefits, loading existing config, bulk save.
- [x] **ProfileScreen.kt**: Cover+avatar, verified badge, account type badge, relationship button (Admire/Admire Back/Unadmire/Unlove 💕), stats row (clickable), bio links, subscription tiers with Kr pricing, own-profile edit/milestones/tier management.
- [x] **EditProfileScreen.kt**: Identity lock enforcement (locked fields with icon when wallet unlocked, pre-lock warning banner).
- [x] **SocialListScreen.kt**: Reusable for all 3 social lists with avatar, lover indicator, clickable to profile, pagination.
- [x] **MilestonesScreen.kt**: Cards with completion status, Kr reward, first completer username, requirement description.
- [x] **SubscriptionTierSetupScreen.kt**: 4-tier config with toggle, Kr price input, benefits description, save.
- [x] **ProfileModule.kt**: Koin DI with parametersOf for ProfileViewModel and SocialListViewModel.

## KMP — Shorts & Contests Updates
- [x] **ShortsDtos.kt**: Added `LinkedProductDto`, `linkedProductId`, `linkedProduct` to ShortDto and CreateShortRequestDto.
- [x] **ShortsModels.kt**: Added `LinkedProduct` model and `linkedProduct` field to Short.
- [x] **ShortsRepositoryImpl.kt**: Maps linkedProduct DTO to domain model.
- [x] **ShortsScreen.kt**: Added `LinkedProductPopup` — auto-shows for 4 seconds with slide+fade animation when short has linked product. Shows product image, title, Kr price, and "View" CTA.
- [x] **ContestsDtos.kt**: Added `sponsorName`/`sponsorUrl` to ContestDto and CreateContestRequestDto.
- [x] **ContestsModels.kt**: Added `sponsorName`/`sponsorUrl` to Contest domain model.
- [x] **ContestsRepositoryImpl.kt**: Maps sponsor fields in toDomain().
- [x] **ContestDetailScreen.kt**: Added "Sponsored by [NAME]" with clickable underlined name that opens sponsorUrl via LocalUriHandler.

## AppModule Integration
- [x] **AppModule.kt**: Wired profileModule into appModules list.

---

# Phase 8: Shop Module

## Backend
- [x] **shop.service.ts**: Full CRUD matching Prisma Product model (sellerId, title, description, imageUrls, priceKr Decimal, category, whatsappNumber, status). Ownership enforcement, soft-delete via status='removed'.
- [x] **shop.routes.ts**: Zod validation, public browsing (GET /products with category/search/seller filter), mine, create, update, soft-delete.
- [x] **index.ts**: Mounted at `/api/v1/shop`.

## KMP (11 files)
- [x] **ShopDtos.kt**: ProductDto, ProductSellerDto, ProductListResponseDto, CreateProductRequestDto, UpdateProductRequestDto.
- [x] **ShopModels.kt**: Product, ProductSeller domain models.
- [x] **ShopApi.kt**: Ktor client for all shop endpoints.
- [x] **ShopRepository.kt**: Interface for all shop operations.
- [x] **ShopRepositoryImpl.kt**: DTO-to-domain mapping.
- [x] **ShopListViewModel.kt**: Category filter, search, cursor pagination.
- [x] **ProductDetailViewModel.kt**: Single product loading by ID.
- [x] **CreateListingViewModel.kt**: Per-field handlers, image management (up to 10), validation, save.
- [x] **ShopScreen.kt**: Search bar, category filter chips, 2-column product grid with image/title/Kr price/seller.
- [x] **ProductDetailScreen.kt**: Image carousel with page indicator, Kr price, description, category badge, seller info, "Buy via WhatsApp" button.
- [x] **CreateListingScreen.kt**: Image URL management, title, description, Kr price input, category, WhatsApp number, validation.
- [x] **ShopModule.kt**: Koin DI with parametersOf for ProductDetailViewModel.

## AppModule
- [x] **AppModule.kt**: Wired shopModule.

---

# Phase 9: Analytics + Ads Module

## Backend — Analytics
- [x] **analytics.service.ts**: Aggregated analytics from DailyStat model (views, likes, newAdmirers, krEarned, krSpent), earnings breakdown from Transaction by type, follower counts. recordStat upsert for other services.
- [x] **analytics.routes.ts**: GET /analytics with days parameter.
- [x] **index.ts**: Mounted at `/api/v1/analytics`.

## Backend — Ads
- [x] **ads.service.ts**: Atomic rewarded ad crediting (wallet + transaction), impression tracking via DailyStat upsert.
- [x] **ads.routes.ts**: POST /ads/rewarded, POST /ads/impression.
- [x] **index.ts**: Mounted at `/api/v1/ads`.

## KMP — Analytics (7 files)
- [x] **AnalyticsDtos.kt**: AnalyticsResponseDto, AnalyticsPeriodDto, AnalyticsTotalsDto, FollowerCountsDto, EarningsBreakdownItemDto, DailyStatDto.
- [x] **AnalyticsModels.kt**: CreatorAnalytics, AnalyticsTotals, FollowerCounts, EarningsBreakdownItem (with displayLabel), DailyStat.
- [x] **AnalyticsApi.kt**: Ktor client with days parameter.
- [x] **AnalyticsRepository.kt**: Interface.
- [x] **AnalyticsRepositoryImpl.kt**: Full DTO-to-domain mapping.
- [x] **AnalyticsViewModel.kt**: Period selector (7/30/90 days), refresh.
- [x] **AnalyticsScreen.kt**: Period selector, stat overview cards (views/likes/new admirers), follower counts, earnings breakdown by source, net earnings summary with Kr formatting.
- [x] **AnalyticsModule.kt**: Koin DI.

## KMP — Ads (7 files)
- [x] **NativeAdBanner.kt**: In-feed native ad composable placeholder.
- [x] **InterstitialAd.kt**: expect class InterstitialAdManager.
- [x] **RewardedAd.kt**: expect class RewardedAdManager.
- [x] **InterstitialAd.android.kt**: Android actual (AdMob stub).
- [x] **RewardedAd.android.kt**: Android actual (AdMob stub).
- [x] **InterstitialAd.ios.kt**: iOS actual (GAD stub).
- [x] **RewardedAd.ios.kt**: iOS actual (GAD stub).

## AppModule
- [x] **AppModule.kt**: Wired analyticsModule.

---

# Phase 10: Android Release Build

- [x] **build.gradle.kts**: R8 already enabled (isMinifyEnabled=true, isShrinkResources=true). Added signing config from krieta-release.properties (not committed to VCS).
- [x] **proguard-rules.pro**: Keep rules for Ktor, kotlinx-serialization, Koin, Voyager, Coil, OkHttp, Media3, Security, SQLDelight, DataStore, Compose. Aggressive obfuscation for security classes. Logging removal in release.
- [x] **krieta-release.properties.template**: Template for keystore configuration.
