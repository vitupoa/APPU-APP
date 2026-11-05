package com.runinga.feature.feed.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.CloudinaryUploader
import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.network.ApiConstants
import com.runinga.feature.feed.domain.repository.FeedRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CreatePostState(
    val caption: String = "",
    val imageFiles: List<io.github.vinceglb.filekit.core.PlatformFile> = emptyList(),
    val isLocked: Boolean = false,
    val unlockPriceLocal: String = "", // Price in creator's local currency
    val unlockPriceKr: Double? = null, // Converted Rc amount
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
        if (currentState.caption.isBlank() && currentState.imageFiles.isEmpty()) {
            _state.value = currentState.copy(error = "Cannot post empty content")
            return
        }

        if (currentState.isLocked && currentState.unlockPriceRc == null) {
            _state.value = currentState.copy(error = "Please enter a valid unlock price")
            return
        }

        screenModelScope.launch {
            _state.value = currentState.copy(isPosting = true, error = null)

            // Just queue the first image for now since BackgroundUploader supports 1 file per job
            // In a complete implementation we could zip multiple jobs or pass an array of URIs
            val firstFile = currentState.imageFiles.firstOrNull()
            if (firstFile != null) {
                val filePath = com.runinga.com.core.util.FileStreamer.getFilePathOrUri(firstFile)
                com.runinga.com.core.upload.BackgroundUploader.enqueueUpload(
                    type = com.runinga.com.core.upload.UploadType.DRIP,
                    filePath = filePath,
                    caption = currentState.caption,
                    isLocked = currentState.isLocked,
                    unlockAmountRc = currentState.unlockPriceKr
                )
            }
            
            _state.value = _state.value.copy(isPosting = false, success = true)
        }
    }
}
