package com.runinga.com.core.util

import androidx.compose.runtime.Composable

actual class ImagePicker {
    @Composable
    actual fun registerPicker(onImagePicked: (ByteArray) -> Unit) {
        // iOS implementation would go here
        // For now, empty implementation
    }

    actual fun pickImage() {
        // iOS implementation would go here
    }
}
