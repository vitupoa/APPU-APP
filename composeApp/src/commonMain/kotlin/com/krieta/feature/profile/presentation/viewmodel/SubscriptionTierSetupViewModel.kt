package com.krieta.feature.profile.presentation.viewmodel
import com.krieta.com.core.util.SafeConversion
import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.model.SubscriptionTier
import com.krieta.feature.profile.domain.model.SubscriptionTierType
import com.krieta.feature.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TierDraft(
    val tier: SubscriptionTierType,
    val krAmount: String = "",
    val benefits: String = "",
    val isEnabled: Boolean = false
)

data class TierSetupState(
    val tiers: List<TierDraft> = SubscriptionTierType.entries.map { TierDraft(tier = it) },
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null
)

class SubscriptionTierSetupViewModel(
    private val repository: ProfileRepository
) : ScreenModel {

    private val _state = MutableStateFlow(TierSetupState())
    val state: StateFlow<TierSetupState> = _state.asStateFlow()

    init { loadTiers() }

    fun updateTierAmount(tier: SubscriptionTierType, amount: String) {
        _state.value = _state.value.copy(
            tiers = _state.value.tiers.map { if (it.tier == tier) it.copy(krAmount = amount) else it }
        )
    }

    fun updateTierBenefits(tier: SubscriptionTierType, benefits: String) {
        _state.value = _state.value.copy(
            tiers = _state.value.tiers.map { if (it.tier == tier) it.copy(benefits = benefits) else it }
        )
    }

    fun toggleTierEnabled(tier: SubscriptionTierType) {
        _state.value = _state.value.copy(
            tiers = _state.value.tiers.map { if (it.tier == tier) it.copy(isEnabled = !it.isEnabled) else it }
        )
    }

    fun save() {
        val enabledTiers = _state.value.tiers.filter { it.isEnabled && it.krAmount.isNotBlank() && it.benefits.isNotBlank() }
        if (enabledTiers.isEmpty()) {
            _state.value = _state.value.copy(error = "Enable at least one tier with amount and benefits")
            return
        }

        screenModelScope.launch {
            _state.value = _state.value.copy(isSaving = true, error = null)
            val domainTiers = _state.value.tiers
                .filter { it.krAmount.isNotBlank() }
                .map {
                    SubscriptionTier(
                        id = "",
                        tier = it.tier,
                        krAmount = SafeConversion.toDoubleOrDefaultWithValidation(it.krAmount, "subscriptionAmount", 0.0, defaultValue = 0.0),
                        benefits = it.benefits,
                        isEnabled = it.isEnabled
                    )
                }

            when (val result = repository.updateSubscriptionTiers(domainTiers)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(isSaving = false, saveSuccess = true)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isSaving = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    private fun loadTiers() {
        screenModelScope.launch {
            when (val result = repository.getMySubscriptionTiers()) {
                is NetworkResult.Success -> {
                    val existing = result.data.associateBy { it.tier }
                    _state.value = TierSetupState(
                        tiers = SubscriptionTierType.entries.map { tierType ->
                            val saved = existing[tierType]
                            TierDraft(
                                tier = tierType,
                                krAmount = saved?.krAmount?.toString() ?: "",
                                benefits = saved?.benefits ?: "",
                                isEnabled = saved?.isEnabled ?: false
                            )
                        },
                        isLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = TierSetupState(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
