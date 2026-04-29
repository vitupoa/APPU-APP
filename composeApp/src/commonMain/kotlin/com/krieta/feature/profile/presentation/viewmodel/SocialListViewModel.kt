package com.krieta.feature.profile.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.model.SocialUser
import com.krieta.feature.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class SocialListType { ADMIRERS, ADMIRING, LOVERS }

data class SocialListState(
    val items: List<SocialUser> = emptyList(),
    val nextCursor: String? = null,
    val isLoading: Boolean = true,
    val isLoadingMore: Boolean = false,
    val error: String? = null
)

class SocialListViewModel(
    private val userId: String,
    private val listType: SocialListType,
    private val repository: ProfileRepository
) : ScreenModel {

    private val _state = MutableStateFlow(SocialListState())
    val state: StateFlow<SocialListState> = _state.asStateFlow()

    init { load() }

    fun loadMore() {
        val cursor = _state.value.nextCursor ?: return
        if (_state.value.isLoadingMore) return
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoadingMore = true)
            val result = fetchList(cursor)
            when (result) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        items = _state.value.items + result.data.items,
                        nextCursor = result.data.nextCursor,
                        isLoadingMore = false
                    )
                }
                else -> _state.value = _state.value.copy(isLoadingMore = false)
            }
        }
    }

    private fun load() {
        screenModelScope.launch {
            _state.value = SocialListState(isLoading = true)
            when (val result = fetchList(null)) {
                is NetworkResult.Success -> {
                    _state.value = SocialListState(
                        items = result.data.items,
                        nextCursor = result.data.nextCursor,
                        isLoading = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = SocialListState(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    private suspend fun fetchList(cursor: String?) = when (listType) {
        SocialListType.ADMIRERS -> repository.getAdmirers(userId, cursor)
        SocialListType.ADMIRING -> repository.getAdmiring(userId, cursor)
        SocialListType.LOVERS -> repository.getLovers(userId, cursor)
    }
}
