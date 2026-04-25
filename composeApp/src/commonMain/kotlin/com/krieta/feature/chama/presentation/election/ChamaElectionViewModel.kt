package com.krieta.feature.chama.presentation.election

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.data.remote.dto.ChamaElectionDto
import com.krieta.feature.chama.data.remote.dto.NominateRequest
import com.krieta.feature.chama.data.remote.dto.StartElectionRequest
import com.krieta.feature.chama.data.remote.dto.VoteRequest
import com.krieta.feature.chama.domain.repository.ChamaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ChamaElectionState(
    val election: ChamaElectionDto? = null,
    val isLoading: Boolean = true,
    val isActionLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null
)

class ChamaElectionViewModel(
    private val chamaId: String,
    private val electionId: String,
    private val repository: ChamaRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ChamaElectionState())
    val state = _state.asStateFlow()

    init {
        loadElection()
    }

    fun loadElection() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.getElectionStatus(chamaId, electionId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isLoading = false, election = result.data) }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun nominate(nomineeId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isActionLoading = true) }
            when (val result = repository.nominate(chamaId, electionId, NominateRequest(nomineeId))) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isActionLoading = false, successMessage = "Nomination successful") }
                    loadElection()
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isActionLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun secondNomination(nominationId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isActionLoading = true) }
            when (val result = repository.secondNomination(chamaId, electionId, nominationId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isActionLoading = false, successMessage = "Seconded successfully") }
                    loadElection()
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isActionLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun vote(nominationId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isActionLoading = true) }
            when (val result = repository.castVote(chamaId, electionId, VoteRequest(nominationId))) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isActionLoading = false, successMessage = "Vote cast successfully") }
                    loadElection()
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isActionLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun clearMessages() = _state.update { it.copy(error = null, successMessage = null) }
}
