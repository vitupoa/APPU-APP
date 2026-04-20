package com.krieta.feature.contests.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.contests.domain.model.JudgeInvite
import com.krieta.feature.contests.domain.model.JudgeInviteStatus
import com.krieta.feature.contests.domain.repository.ContestsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class JudgeInvitationsState(
    val invitations: List<JudgeInvite> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val processingInviteId: String? = null
)

class JudgeInvitationsViewModel(
    private val repository: ContestsRepository
) : ScreenModel {

    private val _state = MutableStateFlow(JudgeInvitationsState())
    val state: StateFlow<JudgeInvitationsState> = _state.asStateFlow()

    fun loadInvitations() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            when (val result = repository.getJudgeInvitations()) {
                is NetworkResult.Success -> {
                    // Filter to show only pending invitations
                    val pendingInvites = result.data.filter { 
                        it.status == JudgeInviteStatus.PENDING 
                    }
                    _state.value = _state.value.copy(
                        invitations = pendingInvites,
                        isLoading = false,
                        error = null
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message ?: "Failed to load invitations"
                    )
                }
                else -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = "An unexpected error occurred"
                    )
                }
            }
        }
    }

    fun acceptInvite(inviteId: String) {
        screenModelScope.launch {
            _state.value = _state.value.copy(processingInviteId = inviteId)
            
            when (repository.acceptJudgeInvite(inviteId)) {
                is NetworkResult.Success -> {
                    // Remove the accepted invite from the list
                    _state.value = _state.value.copy(
                        invitations = _state.value.invitations.filter { it.id != inviteId },
                        processingInviteId = null
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        processingInviteId = null,
                        error = "Failed to accept invitation"
                    )
                }
                else -> {
                    _state.value = _state.value.copy(
                        processingInviteId = null,
                        error = "An unexpected error occurred"
                    )
                }
            }
        }
    }

    fun declineInvite(inviteId: String) {
        screenModelScope.launch {
            _state.value = _state.value.copy(processingInviteId = inviteId)
            
            when (repository.declineJudgeInvite(inviteId)) {
                is NetworkResult.Success -> {
                    // Remove the declined invite from the list
                    _state.value = _state.value.copy(
                        invitations = _state.value.invitations.filter { it.id != inviteId },
                        processingInviteId = null
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        processingInviteId = null,
                        error = "Failed to decline invitation"
                    )
                }
                else -> {
                    _state.value = _state.value.copy(
                        processingInviteId = null,
                        error = "An unexpected error occurred"
                    )
                }
            }
        }
    }
}
