package com.krieta.feature.marketplace.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.marketplace.domain.model.InfluencerProfile
import com.krieta.feature.marketplace.domain.model.InfluencerTier
import com.krieta.feature.marketplace.domain.repository.MarketplaceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class InfluencerSearchViewModel(
    private val repository: MarketplaceRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow<InfluencerSearchState>(InfluencerSearchState.Loading)
    val uiState: StateFlow<InfluencerSearchState> = _uiState
    
    fun searchInfluencers(
        tier: InfluencerTier? = null,
        category: String? = null,
        minEngagement: Double? = null,
        minFollowers: Int? = null,
        minSubscribers: Int? = null,
        platform: String? = null
    ) {
        viewModelScope.launch {
            _uiState.value = InfluencerSearchState.Loading
            when (val result = repository.searchInfluencers(
                tier, category, minEngagement, minFollowers, minSubscribers, platform
            )) {
                is NetworkResult.Success -> {
                    _uiState.value = InfluencerSearchState.Success(
                        result.data.first,
                        result.data.second
                    )
                }
                is NetworkResult.Error -> {
                    _uiState.value = InfluencerSearchState.Error(result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}

sealed class InfluencerSearchState {
    object Loading : InfluencerSearchState()
    data class Success(
        val influencers: List<InfluencerProfile>,
        val socialAccountsMap: Map<String, List<com.krieta.feature.marketplace.domain.model.SocialMediaAccount>>
    ) : InfluencerSearchState()
    data class Error(val message: String) : InfluencerSearchState()
}
