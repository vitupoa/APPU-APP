package com.krieta.com.core.util

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

actual class ImagePicker {
    private var onImagePicked: ((ByteArray) -> Unit)? = null
    private var launcher: ((Uri?) -> Unit)? = null

    @Composable
    actual fun registerPicker(onImagePicked: (ByteArray) -> Unit) {
        this.onImagePicked = onImagePicked
        val context = LocalContext.current
        
        val launcher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.GetContent()
        ) { uri: Uri? ->
            uri?.let {
                try {
                    val inputStream = context.contentResolver.openInputStream(it)
                    val bytes = inputStream?.readBytes()
                    inputStream?.close()
                    bytes?.let { imageBytes ->
                        onImagePicked(imageBytes)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        
        this.launcher = { launcher.launch("image/*") }
    }

    actual fun pickImage() {
        launcher?.invoke(null)
    }
}
