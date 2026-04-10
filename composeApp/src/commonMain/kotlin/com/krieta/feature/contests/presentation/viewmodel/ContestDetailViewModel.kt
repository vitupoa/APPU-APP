package com.krieta.feature.contests.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.domain.model.ContestSubmission
import com.krieta.feature.contests.domain.repository.ContestsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ContestDetailState(
    val contest: Contest? = null,
    val submissions: List<ContestSubmission> = emptyList(),
    val nextSubmissionCursor: String? = null,
    val isLoading: Boolean = true,
    val isJoining: Boolean = false,
    val hasJoined: Boolean = false,
    val error: String? = null
)

class ContestDetailViewModel(
    private val contestId: String,
    private val repository: ContestsRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ContestDetailState())
    val state: StateFlow<ContestDetailState> = _state.asStateFlow()

    init { loadDetail() }

    fun joinContest() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isJoining = true)
            when (val result = repository.joinContest(contestId)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isJoining = false,
                        hasJoined = true,
                        contest = _state.value.contest?.copy(
                            isJoined = true,
                            participantsCount = (_state.value.contest?.participantsCount ?: 0) + 1
                        )
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isJoining = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadMoreSubmissions() {
        val cursor = _state.value.nextSubmissionCursor ?: return
        screenModelScope.launch {
            when (val result = repository.getSubmissions(contestId, cursor)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        submissions = _state.value.submissions + result.data.items,
                        nextSubmissionCursor = result.data.nextCursor
                    )
                }
                else -> {}
            }
        }
    }

    private fun loadDetail() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)

            val contestResult = repository.getContest(contestId)
            val submissionsResult = repository.getSubmissions(contestId, null)

            val contest = when (contestResult) {
                is NetworkResult.Success -> contestResult.data
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = contestResult.message)
                    return@launch
                }
                is NetworkResult.Loading -> return@launch
            }

            val submissions = when (submissionsResult) {
                is NetworkResult.Success -> submissionsResult.data
                else -> null
            }

            _state.value = ContestDetailState(
                contest = contest,
                submissions = submissions?.items ?: emptyList(),
                nextSubmissionCursor = submissions?.nextCursor,
                isLoading = false,
                hasJoined = contest.isJoined
            )
        }
    }
}
