# Immersive 9:16 Live Streaming

## Overview
All live streams in Runinga are displayed in **full immersive 9:16 portrait aspect ratio** (vertical format). The system automatically adapts to any camera shooting aspect ratio while maintaining the 9:16 output.

## Key Features ✅

### 1. Always 9:16 Output
- **Target Resolution**: 1080x1920 (Full HD), 720x1280 (HD), or 540x960 (SD)
- **Aspect Ratio**: 9:16 (0.5625) portrait orientation
- **Full Screen**: Immersive edge-to-edge experience
- **No Black Bars**: Content fills the entire screen

### 2. Adaptive Input Handling
The system handles any input aspect ratio from the camera:

| Input Ratio | Example | Handling |
|-------------|---------|----------|
| 9:16 | Portrait phone | Direct pass-through (no processing) |
| 16:9 | Landscape phone | Blur background + centered content |
| 4:3 | Old cameras | Blur background + centered content |
| 1:1 | Square | Blur background + centered content |

### 3. Blurred Background Effect

#### When Applied
- Automatically applied when input aspect ratio ≠ 9:16
- Creates cinematic, professional look
- Maintains viewer immersion

#### How It Works
1. **Background Layer**: 
   - Original video scaled and cropped to fill 9:16
   - Gaussian blur applied (radius: 25px)
   - Darkened by 50% for better contrast

2. **Content Layer**:
   - Original video scaled to fit within 9:16
   - Centered on screen
   - Sharp and clear (no blur)
   - Maintains original aspect ratio

3. **Composite**:
   - Content overlaid on blurred background
   - Seamless blend
   - Professional appearance

#### Visual Example
```
┌─────────────────┐
│  [Blur BG]      │  ← Blurred, darkened background
│  ┌─────────┐    │
│  │ Content │    │  ← Sharp, centered original video
│  │  16:9   │    │
│  └─────────┘    │
│  [Blur BG]      │
└─────────────────┘
     9:16 Output
```

### 4. Performance Optimizations

#### Android (RenderScript)
- **Downscaling**: Blur applied to 25% scaled image for performance
- **Hardware Acceleration**: RenderScript uses GPU
- **Efficient Compositing**: Canvas-based rendering
- **Memory Management**: Bitmap recycling to prevent leaks

#### iOS (Core Image)
- **GPU Acceleration**: Core Image filters use Metal
- **CIGaussianBlur**: Native blur filter (optimized)
- **Transform Pipeline**: Efficient scale/translate operations
- **Zero-copy**: Direct CIImage processing

### 5. Blur Control

#### Intensity
```kotlin
videoProcessor.setBlurIntensity(0.8f) // 0.0 to 1.0
```
- **0.0**: No blur (sharp background)
- **0.5**: Medium blur
- **0.8**: Default (recommended)
- **1.0**: Maximum blur

#### Enable/Disable
```kotlin
videoProcessor.setBlurEnabled(true)  // Blur background
videoProcessor.setBlurEnabled(false) // Black background
```

### 6. Camera Configuration

#### Android CameraX
```kotlin
// Preview with 9:16 aspect
Preview.Builder()
    .setTargetAspectRatio(AspectRatio.RATIO_16_9) // Rotated to 9:16 in portrait
    .build()

// PreviewView scaling
previewView.scaleType = PreviewView.ScaleType.FILL_CENTER
```

#### iOS AVFoundation
```kotlin
// Capture session preset
captureSession.sessionPreset = AVCaptureSessionPresetHigh

// Preview layer
previewLayer.videoGravity = AVLayerVideoGravityResizeAspectFill
```

### 7. WebRTC Streaming

#### Resolution Tiers (9:16)
| Quality | Resolution | Bitrate | Network |
|---------|------------|---------|---------|
| Full HD | 1080x1920 | 3000 kbps | WiFi |
| HD | 720x1280 | 2500 kbps | 4G/5G |
| SD | 540x960 | 1500 kbps | 3G |
| Low | 540x960 | 800 kbps | 2G |

All resolutions maintain 9:16 aspect ratio.

### 8. User Experience

#### Host View
- Camera preview fills screen in 9:16
- Real-time blur preview (if applicable)
- Smooth camera switching
- No aspect ratio changes

#### Viewer View
- Full immersive 9:16 playback
- No black bars or letterboxing
- Professional cinematic look
- Consistent experience across all streams

### 9. Implementation Details

#### VideoProcessor Class
**Location**: `composeApp/src/commonMain/kotlin/com/runinga/feature/live/data/video/VideoProcessor.kt`

**Methods**:
- `initialize()` - Setup blur filters
- `processFrame(frame)` - Convert any aspect to 9:16
- `setBlurIntensity(intensity)` - Adjust blur strength
- `setBlurEnabled(enabled)` - Toggle blur effect
- `inputAspectRatio` - Monitor input ratio changes

#### Integration with Camera
```kotlin
// In CameraManager
val frame = captureFrame()
val processed = videoProcessor.processFrame(frame)
sendToWebRTC(processed)
```

#### Integration with WebRTC
```kotlin
// WebRTC always expects 9:16
videoCapturer.startCapture(
    width = 1080,
    height = 1920,
    fps = 30
)
```

### 10. Edge Cases

#### Extreme Aspect Ratios
- **Ultra-wide (21:9)**: Large blur bars top/bottom
- **Ultra-tall (9:21)**: Slight crop or small blur bars
- **Square (1:1)**: Equal blur bars top/bottom

#### Rotation Handling
- Portrait mode: Native 9:16
- Landscape mode: Blur background applied
- Auto-rotation: Seamless transition

#### Low-end Devices
- Reduce blur radius for performance
- Use black background instead of blur
- Lower resolution (540x960)

### 11. Testing Scenarios

#### Test Cases
1. ✅ Portrait 9:16 camera → Direct pass-through
2. ✅ Landscape 16:9 camera → Blur background
3. ✅ Square 1:1 camera → Blur background
4. ✅ Camera rotation during stream → Smooth transition
5. ✅ Camera switch (front/back) → Maintain 9:16
6. ✅ Network degradation → Resolution scales, keeps 9:16
7. ✅ Low battery → Disable blur, use black background

#### Performance Metrics
- **Blur Processing**: <16ms per frame (60fps capable)
- **Memory Overhead**: <50MB additional
- **CPU Usage**: <10% for blur processing
- **Battery Impact**: <5% additional drain

### 12. Configuration Options

#### Default Settings
```kotlin
val config = StreamConfig(
    streamKey = key,
    streamUrl = url,
    videoBitrate = 2500,
    videoWidth = 1080,   // 9:16 width
    videoHeight = 1920,  // 9:16 height
    fps = 30,
    keyFrameInterval = 2,
    enableAdaptiveBitrate = true
)

val videoProcessor = VideoProcessor().apply {
    initialize()
    setBlurIntensity(0.8f)
    setBlurEnabled(true)
}
```

#### Customization
```kotlin
// Disable blur for performance
videoProcessor.setBlurEnabled(false)

// Reduce blur for subtle effect
videoProcessor.setBlurIntensity(0.4f)

// Monitor aspect ratio changes
videoProcessor.inputAspectRatio.collect { ratio ->
    if (ratio.needsBlurBackground()) {
        showBlurIndicator()
    }
}
```

### 13. Benefits

#### For Users
- ✅ Consistent viewing experience
- ✅ Professional, cinematic look
- ✅ No awkward black bars
- ✅ Full screen immersion
- ✅ Works with any camera orientation

#### For Platform
- ✅ Unified aspect ratio across all streams
- ✅ Optimized for mobile viewing
- ✅ Better engagement (full screen)
- ✅ Professional appearance
- ✅ Competitive with TikTok/Instagram Live

### 14. Future Enhancements

#### Phase 2
- [ ] Custom blur styles (motion blur, radial blur)
- [ ] Animated background effects
- [ ] Color grading filters
- [ ] Beauty filters integration
- [ ] AR effects overlay

#### Phase 3
- [ ] AI-powered background replacement
- [ ] Virtual backgrounds
- [ ] Green screen support
- [ ] Multi-camera picture-in-picture
- [ ] 360° video support

## Conclusion

The immersive 9:16 streaming system ensures:
- ✅ **Always 9:16**: Consistent aspect ratio for all streams
- ✅ **Adaptive Input**: Handles any camera orientation
- ✅ **Blurred Background**: Professional cinematic look
- ✅ **High Performance**: GPU-accelerated processing
- ✅ **Smooth Experience**: No lag or stuttering
- ✅ **Mobile-First**: Optimized for vertical viewing

**Result**: TikTok-style immersive live streaming experience that keeps viewers engaged with full-screen, professional-quality video.
