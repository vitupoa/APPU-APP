# Ad Integration Examples - Copy & Paste Ready

## Import Statement (Add to all screens)

```kotlin
import com.runinga.feature.ads.presentation.*
```

---

## 1. LIVE STREAMS TAB

### File: `LiveStreamsScreen.kt` or similar

```kotlin
@Composable
fun LiveStreamsScreen() {
    val liveStreams by viewModel.liveStreams.collectAsState()
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(liveStreams.size) { index ->
            val stream = liveStreams[index]
            
            // Regular live stream card
            LiveStreamCard(stream)
            
            // Insert banner ad every 5 streams
            if ((index + 1) % 5 == 0 && index < liveStreams.size - 1) {
                LiveStreamBannerAd(
                    onAdClick = {
                        // TODO: Track ad click
                        // TODO: Navigate to ad destination
                    }
                )
            }
        }
    }
}

// During live stream playback
@Composable
fun LiveStreamPlayer(stream: LiveStream) {
    var watchTime by remember { mutableStateOf(0) }
    var showOverlayAd by remember { mutableStateOf(false) }
    
    LaunchedEffect(Unit) {
        while (true) {
            delay(1000)
            watchTime++
            
            // Show overlay ad after 2 minutes
            if (watchTime == 120) {
                showOverlayAd = true
            }
        }
    }
    
    Box(modifier = Modifier.fillMaxSize()) {
        // Video player
        VideoPlayer(stream)
        
        // Overlay ad
        if (showOverlayAd) {
            LiveStreamOverlayAd(
                onAdClick = {
                    // TODO: Track ad click
                    showOverlayAd = false
                }
            )
        }
    }
}
```

---

## 2. CONTESTS TAB

### File: `ContestsScreen.kt` or similar

```kotlin
@Composable
fun ContestsScreen() {
    val contests by viewModel.contests.collectAsState()
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(contests.size) { index ->
            val contest = contests[index]
            
            // Show sponsor banner if contest is sponsored
            if (contest.sponsorName != null) {
                ContestSponsorBanner(
                    sponsorName = contest.sponsorName,
                    sponsorLogo = contest.sponsorLogoUrl,
                    onSponsorClick = {
                        // TODO: Navigate to sponsor page
                        // TODO: Track sponsor click
                    }
                )
            }
            
            // Regular contest card
            ContestCard(contest)
            
            // Insert native ad every 8 contests
            if ((index + 1) % 8 == 0 && index < contests.size - 1) {
                ContestNativeAd(
                    onAdClick = {
                        // TODO: Track ad click
                        // TODO: Navigate to ad destination
                    }
                )
            }
        }
    }
}
```

---

## 3. DISCOVER TAB

### File: `DiscoverScreen.kt` or similar

```kotlin
@Composable
fun DiscoverScreen() {
    val discoverItems by viewModel.discoverItems.collectAsState()
    
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(discoverItems.size) { index ->
            val item = discoverItems[index]
            
            // Regular discover card
            DiscoverCard(item)
            
            // Insert native ad every 10 items (full width)
            if ((index + 1) % 10 == 0 && index < discoverItems.size - 1) {
                item(span = { GridItemSpan(2) }) {
                    DiscoverNativeAd(
                        onAdClick = {
                            // TODO: Track ad click
                            // TODO: Navigate to ad destination
                        }
                    )
                }
            }
            
            // Insert banner ad every 20 items (full width)
            if ((index + 1) % 20 == 0 && index < discoverItems.size - 1) {
                item(span = { GridItemSpan(2) }) {
                    DiscoverBannerAd(
                        onAdClick = {
                            // TODO: Track ad click
                            // TODO: Navigate to ad destination
                        }
                    )
                }
            }
        }
    }
}
```

---

## 4. ADMIRING TAB (Home Tab - Admiring Section)

### File: `AdmiringScreen.kt` or `HomeScreen.kt` (Admiring section)

```kotlin
@Composable
fun AdmiringTab() {
    val admiringUsers by viewModel.admiringUsers.collectAsState()
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(admiringUsers.size) { index ->
            val user = admiringUsers[index]
            
            // Regular admiring user card
            AdmiringUserCard(user)
            
            // Insert ad every 12 users
            if ((index + 1) % 12 == 0 && index < admiringUsers.size - 1) {
                AdmiringFeedAd(
                    onAdClick = {
                        // TODO: Track ad click
                        // TODO: Navigate to ad destination
                    }
                )
            }
        }
    }
}
```

---

## 5. STORIES

### File: `StoriesScreen.kt` or similar

```kotlin
@Composable
fun StoriesScreen(initialStoryIndex: Int = 0) {
    val stories by viewModel.stories.collectAsState()
    
    // Build list with ads inserted
    val storiesWithAds = remember(stories) {
        buildList {
            stories.forEachIndexed { index, story ->
                add(StoryItem.Content(story))
                
                // Insert story ad every 5 stories
                if ((index + 1) % 5 == 0 && index < stories.size - 1) {
                    add(StoryItem.Ad)
                }
            }
        }
    }
    
    val pagerState = rememberPagerState(
        initialPage = initialStoryIndex,
        pageCount = { storiesWithAds.size }
    )
    
    HorizontalPager(
        state = pagerState,
        modifier = Modifier.fillMaxSize()
    ) { page ->
        when (val item = storiesWithAds[page]) {
            is StoryItem.Content -> {
                StoryView(story = item.story)
            }
            is StoryItem.Ad -> {
                StoryAd(
                    onAdClick = {
                        // TODO: Track ad click
                        // TODO: Navigate to ad destination
                    },
                    onDismiss = {
                        // Skip to next story
                        if (page < storiesWithAds.size - 1) {
                            pagerState.animateScrollToPage(page + 1)
                        }
                    }
                )
            }
        }
    }
}

// Helper sealed class
sealed class StoryItem {
    data class Content(val story: Story) : StoryItem()
    object Ad : StoryItem()
}
```

---

## 6. DRIPS TAB (Already Implemented)

### File: `DripsScreen.kt`

Already has comprehensive ad integration:
- ✅ Native ads every 6 posts
- ✅ Banner ads every 15 posts
- ✅ Story-style ads every 20 posts
- ✅ Sponsored posts with badge

No changes needed!

---

## ADMIN DASHBOARD ACCESS

### File: `ProfileScreen.kt` or `SettingsScreen.kt`

Add navigation to admin dashboard (only for SUPER_ADMIN):

```kotlin
@Composable
fun ProfileScreen() {
    val tokenManager = koinInject<TokenManager>()
    var adminRole by remember { mutableStateOf<String?>(null) }
    
    LaunchedEffect(Unit) {
        adminRole = tokenManager.getAdminRole()
    }
    
    LazyColumn {
        // ... other profile items
        
        // Show admin option only for SUPER_ADMIN
        if (adminRole == "SUPER_ADMIN") {
            item {
                ListItem(
                    headlineContent = { Text("Ad Management") },
                    leadingContent = {
                        Icon(Icons.Default.Campaign, "Ad Management")
                    },
                    modifier = Modifier.clickable {
                        navigator.push(AdminAdManagementScreen())
                    }
                )
            }
        }
    }
}
```

---

## AD CLICK TRACKING (TODO Implementation)

Create a shared ad tracking service:

```kotlin
// File: AdTrackingService.kt
class AdTrackingService(
    private val apiClient: ApiClient
) {
    suspend fun trackAdImpression(
        adId: String,
        adType: String,
        userId: String
    ) {
        try {
            apiClient.post("/api/v1/ads/track/impression") {
                setBody(mapOf(
                    "adId" to adId,
                    "adType" to adType,
                    "userId" to userId,
                    "timestamp" to System.currentTimeMillis()
                ))
            }
        } catch (e: Exception) {
            // Log error but don't block UI
            println("Failed to track impression: ${e.message}")
        }
    }
    
    suspend fun trackAdClick(
        adId: String,
        adType: String,
        userId: String,
        destinationUrl: String
    ) {
        try {
            apiClient.post("/api/v1/ads/track/click") {
                setBody(mapOf(
                    "adId" to adId,
                    "adType" to adType,
                    "userId" to userId,
                    "destinationUrl" to destinationUrl,
                    "timestamp" to System.currentTimeMillis()
                ))
            }
        } catch (e: Exception) {
            println("Failed to track click: ${e.message}")
        }
    }
}

// Usage in ad components
val adTracker = koinInject<AdTrackingService>()
val userId = tokenManager.getUserId()

LiveStreamBannerAd(
    onAdClick = {
        scope.launch {
            userId?.let {
                adTracker.trackAdClick(
                    adId = "ad_123",
                    adType = "LIVE_STREAM_BANNER",
                    userId = it,
                    destinationUrl = "https://example.com"
                )
            }
        }
        // Navigate to ad destination
    }
)
```

---

## TESTING CHECKLIST

For each tab integration:

1. **Visual Testing**
   - [ ] Ads render correctly
   - [ ] Sponsored badge visible
   - [ ] Layout doesn't break
   - [ ] Spacing looks good

2. **Functional Testing**
   - [ ] Ads appear at correct frequency
   - [ ] Click tracking works
   - [ ] Navigation works
   - [ ] No crashes

3. **Performance Testing**
   - [ ] Smooth scrolling
   - [ ] No memory leaks
   - [ ] Fast ad loading

4. **Edge Cases**
   - [ ] Empty feed (no ads)
   - [ ] Single item (no ads)
   - [ ] Network error (graceful fallback)

---

## QUICK INTEGRATION STEPS

1. **Copy import statement** to your screen file
2. **Copy relevant code block** for your tab
3. **Replace TODO comments** with actual implementation
4. **Test in emulator/device**
5. **Adjust frequencies** if needed (via admin dashboard)

---

## NEED HELP?

- **Documentation**: See COMPREHENSIVE_AD_SYSTEM.md
- **Deployment**: See RAILWAY_DEPLOYMENT_GUIDE.md
- **Support**: dev@runinga.com
