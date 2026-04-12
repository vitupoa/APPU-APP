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
    val imageBytes: List<ByteArray> = emptyList(),
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

    fun addImage(bytes: ByteArray) {
        val current = _state.value.imageBytes.toMutableList()
        if (current.size < 10) {
            current.add(bytes)
            _state.value = _state.value.copy(imageBytes = current)
        }
    }

    fun removeImage(index: Int) {
        val current = _state.value.imageBytes.toMutableList()
        if (index in current.indices) {
            current.removeAt(index)
            _state.value = _state.value.copy(imageBytes = current)
        }
    }

    fun post() {
        val currentState = _state.value
        if (currentState.caption.isBlank() && currentState.imageBytes.isEmpty()) {
            _state.value = currentState.copy(error = "Cannot post empty content")
            return
        }

        screenModelScope.launch {
            _state.value = currentState.copy(isPosting = true, error = null)

            // 1. Upload images to Cloudinary (if any)
            val uploadedUrls = mutableListOf<String>()
            for (bytes in currentState.imageBytes) {
                when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.FEED_PHOTO, bytes, isVideo = false)) {
                    is NetworkResult.Success -> uploadedUrls.add(result.data)
                    is NetworkResult.Error -> {
                        _state.value = _state.value.copy(isPosting = false, error = "Failed to upload image: ${result.message}")
                        return@launch
                    }
                    else -> {}
                }
            }

            // 2. Create post via backend
            when (val result = repository.createPost(currentState.caption, uploadedUrls)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(isPosting = false, success = true)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isPosting = false, error = result.message)
                }
                else -> {}
            }
        }
    }
}
