package com.krieta.feature.contests.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.contests.domain.model.ContestSubmission
import com.krieta.feature.contests.domain.repository.ContestsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ContestSubmissionFeedState(
    val submissions: List<ContestSubmission> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val nextCursor: String? = null,
    val isLoadingMore: Boolean = false
)

class ContestSubmissionFeedViewModel(
    private val repository: ContestsRepository,
    private val contestId: String? = null // null = all contests
) : ScreenModel {

    private val _state = MutableStateFlow(ContestSubmissionFeedState())
    val state: StateFlow<ContestSubmissionFeedState> = _state.asStateFlow()

    init {
        loadSubmissions()
    }

    fun loadSubmissions() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            // If contestId is provided, load submissions for that contest
            // Otherwise, load submissions from all active contests
            val result = if (contestId != null) {
                repository.getSubmissions(contestId, null)
            } else {
                // Load from all active contests - this would need a new API endpoint
                // For now, we'll use a placeholder
                NetworkResult.Success(com.krieta.feature.contests.domain.repository.SubmissionsResult(emptyList(), null))
            }

            when (result) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        submissions = result.data.items,
                        nextCursor = result.data.nextCursor,
                        isLoading = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
            }
        }
    }

    fun loadMore() {
        val cursor = _state.value.nextCursor ?: return
        if (_state.value.isLoadingMore) return

        screenModelScope.launch {
            _state.value = _state.value.copy(isLoadingMore = true)
            
            val result = if (contestId != null) {
                repository.getSubmissions(contestId, cursor)
            } else {
                NetworkResult.Success(com.krieta.feature.contests.domain.repository.SubmissionsResult(emptyList(), null))
            }

            when (result) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        submissions = _state.value.submissions + result.data.items,
                        nextCursor = result.data.nextCursor,
                        isLoadingMore = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoadingMore = false)
                }
            }
        }
    }

    fun upvoteSubmission(submissionId: String) {
        screenModelScope.launch {
            // Update local state optimistically
            val updated = _state.value.submissions.map { submission ->
                if (submission.id == submissionId) {
                    submission.copy(votes = submission.votes + 1)
                } else {
                    submission
                }
            }
            _state.value = _state.value.copy(submissions = updated)
            
            // Call API
            when (val result = repository.voteSubmission(submissionId)) {
                is NetworkResult.Error -> {
                    // Revert optimistic update on error
                    val reverted = _state.value.submissions.map { submission ->
                        if (submission.id == submissionId) {
                            submission.copy(votes = submission.votes - 1)
                        } else {
                            submission
                        }
                    }
                    _state.value = _state.value.copy(
                        submissions = reverted,
                        error = result.message ?: "Failed to vote"
                    )
                }
                else -> {}
            }
        }
    }

    fun downvoteSubmission(submissionId: String) {
        // Downvotes are tracked internally by backend but not exposed to users
        // No action needed on client side
    }

    fun refresh() {
        _state.value = ContestSubmissionFeedState()
        loadSubmissions()
    }
}
