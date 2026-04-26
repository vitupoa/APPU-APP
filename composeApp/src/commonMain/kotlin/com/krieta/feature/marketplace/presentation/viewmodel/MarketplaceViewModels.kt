package com.krieta.feature.marketplace.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.marketplace.domain.model.*
import com.krieta.feature.marketplace.domain.repository.MarketplaceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class CampaignListViewModel(
    private val repository: MarketplaceRepository
) : ViewModel() {
    
    private val _myCampaigns = MutableStateFlow<List<BrandCampaign>>(emptyList())
    val myCampaigns: StateFlow<List<BrandCampaign>> = _myCampaigns
    
    private val _availableCampaigns = MutableStateFlow<List<BrandCampaign>>(emptyList())
    val availableCampaigns: StateFlow<List<BrandCampaign>> = _availableCampaigns
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading
    
    fun loadMyCampaigns() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getMyCampaigns()) {
                is NetworkResult.Success -> _myCampaigns.value = result.data
                is NetworkResult.Error -> {}
                is com.krieta.com.core.network.NetworkResult.Loading -> {}
            }
            _isLoading.value = false
        }
    }
    
    fun loadAvailableCampaigns() {
        viewModelScope.launch {
            _isLoading.value = true
            when (val result = repository.getAvailableCampaigns()) {
                is NetworkResult.Success -> _availableCampaigns.value = result.data
                is NetworkResult.Error -> {}
                is com.krieta.com.core.network.NetworkResult.Loading -> {}
            }
            _isLoading.value = false
        }
    }
}

class CreateCampaignViewModel(
    private val repository: MarketplaceRepository
) : ViewModel() {
    
    private val _createState = MutableStateFlow<CreateCampaignState>(CreateCampaignState.Idle)
    val createState: StateFlow<CreateCampaignState> = _createState
    
    fun createCampaign(
        title: String,
        description: String,
        budget: Double,
        targetTier: InfluencerTier?,
        categories: List<String>,
        requirements: String,
        deliverables: String,
        startDate: String,
        endDate: String
    ) {
        viewModelScope.launch {
            _createState.value = CreateCampaignState.Loading
            when (val result = repository.createCampaign(
                title, description, budget, targetTier, categories, requirements, deliverables, startDate, endDate
            )) {
                is NetworkResult.Success -> {
                    _createState.value = CreateCampaignState.Success(result.data)
                }
                is NetworkResult.Error -> {
                    _createState.value = CreateCampaignState.Error(result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}

sealed class CreateCampaignState {
    object Idle : CreateCampaignState()
    object Loading : CreateCampaignState()
    data class Success(val campaign: BrandCampaign) : CreateCampaignState()
    data class Error(val message: String) : CreateCampaignState()
}

class CampaignApplicationsViewModel(
    private val repository: MarketplaceRepository
) : ViewModel() {
    
    private val _applications = MutableStateFlow<List<CampaignApplication>>(emptyList())
    val applications: StateFlow<List<CampaignApplication>> = _applications
    
    fun loadMyApplications() {
        viewModelScope.launch {
            when (val result = repository.getMyApplications()) {
                is NetworkResult.Success -> _applications.value = result.data
                is NetworkResult.Error -> {}
                is com.krieta.com.core.network.NetworkResult.Loading -> {}
            }
        }
    }
    
    fun applyToCampaign(campaignId: String, proposedRate: Double, pitch: String) {
        viewModelScope.launch {
            repository.applyToCampaign(campaignId, proposedRate, pitch)
            loadMyApplications()
        }
    }
}

class SponsorContestViewModel(
    private val repository: MarketplaceRepository
) : ViewModel() {
    
    private val _sponsorState = MutableStateFlow<SponsorState>(SponsorState.Idle)
    val sponsorState: StateFlow<SponsorState> = _sponsorState
    
    fun sponsorContest(
        contestId: String,
        amount: Double,
        productUrl: String?,
        enablePurchaseToEnter: Boolean
    ) {
        viewModelScope.launch {
            _sponsorState.value = SponsorState.Loading
            when (val result = repository.sponsorContest(contestId, amount, productUrl, enablePurchaseToEnter)) {
                is NetworkResult.Success -> {
                    _sponsorState.value = SponsorState.Success(result.data)
                }
                is NetworkResult.Error -> {
                    _sponsorState.value = SponsorState.Error(result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}

sealed class SponsorState {
    object Idle : SponsorState()
    object Loading : SponsorState()
    data class Success(val sponsorship: ContestSponsorship) : SponsorState()
    data class Error(val message: String) : SponsorState()
}

class GamificationViewModel(
    private val repository: MarketplaceRepository
) : ViewModel() {
    
    private val _stats = MutableStateFlow<GamificationStats?>(null)
    val stats: StateFlow<GamificationStats?> = _stats
    
    fun loadStats() {
        viewModelScope.launch {
            when (val result = repository.getGamificationStats()) {
                is NetworkResult.Success -> _stats.value = result.data
                is NetworkResult.Error -> {}
                is com.krieta.com.core.network.NetworkResult.Loading -> {}
            }
        }
    }
}
