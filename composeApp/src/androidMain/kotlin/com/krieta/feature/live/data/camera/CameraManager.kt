package com.krieta.feature.live.data.camera

import android.content.Context
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.*
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Android implementation of CameraManager using CameraX
 */
actual class CameraManager(private val context: Context) {
    private var cameraProvider: ProcessCameraProvider? = null
    private var preview: Preview? = null
    private var videoCapture: VideoCapture<Recorder>? = null
    private var recording: Recording? = null
    private var cameraSelector: CameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA
    private var camera: androidx.camera.core.Camera? = null
    private var isActive = false
    private var isStreaming = false
    private var useFrontCamera = true
    private lateinit var cameraExecutor: ExecutorService
    private var lifecycleOwner: LifecycleOwner? = null
    private var previewView: PreviewView? = null

    actual fun initializeCamera(useFrontCamera: Boolean) {
        this.useFrontCamera = useFrontCamera
        cameraSelector = if (useFrontCamera) {
            CameraSelector.DEFAULT_FRONT_CAMERA
        } else {
            CameraSelector.DEFAULT_BACK_CAMERA
        }
        cameraExecutor = Executors.newSingleThreadExecutor()
    }

    actual fun startCamera() {
        lifecycleOwner?.let { owner ->
            previewView?.let { view ->
                bindCamera(context, owner, view)
            }
        }
        isActive = true
        isStreaming = true
    }

    actual fun stopCamera() {
        isActive = false
        isStreaming = false
        recording?.stop()
        cameraProvider?.unbindAll()
    }

    actual fun switchCamera() {
        useFrontCamera = !useFrontCamera
        cameraSelector = if (useFrontCamera) {
            CameraSelector.DEFAULT_FRONT_CAMERA
        } else {
            CameraSelector.DEFAULT_BACK_CAMERA
        }
        
        if (isActive && lifecycleOwner != null && previewView != null) {
            cameraProvider?.unbindAll()
            bindCamera(context, lifecycleOwner!!, previewView!!)
        }
    }

    actual fun pauseStream() {
        isStreaming = false
        recording?.pause()
    }

    actual fun resumeStream() {
        isStreaming = true
        recording?.resume()
    }

    actual fun isCameraActive(): Boolean = isActive

    actual fun isFrontCamera(): Boolean = useFrontCamera

    actual fun release() {
        stopCamera()
        if (::cameraExecutor.isInitialized) {
            cameraExecutor.shutdown()
        }
    }

    /**
     * Bind camera to lifecycle (call from Activity/Fragment)
     * ALWAYS outputs 9:16 aspect ratio for immersive streaming
     */
    fun bindCamera(
        context: Context,
        lifecycleOwner: LifecycleOwner,
        previewView: PreviewView
    ) {
        this.lifecycleOwner = lifecycleOwner
        this.previewView = previewView
        
        // Set preview to fill container with 9:16 aspect
        previewView.scaleType = PreviewView.ScaleType.FILL_CENTER
        
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()

            // Preview with 9:16 aspect ratio
            preview = Preview.Builder()
                .setTargetAspectRatio(AspectRatio.RATIO_16_9) // Will be rotated to 9:16 in portrait
                .setTargetRotation(previewView.display.rotation)
                .build()
                .also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

            // Video capture with 9:16 for streaming
            val recorder = Recorder.Builder()
                .setQualitySelector(
                    QualitySelector.fromOrderedList(
                        listOf(Quality.FHD, Quality.HD, Quality.SD),
                        FallbackStrategy.lowerQualityOrHigherThan(Quality.SD)
                    )
                )
                .setAspectRatio(AspectRatio.RATIO_16_9) // Portrait 9:16
                .build()
            videoCapture = VideoCapture.withOutput(recorder)

            try {
                cameraProvider?.unbindAll()
                camera = cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    videoCapture
                )
                isActive = true
            } catch (e: Exception) {
                // Handle error
            }
        }, ContextCompat.getMainExecutor(context))
    }
    
    /**
     * Get camera control for manual focus, zoom, etc.
     */
    fun getCameraControl(): CameraControl? = camera?.cameraControl
    
    /**
     * Get camera info for capabilities
     */
    fun getCameraInfo(): CameraInfo? = camera?.cameraInfo
}
