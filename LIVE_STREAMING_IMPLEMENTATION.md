# Live Streaming Implementation

## Overview
Complete implementation of camera hardware binding, backend API connection, and WebRTC video streaming for the Runinga live streaming feature.

## 1. Camera Hardware Binding ✅

### Common Interface
- **Location**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/data/camera/CameraManager.kt`
- **Functions**:
  - `initializeCamera(useFrontCamera: Boolean)` - Initialize camera with front/back selection
  - `startCamera()` - Start camera preview and capture
  - `stopCamera()` - Stop camera
  - `switchCamera()` - Switch between front/back cameras
  - `pauseStream()` - Pause video streaming
  - `resumeStream()` - Resume video streaming
  - `release()` - Release camera resources

### Android Implementation (CameraX)
- **Location**: `composeApp/src/androidMain/kotlin/com/runinga/feature/live/data/camera/CameraManager.kt`
- **Features**:
  - Uses CameraX library for camera management
  - Supports HD video quality (720p/1080p)
  - Lifecycle-aware camera binding
  - Preview + VideoCapture use cases
  - Recording pause/resume support
  - Camera control access (focus, zoom, exposure)

### iOS Implementation (AVFoundation)
- **Location**: `composeApp/src/iosMain/kotlin/com/runinga/feature/live/data/camera/CameraManager.kt`
- **Features**:
  - Uses AVFoundation framework
  - AVCaptureSession with high preset quality
  - Video and audio input/output
  - Preview layer for UIView
  - Dynamic camera switching
  - Capture session configuration

### UI Components
- **Common**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/presentation/components/CameraPreview.kt`
- **Android**: `composeApp/src/androidMain/kotlin/com/runinga/feature/live/presentation/components/CameraPreview.android.kt`
  - Uses AndroidView with PreviewView
  - Lifecycle-aware binding
- **iOS**: `composeApp/src/iosMain/kotlin/com/runinga/feature/live/presentation/components/CameraPreview.ios.kt`
  - Uses UIKitView with UIView
  - AVCaptureVideoPreviewLayer integration

## 2. Backend API Connection ✅

### API Service
- **Location**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/data/api/LiveApiService.kt`

### Endpoints
1. **POST /api/v1/live/start** - Start live stream
   - Request: `{ title, description, type, isCoHostEnabled, productId }`
   - Response: Stream details with streamKey and streamUrl

2. **POST /api/v1/live/:streamId/end** - End live stream
   - Response: Success confirmation

3. **GET /api/v1/live/active** - Get active live streams
   - Query params: page, limit, chamaId
   - Response: List of active streams with pagination

4. **GET /api/v1/live/:streamId** - Get stream details
   - Response: Full stream information

5. **POST /api/v1/live/:streamId/viewer** - Update viewer count
   - Response: Current viewer count

6. **POST /api/v1/live/:streamId/pin-product** - Pin product to stream
   - Request: `{ productId }`
   - Response: Product details

7. **DELETE /api/v1/live/:streamId/pin-product** - Unpin product
   - Response: Success confirmation

8. **POST /api/v1/live/:streamId/gift-goal** - Set gift goal
   - Request: `{ title, targetRc }`
   - Response: Gift goal details

### Data Models
- `StartStreamRequest/Response`
- `StreamDto` - Complete stream information
- `HostDto` - Host user information
- `ProductDto` - Product information for commerce streams
- `PaginationDto` - Pagination metadata

## 3. WebRTC Video Streaming ✅

### Common Interface
- **Location**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/data/webrtc/WebRTCManager.kt`
- **Functions**:
  - `initialize(streamKey: String, streamUrl: String)` - Initialize WebRTC
  - `startStreaming()` - Start video/audio streaming
  - `stopStreaming()` - Stop streaming
  - `setAudioEnabled(enabled: Boolean)` - Mute/unmute audio
  - `setVideoEnabled(enabled: Boolean)` - Enable/disable video
  - `switchCamera()` - Switch camera during stream
  - `connectionState: StateFlow<WebRTCState>` - Connection state observer
  - `release()` - Release WebRTC resources

### States
- `IDLE` - Not initialized
- `CONNECTING` - Establishing connection
- `CONNECTED` - Streaming active
- `DISCONNECTED` - Connection lost
- `FAILED` - Connection failed

### Android Implementation
- **Location**: `composeApp/src/androidMain/kotlin/com/runinga/feature/live/data/webrtc/WebRTCManager.kt`
- **Features**:
  - Uses WebRTC library (org.webrtc)
  - PeerConnectionFactory with hardware encoding
  - Camera2Enumerator for camera access
  - Video: 1280x720 @ 30fps, 2500kbps
  - Audio: 128kbps
  - RTP track management
  - ICE connection state monitoring

### iOS Implementation
- **Location**: `composeApp/src/iosMain/kotlin/com/runinga/feature/live/data/webrtc/WebRTCManager.kt`
- **Features**:
  - Uses WebRTC framework
  - RTCPeerConnectionFactory
  - RTCCameraVideoCapturer
  - Video/audio track creation
  - ICE connection state monitoring
  - SSL initialization/cleanup

### Stream Configuration
```kotlin
data class StreamConfig(
    val streamKey: String,
    val streamUrl: String,
    val videoBitrate: Int = 2500, // kbps
    val audioBitrate: Int = 128, // kbps
    val videoWidth: Int = 720,
    val videoHeight: Int = 1280,
    val fps: Int = 30
)
```

## 4. ViewModel Integration ✅

### HostLiveViewModel Updates
- **Location**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/presentation/viewmodel/HostLiveViewModel.kt`
- **Dependencies**:
  - `CameraManager` - Camera hardware control
  - `WebRTCManager` - Video streaming
  - `LiveRepository` - Backend API
  - `LiveSocketManager` - Real-time events

### Flow
1. **Start Live**:
   - Call backend API to create stream
   - Receive streamKey and streamUrl
   - Initialize camera with front camera
   - Start camera preview
   - Initialize WebRTC with stream credentials
   - Start WebRTC streaming
   - Connect to WebSocket for real-time events

2. **Switch Camera**:
   - Call cameraManager.switchCamera()
   - Call webrtcManager.switchCamera()
   - Update UI state

3. **Pause/Resume**:
   - Pause: Stop video encoding, keep camera active
   - Resume: Resume video encoding

4. **End Live**:
   - Stop camera
   - Stop WebRTC streaming
   - Call backend API to end stream
   - Disconnect WebSocket
   - Release resources

## Dependencies Required

### Android (build.gradle.kts)
```kotlin
// CameraX
implementation("androidx.camera:camera-core:1.3.0")
implementation("androidx.camera:camera-camera2:1.3.0")
implementation("androidx.camera:camera-lifecycle:1.3.0")
implementation("androidx.camera:camera-video:1.3.0")
implementation("androidx.camera:camera-view:1.3.0")

// WebRTC
implementation("org.webrtc:google-webrtc:1.0.32006")
```

### iOS (Podfile)
```ruby
pod 'WebRTC-SDK', '~> 114.0'
```

### Common
```kotlin
// Ktor for API calls (already in project)
implementation("io.ktor:ktor-client-core")
implementation("io.ktor:ktor-client-content-negotiation")
implementation("io.ktor:ktor-serialization-kotlinx-json")
```

## Permissions Required

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for live streaming</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is required for live streaming</string>
```

## Usage Example

```kotlin
// In HostLiveScreen
val viewModel = remember { 
    HostLiveViewModel(
        liveRepository = liveRepository,
        socketManager = socketManager,
        cameraManager = CameraManager(context), // Android
        webrtcManager = WebRTCManager(context), // Android
        liveType = LiveType.NORMAL
    )
}

// Camera preview
CameraPreview(
    cameraManager = viewModel.cameraManager,
    modifier = Modifier.fillMaxSize()
)

// Start streaming
viewModel.startLive(title = "My Live Stream")

// Switch camera
IconButton(onClick = { viewModel.switchCamera() }) {
    Icon(Icons.Default.FlipCameraAndroid, "Switch Camera")
}

// End stream
viewModel.endLive()
```

## Next Steps

1. **Add dependencies** to build.gradle.kts and Podfile
2. **Request permissions** at runtime before starting live stream
3. **Test camera preview** on both Android and iOS devices
4. **Configure backend** to provide valid streamKey and streamUrl
5. **Set up RTMP/WebRTC server** for video ingestion
6. **Test end-to-end streaming** with real backend

## Notes

- WebRTC requires STUN/TURN servers for NAT traversal (configure in RTCConfiguration)
- For production, use a media server like Wowza, Ant Media Server, or AWS IVS
- Consider adaptive bitrate streaming based on network conditions
- Implement reconnection logic for network interruptions
- Add analytics for stream quality monitoring
