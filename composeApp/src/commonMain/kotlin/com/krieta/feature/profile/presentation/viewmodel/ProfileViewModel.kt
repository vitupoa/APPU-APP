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
import com.krieta.feature.auth.domain.repository.AuthRepository

data class ProfileState(
    val profile: UserProfile? = null,
    val tiers: List<SubscriptionTier> = emptyList(),
    val selectedNiches: List<String> = emptyList(),
    val customNiches: List<String> = emptyList(),
    val isLoading: Boolean = true,
    val isRelationshipLoading: Boolean = false,
    val error: String? = null
)

class ProfileViewModel(
    private val userId: String?,  // null = my own profile
    private val repository: ProfileRepository,
    private val authRepository: AuthRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ProfileState())
    val state: StateFlow<ProfileState> = _state.asStateFlow()

    val isOwnProfile: Boolean get() = userId == null

    companion object {
        // Cache profile data to prevent "Unknown User" on tab switch
        private var cachedOwnProfile: UserProfile? = null
    }

    init { 
        println("🔍 ProfileViewModel init - userId: $userId, isOwnProfile: $isOwnProfile")
        
        // Use cached profile if available for own profile
        if (isOwnProfile && cachedOwnProfile != null) {
            println("✅ ProfileViewModel: Using cached profile - ${cachedOwnProfile?.displayName}")
            _state.value = ProfileState(profile = cachedOwnProfile, isLoading = false)
        } else {
            println("🔍 ProfileViewModel: No cache, loading fresh profile")
            refreshProfile()
        }
        
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

    fun logout(onSuccess: () -> Unit) {
        screenModelScope.launch {
            authRepository.logout()
            onSuccess()
        }
    }
    
    fun wipeCache(onSuccess: () -> Unit) {
        screenModelScope.launch {
            authRepository.logout()
            onSuccess()
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
                                    stats = profile.stats.copy(admirers = profile.stats.admirers + 1)
                                )
                            )
                        }
                        is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                            _state.value = _state.value.copy(isRelationshipLoading = false, error = result.message)
                        }
                        is NetworkResult.Loading -> {}
                    }
                }
                RelationshipStatus.ADMIRING, RelationshipStatus.LOVERS -> {
                    when (repository.unadmire(profile.id)) {
                        is NetworkResult.Success -> {
                            val newStatus = if (profile.relationshipStatus == RelationshipStatus.LOVERS) RelationshipStatus.ADMIRED_BY else RelationshipStatus.NONE
                            _state.value = _state.value.copy(
                                isRelationshipLoading = false,
                                profile = profile.copy(
                                    relationshipStatus = newStatus,
                                    stats = profile.stats.copy(admirers = maxOf(0, profile.stats.admirers - 1))
                                )
                            )
                        }
                        is NetworkResult.Loading -> {}
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
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {}
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun refreshProfile() {
        loadProfile()
    }

    private fun loadProfile() {
        screenModelScope.launch {
            // Don't show loading if we have cached data
            val hasCache = isOwnProfile && cachedOwnProfile != null
            _state.value = _state.value.copy(
                isLoading = !hasCache,
                error = null,
                profile = if (hasCache) cachedOwnProfile else _state.value.profile
            )

            // If loading own profile, verify we have a valid token
            if (isOwnProfile) {
                println("🔍 ProfileViewModel: Loading own profile")
                val isAuthenticated = authRepository.isAuthenticated()
                println("🔍 ProfileViewModel: isAuthenticated = $isAuthenticated")
                
                if (!isAuthenticated) {
                    println("❌ ProfileViewModel: Not authenticated!")
                    _state.value = ProfileState(
                        isLoading = false, 
                        error = "Your session has expired. Please log in again."
                    )
                    return@launch
                }
            }

            val profileResult = if (isOwnProfile) {
                println("🔍 ProfileViewModel: Calling getMyProfile()")
                repository.getMyProfile()
            } else {
                println("🔍 ProfileViewModel: Calling getProfile($userId)")
                repository.getProfile(userId!!)
            }

            when (profileResult) {
                is NetworkResult.Success -> {
                    val profile = profileResult.data
                    println("✅ ProfileViewModel: Profile loaded successfully - ${profile.displayName}")
                    
                    // Cache own profile in memory for quick access
                    if (isOwnProfile) {
                        cachedOwnProfile = profile
                        println("💾 ProfileViewModel: Cached own profile in memory")
                    }
                    
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
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    println("❌ ProfileViewModel: Profile load error - ${profileResult.message}")
                    _state.value = ProfileState(
                        isLoading = false, 
                        error = profileResult.message
                    )
                }
            }
        }
    }
}
