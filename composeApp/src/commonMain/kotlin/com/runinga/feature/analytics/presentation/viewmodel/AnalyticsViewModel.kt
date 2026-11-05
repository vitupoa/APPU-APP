package com.runinga.feature.analytics.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.analytics.domain.model.CreatorAnalytics
import com.runinga.feature.analytics.domain.repository.AnalyticsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AnalyticsState(
    val analytics: CreatorAnalytics? = null,
    val selectedDays: Int = 30,
    val isLoading: Boolean = true,
    val error: String? = null
)

class AnalyticsViewModel(
    private val repository: AnalyticsRepository
) : ScreenModel {

    private val _state = MutableStateFlow(AnalyticsState())
    val state: StateFlow<AnalyticsState> = _state.asStateFlow()

    init { load() }

    fun selectPeriod(days: Int) {
        _state.value = _state.value.copy(selectedDays = days)
        load()
    }

    fun refresh() { load() }

    private fun load() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            when (val result = repository.getCreatorAnalytics(_state.value.selectedDays)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(analytics = result.data, isLoading = false)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
            }
        }
    }
}
