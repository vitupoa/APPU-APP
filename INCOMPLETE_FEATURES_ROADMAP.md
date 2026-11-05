# INCOMPLETE FEATURES - IMPLEMENTATION ROADMAP

## Priority Matrix

### 🔴 CRITICAL (P0) - Core Functionality Blockers
1. **Native Video Player** - App won't work without proper video playback
2. **iOS Keychain** - Security vulnerability, tokens stored insecurely
3. **Live Streaming Socket.io** - Core feature completely non-functional

### 🟡 HIGH (P1) - Major Features Incomplete
4. **Wallet Top-up/Withdrawal** - Revenue-critical, users can't cash out
5. **Judge Notifications** - Contest feature incomplete
6. **Chama Frontend Integration** - Backend complete, just needs wiring

### 🟢 MEDIUM (P2) - Enhancement Features
7. **Social Media OAuth** - Nice-to-have for influencer profiles

---

## 1. Native Video Player (P0) 🔴

### Current State
- Android: Uses ExoPlayer (✅ Complete)
- iOS: Needs AVPlayer implementation
- Contest feed: Has placeholder comment

### Implementation Plan

#### iOS AVPlayer Implementation
**File**: `composeApp/src/iosMain/kotlin/com/runinga/com/core/ui/components/VideoPlayer.ios.kt`

```kotlin
@Composable
actual fun VideoPlayer(
    url: String,
    isPlaying: Boolean,
    modifier: Modifier,
    onPlaybackStateChanged: (Boolean) -> Unit,
    onProgressUpdate: (currentPosition: Long, duration: Long) -> Unit,
    seekToPosition: Long?
) {
    // Use AVPlayerLayer with UIViewRepresentable
    // Implement AVPlayerItemObserver for progress
    // Handle lifecycle events
}
```

**Estimated Time**: 4-6 hours
**Dependencies**: AVFoundation, AVKit frameworks

---

## 2. iOS Keychain (P0) 🔴

### Current State
```kotlin
// Placeholder - needs Security framework integration
actual class SecureTokenManager {
    actual fun saveToken(key: String, token: String) {
        // TODO: Use iOS Keychain
    }
}
```

### Implementation Plan

**File**: `composeApp/src/iosMain/kotlin/com/runinga/com/core/security/SecureTokenManager.ios.kt`

```kotlin
import platform.Security.*
import platform.Foundation.*

actual class SecureTokenManager {
    actual fun saveToken(key: String, token: String) {
        val query = mapOf(
            kSecClass to kSecClassGenericPassword,
            kSecAttrAccount to key,
            kSecValueData to token.encodeToByteArray().toNSData()
        )
        SecItemAdd(query as CFDictionaryRef, null)
    }
    
    actual fun getToken(key: String): String? {
        val query = mapOf(
            kSecClass to kSecClassGenericPassword,
            kSecAttrAccount to key,
            kSecReturnData to kCFBooleanTrue,
            kSecMatchLimit to kSecMatchLimitOne
        )
        val result = SecItemCopyMatching(query as CFDictionaryRef, null)
        return result?.toByteArray()?.decodeToString()
    }
    
    actual fun deleteToken(key: String) {
        val query = mapOf(
            kSecClass to kSecClassGenericPassword,
            kSecAttrAccount to key
        )
        SecItemDelete(query as CFDictionaryRef)
    }
}
```

**Estimated Time**: 2-3 hours
**Security Impact**: HIGH - Currently tokens are insecure

---

## 3. Live Streaming Socket.io (P0) 🔴

### Current State
```kotlin
// Stubbed with TODOs
class LiveStreamViewModel {
    fun connectToStream(streamId: String) {
        // TODO: Socket.io connection
    }
}
```

### Implementation Plan

#### Step 1: Add Socket.io Client
**File**: `composeApp/build.gradle.kts`
```kotlin
commonMain.dependencies {
    implementation("io.socket:socket.io-client:2.1.0")
}
```

#### Step 2: Create Socket Manager
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/data/LiveSocketManager.kt`

```kotlin
class LiveSocketManager(private val baseUrl: String) {
    private var socket: Socket? = null
    
    fun connect(streamId: String, token: String) {
        val options = IO.Options().apply {
            auth = mapOf("token" to token)
            transports = arrayOf("websocket")
        }
        
        socket = IO.socket("$baseUrl/live", options).apply {
            on(Socket.EVENT_CONNECT) { onConnected() }
            on("message") { args -> onMessage(args) }
            on("viewer_joined") { args -> onViewerJoined(args) }
            on("viewer_left") { args -> onViewerLeft(args) }
            on("tip_received") { args -> onTipReceived(args) }
            on("like_received") { args -> onLikeReceived(args) }
            connect()
        }
    }
    
    fun sendMessage(message: String) {
        socket?.emit("send_message", JSONObject().apply {
            put("text", message)
        })
    }
    
    fun sendTip(amount: Double, message: String?) {
        socket?.emit("send_tip", JSONObject().apply {
            put("amount", amount)
            put("message", message)
        })
    }
    
    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
```

#### Step 3: Update ViewModel
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/presentation/viewmodel/LiveStreamViewModel.kt`

```kotlin
class LiveStreamViewModel(
    private val socketManager: LiveSocketManager
) : ScreenModel {
    
    private val _messages = MutableStateFlow<List<LiveMessage>>(emptyList())
    val messages = _messages.asStateFlow()
    
    private val _viewerCount = MutableStateFlow(0)
    val viewerCount = _viewerCount.asStateFlow()
    
    fun connectToStream(streamId: String) {
        socketManager.connect(streamId, getAuthToken())
    }
    
    fun sendMessage(text: String) {
        socketManager.sendMessage(text)
    }
    
    fun sendTip(amount: Double, message: String?) {
        socketManager.sendTip(amount, message)
        // Show tip animation
        _showTipAnimation.value = true
    }
    
    private fun onMessageReceived(message: LiveMessage) {
        _messages.value = _messages.value + message
    }
    
    private fun onViewerCountChanged(count: Int) {
        _viewerCount.value = count
    }
}
```

**Estimated Time**: 6-8 hours
**Dependencies**: Socket.io client library

---

## 4. Wallet Top-up/Withdrawal (P1) 🟡

### Current State
- M-Pesa service exists but incomplete
- PayPal service exists but incomplete
- Paystack service exists but incomplete

### Implementation Plan

#### M-Pesa Integration
**File**: `backend/src/modules/wallet/services/mpesa.service.ts`

```typescript
export class MpesaService {
  async initiateSTKPush(phoneNumber: string, amount: number, userId: string) {
    // 1. Get OAuth token
    const token = await this.getAccessToken();
    
    // 2. Initiate STK Push
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: env.MPESA_SHORTCODE,
        Password: this.generatePassword(),
        Timestamp: this.getTimestamp(),
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: `${env.MPESA_CALLBACK_URL}/topup`,
        AccountReference: userId,
        TransactionDesc: 'Runinga Wallet Top-up'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data;
  }
  
  async handleCallback(data: any) {
    // Process M-Pesa callback
    if (data.Body.stkCallback.ResultCode === 0) {
      // Success - credit wallet
      const userId = data.Body.stkCallback.CallbackMetadata.Item
        .find(i => i.Name === 'AccountReference').Value;
      const amount = data.Body.stkCallback.CallbackMetadata.Item
        .find(i => i.Name === 'Amount').Value;
      
      await this.creditWallet(userId, amount);
    }
  }
}
```

#### PayPal Integration
**File**: `backend/src/modules/wallet/services/paypal.service.ts`

```typescript
export class PayPalService {
  async createOrder(amount: number, currency: string) {
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: currency, value: amount.toString() }
        }],
        application_context: {
          return_url: `${env.APP_URL}/wallet/topup/success`,
          cancel_url: `${env.APP_URL}/wallet/topup/cancel`
        }
      },
      { auth: { username: env.PAYPAL_CLIENT_ID, password: env.PAYPAL_CLIENT_SECRET } }
    );
    
    return response.data;
  }
  
  async captureOrder(orderId: string) {
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      { auth: { username: env.PAYPAL_CLIENT_ID, password: env.PAYPAL_CLIENT_SECRET } }
    );
    
    return response.data;
  }
}
```

**Estimated Time**: 12-16 hours (all providers)
**Revenue Impact**: HIGH - Users can't cash out

---

## 5. Judge Notifications (P1) 🟡

### Current State
```typescript
// TODO: Send notification to judge
// await NotificationService.sendJudgeInvite(judgeId, contestId);
```

### Implementation Plan

**File**: `backend/src/shared/services/notification.service.ts`

```typescript
export class NotificationService {
  static async sendJudgeInvite(judgeId: string, contestId: string) {
    const judge = await prisma.user.findUnique({ where: { id: judgeId } });
    const contest = await prisma.contest.findUnique({ 
      where: { id: contestId },
      include: { creator: true }
    });
    
    // 1. Create in-app notification
    await prisma.notification.create({
      data: {
        userId: judgeId,
        type: 'JUDGE_INVITE',
        title: 'Judge Invitation',
        message: `${contest.creator.displayName} invited you to judge "${contest.title}"`,
        data: { contestId, inviteId: '...' },
        isRead: false
      }
    });
    
    // 2. Send push notification
    if (judge.fcmToken) {
      await this.sendPushNotification(judge.fcmToken, {
        title: 'Judge Invitation',
        body: `You've been invited to judge "${contest.title}"`,
        data: { type: 'JUDGE_INVITE', contestId }
      });
    }
    
    // 3. Send email (optional)
    await this.sendEmail(judge.email, 'judge-invite', {
      judgeName: judge.displayName,
      contestTitle: contest.title,
      creatorName: contest.creator.displayName,
      acceptUrl: `${env.APP_URL}/contests/${contestId}/judge/accept`
    });
  }
  
  static async sendPushNotification(fcmToken: string, payload: any) {
    // Use Firebase Admin SDK
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data
    });
  }
}
```

**Estimated Time**: 4-6 hours
**Dependencies**: Firebase Admin SDK

---

## 6. Chama Frontend Integration (P1) 🟡

### Current State
- Backend: ✅ Complete
- Frontend: Placeholder TODOs

### Implementation Plan

#### Defaulters Screen
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/chama/presentation/screen/DefaultersScreen.kt`

```kotlin
@Composable
fun DefaultersScreen(chamaId: String) {
    val viewModel = getScreenModel<ChamaViewModel>()
    val defaulters by viewModel.defaulters.collectAsState()
    
    LaunchedEffect(chamaId) {
        viewModel.loadDefaulters(chamaId)
    }
    
    LazyColumn {
        items(defaulters) { defaulter ->
            DefaulterCard(
                defaulter = defaulter,
                onResolve = { viewModel.resolveDefault(defaulter.id) }
            )
        }
    }
}
```

#### Payouts Screen
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/chama/presentation/screen/PayoutsScreen.kt`

```kotlin
@Composable
fun PayoutsScreen(chamaId: String) {
    val viewModel = getScreenModel<ChamaViewModel>()
    val payouts by viewModel.payouts.collectAsState()
    
    LaunchedEffect(chamaId) {
        viewModel.loadPayouts(chamaId)
    }
    
    LazyColumn {
        items(payouts) { payout ->
            PayoutCard(
                payout = payout,
                onApprove = { viewModel.approvePayout(payout.id) },
                onReject = { viewModel.rejectPayout(payout.id) }
            )
        }
    }
}
```

**Estimated Time**: 8-10 hours
**Complexity**: LOW - Just API wiring

---

## 7. Social Media OAuth (P2) 🟢

### Current State
- Routes exist
- Authorization checks missing
- No OAuth integration

### Implementation Plan

#### TikTok OAuth
**File**: `backend/src/modules/influencer/services/tiktok.service.ts`

```typescript
export class TikTokService {
  async getAuthUrl(userId: string) {
    const state = crypto.randomBytes(16).toString('hex');
    await redis.setex(`tiktok_oauth:${state}`, 600, userId);
    
    return `https://www.tiktok.com/auth/authorize/?` +
      `client_key=${env.TIKTOK_CLIENT_KEY}&` +
      `scope=user.info.basic,video.list&` +
      `response_type=code&` +
      `redirect_uri=${env.TIKTOK_REDIRECT_URI}&` +
      `state=${state}`;
  }
  
  async handleCallback(code: string, state: string) {
    const userId = await redis.get(`tiktok_oauth:${state}`);
    if (!userId) throw new Error('Invalid state');
    
    // Exchange code for token
    const tokenResponse = await axios.post(
      'https://open-api.tiktok.com/oauth/access_token/',
      {
        client_key: env.TIKTOK_CLIENT_KEY,
        client_secret: env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    // Get user info
    const userInfo = await this.getUserInfo(access_token);
    
    // Save to database
    await prisma.socialMediaAccount.create({
      data: {
        influencerId: userId,
        platform: 'TIKTOK',
        username: userInfo.username,
        followerCount: userInfo.follower_count,
        accessToken: access_token
      }
    });
  }
}
```

**Estimated Time**: 16-20 hours (all platforms)
**Priority**: LOW - Enhancement feature

---

## Implementation Timeline

### Week 1 (Critical)
- [ ] Day 1-2: iOS Keychain implementation
- [ ] Day 3-4: iOS AVPlayer implementation
- [ ] Day 5: Testing & bug fixes

### Week 2 (High Priority)
- [ ] Day 1-3: Live Streaming Socket.io
- [ ] Day 4-5: Judge Notifications

### Week 3 (High Priority)
- [ ] Day 1-3: M-Pesa integration
- [ ] Day 4-5: PayPal/Paystack integration

### Week 4 (Medium Priority)
- [ ] Day 1-2: Chama frontend integration
- [ ] Day 3-5: Testing & polish

### Week 5+ (Low Priority)
- [ ] Social Media OAuth (as needed)

---

## Risk Assessment

### High Risk
1. **iOS Keychain** - Security vulnerability
2. **Native Video Player** - App unusable without it
3. **Wallet Withdrawals** - Legal/financial implications

### Medium Risk
4. **Live Streaming** - Core feature, but has fallback
5. **Judge Notifications** - Feature incomplete but functional

### Low Risk
6. **Chama Frontend** - Backend works, just UI wiring
7. **Social Media OAuth** - Enhancement feature

---

## Testing Requirements

### P0 Features
- [ ] iOS Keychain: Security audit
- [ ] Video Player: Test on real devices
- [ ] Socket.io: Load testing with 1000+ concurrent users

### P1 Features
- [ ] M-Pesa: Test with real transactions (sandbox)
- [ ] PayPal: Test with real transactions (sandbox)
- [ ] Notifications: Test FCM delivery

### P2 Features
- [ ] OAuth: Test with real accounts
- [ ] Chama: Integration testing

---

## Status Tracking

| Feature | Priority | Status | ETA |
|---------|----------|--------|-----|
| iOS Keychain | P0 | 🔴 Not Started | Week 1 |
| iOS Video Player | P0 | 🔴 Not Started | Week 1 |
| Socket.io Live | P0 | 🔴 Not Started | Week 2 |
| Wallet Integration | P1 | 🟡 Partial | Week 3 |
| Judge Notifications | P1 | 🟡 Partial | Week 2 |
| Chama Frontend | P1 | 🟡 Partial | Week 4 |
| Social OAuth | P2 | 🔴 Not Started | Week 5+ |

---

**Last Updated**: 2026
**Next Review**: After Week 1 completion
