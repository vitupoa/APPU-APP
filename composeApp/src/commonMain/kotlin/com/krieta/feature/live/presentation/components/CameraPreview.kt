package com.krieta.feature.live.presentation.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.krieta.feature.live.data.camera.CameraManager

@Composable
expect fun CameraPreview(
    cameraManager: CameraManager,
    modifier: Modifier = Modifier
)
