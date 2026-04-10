package com.krieta.feature.profile.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.model.Milestone
import com.krieta.feature.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class MilestonesState(
    val milestones: List<Milestone> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

class MilestonesViewModel(
    private val repository: ProfileRepository
) : ScreenModel {

    private val _state = MutableStateFlow(MilestonesState())
    val state: StateFlow<MilestonesState> = _state.asStateFlow()

    init { load() }

    private fun load() {
        screenModelScope.launch {
            when (val result = repository.getMyMilestones()) {
                is NetworkResult.Success -> {
                    _state.value = MilestonesState(milestones = result.data, isLoading = false)
                }
                is NetworkResult.Error -> {
                    _state.value = MilestonesState(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
