package com.krieta.feature.profile.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.model.SocialUser
import com.krieta.feature.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

enum class SearchResultType { USER, PRODUCT, CONTEST, SHORT }

data class SearchResult(
    val id: String,
    val title: String,
    val subtitle: String,
    val type: SearchResultType
)

data class SearchState(
    val query: String = "",
    val results: List<SearchResult> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class SearchViewModel(
    private val repository: ProfileRepository
) : ScreenModel {

    private val _state = MutableStateFlow(SearchState())
    val state: StateFlow<SearchState> = _state.asStateFlow()

    private val queryFlow = MutableStateFlow("")

    init {
        @OptIn(FlowPreview::class)
        queryFlow
            .debounce(300)
            .distinctUntilChanged()
            .filter { it.length >= 2 }
            .onEach { _state.value = _state.value.copy(isLoading = true, query = it) }
            .mapLatest { repository.searchUsers(it) }
            .onEach { result ->
                when (result) {
                    is NetworkResult.Success -> {
                        val mapped = result.data.map { 
                            SearchResult(
                                id = it.id,
                                title = it.displayName,
                                subtitle = "@${it.username}",
                                type = SearchResultType.USER
                            )
                        }
                        _state.value = _state.value.copy(results = mapped, isLoading = false)
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
            _state.value = _state.value.copy(results = emptyList(), isLoading = false)
        }
    }
}
