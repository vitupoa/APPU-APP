package com.krieta.feature.feed.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.feed.domain.model.Post
import com.krieta.feature.feed.domain.repository.FeedRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FeedState(
    val items: List<Post> = emptyList(),
    val nextCursor: String? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null
)

class FeedViewModel(
    private val repository: FeedRepository
) : ScreenModel {

    private val _state = MutableStateFlow(FeedState(isLoading = true))
    val state: StateFlow<FeedState> = _state.asStateFlow()

    init { loadFeed() }

    fun refresh() {
        _state.value = _state.value.copy(isRefreshing = true, error = null)
        screenModelScope.launch {
            when (val result = repository.getFeed(null)) {
                is NetworkResult.Success -> {
                    _state.value = FeedState(
                        items = result.data.items,
                        nextCursor = result.data.nextCursor
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isRefreshing = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadMore() {
        val cursor = _state.value.nextCursor ?: return
        if (_state.value.isLoadingMore) return
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoadingMore = true)
            when (val result = repository.getFeed(cursor)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        items = _state.value.items + result.data.items,
                        nextCursor = result.data.nextCursor,
                        isLoadingMore = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoadingMore = false)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun toggleLike(postId: String) {
        screenModelScope.launch {
            when (val result = repository.toggleLike(postId)) {
                is NetworkResult.Success -> {
                    val liked = result.data
                    _state.value = _state.value.copy(
                        items = _state.value.items.map { post ->
                            if (post.id == postId) post.copy(
                                isLiked = liked,
                                likesCount = if (liked) post.likesCount + 1 else post.likesCount - 1
                            ) else post
                        }
                    )
                }
                else -> {}
            }
        }
    }

    private fun loadFeed() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.getFeed(null)) {
                is NetworkResult.Success -> {
                    _state.value = FeedState(
                        items = result.data.items,
                        nextCursor = result.data.nextCursor,
                        isLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = FeedState(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
