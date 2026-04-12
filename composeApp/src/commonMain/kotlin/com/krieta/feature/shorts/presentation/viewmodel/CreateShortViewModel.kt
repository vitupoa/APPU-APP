package com.krieta.feature.shorts.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.CloudinaryUploader
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.shorts.domain.repository.ShortsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CreateShortState(
    val caption: String = "",
    val videoBytes: ByteArray? = null,
    val isPosting: Boolean = false,
    val success: Boolean = false,
    val error: String? = null
)

class CreateShortViewModel(
    private val repository: ShortsRepository,
    private val cloudinaryUploader: CloudinaryUploader
) : ScreenModel {

    private val _state = MutableStateFlow(CreateShortState())
    val state: StateFlow<CreateShortState> = _state.asStateFlow()

    fun updateCaption(caption: String) {
        _state.value = _state.value.copy(caption = caption)
    }

    fun setVideo(bytes: ByteArray) {
        _state.value = _state.value.copy(videoBytes = bytes)
    }

    fun post() {
        val currentState = _state.value
        if (currentState.videoBytes == null) {
            _state.value = currentState.copy(error = "Please select a video")
            return
        }

        screenModelScope.launch {
            _state.value = currentState.copy(isPosting = true, error = null)

            // 1. Upload video to Cloudinary
            when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.SHORTS_VIDEO, currentState.videoBytes, isVideo = true)) {
                is NetworkResult.Success -> {
                    val videoUrl = result.data

                    // 2. Create short via backend
                    when (val createResult = repository.createShort(videoUrl, currentState.caption)) {
                        is NetworkResult.Success -> {
                            _state.value = _state.value.copy(isPosting = false, success = true)
                        }
                        is NetworkResult.Error -> {
                            _state.value = _state.value.copy(isPosting = false, error = createResult.message)
                        }
                        else -> {}
                    }
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isPosting = false, error = "Failed to upload video: ${result.message}")
                }
                else -> {}
            }
        }
    }
}
