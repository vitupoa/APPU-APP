package com.runinga.feature.chat.presentation.media

import androidx.compose.runtime.Composable

data class MediaFile(
    val uri: String,
    val fileName: String,
    val fileSize: Long,
    val mimeType: String,
    val bytes: ByteArray
)

@Composable
expect fun rememberImagePicker(
    onMediaSelected: (MediaFile) -> Unit
): () -> Unit

@Composable
expect fun rememberVideoPicker(
    onMediaSelected: (MediaFile) -> Unit
): () -> Unit

@Composable
expect fun rememberDocumentPicker(
    onMediaSelected: (MediaFile) -> Unit
): () -> Unit
