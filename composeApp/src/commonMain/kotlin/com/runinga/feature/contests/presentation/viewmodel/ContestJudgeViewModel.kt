package com.runinga.feature.contests.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import com.runinga.feature.contests.domain.model.Contest
import com.runinga.feature.contests.domain.model.ContestSubmission

sealed class JudgeState {
    object Loading : JudgeState()
    data class Success(val assignedContests: List<Contest>) : JudgeState()
    data class Error(val message: String) : JudgeState()
}

sealed class SubmissionState {
    object Loading : SubmissionState()
    data class Success(val entries: List<ContestSubmission>) : SubmissionState()
    data class Error(val message: String) : SubmissionState()
}

class ContestJudgeViewModel : ScreenModel {
    private val _state = MutableStateFlow<JudgeState>(JudgeState.Success(emptyList()))
    val state: StateFlow<JudgeState> = _state

    private val _submissionState = MutableStateFlow<SubmissionState>(SubmissionState.Success(emptyList()))
    val submissionState: StateFlow<SubmissionState> = _submissionState

    fun approveProofVerification(id: String) {
        // stub
    }

    fun rejectFraudulentProof(id: String) {
        // stub
    }

    fun selectWinner(id: String) {
        // stub
    }

    fun revokeWinnerStatus(id: String) {
        // stub
    }
}
