package com.krieta.feature.sponsored.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.krieta.feature.sponsored.data.remote.SponsoredApi
import com.krieta.feature.sponsored.domain.model.SponsoredContent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class BrandDashboardState {
    object Loading : BrandDashboardState()
    data class Success(val campaigns: List<SponsoredContent>) : BrandDashboardState()
    data class Error(val message: String) : BrandDashboardState()
}

class BrandDashboardViewModel(
    private val api: SponsoredApi
) : ViewModel() {
    
    private val _state = MutableStateFlow<BrandDashboardState>(BrandDashboardState.Loading)
    val state: StateFlow<BrandDashboardState> = _state.asStateFlow()
    
    init {
        loadCampaigns()
    }
    
    fun loadCampaigns() {
        viewModelScope.launch {
            _state.value = BrandDashboardState.Loading
            try {
                val campaigns = api.getMyCampaigns()
                _state.value = BrandDashboardState.Success(campaigns)
            } catch (e: Exception) {
                _state.value = BrandDashboardState.Error(e.message ?: "Failed to load campaigns")
            }
        }
    }
    
    fun toggleCampaign(campaignId: String) {
        viewModelScope.launch {
            try {
                api.toggleCampaign(campaignId)
                loadCampaigns()
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
