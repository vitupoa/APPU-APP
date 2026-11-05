package com.runinga.feature.sponsored.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.runinga.feature.sponsored.data.remote.SponsoredApi
import com.runinga.feature.sponsored.domain.model.SponsoredAnalytics
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class CampaignAnalyticsState {
    object Loading : CampaignAnalyticsState()
    data class Success(val analytics: SponsoredAnalytics) : CampaignAnalyticsState()
    data class Error(val message: String) : CampaignAnalyticsState()
}

class CampaignAnalyticsViewModel(
    private val api: SponsoredApi,
    private val campaignId: String
) : ViewModel() {
    
    private val _state = MutableStateFlow<CampaignAnalyticsState>(CampaignAnalyticsState.Loading)
    val state: StateFlow<CampaignAnalyticsState> = _state.asStateFlow()
    
    init {
        loadAnalytics()
    }
    
    fun loadAnalytics() {
        viewModelScope.launch {
            _state.value = CampaignAnalyticsState.Loading
            try {
                val analytics = api.getCampaignAnalytics(campaignId)
                _state.value = CampaignAnalyticsState.Success(analytics)
            } catch (e: Exception) {
                _state.value = CampaignAnalyticsState.Error(e.message ?: "Failed to load analytics")
            }
        }
    }
}
