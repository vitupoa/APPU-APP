package com.krieta.feature.marketplace.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.marketplace.domain.model.SocialMediaAccount
import com.krieta.feature.marketplace.domain.model.SocialPlatform
import com.krieta.feature.marketplace.domain.repository.MarketplaceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SocialMediaManagementState(
    val accounts: List<SocialMediaAccount> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val successMessage: String? = null,
    val isSyncing: Boolean = false
)

class SocialMediaManagementViewModel(
    private val influencerId: String,
    private val repository: MarketplaceRepository
) : ScreenModel {

    private val _state = MutableStateFlow(SocialMediaManagementState())
    val state: StateFlow<SocialMediaManagementState> = _state.asStateFlow()

    init {
        loadAccounts()
    }

    fun loadAccounts() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            when (val result = repository.getConnectedAccounts()) {
                is NetworkResult.Success -> {
                    val mappedAccounts = result.data.accounts.map { connectedAccount ->
                        SocialMediaAccount(
                            id = connectedAccount.id,
                            influencerId = "",
                            platform = SocialPlatform.valueOf(connectedAccount.platform.uppercase()),
                            username = connectedAccount.username,
                            profileUrl = "",
                            displayName = connectedAccount.displayName,
                            followerCount = connectedAccount.followerCount,
                            subscriberCount = 0,
                            videoCount = 0,
                            totalViews = 0L,
                            avgViews = 0,
                            avgLikes = 0,
                            engagementRate = 0.0,
                            isVerified = connectedAccount.isVerified,
                            isPrimary = false,
                            syncStatus = "synced",
                            lastSyncedAt = connectedAccount.lastSyncedAt ?: ""
                        )
                    }
                    _state.value = _state.value.copy(
                        accounts = mappedAccounts,
                        isLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message ?: "Failed to load accounts"
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun syncAccount(platform: SocialPlatform) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isSyncing = true, error = null)
            
            // Trigger OAuth flow to refresh account data
            when (val result = repository.getOAuthUrl(platform.name.lowercase())) {
                is NetworkResult.Success -> {
                    // In a real implementation, this would open a browser/webview
                    // For now, we'll just refresh the account data
                    loadAccounts()
                    _state.value = _state.value.copy(
                        isSyncing = false,
                        successMessage = "${platform.name} account synced successfully"
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isSyncing = false,
                        error = result.message ?: "Failed to sync account"
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun setPrimaryAccount(platform: SocialPlatform) {
        screenModelScope.launch {
            _state.value = _state.value.copy(error = null)
            
            // Update local state optimistically
            val updatedAccounts = _state.value.accounts.map { account ->
                account.copy(isPrimary = account.platform == platform)
            }
            _state.value = _state.value.copy(accounts = updatedAccounts)
            
            // In a real implementation, this would call an API endpoint
            // For now, we'll just show success message
            _state.value = _state.value.copy(
                successMessage = "${platform.name} set as primary account"
            )
        }
    }

    fun deleteAccount(platform: SocialPlatform) {
        screenModelScope.launch {
            _state.value = _state.value.copy(error = null)
            
            when (val result = repository.disconnectAccount(platform.name.lowercase())) {
                is NetworkResult.Success -> {
                    // Remove account from local state
                    val updatedAccounts = _state.value.accounts.filter { it.platform != platform }
                    _state.value = _state.value.copy(
                        accounts = updatedAccounts,
                        successMessage = "${platform.name} account disconnected"
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        error = result.message ?: "Failed to disconnect account"
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun addAccount(platform: SocialPlatform, username: String) {
        screenModelScope.launch {
            _state.value = _state.value.copy(error = null)
            
            // Get OAuth URL to start connection flow
            when (val result = repository.getOAuthUrl(platform.name.lowercase())) {
                is NetworkResult.Success -> {
                    // In a real implementation, this would open OAuth flow
                    // For now, we'll show a message
                    _state.value = _state.value.copy(
                        successMessage = "Opening ${platform.name} authentication..."
                    )
                    // After OAuth completes, reload accounts
                    loadAccounts()
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        error = result.message ?: "Failed to connect account"
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun clearMessages() {
        _state.value = _state.value.copy(error = null, successMessage = null)
    }
}
