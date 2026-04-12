package com.krieta.feature.contests.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.CloudinaryUploader
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.contests.data.remote.dto.CreateContestRequestDto
import com.krieta.feature.contests.data.remote.dto.PrizeDistributionDto
import com.krieta.feature.contests.data.remote.dto.RequiredActionDto
import com.krieta.feature.contests.domain.repository.ContestsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.plus

data class CreateContestState(
    val title: String = "",
    val description: String = "",
    val prizeKr: String = "",
    val category: String = "CHALLENGE",
    val mediaType: String = "PHOTO_AND_VIDEO",
    val coverImageBytes: ByteArray? = null,
    val isPosting: Boolean = false,
    val success: Boolean = false,
    val error: String? = null
)

class CreateContestViewModel(
    private val repository: ContestsRepository,
    private val cloudinaryUploader: CloudinaryUploader
) : ScreenModel {

    private val _state = MutableStateFlow(CreateContestState())
    val state: StateFlow<CreateContestState> = _state.asStateFlow()

    fun updateTitle(v: String) { _state.value = _state.value.copy(title = v) }
    fun updateDescription(v: String) { _state.value = _state.value.copy(description = v) }
    fun updatePrizeKr(v: String) { _state.value = _state.value.copy(prizeKr = v) }
    fun updateCategory(v: String) { _state.value = _state.value.copy(category = v) }
    fun setCoverImage(bytes: ByteArray) { _state.value = _state.value.copy(coverImageBytes = bytes) }

    fun post() {
        val currentState = _state.value
        val prize = currentState.prizeKr.toDoubleOrNull()
        
        if (currentState.title.isBlank() || currentState.description.isBlank() || prize == null || prize <= 0) {
            _state.value = currentState.copy(error = "Please fill all required fields correctly")
            return
        }

        screenModelScope.launch {
            _state.value = currentState.copy(isPosting = true, error = null)

            var coverMediaUrl: String? = null
            if (currentState.coverImageBytes != null) {
                when (val result = cloudinaryUploader.uploadMedia(ApiConstants.CloudinaryFolders.CONTESTS_PHOTO, currentState.coverImageBytes, isVideo = false)) {
                    is NetworkResult.Success -> coverMediaUrl = result.data
                    is NetworkResult.Error -> {
                        _state.value = _state.value.copy(isPosting = false, error = "Cover image upload failed: ${result.message}")
                        return@launch
                    }
                    else -> {}
                }
            }

            // Defaults required by backend Zod validation
            val request = CreateContestRequestDto(
                title = currentState.title,
                description = currentState.description,
                mediaType = currentState.mediaType,
                category = currentState.category,
                prizeKr = prize,
                requiredActions = listOf(RequiredActionDto(type = "FOLLOW_CREATOR", label = "Follow Creator to Enter")),
                maxWinners = 1,
                prizeDistribution = listOf(PrizeDistributionDto(rank = 1, percentage = 100.0)),
                judgingCriteria = "CREATOR_PICKS",
                deadline = Clock.System.now().plus(7, DateTimeUnit.DAY, kotlinx.datetime.TimeZone.UTC).toString(),
                coverMediaUrl = coverMediaUrl
            )

            when (val result = repository.createContest(request)) {
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
