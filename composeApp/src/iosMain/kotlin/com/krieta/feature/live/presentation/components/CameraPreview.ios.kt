package com.krieta.feature.live.presentation.components

import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.interop.UIKitView
import com.krieta.feature.live.data.camera.CameraManager
import platform.UIKit.UIView

@Composable
actual fun CameraPreview(
    cameraManager: CameraManager,
    modifier: Modifier
) {
    UIKitView(
        factory = {
            UIView().apply {
                cameraManager.setupPreview(this)
            }
        },
        modifier = modifier
    )
}
