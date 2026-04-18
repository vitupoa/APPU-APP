# Complete Setup & Testing Guide

## 🚀 Quick Start

### 1. Database Migrations

The backend now includes a safe migration runner that tracks executed migrations.

**Run migrations**:
```bash
cd backend
npm run db:migrate:run
```

**Expected Output**:
```
🔄 Starting database migrations...

✅ Found 0 previously executed migrations

🔧 Running migration: add_contest_vote_fields.sql
✅ Successfully executed add_contest_vote_fields.sql

🔧 Running migration: add_feeds_and_voting.sql
✅ Successfully executed add_feeds_and_voting.sql

📊 Migration Summary:
   ✅ Executed: 2
   ⏭️  Skipped: 0
   📝 Total: 2

🎉 Database migrations completed successfully!
```

**What the migrations do**:
- Add `downvotes_count` to contest submissions
- Add `vote_type` (UPVOTE/DOWNVOTE) to contest votes
- Rename `voter_id` to `user_id` in contest_votes
- Create generic `likes` and `views` tables
- Migrate existing likes to generic table
- Add necessary indexes for performance
- Update shorts table structure

**Re-running is safe**: The script tracks executed migrations and skips them automatically.

---

### 2. Cloudinary Configuration

Your Cloudinary setup is **already correct** for signed uploads. The backend properly generates signatures without including the folder parameter.

**Current Configuration**:
- ✅ Signed upload preset: "Krieta"
- ✅ Asset folder: "Krieta/uploads" (configured in preset)
- ✅ Signature includes: `timestamp`, `upload_preset`, `api_key`
- ✅ Folder NOT included in signature (correct for signed presets)

**Verify Cloudinary Dashboard Settings**:
1. Go to Settings → Upload
2. Find preset "Krieta"
3. Ensure:
   - Signing mode: **Signed**
   - Asset folder: **Krieta/uploads**
   - Preset is enabled

**The upload flow**:
```
Mobile App → Backend (/media/upload-signature) → Get signature
          → Cloudinary API (with signature) → Upload success
```

**If still getting errors**, check:
```bash
# Test signature generation
curl http://localhost:3000/api/v1/media/upload-signature?folder=Krieta/profile/Images&resourceType=image \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "signature": "abc123...",
  "timestamp": 1705334400,
  "uploadPreset": "Krieta",
  "folder": "Krieta/profile/Images",
  "resourceType": "image",
  "apiKey": "your_api_key",
  "cloudName": "your_cloud_name"
}
```

---

### 3. Video Player Testing

The video player now includes:
- ✅ Buffering indicators
- ✅ Error handling with user-friendly messages
- ✅ Automatic retry on URL change
- ✅ Proper resource cleanup

**Test on Android**:
```bash
cd Krieta
.\gradlew.bat :composeApp:assembleDebug
```

**Test on iOS**:
Open `iosApp/iosApp.xcodeproj` in Xcode and run.

**What to test**:
1. Video loads and plays automatically
2. Buffering spinner shows while loading
3. Error message displays if video fails
4. Tap to pause/play works
5. Swipe to next video releases previous player
6. No memory leaks after viewing 20+ videos

**Expected behavior**:
- Videos start playing within 1-2 seconds
- Smooth transitions between videos
- Buffering indicator appears during loading
- Error state shows "Failed to load video" if URL is invalid

---

### 4. WebSocket Testing

The WebSocket service now includes:
- ✅ Connection state monitoring
- ✅ Heartbeat with stale connection detection
- ✅ Enhanced logging
- ✅ Connection metrics API
- ✅ Force reconnect capability

**Start backend with WebSocket support**:
```bash
cd backend
npm run dev
```

**Test WebSocket connection**:

1. **Launch mobile app and login**
2. **Check logs for connection**:
   ```
   [WebSocket] Connecting to: ws://10.0.2.2:3000/socket.io/...
   [WebSocket] Authentication message sent
   [WebSocket] Connection established
   ```

3. **Test reconnection**:
   - Enable airplane mode
   - Wait 5 seconds
   - Disable airplane mode
   - Verify automatic reconnection

4. **Test event delivery**:
   ```bash
   # In another terminal, trigger a test event
   curl -X POST http://localhost:3000/api/v1/contests/submissions/SUBMISSION_ID/vote \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"voteType":"UPVOTE"}'
   ```
   
   Mobile app should receive `vote_update` event.

**Monitor connection health**:
The app now tracks connection metrics. Add this to any screen for debugging:

```kotlin
val metrics = webSocketService.getConnectionMetrics()
Text("WS State: ${metrics["state"]}")
Text("Reconnects: ${metrics["reconnectAttempts"]}")
Text("Last message: ${metrics["timeSinceLastMessage"]}ms ago")
```

**See full testing guide**: `WEBSOCKET_VALIDATION_GUIDE.md`

---

## 🧪 Complete Testing Checklist

### Backend Tests

- [ ] **Database migrations run successfully**
  ```bash
  npm run db:migrate:run
  ```

- [ ] **Backend starts without errors**
  ```bash
  npm run dev
  ```

- [ ] **Health check responds**
  ```bash
  curl http://localhost:3000/health
  ```

- [ ] **Cloudinary signature endpoint works**
  ```bash
  curl http://localhost:3000/api/v1/media/upload-signature?folder=Krieta/profile/Images&resourceType=image \
    -H "Authorization: Bearer TOKEN"
  ```

- [ ] **WebSocket endpoint accessible**
  ```bash
  # Install wscat: npm install -g wscat
  wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket
  ```

### Mobile App Tests

- [ ] **App builds successfully**
  - Android: `.\gradlew.bat :composeApp:assembleDebug`
  - iOS: Build in Xcode

- [ ] **Login works**
  - Email/password login
  - OAuth login (if configured)

- [ ] **Image upload works**
  - Navigate to Edit Profile
  - Upload avatar image
  - Upload banner image
  - Verify images appear in Cloudinary dashboard

- [ ] **Video player works**
  - Navigate to Shorts feed
  - Videos load and play automatically
  - Buffering indicator shows
  - Tap to pause/play
  - Swipe to next video

- [ ] **WebSocket connects**
  - Check logs for connection success
  - Test reconnection (airplane mode)
  - Verify events received

- [ ] **Contest voting works**
  - Navigate to Contests tab
  - Swipe right to upvote
  - Swipe left to downvote
  - Vote count updates

- [ ] **Tipping works**
  - Navigate to Discover tab
  - Tap gift icon on non-contest content
  - Enter tip amount
  - Verify balance deduction

### Integration Tests

- [ ] **Real-time vote updates**
  - User A votes on submission
  - User B sees vote count update instantly

- [ ] **Real-time wallet updates**
  - User receives tip
  - Wallet balance updates without refresh

- [ ] **Contest submission feed**
  - Submissions load correctly
  - Pagination works
  - Contest banner displays

- [ ] **Profile editing**
  - Update display name
  - Update bio
  - Changes persist after app restart

---

## 🐛 Troubleshooting

### Cloudinary Upload Fails

**Error**: "Upload preset must be whitelisted for unsigned uploads"

**Solution**: Your preset is signed, which is correct. Verify:
1. Backend generates signature correctly
2. Mobile app sends all required params: `api_key`, `timestamp`, `signature`, `upload_preset`, `file`
3. Mobile app does NOT send `folder` parameter (it's in the preset)

**Debug**:
```bash
# Check backend logs for signature generation
# Check mobile logs for upload parameters
```

### Video Player Not Working

**Error**: Black screen or "Failed to load video"

**Solution**:
1. Verify video URL is accessible
2. Check video format (MP4 recommended)
3. Ensure ExoPlayer dependencies installed (Android)
4. Check iOS permissions for network access

**Debug**:
```kotlin
// Add to VideoPlayer
println("Loading video: $url")
```

### WebSocket Not Connecting

**Error**: Connection refused or timeout

**Solution**:
1. Verify backend is running: `curl http://localhost:3000/health`
2. Check BASE_URL in ApiConstants matches backend
3. For Android emulator, use `10.0.2.2` instead of `localhost`
4. For iOS simulator, use actual IP address

**Debug**:
```bash
# Test WebSocket endpoint
wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```

### Database Migration Fails

**Error**: Column already exists or constraint violation

**Solution**:
The migration script is idempotent and uses `IF NOT EXISTS` clauses. If it fails:
1. Check database connection: `psql $DATABASE_URL -c "SELECT 1"`
2. Review error message for specific issue
3. Manually fix if needed, then re-run

**Debug**:
```bash
# Check migration tracking table
psql $DATABASE_URL -c "SELECT * FROM _migrations"
```

---

## 📊 Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable |
|--------|--------|------------|
| Video load time | < 1s | < 2s |
| Image upload time | < 3s | < 5s |
| WebSocket connection | < 2s | < 5s |
| WebSocket reconnection | < 5s | < 10s |
| Event delivery latency | < 500ms | < 1s |
| Feed load time | < 500ms | < 1s |
| Vote registration | < 300ms | < 500ms |

### Monitoring

Add performance logging:
```kotlin
val startTime = System.currentTimeMillis()
// ... operation ...
val duration = System.currentTimeMillis() - startTime
println("Operation took ${duration}ms")
```

---

## 🎯 Next Steps

### Immediate (Today)
1. ✅ Run database migrations
2. ✅ Test Cloudinary uploads
3. ✅ Test video player
4. ✅ Validate WebSocket connection

### This Week
1. Test on real devices (not just emulator/simulator)
2. Implement comment screen
3. Add contest submission creation
4. Performance optimization

### Before Launch
1. Security audit
2. Load testing
3. Beta user testing
4. Analytics integration
5. Crash reporting setup

---

## 📝 Summary

### What's Been Fixed/Enhanced

1. **Cloudinary**: Already correctly configured for signed uploads
2. **Video Player**: Now includes buffering states and error handling
3. **Database Migrations**: Safe runner script with tracking
4. **WebSocket**: Enhanced with state monitoring, heartbeat, and metrics

### What's Ready to Test

- ✅ Image uploads with Cloudinary
- ✅ Video playback with buffering/error states
- ✅ WebSocket real-time updates
- ✅ Database schema updates
- ✅ Contest voting
- ✅ Tipping system
- ✅ All core features

### What's Next

Focus on testing the implemented features, fixing any bugs found, and preparing for production deployment.

---

## 🆘 Support

If you encounter issues:
1. Check logs (backend and mobile)
2. Review this guide's troubleshooting section
3. Verify all dependencies installed
4. Test individual components in isolation
5. Check network connectivity

**Key Log Locations**:
- Backend: Console output from `npm run dev`
- Android: Logcat in Android Studio
- iOS: Console in Xcode
