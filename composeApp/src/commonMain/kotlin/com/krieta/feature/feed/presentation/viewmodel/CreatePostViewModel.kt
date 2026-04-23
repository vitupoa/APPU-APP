package com.krieta.feature.feed.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.CloudinaryUploader
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.feed.domain.repository.FeedRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CreatePostState(
    val caption: String = "",
    val imageFiles: List<io.github.vinceglb.filekit.core.PlatformFile> = emptyList(),
    val isPosting: Boolean = false,
    val success: Boolean = false,
    val error: String? = null
)

class CreatePostViewModel(
    private val repository: FeedRepository,
    private val cloudinaryUploader: CloudinaryUploader
) : ScreenModel {

    private val _state = MutableStateFlow(CreatePostState())
    val state: StateFlow<CreatePostState> = _state.asStateFlow()

    fun updateCaption(caption: String) {
        _state.value = _state.value.copy(caption = caption)
    }

    fun addImage(file: io.github.vinceglb.filekit.core.PlatformFile) {
        val current = _state.value.imageFiles.toMutableList()
        if (current.size < 10) {
            current.add(file)
            _state.value = _state.value.copy(imageFiles = current)
        }
    }

    fun removeImage(index: Int) {
        val current = _state.value.imageFiles.toMutableList()
        if (index in current.indices) {
            current.removeAt(index)
            _state.value = _state.value.copy(imageFiles = current)
        }
    }

    fun post() {
        val currentState = _state.value
        if (currentState.caption.isBlank() && currentState.imageFiles.isEmpty()) {
            _state.value = currentState.copy(error = "Cannot post empty content")
            return
        }

        screenModelScope.launch {
            _state.value = currentState.copy(isPosting = true, error = null)

            // Just queue the first image for now since BackgroundUploader supports 1 file per job
            // In a complete implementation we could zip multiple jobs or pass an array of URIs
            val firstFile = currentState.imageFiles.firstOrNull()
            if (firstFile != null) {
                val filePath = com.krieta.com.core.util.FileStreamer.getFilePathOrUri(firstFile)
                com.krieta.com.core.upload.BackgroundUploader.enqueueUpload(
                    type = com.krieta.com.core.upload.UploadType.DRIP,
                    filePath = filePath,
                    caption = currentState.caption
                )
            }
            
            _state.value = _state.value.copy(isPosting = false, success = true)
        }
    }
}
