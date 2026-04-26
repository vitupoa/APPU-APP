# Sponsored Content - Developer Quick Reference

## 🚀 Quick Start

### For Brand Users
1. Navigate to Brand Dashboard
2. Click "Create Campaign"
3. Fill in campaign details
4. Submit for admin approval
5. Wait for approval
6. Campaign goes live automatically

### For Admins
1. Navigate to Admin Approval Screen
2. Review pending campaigns
3. Approve or reject
4. Approved campaigns go live immediately

## 📱 Feed Integration

### Shorts Feed
```kotlin
// Injection happens automatically in ShortsViewModel
// Every 7 items, a sponsored short is injected
// Badge appears automatically if isSponsored(index) returns true
```

### Posts Feed
```kotlin
// Injection happens automatically in FeedViewModel
// Every 5 items, a sponsored post is injected
// Label appears automatically if isSponsored(index) returns true
```

### Contests Feed
```kotlin
// Injection happens automatically in ContestFeedViewModel
// Every 6 items, a sponsored contest is injected
// Badge appears automatically if isSponsored(index) returns true
```

## 🎯 Tracking Events

### Impression
Automatically tracked when sponsored content appears on screen:
```kotlin
LaunchedEffect(pagerState.currentPage) {
    if (viewModel.isSponsored(pagerState.currentPage)) {
        viewModel.recordSponsoredImpression(pagerState.currentPage)
    }
}
```

### View (3+ seconds)
Automatically tracked for video content:
```kotlin
LaunchedEffect(isPlaying, isActive) {
    if (isPlaying && isActive) {
        while (true) {
            delay(1000)
            watchTime++
            onWatchTimeUpdate(watchTime) // Triggers recordSponsoredView at 3s
        }
    }
}
```

### Engagement
Tracked on user actions:
```kotlin
onLike = { 
    viewModel.toggleLike(short.id)
    if (viewModel.isSponsored(page)) {
        viewModel.recordSponsoredEngagement(page, "like")
    }
}
```

## 🔧 API Usage

### Create Campaign
```kotlin
val request = CreateSponsoredCampaignRequest(
    contentType = "short",
    contentId = "short_id_here",
    campaignName = "Summer Sale 2025",
    budget = 1000.0,
    pricingModel = "CPM",
    bidAmount = 10.0,
    startDate = "2025-06-01",
    endDate = "2025-06-30",
    targeting = SponsoredTargeting(
        ageMin = 18,
        ageMax = 35,
        gender = listOf("male", "female"),
        countries = listOf("KE", "UG", "TZ")
    )
)
api.createCampaign(request)
```

### Get Campaign Analytics
```kotlin
val analytics = api.getCampaignAnalytics(campaignId)
println("Impressions: ${analytics.impressions}")
println("CPM: ${analytics.cpm}")
println("CTR: ${analytics.ctr}%")
```

### Toggle Campaign
```kotlin
api.toggleCampaign(campaignId) // Pauses if active, resumes if paused
```

## 🎨 UI Components

### Sponsored Badge (for videos)
```kotlin
if (isSponsored) {
    SponsoredComponents.SponsoredBadge(
        modifier = Modifier.padding(bottom = 8.dp)
    )
}
```

### Sponsored Label (for text)
```kotlin
if (isSponsored) {
    SponsoredComponents.SponsoredLabel()
}
```

## 📊 Pricing Models

| Model | Description | Use Case |
|-------|-------------|----------|
| CPM | Cost per 1000 impressions | Brand awareness |
| CPV | Cost per view (3+ seconds) | Video engagement |
| CPE | Cost per engagement | Social interaction |
| CPC | Cost per click | Traffic generation |
| FLAT_FEE | Fixed campaign cost | Guaranteed placement |

## 🔐 Admin Functions

### Approve Campaign
```kotlin
api.approveCampaign(campaignId)
```

### Reject Campaign
```kotlin
api.rejectCampaign(campaignId)
```

### Get Pending Campaigns
```kotlin
val pending = api.getPendingCampaigns()
```

## 🐛 Debugging

### Check if content is sponsored
```kotlin
val isSponsored = viewModel.isSponsored(index)
println("Is sponsored: $isSponsored")
```

### Verify injection
```kotlin
println("Total items: ${state.items.size}")
println("Sponsored indices: ${state.sponsoredIndices}")
```

### Test tracking
```kotlin
// Enable logging in SponsoredContentManager
sponsoredManager.recordImpression() // Should log to console
```

## ⚠️ Common Issues

### Sponsored content not appearing
1. Check if campaign is approved (status = ACTIVE)
2. Verify campaign dates (startDate <= now <= endDate)
3. Check budget (spent < budget)
4. Verify targeting matches user profile

### Tracking not working
1. Ensure user is authenticated
2. Check network connectivity
3. Verify campaign ID is correct
4. Check if tracking endpoints are responding

### Badge not showing
1. Verify `isSponsored(index)` returns true
2. Check if `SponsoredComponents` is imported
3. Ensure badge is not hidden by other UI elements

## 📈 Performance Tips

1. **Lazy Loading**: Sponsored content is fetched asynchronously
2. **Silent Fail**: If no sponsored content available, feed continues normally
3. **Caching**: Consider caching sponsored content for offline viewing
4. **Batch Tracking**: Track events in batches to reduce API calls

## 🔗 Related Files

- Backend: `backend/src/modules/sponsored/`
- Frontend: `composeApp/src/commonMain/kotlin/com/krieta/feature/sponsored/`
- Docs: `SPONSORED_CONTENT_COMPLETE.md`
- Summary: `SPONSORED_IMPLEMENTATION_SUMMARY.md`

## 📞 Need Help?

1. Check `SPONSORED_CONTENT_COMPLETE.md` for detailed documentation
2. Review `SPONSORED_CONTENT_SYSTEM.md` for architecture
3. See implementation examples in ViewModels
4. Test with sample campaigns in development

---

**Last Updated**: 2025
**Version**: 1.0.0
