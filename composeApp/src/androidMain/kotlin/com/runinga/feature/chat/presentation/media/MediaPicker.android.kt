package com.runinga.feature.chat.presentation.media

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

@Composable
actual fun rememberImagePicker(
    onMediaSelected: (MediaFile) -> Unit
): () -> Unit {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val mediaFile = uriToMediaFile(context, it, "image")
            mediaFile?.let(onMediaSelected)
        }
    }
    return { launcher.launch("image/*") }
}

@Composable
actual fun rememberVideoPicker(
    onMediaSelected: (MediaFile) -> Unit
): () -> Unit {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val mediaFile = uriToMediaFile(context, it, "video")
            mediaFile?.let(onMediaSelected)
        }
    }
    return { launcher.launch("video/*") }
}

@Composable
actual fun rememberDocumentPicker(
    onMediaSelected: (MediaFile) -> Unit
): () -> Unit {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val mediaFile = uriToMediaFile(context, it, "document")
            mediaFile?.let(onMediaSelected)
        }
    }
    return { launcher.launch("application/pdf") }
}

private fun uriToMediaFile(context: Context, uri: Uri, type: String): MediaFile? {
    return try {
        val contentResolver = context.contentResolver
        val cursor = contentResolver.query(uri, null, null, null, null)
        
        var fileName = "file"
        var fileSize = 0L
        
        cursor?.use {
            if (it.moveToFirst()) {
                val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = it.getColumnIndex(OpenableColumns.SIZE)
                if (nameIndex != -1) fileName = it.getString(nameIndex)
                if (sizeIndex != -1) fileSize = it.getLong(sizeIndex)
            }
        }
        
        val mimeType = contentResolver.getType(uri) ?: "application/octet-stream"
        val bytes = contentResolver.openInputStream(uri)?.readBytes() ?: byteArrayOf()
        
        MediaFile(
            uri = uri.toString(),
            fileName = fileName,
            fileSize = fileSize,
            mimeType = mimeType,
            bytes = bytes
        )
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}
