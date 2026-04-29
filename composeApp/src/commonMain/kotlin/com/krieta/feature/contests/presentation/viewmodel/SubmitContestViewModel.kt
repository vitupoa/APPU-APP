package com.krieta.feature.contests.presentation.viewmodel

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.domain.model.ContestAction
import com.krieta.feature.contests.domain.repository.ContestsRepository
import kotlinx.coroutines.launch

data class SubmitContestState(
    val contest: Contest? = null,
    val requirements: List<ContestAction> = emptyList(),
    val hasSubmitted: Boolean = false,
    val canSubmit: Boolean = false,
    val selectedMediaUri: String? = null,
    val proofUris: List<String> = emptyList(),
    val uploadingMedia: Boolean = false,
    val uploadingProof: Boolean = false,
    val submitting: Boolean = false,
    val error: String? = null,
    val success: Boolean = false
)

class SubmitContestViewModel(
    private val contestId: String,
    private val repository: ContestsRepository
) : ScreenModel {

    var state by mutableStateOf(SubmitContestState())
        private set

    init {
        loadContestAndRequirements()
    }

    private fun loadContestAndRequirements() {
        screenModelScope.launch {
            when (val result = repository.getContest(contestId)) {
                is NetworkResult.Success -> {
                    state = state.copy(contest = result.data)
                    loadRequirements()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    state = state.copy(error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    private fun loadRequirements() {
        screenModelScope.launch {
            when (val result = repository.getContestRequirements(contestId)) {
                is NetworkResult.Success -> {
                    state = state.copy(
                        requirements = result.data.actions,
                        hasSubmitted = result.data.hasSubmitted,
                        canSubmit = result.data.canSubmit
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    state = state.copy(error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun onMediaSelected(uri: String) {
        state = state.copy(selectedMediaUri = uri, error = null)
    }

    fun onProofAdded(uri: String) {
        state = state.copy(proofUris = state.proofUris + uri, error = null)
    }

    fun onProofRemoved(uri: String) {
        state = state.copy(proofUris = state.proofUris - uri)
    }

    fun onMediaUploaded(url: String) {
        state = state.copy(selectedMediaUri = url, uploadingMedia = false)
    }

    fun onProofUploaded(url: String) {
        state = state.copy(
            proofUris = state.proofUris + url,
            uploadingProof = false
        )
    }

    fun setUploadingMedia(uploading: Boolean) {
        state = state.copy(uploadingMedia = uploading)
    }

    fun setUploadingProof(uploading: Boolean) {
        state = state.copy(uploadingProof = uploading)
    }

    fun submitEntry() {
        val mediaUrl = state.selectedMediaUri
        val contest = state.contest

        if (mediaUrl == null || contest == null) {
            state = state.copy(error = "Please select media to submit")
            return
        }

        if (!state.canSubmit) {
            state = state.copy(error = "You must complete all requirements before submitting")
            return
        }

        val mediaType = if (mediaUrl.contains(".mp4") || mediaUrl.contains("video")) "video" else "photo"

        state = state.copy(submitting = true, error = null)

        screenModelScope.launch {
            when (val result = repository.submitEntry(contestId, mediaUrl, mediaType, state.proofUris)) {
                is NetworkResult.Success -> {
                    state = state.copy(submitting = false, success = true)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    state = state.copy(submitting = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun clearError() {
        state = state.copy(error = null)
    }
}
