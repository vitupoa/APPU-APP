# Quick Start Guide

## Testing the New Features

### 1. Edit Profile with Native Image Upload

**Steps:**
1. Navigate to Profile tab
2. Tap "Edit Profile"
3. Scroll to "Avatar Image" section
4. Tap "Upload from Device"
5. Select an image from gallery or take a photo
6. Wait for upload progress indicator
7. Preview the uploaded image
8. Repeat for "Banner Image"
9. Tap "Save Changes"

**Expected Behavior:**
- File picker opens with image selection
- Upload progress shows during upload
- Image preview appears after successful upload
- Save button is enabled after changes
- Profile updates with new images

**Troubleshooting:**
- If upload fails, check Cloudinary configuration
- Ensure backend `/media/upload-signature` endpoint is working
- Check network connectivity
- Verify file size is reasonable (< 10MB)

### 2. Home Tab with 3-Tab Layout

**Steps:**
1. Navigate to Home tab
2. Observe 3 tabs at top: Contests | Discover | Admiring
3. Tap each tab to switch content
4. Verify yellow underline indicator moves
5. Verify vertical dividers between tabs

**Expected Behavior:**
- Contests tab shows contest submission feed
- Discover tab shows shorts/videos
- Admiring tab shows posts from followed users
- Active tab is white and bold
- Inactive tabs are semi-transparent

### 3. Contest Submission Feed

**Steps:**
1. Navigate to Home tab
2. Ensure "Contests" tab is selected
3. Swipe up/down to navigate submissions
4. Observe contest banner at top
5. Tap contest banner to view details

**Expected Behavior:**
- Full-screen vertical scrolling
- Contest banner shows at top with prize info
- Smooth transitions between submissions
- Video/photo displays correctly
- Creator info shows at bottom

### 4. Swipe Voting

**Steps:**
1. In contest submission feed
2. Swipe right on a submission (upvote)
3. Observe green overlay and thumbs up icon
4. Swipe left on a submission (downvote)
5. Observe red overlay and thumbs down icon
6. Release to register vote

**Expected Behavior:**
- Swipe threshold is ~300px
- Visual feedback during swipe
- Vote count updates after release
- Cannot vote on same submission twice
- Only upvotes are displayed

### 5. Tipping

**Steps:**
1. Navigate to Discover or Admiring tab
2. Find non-contest content
3. Tap gift icon on right side
4. Tipping modal opens
5. Enter amount or use quick buttons
6. Observe Rc ↔ Fiat conversion
7. Tap "Send Tip"

**Expected Behavior:**
- Modal shows recipient info
- Currency conversion is real-time
- Quick buttons: 50, 100, 500, 1000 Rc
- Balance validation (min 50 Rc)
- Redirects to wallet if insufficient balance
- Tip button NOT shown on contest content

### 6. Action Buttons

**Steps:**
1. In any feed (Contests, Discover, Admiring)
2. Observe right-side action buttons
3. Tap like button
4. Tap comment button
5. Tap share button

**Expected Behavior:**
- Like button turns red when liked
- Comment count updates
- Share sheet opens
- Buttons are responsive
- Counts update in real-time

## Common Issues and Solutions

### Issue: Images not uploading
**Solution:**
- Check Cloudinary credentials in backend
- Verify `/media/upload-signature` endpoint
- Check file size (max 10MB)
- Ensure proper permissions for file access

### Issue: Contest submissions not loading
**Solution:**
- Verify backend API is running
- Check `/contests/submissions/feed` endpoint
- Ensure database has contest submissions
- Check network connectivity

### Issue: Tipping not working
**Solution:**
- Verify wallet balance
- Check minimum tip amount (50 Rc)
- Ensure user is not tipping own content
- Verify exchange rate is loaded

### Issue: Swipe voting not registering
**Solution:**
- Ensure swipe distance exceeds threshold (300px)
- Check if user already voted on submission
- Verify backend voting endpoint
- Check for rate limiting

### Issue: Tabs not switching
**Solution:**
- Check if screens are properly initialized
- Verify navigation setup
- Check for console errors
- Restart app

## Development Tips

### Testing with Mock Data
If backend is not ready, you can test with mock data:

```kotlin
// In ContestSubmissionFeedViewModel
init {
    _state.value = ContestSubmissionFeedState(
        submissions = listOf(
            ContestSubmission(
                id = "1",
                user = ContestCreator("u1", "johndoe", "John Doe", "https://..."),
                contestId = "c1",
                mediaUrl = "https://...",
                mediaType = "VIDEO",
                proofScreenshots = emptyList(),
                votes = 150,
                rank = 1,
                createdAt = "2024-01-15T10:30:00Z"
            )
        ),
        isLoading = false
    )
}
```

### Debugging Tips
1. Enable verbose logging in Ktor client
2. Check Logcat/Console for errors
3. Use breakpoints in ViewModels
4. Verify API responses with Postman
5. Test on real device for gestures

### Performance Testing
1. Test with 100+ submissions
2. Monitor memory usage during scrolling
3. Check video playback performance
4. Test on low-end devices
5. Monitor network usage

## Next Steps

1. **Backend Integration:**
   - Implement required API endpoints (see BACKEND_API_REQUIREMENTS.md)
   - Test with real data
   - Set up proper error handling

2. **Video Player:**
   - Implement expect/actual for ExoPlayer (Android) and AVPlayer (iOS)
   - Add playback controls
   - Handle buffering states

3. **Real-time Updates:**
   - Integrate WebSocket for live vote counts
   - Add real-time notifications
   - Implement optimistic updates

4. **Analytics:**
   - Track user engagement
   - Monitor voting patterns
   - Analyze tipping behavior

5. **Optimization:**
   - Implement image caching
   - Add video preloading
   - Optimize network requests

## Support

For issues or questions:
1. Check console logs for errors
2. Review implementation files
3. Verify backend API responses
4. Test on different devices
5. Check network connectivity

## Resources

- [Kotlin Multiplatform Documentation](https://kotlinlang.org/docs/multiplatform.html)
- [Compose Multiplatform](https://www.jetbrains.com/lp/compose-multiplatform/)
- [Voyager Navigation](https://voyager.adriel.cafe/)
- [Coil Image Loading](https://coil-kt.github.io/coil/)
- [FileKit](https://github.com/vinceglb/FileKit)
