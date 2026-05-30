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
    val isLocked: Boolean = false,
    val unlockPriceLocal: String = "", // Price in creator's local currency
    val unlockPriceKr: Double? = null, // Converted Kr amount
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

    fun toggleLock(isLocked: Boolean) {
        _state.value = _state.value.copy(isLocked = isLocked)
    }

    fun updateUnlockPrice(priceLocal: String, exchangeRate: Double?) {
        _state.value = _state.value.copy(unlockPriceLocal = priceLocal)
        
        // Convert to Kr if valid number and exchange rate available
        val priceDouble = priceLocal.toDoubleOrNull()
        if (priceDouble != null && priceDouble > 0 && exchangeRate != null && exchangeRate > 0) {
            // Convert local currency to Kr: Kr = localAmount / exchangeRate
            val krAmount = priceDouble / exchangeRate
            _state.value = _state.value.copy(unlockPriceKr = krAmount)
        } else {
            _state.value = _state.value.copy(unlockPriceKr = null)
        }
    }

    fun post() {
        val currentState = _state.value
        if (currentState.videoFile == null) {
            _state.value = currentState.copy(error = "Please select a video")
            return
        }

        if (currentState.isLocked && currentState.unlockPriceKr == null) {
            _state.value = currentState.copy(error = "Please enter a valid unlock price")
            return
        }

        screenModelScope.launch {
            _state.value = currentState.copy(isPosting = true, error = null)

            try {
                val filePath = com.krieta.com.core.util.FileStreamer.getFilePathOrUri(currentState.videoFile!!)
                com.krieta.com.core.upload.BackgroundUploader.enqueueUpload(
                    type = com.krieta.com.core.upload.UploadType.SHORT,
                    filePath = filePath,
                    caption = currentState.caption,
                    isLocked = currentState.isLocked,
                    unlockAmountKr = currentState.unlockPriceKr
                )
                
                _state.value = _state.value.copy(isPosting = false, success = true)
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isPosting = false, 
                    error = "Failed to queue upload: ${e.message}"
                )
            }
        }
    }
}
