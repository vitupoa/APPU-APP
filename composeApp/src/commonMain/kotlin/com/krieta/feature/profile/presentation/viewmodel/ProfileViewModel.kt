package com.krieta.feature.profile.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.model.RelationshipStatus
import com.krieta.feature.profile.domain.model.SubscriptionTier
import com.krieta.feature.profile.domain.model.UserProfile
import com.krieta.feature.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

data class ProfileState(
    val profile: UserProfile? = null,
    val tiers: List<SubscriptionTier> = emptyList(),
    val isLoading: Boolean = true,
    val isRelationshipLoading: Boolean = false,
    val error: String? = null
)

class ProfileViewModel(
    private val userId: String?,  // null = my own profile
    private val repository: ProfileRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ProfileState())
    val state: StateFlow<ProfileState> = _state.asStateFlow()

    val isOwnProfile: Boolean get() = userId == null

    init { 
        refreshProfile() 
        observeProfileUpdates()
    }

    private fun observeProfileUpdates() {
        screenModelScope.launch {
            repository.profileUpdates.collectLatest { updatedProfile ->
                if (isOwnProfile || updatedProfile.id == userId) {
                    _state.value = _state.value.copy(profile = updatedProfile)
                }
            }
        }
    }

    fun toggleAdmire() {
        val profile = _state.value.profile ?: return
        screenModelScope.launch {
            _state.value = _state.value.copy(isRelationshipLoading = true)
            when (profile.relationshipStatus) {
                RelationshipStatus.NONE, RelationshipStatus.ADMIRED_BY -> {
                    when (val result = repository.admire(profile.id)) {
                        is NetworkResult.Success -> {
                            val isLovers = result.data
                            _state.value = _state.value.copy(
                                isRelationshipLoading = false,
                                profile = profile.copy(
                                    relationshipStatus = if (isLovers) RelationshipStatus.LOVERS else RelationshipStatus.ADMIRING,
                                    stats = profile.stats.copy(admirers = profile.stats.admirers + if (isLovers) 0 else 0)
                                )
                            )
                        }
                        is NetworkResult.Error -> {
                            _state.value = _state.value.copy(isRelationshipLoading = false, error = result.message)
                        }
                        is NetworkResult.Loading -> {}
                    }
                }
                RelationshipStatus.ADMIRING, RelationshipStatus.LOVERS -> {
                    when (repository.unadmire(profile.id)) {
                        is NetworkResult.Success -> {
                            _state.value = _state.value.copy(
                                isRelationshipLoading = false,
                                profile = profile.copy(relationshipStatus = RelationshipStatus.NONE)
                            )
                        }
                        is NetworkResult.Error -> {
                            _state.value = _state.value.copy(isRelationshipLoading = false)
                        }
                        is NetworkResult.Loading -> {}
                    }
                }
            }
        }
    }

    fun subscribe(tier: String) {
        val profile = _state.value.profile ?: return
        screenModelScope.launch {
            when (repository.subscribe(profile.id, tier)) {
                is NetworkResult.Success -> loadProfile() // Refresh to show updated state
                is NetworkResult.Error -> {}
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun refreshProfile() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            val profileResult = if (isOwnProfile) repository.getMyProfile() else repository.getProfile(userId!!)

            when (profileResult) {
                is NetworkResult.Success -> {
                    val profile = profileResult.data
                    // Load subscription tiers if not own profile
                    val tiers = if (!isOwnProfile) {
                        when (val tiersResult = repository.getUserSubscriptionTiers(profile.id)) {
                            is NetworkResult.Success -> tiersResult.data
                            else -> emptyList()
                        }
                    } else emptyList()

                    _state.value = ProfileState(
                        profile = profile,
                        tiers = tiers,
                        isLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = ProfileState(isLoading = false, error = profileResult.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
