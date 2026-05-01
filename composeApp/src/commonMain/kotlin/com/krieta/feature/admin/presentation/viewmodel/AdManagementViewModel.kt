package com.krieta.feature.admin.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.feature.admin.domain.model.*
import com.krieta.feature.admin.domain.repository.AdManagementRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AdManagementViewModel(
    private val repository: AdManagementRepository
) : ScreenModel {

    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state.asStateFlow()

    data class State(
        val adConfig: AdConfig? = null,
        val campaigns: List<AdCampaign> = emptyList(),
        val sponsoredPosts: List<SponsoredPostRequest> = emptyList(),
        val totalRevenue: Double = 0.0,
        val activeCampaigns: Int = 0,
        val totalImpressions: Long = 0,
        val avgCtr: Double = 0.0,
        val isLoading: Boolean = false,
        val error: String? = null
    )

    init {
        loadAdConfig()
        loadCampaigns()
        loadSponsoredPosts()
        loadAnalytics()
    }

    private fun loadAdConfig() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            repository.getAdConfig()
                .onSuccess { config ->
                    _state.value = _state.value.copy(
                        adConfig = config,
                        isLoading = false
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(
                        error = e.message,
                        isLoading = false
                    )
                }
        }
    }

    private fun loadCampaigns() {
        screenModelScope.launch {
            repository.getCampaigns(page = 1, limit = 100)
                .onSuccess { response ->
                    _state.value = _state.value.copy(campaigns = response.campaigns)
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(error = e.message)
                }
        }
    }

    private fun loadSponsoredPosts() {
        screenModelScope.launch {
            repository.getSponsoredPosts(page = 1, limit = 100)
                .onSuccess { response ->
                    _state.value = _state.value.copy(sponsoredPosts = response.posts)
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(error = e.message)
                }
        }
    }

    private fun loadAnalytics() {
        screenModelScope.launch {
            repository.getPlatformStats()
                .onSuccess { stats ->
                    _state.value = _state.value.copy(
                        totalRevenue = stats.campaigns.totalSpent,
                        activeCampaigns = stats.campaigns.activeCampaigns
                    )
                }
                .onFailure { e ->
                    _state.value = _state.value.copy(error = e.message)
                }
        }
    }

    // Platform Cut Management
    fun updatePlatformCut(newCut: Double) {
        screenModelScope.launch {
            repository.updatePlatformCut(newCut)
                .onSuccess { loadAdConfig() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    // Pricing Management
    fun updateNativeAdPricing(min: Double, max: Double) {
        screenModelScope.launch {
            repository.updateNativeAdPricing(min, max)
                .onSuccess { loadAdConfig() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    fun updateBannerAdPricing(min: Double, max: Double) {
        screenModelScope.launch {
            repository.updateBannerAdPricing(min, max)
                .onSuccess { loadAdConfig() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    fun updateStoryAdPricing(min: Double, max: Double) {
        screenModelScope.launch {
            repository.updateStoryAdPricing(min, max)
                .onSuccess { loadAdConfig() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    // Frequency Management
    fun updateNativeAdFrequency(frequency: Int) {
        screenModelScope.launch {
            repository.updateNativeAdFrequency(frequency)
                .onSuccess { loadAdConfig() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    fun updateBannerAdFrequency(frequency: Int) {
        screenModelScope.launch {
            repository.updateBannerAdFrequency(frequency)
                .onSuccess { loadAdConfig() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    fun updateStoryAdFrequency(frequency: Int) {
        screenModelScope.launch {
            repository.updateStoryAdFrequency(frequency)
                .onSuccess { loadAdConfig() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    // Campaign Management
    fun approveCampaign(campaignId: String) {
        screenModelScope.launch {
            repository.approveCampaign(campaignId)
                .onSuccess { loadCampaigns() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    fun rejectCampaign(campaignId: String, reason: String) {
        screenModelScope.launch {
            repository.rejectCampaign(campaignId, reason)
                .onSuccess { loadCampaigns() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    fun pauseCampaign(campaignId: String) {
        screenModelScope.launch {
            repository.pauseCampaign(campaignId)
                .onSuccess { loadCampaigns() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    fun deleteCampaign(campaignId: String) {
        screenModelScope.launch {
            repository.deleteCampaign(campaignId)
                .onSuccess { loadCampaigns() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    // Sponsored Posts
    fun verifySponsoredPost(postId: String) {
        screenModelScope.launch {
            repository.verifySponsoredPost(postId)
                .onSuccess { loadSponsoredPosts() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    fun releasePayment(postId: String) {
        screenModelScope.launch {
            repository.releasePayment(postId)
                .onSuccess { loadSponsoredPosts() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }

    // Toggle Ads
    fun toggleAds(enabled: Boolean) {
        screenModelScope.launch {
            repository.toggleAds(enabled)
                .onSuccess { loadAdConfig() }
                .onFailure { e -> _state.value = _state.value.copy(error = e.message) }
        }
    }
}
