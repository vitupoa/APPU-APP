package com.krieta.feature.live.presentation.components

import androidx.camera.view.PreviewView
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.krieta.feature.live.data.camera.CameraManager

@Composable
actual fun CameraPreview(
    cameraManager: CameraManager,
    modifier: Modifier
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    
    AndroidView(
        factory = { context ->
            PreviewView(context).apply {
                cameraManager.bindCamera(context, lifecycleOwner, this)
            }
        },
        modifier = modifier
    )
}
