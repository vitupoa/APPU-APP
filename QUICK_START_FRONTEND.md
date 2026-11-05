# 🚀 QUICK START - Frontend Implementation (20 Minutes)

## ✅ Backend Status: 100% COMPLETE
- All APIs live and tested
- Redis caching active
- Workers running
- Security implemented
- Database optimized

---

## 📱 Frontend: 3 Simple Steps

### STEP 1: Add Repository Methods (5 min)
**File**: `composeApp/src/commonMain/kotlin/com/runinga/data/repository/FeedRepositoryImpl.kt`

```kotlin
override suspend fun getDiscoverFeed(limit: Int, cursor: String?): NetworkResult<DiscoverFeedResult> {
    return try {
        val response = client.get("${ApiConstants.BASE_URL}/recommendation/feed/discover") {
            parameter("limit", limit)
            cursor?.let { parameter("cursor", it) }
        }
        NetworkResult.Success(response.body())
    } catch (e: Exception) {
        NetworkResult.Error(e.message ?: "Failed to load discover feed")
    }
}

override suspend fun getAdmiringFeed(limit: Int, cursor: String?): NetworkResult<DiscoverFeedResult> {
    return try {
        val response = client.get("${ApiConstants.BASE_URL}/recommendation/feed/admiring") {
            parameter("limit", limit)
            cursor?.let { parameter("cursor", it) }
        }
        NetworkResult.Success(response.body())
    } catch (e: Exception) {
        NetworkResult.Error(e.message ?: "Failed to load admiring feed")
    }
}

override suspend fun trackInteraction(
    contentId: String,
    contentType: String,
    signalType: String,
    watchDuration: Long,
    totalDuration: Long
): NetworkResult<Unit> {
    return try {
        client.post("${ApiConstants.BASE_URL}/recommendation/interactions/track") {
            setBody(mapOf(
                "contentId" to contentId,
                "contentType" to contentType,
                "signalType" to signalType,
                "watchDuration" to watchDuration,
                "totalDuration" to totalDuration
            ))
        }
        NetworkResult.Success(Unit)
    } catch (e: Exception) {
        NetworkResult.Error(e.message ?: "Failed to track interaction")
    }
}
```

---

### STEP 2: Initialize Distribution on Upload (2 min)
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/shorts/presentation/viewmodel/CreateShortViewModel.kt`

**Add after successful upload:**

```kotlin
// Initialize content distribution
viewModelScope.launch {
    try {
        client.post("${ApiConstants.BASE_URL}/recommendation/distribution/initialize") {
            setBody(mapOf(
                "contentId" to shortId,
                "contentType" to "SHORT",
                "hashtags" to extractedHashtags,
                "location" to userLocation
            ))
        }
    } catch (e: Exception) {
        println("Failed to initialize distribution: ${e.message}")
    }
}
```

---

### STEP 3: Connect Tabs to APIs (10 min)

#### A. Discover Tab
**File**: Home tab implementation

```kotlin
// In Discover tab
val viewModel = getScreenModel<DiscoverFeedViewModel>()

LaunchedEffect(Unit) {
    viewModel.loadDiscoverFeed()
}

// In DiscoverFeedViewModel
fun loadDiscoverFeed() {
    viewModelScope.launch {
        when (val result = feedRepository.getDiscoverFeed(limit = 20)) {
            is NetworkResult.Success -> {
                _state.value = state.value.copy(items = result.data.content)
            }
            is NetworkResult.Error -> {
                // Handle error
            }
        }
    }
}
```

#### B. Admiring Tab
```kotlin
// In Admiring tab
val viewModel = getScreenModel<AdmiringFeedViewModel>()

LaunchedEffect(Unit) {
    viewModel.loadAdmiringFeed()
}

// In AdmiringFeedViewModel
fun loadAdmiringFeed() {
    viewModelScope.launch {
        when (val result = feedRepository.getAdmiringFeed(limit = 20)) {
            is NetworkResult.Success -> {
                _state.value = state.value.copy(items = result.data.content)
            }
            is NetworkResult.Error -> {
                // Handle error
            }
        }
    }
}
```

#### C. Track Interactions
**File**: Video player component

```kotlin
// Track view
DisposableEffect(videoUrl) {
    val startTime = System.currentTimeMillis()
    
    onDispose {
        val watchDuration = System.currentTimeMillis() - startTime
        viewModel.trackInteraction(
            contentId = videoId,
            contentType = "SHORT",
            signalType = "VIEW",
            watchDuration = watchDuration,
            totalDuration = videoDuration
        )
    }
}

// Track like
onLike = {
    viewModel.trackInteraction(videoId, "SHORT", "LIKE", 0, 0)
}

// Track share
onShare = {
    viewModel.trackInteraction(videoId, "SHORT", "SHARE", 0, 0)
}

// Track comment
onComment = {
    viewModel.trackInteraction(videoId, "SHORT", "COMMENT", 0, 0)
}
```

---

## 🎯 That's It!

### What You Get:
- ✅ Personalized Discover feed
- ✅ Admiring feed (99% unseen, 1% favorites)
- ✅ Smart content distribution
- ✅ User interest tracking
- ✅ Trending content
- ✅ Performance optimized (Redis caching)
- ✅ Secure (rate limited, authenticated)

### Test It:
1. Upload a short → Distribution initializes automatically
2. Open Discover tab → See personalized feed
3. Open Admiring tab → See content from admired creators
4. Watch videos → Interactions tracked automatically
5. Algorithm learns → Feed improves over time

---

## 📊 API Endpoints

```
GET  /api/v1/recommendation/feed/discover?limit=20
GET  /api/v1/recommendation/feed/admiring?limit=20
POST /api/v1/recommendation/interactions/track
POST /api/v1/recommendation/distribution/initialize
```

All require: `Authorization: Bearer <token>`

---

## 🐛 Troubleshooting

### Feed not loading?
- Check backend is running
- Verify JWT token is valid
- Check network logs

### Content not distributing?
- Verify distribution initialization is called after upload
- Check backend logs for worker messages

### Interactions not tracking?
- Check rate limit (100 req/10s)
- Verify contentId and contentType are correct

---

## 📝 Signal Types

Use these for `trackInteraction()`:
- `VIEW` - User watched video
- `LIKE` - User liked content
- `SHARE` - User shared content
- `COMMENT` - User commented
- `REWATCH` - User rewatched
- `SKIP` - User skipped
- `NOT_INTERESTED` - User marked not interested
- `HIDE` - User hid content
- `ADMIRE` - User admired creator
- `UNADMIRE` - User unadmired creator

---

**Total Time**: 20 minutes
**Difficulty**: Easy
**Status**: Ready to implement ✅
