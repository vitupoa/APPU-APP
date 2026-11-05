package com.runinga.feature.marketplace.presentation.oauth

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.oauth.OAuthBrowser
import com.runinga.com.core.oauth.OAuthResult
import com.runinga.feature.marketplace.domain.repository.MarketplaceRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SocialAccount(
    val id: String,
    val platform: String,
    val username: String,
    val displayName: String,
    val followerCount: Int,
    val isVerified: Boolean,
    val lastSyncedAt: String?
)

data class OAuthState(
    val accounts: List<SocialAccount> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isConnecting: Boolean = false
)

class OAuthViewModel(
    private val repository: MarketplaceRepository,
    private val oauthBrowser: OAuthBrowser
) : ScreenModel {
    
    private val _state = MutableStateFlow(OAuthState())
    val state: StateFlow<OAuthState> = _state.asStateFlow()
    
    init {
        loadAccounts()
    }
    
    fun loadAccounts() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            when (val result = repository.getConnectedAccounts()) {
                is NetworkResult.Success -> {
                    val accounts = result.data.accounts.map { account ->
                        SocialAccount(
                            id = account.id,
                            platform = account.platform,
                            username = account.username,
                            displayName = account.displayName,
                            followerCount = account.followerCount,
                            isVerified = account.isVerified,
                            lastSyncedAt = account.lastSyncedAt
                        )
                    }
                    _state.value = _state.value.copy(
                        accounts = accounts,
                        isLoading = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
            }
        }
    }
    
    fun connectAccount(platform: String) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isConnecting = true, error = null)
            
            when (val result = repository.getOAuthUrl(platform)) {
                is NetworkResult.Success -> {
                    val authUrl = result.data.authUrl
                    val callbackScheme = "runinga"
                    
                    when (val browserResult = oauthBrowser.openAuthUrl(authUrl, callbackScheme)) {
                        is OAuthResult.Success -> {
                            handleCallback(platform, browserResult.code, browserResult.state)
                        }
                        is OAuthResult.Error -> {
                            _state.value = _state.value.copy(
                                isConnecting = false,
                                error = browserResult.message
                            )
                        }
                        is OAuthResult.Cancelled -> {
                            _state.value = _state.value.copy(isConnecting = false)
                        }
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isConnecting = false,
                        error = result.message
                    )
                }
            }
        }
    }
    
    fun handleCallback(platform: String, code: String, state: String) {
        screenModelScope.launch {
            when (repository.handleOAuthCallback(platform, code, state)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(isConnecting = false)
                    loadAccounts()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isConnecting = false,
                        error = "Failed to connect account"
                    )
                }
            }
        }
    }
    
    fun disconnectAccount(platform: String) {
        screenModelScope.launch {
            when (repository.disconnectAccount(platform)) {
                is NetworkResult.Success -> {
                    loadAccounts()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        error = "Failed to disconnect account"
                    )
                }
            }
        }
    }
    
    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}
