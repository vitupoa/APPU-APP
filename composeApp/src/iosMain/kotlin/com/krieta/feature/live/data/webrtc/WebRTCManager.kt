package com.krieta.feature.live.data.webrtc

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import platform.WebRTC.*
import platform.Foundation.*
import kotlinx.cinterop.*

actual class WebRTCManager {
    private var peerConnectionFactory: RTCPeerConnectionFactory? = null
    private var peerConnection: RTCPeerConnection? = null
    private var videoCapturer: RTCCameraVideoCapturer? = null
    private var localVideoTrack: RTCVideoTrack? = null
    private var localAudioTrack: RTCAudioTrack? = null
    private var videoSource: RTCVideoSource? = null
    private var audioSource: RTCAudioSource? = null
    
    private val _connectionState = MutableStateFlow(WebRTCState.IDLE)
    actual val connectionState: StateFlow<WebRTCState> = _connectionState.asStateFlow()
    
    private var streamKey: String = ""
    private var streamUrl: String = ""
    private var isFrontCamera = true
    private var currentBitrate = 2500
    private var config = StreamConfig("", "")

    actual fun initialize(streamKey: String, streamUrl: String) {
        this.streamKey = streamKey
        this.streamUrl = streamUrl
        this.config = StreamConfig(streamKey, streamUrl)
        
        RTCInitializeSSL()
        
        val encoderFactory = RTCDefaultVideoEncoderFactory()
        val decoderFactory = RTCDefaultVideoDecoderFactory()
        
        peerConnectionFactory = RTCPeerConnectionFactory(
            encoderFactory = encoderFactory,
            decoderFactory = decoderFactory
        )
    }

    actual suspend fun startStreaming(): Result<Unit> {
        return try {
            _connectionState.value = WebRTCState.CONNECTING
            
            // Adjust settings based on network
            adjustBitrateForNetwork()
            
            // Create video capturer
            videoCapturer = RTCCameraVideoCapturer()
            
            val devices = RTCCameraVideoCapturer.captureDevices()
            val camera = if (isFrontCamera) {
                devices.firstOrNull { (it as? AVCaptureDevice)?.position == AVCaptureDevicePositionFront }
            } else {
                devices.firstOrNull { (it as? AVCaptureDevice)?.position == AVCaptureDevicePositionBack }
            } ?: throw Exception("No camera found")
            
            // Create video source with adaptive output
            videoSource = peerConnectionFactory?.videoSource()
            
            // Find optimal format for 9:16 portrait
            val formats = RTCCameraVideoCapturer.supportedFormatsForDevice(camera)
            val optimalFormat = formats.firstOrNull { format ->
                val dimensions = (format as? AVCaptureDeviceFormat)?.formatDescription?.dimensions
                // Look for 1080x1920 or 720x1280 (9:16 portrait)
                (dimensions?.width == 1080L && dimensions?.height == 1920L) ||
                (dimensions?.width == 720L && dimensions?.height == 1280L)
            } ?: formats.firstOrNull()
            
            videoCapturer?.startCapture(
                device = camera,
                format = optimalFormat,
                fps = config.fps
            )
            
            localVideoTrack = peerConnectionFactory?.videoTrack(
                source = videoSource!!,
                trackId = "video"
            )?.apply {
                isEnabled = true
            }
            
            // Create audio source with constraints
            val audioConstraints = RTCMediaConstraints(
                mandatoryConstraints = mapOf(
                    "googEchoCancellation" to "true",
                    "googNoiseSuppression" to "true",
                    "googAutoGainControl" to "true",
                    "googHighpassFilter" to "true"
                ),
                optionalConstraints = null
            )
            audioSource = peerConnectionFactory?.audioSource(audioConstraints)
            localAudioTrack = peerConnectionFactory?.audioTrack(
                source = audioSource!!,
                trackId = "audio"
            )?.apply {
                isEnabled = true
            }
            
            // Create peer connection with optimized config
            val rtcConfig = RTCConfiguration().apply {
                iceServers = emptyList()
                sdpSemantics = RTCSdpSemanticsUnifiedPlan
                continualGatheringPolicy = RTCContinualGatheringPolicyGatherContinually
                tcpCandidatePolicy = RTCTcpCandidatePolicyDisabled
                bundlePolicy = RTCBundlePolicyMaxBundle
                rtcpMuxPolicy = RTCRtcpMuxPolicyRequire
            }
            
            peerConnection = peerConnectionFactory?.peerConnection(
                configuration = rtcConfig,
                constraints = RTCMediaConstraints(null, null),
                delegate = object : RTCPeerConnectionDelegateProtocol {
                    override fun peerConnection(
                        peerConnection: RTCPeerConnection,
                        didChange: RTCIceConnectionState
                    ) {
                        when (didChange) {
                            RTCIceConnectionStateConnected -> {
                                _connectionState.value = WebRTCState.CONNECTED
                            }
                            RTCIceConnectionStateDisconnected -> {
                                _connectionState.value = WebRTCState.RECONNECTING
                                attemptReconnection()
                            }
                            RTCIceConnectionStateFailed -> {
                                _connectionState.value = WebRTCState.FAILED
                            }
                            else -> {}
                        }
                    }
                    
                    override fun peerConnection(
                        peerConnection: RTCPeerConnection,
                        didGenerate: RTCIceCandidate
                    ) {}
                    
                    override fun peerConnection(
                        peerConnection: RTCPeerConnection,
                        didRemove: List<*>
                    ) {}
                }
            )
            
            // Add tracks with encoding parameters
            localVideoTrack?.let { track ->
                val sender = peerConnection?.addTrack(track, listOf(streamKey))
                sender?.parameters?.let { params ->
                    params.encodings.forEach { encoding ->
                        (encoding as? RTCRtpEncodingParameters)?.apply {
                            maxBitrateBps = (currentBitrate * 1000).toULong()
                            minBitrateBps = 500000u // 500 kbps minimum
                            maxFramerate = config.fps.toUInt()
                            scaleResolutionDownBy = 1.0
                        }
                    }
                    sender.parameters = params
                }
            }
            
            localAudioTrack?.let { track ->
                val sender = peerConnection?.addTrack(track, listOf(streamKey))
                sender?.parameters?.let { params ->
                    params.encodings.forEach { encoding ->
                        (encoding as? RTCRtpEncodingParameters)?.apply {
                            maxBitrateBps = (config.audioBitrate * 1000).toULong()
                        }
                    }
                    sender.parameters = params
                }
            }
            
            _connectionState.value = WebRTCState.CONNECTED
            Result.success(Unit)
        } catch (e: Exception) {
            _connectionState.value = WebRTCState.FAILED
            Result.failure(e)
        }
    }

    actual fun stopStreaming() {
        videoCapturer?.stopCapture()
        peerConnection?.close()
        _connectionState.value = WebRTCState.DISCONNECTED
    }

    actual fun setAudioEnabled(enabled: Boolean) {
        localAudioTrack?.isEnabled = enabled
    }

    actual fun setVideoEnabled(enabled: Boolean) {
        localVideoTrack?.isEnabled = enabled
    }

    actual fun switchCamera() {
        val devices = RTCCameraVideoCapturer.captureDevices()
        val newCamera = if (isFrontCamera) {
            devices.firstOrNull { (it as? AVCaptureDevice)?.position == AVCaptureDevicePositionBack }
        } else {
            devices.firstOrNull { (it as? AVCaptureDevice)?.position == AVCaptureDevicePositionFront }
        }
        
        newCamera?.let {
            videoCapturer?.stopCapture()
            val formats = RTCCameraVideoCapturer.supportedFormatsForDevice(it)
            val optimalFormat = formats.firstOrNull { format ->
                val dimensions = (format as? AVCaptureDeviceFormat)?.formatDescription?.dimensions
                // Look for 1080x1920 or 720x1280 (9:16 portrait)
                (dimensions?.width == 1080L && dimensions?.height == 1920L) ||
                (dimensions?.width == 720L && dimensions?.height == 1280L)
            } ?: formats.firstOrNull()
            
            videoCapturer?.startCapture(device = it, format = optimalFormat, fps = config.fps)
            isFrontCamera = !isFrontCamera
        }
    }

    actual fun release() {
        stopStreaming()
        RTCCleanupSSL()
    }
    
    private fun adjustBitrateForNetwork() {
        // iOS network detection using Reachability
        val reachability = SCNetworkReachabilityCreateWithName(null, "www.google.com")
        memScoped {
            val flags = alloc<SCNetworkReachabilityFlagsVar>()
            if (SCNetworkReachabilityGetFlags(reachability, flags.ptr)) {
                val isReachable = (flags.value and kSCNetworkReachabilityFlagsReachable.toUInt()) != 0u
                val isWWAN = (flags.value and kSCNetworkReachabilityFlagsIsWWAN.toUInt()) != 0u
                
                currentBitrate = when {
                    isReachable && !isWWAN -> {
                        // WiFi: High quality 9:16
                        config = config.copy(videoBitrate = 3000, videoWidth = 1080, videoHeight = 1920, fps = 30)
                        3000
                    }
                    isReachable && isWWAN -> {
                        // Cellular: Medium quality 9:16
                        config = config.copy(videoBitrate = 2000, videoWidth = 720, videoHeight = 1280, fps = 25)
                        2000
                    }
                    else -> {
                        // Unknown: Low quality 9:16
                        config = config.copy(videoBitrate = 1200, videoWidth = 540, videoHeight = 960, fps = 20)
                        1200
                    }
                }
            }
        }
    }
    
    private fun attemptReconnection() {
        NSThread.sleepForTimeInterval(2.0)
        if (_connectionState.value == WebRTCState.RECONNECTING) {
            peerConnection?.restartIce()
        }
    }
}
