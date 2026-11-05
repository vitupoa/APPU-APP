package com.runinga.feature.shorts.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.CloudinaryUploader
import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.network.ApiConstants
import com.runinga.feature.shorts.domain.repository.ShortsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CreateShortState(
    val caption: String = "",
    val videoFile: io.github.vinceglb.filekit.core.PlatformFile? = null,
    val isLocked: Boolean = false,
    val unlockPriceLocal: String = "", // Price in creator's local currency
    val unlockPriceKr: Double? = null, // Converted Rc amount
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
        
        // Convert to Rc if valid number and exchange rate available
        val priceDouble = priceLocal.toDoubleOrNull()
        if (priceDouble != null && priceDouble > 0 && exchangeRate != null && exchangeRate > 0) {
            // Convert local currency to Rc: Rc = localAmount / exchangeRate
            val krAmount = priceDouble / exchangeRate
            _state.value = _state.value.copy(unlockPriceRc = krAmount)
        } else {
            _state.value = _state.value.copy(unlockPriceRc = null)
        }
    }

    fun post() {
        val currentState = _state.value
        if (currentState.videoFile == null) {
            _state.value = currentState.copy(error = "Please select a video")
            return
        }

        if (currentState.isLocked && currentState.unlockPriceRc == null) {
            _state.value = currentState.copy(error = "Please enter a valid unlock price")
            return
        }

        screenModelScope.launch {
            _state.value = currentState.copy(isPosting = true, error = null)

            try {
                val filePath = com.runinga.com.core.util.FileStreamer.getFilePathOrUri(currentState.videoFile!!)
                com.runinga.com.core.upload.BackgroundUploader.enqueueUpload(
                    type = com.runinga.com.core.upload.UploadType.SHORT,
                    filePath = filePath,
                    caption = currentState.caption,
                    isLocked = currentState.isLocked,
                    unlockAmountRc = currentState.unlockPriceKr
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
