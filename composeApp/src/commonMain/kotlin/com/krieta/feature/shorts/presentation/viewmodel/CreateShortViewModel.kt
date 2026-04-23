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
    val videoFile: io.github.vinceglb.filekit.core.PlatformFile? = null,
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

    fun setVideo(file: io.github.vinceglb.filekit.core.PlatformFile) {
        _state.value = _state.value.copy(videoFile = file)
    }

    fun post() {
        val currentState = _state.value
        if (currentState.videoFile == null) {
            _state.value = currentState.copy(error = "Please select a video")
            return
        }

        screenModelScope.launch {
            _state.value = currentState.copy(isPosting = true, error = null)

            val filePath = com.krieta.com.core.util.FileStreamer.getFilePathOrUri(currentState.videoFile!!)
            com.krieta.com.core.upload.BackgroundUploader.enqueueUpload(
                type = com.krieta.com.core.upload.UploadType.SHORT,
                filePath = filePath,
                caption = currentState.caption
            )
            
            _state.value = _state.value.copy(isPosting = false, success = true)
        }
    }
}
