package com.runinga.feature.sponsored.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.runinga.com.core.location.UserCurrencyProvider
import com.runinga.feature.sponsored.data.remote.SponsoredApi
import com.runinga.feature.sponsored.domain.model.CreateSponsoredCampaignRequest
import com.runinga.feature.sponsored.domain.model.PricingModel
import com.runinga.feature.sponsored.domain.model.SponsoredContentType
import com.runinga.feature.sponsored.domain.model.SponsoredTargeting
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import com.runinga.com.core.util.currentTimeMillis

sealed class CreateCampaignState {
    object Idle : CreateCampaignState()
    object Creating : CreateCampaignState()
    object Success : CreateCampaignState()
    data class Error(val message: String) : CreateCampaignState()
}

class CreateCampaignViewModel(
    private val api: SponsoredApi,
    private val currencyProvider: UserCurrencyProvider
) : ViewModel() {
    
    private val _state = MutableStateFlow<CreateCampaignState>(CreateCampaignState.Idle)
    val state: StateFlow<CreateCampaignState> = _state.asStateFlow()
    
    val exchangeRate = currencyProvider.exchangeRate
    val currencyCode = currencyProvider.currencyCode
    
    init {
        viewModelScope.launch {
            currencyProvider.start()
        }
    }
    
    fun fiatToKr(fiatAmount: Double): Double {
        val rate = currencyProvider.exchangeRate.value?.baseRate ?: 0.0
        return com.runinga.com.core.util.KrCurrencyFormatter.fiatToKr(fiatAmount, rate)
    }
    
    fun createCampaign(
        campaignName: String,
        contentType: String,
        contentId: String,
        budgetFiat: String,
        pricingModel: String,
        bidAmountFiat: String,
        ageMin: String,
        ageMax: String
    ) {
        viewModelScope.launch {
            _state.value = CreateCampaignState.Creating
            try {
                val budgetRc = budgetFiat.toDoubleOrNull()?.let { fiatToKr(it) } ?: 0.0
                val bidAmountRc = bidAmountFiat.toDoubleOrNull()?.let { fiatToKr(it) } ?: 0.0
                
                val request = CreateSponsoredCampaignRequest(
                    contentType = SponsoredContentType.valueOf(contentType.uppercase()),
                    contentId = contentId,
                    campaignName = campaignName,
                    budget = budgetKr,
                    pricingModel = PricingModel.valueOf(pricingModel),
                    bidAmount = bidAmountKr,
                    startDate = currentTimeMillis().toString(),
                    endDate = (currentTimeMillis() + 30L * 24 * 60 * 60 * 1000).toString(),
                    targeting = SponsoredTargeting(
                        ageMin = ageMin.toIntOrNull(),
                        ageMax = ageMax.toIntOrNull()
                    )
                )
                
                api.createCampaign(request)
                _state.value = CreateCampaignState.Success
            } catch (e: Exception) {
                _state.value = CreateCampaignState.Error(e.message ?: "Failed to create campaign")
            }
        }
    }
    
    fun resetState() {
        _state.value = CreateCampaignState.Idle
    }
}
