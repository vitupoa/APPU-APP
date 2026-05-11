package com.krieta.feature.live.data.webrtc

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.webrtc.*
import java.util.concurrent.Executors

actual class WebRTCManager(private val context: Context) {
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var videoCapturer: CameraVideoCapturer? = null
    private var localVideoTrack: VideoTrack? = null
    private var localAudioTrack: AudioTrack? = null
    private var videoSource: VideoSource? = null
    private var audioSource: AudioSource? = null
    private val executor = Executors.newSingleThreadExecutor()
    
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
        
        val options = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(true)
            .setFieldTrials("WebRTC-H264HighProfile/Enabled/")
            .createInitializationOptions()
        PeerConnectionFactory.initialize(options)
        
        val eglContext = EglBase.create().eglBaseContext
        val encoderFactory = DefaultVideoEncoderFactory(
            eglContext,
            true, // enableIntelVp8Encoder
            true  // enableH264HighProfile
        )
        val decoderFactory = DefaultVideoDecoderFactory(eglContext)
        
        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(encoderFactory)
            .setVideoDecoderFactory(decoderFactory)
            .setOptions(PeerConnectionFactory.Options().apply {
                disableEncryption = false
                disableNetworkMonitor = false
            })
            .createPeerConnectionFactory()
    }

    actual suspend fun startStreaming(): Result<Unit> {
        return try {
            _connectionState.value = WebRTCState.CONNECTING
            
            // Adjust settings based on network
            adjustBitrateForNetwork()
            
            // Create video capturer
            val enumerator = Camera2Enumerator(context)
            val cameraName = if (isFrontCamera) {
                enumerator.deviceNames.firstOrNull { enumerator.isFrontFacing(it) }
            } else {
                enumerator.deviceNames.firstOrNull { enumerator.isBackFacing(it) }
            } ?: throw Exception("No camera found")
            
            videoCapturer = enumerator.createCapturer(cameraName, null)
            
            // Create video source with 9:16 aspect ratio (portrait)
            videoSource = peerConnectionFactory?.createVideoSource(false)?.apply {
                adaptOutputFormat(
                    1080,  // width for 9:16 portrait
                    1920,  // height for 9:16 portrait
                    config.fps
                )
            }
            
            val surfaceTextureHelper = SurfaceTextureHelper.create(
                "CaptureThread",
                EglBase.create().eglBaseContext
            )
            
            videoCapturer?.initialize(
                surfaceTextureHelper,
                context,
                videoSource?.capturerObserver
            )
            
            // Start with 9:16 portrait resolution
            videoCapturer?.startCapture(
                1080,  // width
                1920,  // height
                config.fps
            )
            
            localVideoTrack = peerConnectionFactory?.createVideoTrack("video", videoSource)?.apply {
                setEnabled(true)
            }
            
            // Create audio source with echo cancellation and noise suppression
            val audioConstraints = MediaConstraints().apply {
                mandatory.add(MediaConstraints.KeyValuePair("googEchoCancellation", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googNoiseSuppression", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googAutoGainControl", "true"))
                mandatory.add(MediaConstraints.KeyValuePair("googHighpassFilter", "true"))
            }
            audioSource = peerConnectionFactory?.createAudioSource(audioConstraints)
            localAudioTrack = peerConnectionFactory?.createAudioTrack("audio", audioSource)?.apply {
                setEnabled(true)
            }
            
            // Create peer connection with optimized config
            val rtcConfig = PeerConnection.RTCConfiguration(emptyList()).apply {
                sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
                continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
                tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.DISABLED
                bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE
                rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE
            }
            
            peerConnection = peerConnectionFactory?.createPeerConnection(
                rtcConfig,
                object : PeerConnection.Observer {
                    override fun onIceCandidate(candidate: IceCandidate?) {}
                    override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
                    override fun onSignalingChange(state: PeerConnection.SignalingState?) {}
                    override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
                        when (state) {
                            PeerConnection.IceConnectionState.CONNECTED -> {
                                _connectionState.value = WebRTCState.CONNECTED
                            }
                            PeerConnection.IceConnectionState.DISCONNECTED -> {
                                _connectionState.value = WebRTCState.RECONNECTING
                                // Attempt reconnection
                                executor.execute { attemptReconnection() }
                            }
                            PeerConnection.IceConnectionState.FAILED -> {
                                _connectionState.value = WebRTCState.FAILED
                            }
                            else -> {}
                        }
                    }
                    override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {}
                    override fun onAddStream(stream: MediaStream?) {}
                    override fun onRemoveStream(stream: MediaStream?) {}
                    override fun onDataChannel(channel: DataChannel?) {}
                    override fun onRenegotiationNeeded() {}
                    override fun onAddTrack(receiver: RtpReceiver?, streams: Array<out MediaStream>?) {}
                }
            )
            
            // Add tracks with encoding parameters
            localVideoTrack?.let { track ->
                val sender = peerConnection?.addTrack(track, listOf(streamKey))
                sender?.parameters?.let { params ->
                    params.encodings.forEach { encoding ->
                        encoding.maxBitrateBps = currentBitrate * 1000
                        encoding.minBitrateBps = 500 * 1000 // 500 kbps minimum
                        encoding.maxFramerate = config.fps
                        encoding.scaleResolutionDownBy = 1.0
                    }
                    sender.parameters = params
                }
            }
            
            localAudioTrack?.let { track ->
                val sender = peerConnection?.addTrack(track, listOf(streamKey))
                sender?.parameters?.let { params ->
                    params.encodings.forEach { encoding ->
                        encoding.maxBitrateBps = config.audioBitrate * 1000
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
        localVideoTrack?.dispose()
        localAudioTrack?.dispose()
        videoSource?.dispose()
        audioSource?.dispose()
        peerConnection?.close()
        _connectionState.value = WebRTCState.DISCONNECTED
    }

    actual fun setAudioEnabled(enabled: Boolean) {
        localAudioTrack?.setEnabled(enabled)
    }

    actual fun setVideoEnabled(enabled: Boolean) {
        localVideoTrack?.setEnabled(enabled)
    }

    actual fun switchCamera() {
        (videoCapturer as? CameraVideoCapturer)?.switchCamera(object : CameraVideoCapturer.CameraSwitchHandler {
            override fun onCameraSwitchDone(isFrontCamera: Boolean) {
                this@WebRTCManager.isFrontCamera = isFrontCamera
            }
            override fun onCameraSwitchError(errorDescription: String?) {}
        })
    }

    actual fun release() {
        stopStreaming()
        peerConnectionFactory?.dispose()
        executor.shutdown()
    }
    
    private fun adjustBitrateForNetwork() {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork
        val capabilities = connectivityManager.getNetworkCapabilities(network)
        
        currentBitrate = when {
            capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true -> {
                // WiFi: High quality 9:16
                config = config.copy(videoBitrate = 3000, videoWidth = 1080, videoHeight = 1920, fps = 30)
                3000
            }
            capabilities?.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) == true -> {
                val downlink = capabilities.linkDownstreamBandwidthKbps
                when {
                    downlink > 5000 -> {
                        // 4G/5G: High quality 9:16
                        config = config.copy(videoBitrate = 2500, videoWidth = 1080, videoHeight = 1920, fps = 30)
                        2500
                    }
                    downlink > 2000 -> {
                        // 3G: Medium quality 9:16
                        config = config.copy(videoBitrate = 1500, videoWidth = 720, videoHeight = 1280, fps = 25)
                        1500
                    }
                    else -> {
                        // 2G/Slow: Low quality 9:16
                        config = config.copy(videoBitrate = 800, videoWidth = 540, videoHeight = 960, fps = 20)
                        800
                    }
                }
            }
            else -> {
                // Unknown: Medium quality 9:16
                config = config.copy(videoBitrate = 1500, videoWidth = 720, videoHeight = 1280, fps = 25)
                1500
            }
        }
    }
    
    private fun attemptReconnection() {
        // Simple reconnection logic
        try {
            Thread.sleep(2000)
            if (_connectionState.value == WebRTCState.RECONNECTING) {
                peerConnection?.restartIce()
            }
        } catch (e: Exception) {
            _connectionState.value = WebRTCState.FAILED
        }
    }
}
