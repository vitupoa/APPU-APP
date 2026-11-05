# Live Streaming - Quick Reference

## 🎯 Quick Start

### User Flow
```
FAB+ → Live → Choose Type → Setup → GO LIVE
```

### 4 Live Types
1. **📹 Normal Live** - Standard streaming
2. **🛍️ Sell** - Live shopping with products
3. **⚔️ Battle/PK** - Compete with another creator
4. **👥 Multi-Guest** - Host up to 5 guests

---

## 📁 File Structure

```
feature/live/
├── presentation/
│   ├── screen/
│   │   ├── StartLiveScreen.kt       ← Live type selection
│   │   ├── HostLiveScreen.kt        ← Main live screen (all types)
│   │   ├── ViewerLiveScreen.kt      ← Viewer experience
│   │   └── LiveDiscoveryScreen.kt   ← Browse active streams
│   └── viewmodel/
│       ├── HostLiveViewModel.kt     ← Host state management
│       └── ViewerLiveViewModel.kt   ← Viewer state management
├── domain/
│   ├── model/
│   │   └── LiveStream.kt            ← Data models
│   └── repository/
│       └── LiveRepository.kt        ← API interface
└── data/
    ├── repository/
    │   └── LiveRepositoryImpl.kt    ← API implementation
    └── socket/
        └── LiveSocketManager.kt     ← WebSocket handling
```

---

## 🎨 UI Components

### StartLiveScreen
```kotlin
// 4 cards for live types
LiveTypeCard(
    title = "Go Live",
    emoji = "📹",
    color = Color(0xFFE53935)
)
```

### HostLiveScreen
```kotlin
// Constructor
HostLiveScreen(
    liveType: LiveType = LiveType.NORMAL,
    productId: String? = null
)

// Features:
- Setup dialog (title, description)
- Camera preview (placeholder)
- Live badge + viewer count
- Real-time chat
- Host controls
- Product card (commerce)
- Split-screen (battle)
- Grid layout (multi-guest)
```

---

## 🔌 Backend Integration

### API Endpoints
```typescript
POST   /api/live/start                    // Start stream
POST   /api/live/:id/end                  // End stream
GET    /api/live/active                   // Get active streams
POST   /api/live/:id/join                 // Join as viewer
POST   /api/live/:id/message              // Send message
POST   /api/live/:id/like                 // Send like
POST   /api/live/:id/tip                  // Send gift
POST   /api/live/:id/battle/start         // Start battle
POST   /api/live/:id/cohost/invite        // Invite co-host
POST   /api/live/:id/product/pin          // Pin product
```

### WebSocket Events
```typescript
// Emit
viewer:join, viewer:leave, message:send, like:send

// Listen
message, viewer:joined, viewer:left, tip:received, 
like:received, stream:ended
```

---

## 💾 State Management

### HostLiveState
```kotlin
data class HostLiveState(
    val isLoading: Boolean = false,
    val isLive: Boolean = false,
    val stream: LiveStream? = null,
    val viewerCount: Int = 0,
    val likesCount: Int = 0,
    val messages: List<ChatMessage> = emptyList(),
    val liveType: LiveType = LiveType.NORMAL,
    val productId: String? = null,
    val hostScore: Double = 0.0,
    val opponentScore: Double = 0.0,
    val coHosts: List<CoHost> = emptyList()
)
```

### ViewModel Actions
```kotlin
viewModel.startLive(title, description)
viewModel.endLive()
viewModel.sendMessage(text)
viewModel.sendLike()
```

---

## 🎥 Camera Integration (TODO)

### Android (CameraX)
```kotlin
// androidMain
expect class CameraManager {
    fun startCamera()
    fun stopCamera()
    fun switchCamera()
}
```

### iOS (AVFoundation)
```swift
// iosMain
actual class CameraManager {
    private let captureSession = AVCaptureSession()
}
```

---

## 🔐 Security Features

### Chat Moderation
- Banned word filter
- Host can ban/mute viewers
- Message rate limiting

### Access Control
- Chama-exclusive streams
- Paid unlock streams
- Age restrictions

---

## 💰 Monetization

### Revenue Streams
1. **Gifts/Tips** - 15% platform fee
2. **Live Shopping** - Sales commission
3. **Paid Streams** - Unlock fee
4. **Battle Entry** - Contest fees

### Payment Flow
```
100 Rc gift → 85 Rc creator + 15 Rc platform
```

---

## 🧪 Testing

### Test Normal Live
```kotlin
// 1. Click FAB+ → Live → Go Live
// 2. Enter title "Test Stream"
// 3. Click GO LIVE
// 4. Verify: live badge, viewer count, chat input
```

### Test Live Shopping
```kotlin
// 1. Click FAB+ → Live → Sell
// 2. Select product
// 3. Enter title
// 4. Verify: product card shows at bottom
```

### Test Battle/PK
```kotlin
// 1. Click FAB+ → Live → Battle/PK
// 2. Enter title
// 3. Verify: split-screen with scores
```

### Test Multi-Guest
```kotlin
// 1. Click FAB+ → Live → Multi-Guest
// 2. Enter title
// 3. Click "Invite" button
// 4. Verify: grid layout updates
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Stream won't start | Check camera permissions |
| Chat not working | Verify WebSocket connection |
| High latency | Reduce video quality |
| Battle scores stuck | Check tip transaction |

---

## 📊 Performance

### Metrics
- Chat: Last 50 messages only
- WebSocket: Auto-reconnect
- Video: Adaptive bitrate
- Battery: ~20-25%/hour

---

## 🚀 Next Steps

### Phase 1: Camera ✅
- [x] UI for all 4 types
- [x] State management
- [ ] Camera preview

### Phase 2: Backend
- [ ] API integration
- [ ] WebSocket sync
- [ ] Real-time updates

### Phase 3: Streaming
- [ ] WebRTC setup
- [ ] Media server
- [ ] HLS playback

---

## 📝 Code Snippets

### Start a Live Stream
```kotlin
val navigator = LocalNavigator.currentOrThrow
navigator.push(
    HostLiveScreen(
        liveType = LiveType.NORMAL
    )
)
```

### With Product
```kotlin
navigator.push(
    HostLiveScreen(
        liveType = LiveType.COMMERCE,
        productId = "product_123"
    )
)
```

### Send Chat Message
```kotlin
viewModel.sendMessage("Hello everyone!")
```

### End Stream
```kotlin
viewModel.endLive()
navigator.pop()
```

---

## 🎯 Key Features

✅ 4 live types (Normal, Commerce, Battle, Multi-Guest)  
✅ Real-time chat UI  
✅ Viewer count tracking  
✅ Like/heart system  
✅ Product card overlay  
✅ Split-screen battle view  
✅ Multi-guest grid layout  
✅ Host controls (filters, moderation)  
✅ Setup dialog with title/description  
✅ Mock data for testing  

⏳ Camera integration (next)  
⏳ Backend API connection (next)  
⏳ WebRTC streaming (next)  

---

## 📞 Support

For issues or questions:
1. Check `LIVE_STREAMING_IMPLEMENTATION.md` for detailed docs
2. Review backend API in `backend/src/modules/live/`
3. Test with mock data first
4. Verify WebSocket connection

**Status: UI Complete, Ready for Camera Integration** 🎬
