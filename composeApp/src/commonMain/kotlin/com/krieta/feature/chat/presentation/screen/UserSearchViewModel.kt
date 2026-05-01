package com.krieta.feature.chat.presentation.screen

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class UserSearchState(
    val query: String = "",
    val users: List<UserSearchResult> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class UserSearchViewModel(
    private val profileRepository: ProfileRepository
) : ScreenModel {

    private val _state = MutableStateFlow(UserSearchState())
    val state: StateFlow<UserSearchState> = _state.asStateFlow()

    private val queryFlow = MutableStateFlow("")

    init {
        @OptIn(FlowPreview::class, kotlinx.coroutines.ExperimentalCoroutinesApi::class)
        queryFlow
            .debounce(400)
            .distinctUntilChanged()
            .filter { it.length >= 2 }
            .onEach { _state.value = _state.value.copy(isLoading = true, query = it) }
            .mapLatest { profileRepository.searchUsers(it) }
            .onEach { result ->
                when (result) {
                    is NetworkResult.Success -> {
                        val users = result.data.map { 
                            UserSearchResult(
                                id = it.id,
                                username = it.username,
                                displayName = it.displayName,
                                avatarUrl = it.avatarUrl
                            )
                        }
                        _state.value = _state.value.copy(users = users, isLoading = false)
                    }
                    is NetworkResult.Error -> {
                        _state.value = _state.value.copy(error = result.message, isLoading = false)
                    }
                    else -> {}
                }
            }
            .launchIn(screenModelScope)
    }

    fun onQueryChange(query: String) {
        _state.value = _state.value.copy(query = query)
        queryFlow.value = query
        if (query.isBlank()) {
            _state.value = _state.value.copy(users = emptyList(), isLoading = false)
        }
    }
}
