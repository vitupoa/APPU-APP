package com.krieta.feature.live.data.camera

import platform.AVFoundation.*
import platform.CoreMedia.*
import platform.Foundation.*
import platform.UIKit.UIView
import kotlinx.cinterop.*

/**
 * iOS implementation of CameraManager using AVFoundation
 */
actual class CameraManager {
    private var captureSession: AVCaptureSession? = null
    private var videoDevice: AVCaptureDevice? = null
    private var audioDevice: AVCaptureDevice? = null
    private var videoInput: AVCaptureDeviceInput? = null
    private var audioInput: AVCaptureDeviceInput? = null
    private var videoOutput: AVCaptureVideoDataOutput? = null
    private var audioOutput: AVCaptureAudioDataOutput? = null
    private var previewLayer: AVCaptureVideoPreviewLayer? = null
    private var isActive = false
    private var isStreaming = false
    private var useFrontCamera = true

    actual fun initializeCamera(useFrontCamera: Boolean) {
        this.useFrontCamera = useFrontCamera
        captureSession = AVCaptureSession().apply {
            sessionPreset = AVCaptureSessionPresetHigh
        }
        
        val devicePosition = if (useFrontCamera) {
            AVCaptureDevicePositionFront
        } else {
            AVCaptureDevicePositionBack
        }
        
        // Setup video device
        videoDevice = AVCaptureDevice.defaultDeviceWithDeviceType(
            AVCaptureDeviceTypeBuiltInWideAngleCamera,
            AVMediaTypeVideo,
            devicePosition
        )
        
        // Setup audio device
        audioDevice = AVCaptureDevice.defaultDeviceWithMediaType(AVMediaTypeAudio)
        
        setupInputsAndOutputs()
    }
    
    private fun setupInputsAndOutputs() {
        captureSession?.beginConfiguration()
        
        // Remove existing inputs
        videoInput?.let { captureSession?.removeInput(it) }
        audioInput?.let { captureSession?.removeInput(it) }
        
        // Add video input
        videoDevice?.let { device ->
            memScoped {
                val error = alloc<ObjCObjectVar<NSError?>>()
                val input = AVCaptureDeviceInput.deviceInputWithDevice(device, error.ptr)
                if (error.value == null && input != null) {
                    if (captureSession?.canAddInput(input) == true) {
                        captureSession?.addInput(input)
                        videoInput = input
                    }
                }
            }
        }
        
        // Add audio input
        audioDevice?.let { device ->
            memScoped {
                val error = alloc<ObjCObjectVar<NSError?>>()
                val input = AVCaptureDeviceInput.deviceInputWithDevice(device, error.ptr)
                if (error.value == null && input != null) {
                    if (captureSession?.canAddInput(input) == true) {
                        captureSession?.addInput(input)
                        audioInput = input
                    }
                }
            }
        }
        
        // Add video output
        videoOutput = AVCaptureVideoDataOutput().apply {
            videoSettings = mapOf(
                kCVPixelBufferPixelFormatTypeKey to kCVPixelFormatType_32BGRA
            )
        }
        if (captureSession?.canAddOutput(videoOutput!!) == true) {
            captureSession?.addOutput(videoOutput!!)
        }
        
        // Add audio output
        audioOutput = AVCaptureAudioDataOutput()
        if (captureSession?.canAddOutput(audioOutput!!) == true) {
            captureSession?.addOutput(audioOutput!!)
        }
        
        captureSession?.commitConfiguration()
    }

    actual fun startCamera() {
        captureSession?.startRunning()
        isActive = true
        isStreaming = true
    }

    actual fun stopCamera() {
        captureSession?.stopRunning()
        isActive = false
        isStreaming = false
    }

    actual fun switchCamera() {
        useFrontCamera = !useFrontCamera
        
        val devicePosition = if (useFrontCamera) {
            AVCaptureDevicePositionFront
        } else {
            AVCaptureDevicePositionBack
        }
        
        videoDevice = AVCaptureDevice.defaultDeviceWithDeviceType(
            AVCaptureDeviceTypeBuiltInWideAngleCamera,
            AVMediaTypeVideo,
            devicePosition
        )
        
        setupInputsAndOutputs()
    }

    actual fun pauseStream() {
        isStreaming = false
    }

    actual fun resumeStream() {
        isStreaming = true
    }

    actual fun isCameraActive(): Boolean = isActive

    actual fun isFrontCamera(): Boolean = useFrontCamera

    actual fun release() {
        stopCamera()
        captureSession = null
        videoDevice = null
        audioDevice = null
        videoInput = null
        audioInput = null
        videoOutput = null
        audioOutput = null
        previewLayer = null
    }
    
    /**
     * Setup preview layer for UIView
     */
    fun setupPreview(view: UIView) {
        previewLayer = AVCaptureVideoPreviewLayer(session = captureSession!!).apply {
            frame = view.bounds
            videoGravity = AVLayerVideoGravityResizeAspectFill
        }
        view.layer.addSublayer(previewLayer!!)
    }
    
    /**
     * Get capture session for advanced configuration
     */
    fun getCaptureSession(): AVCaptureSession? = captureSession
}
