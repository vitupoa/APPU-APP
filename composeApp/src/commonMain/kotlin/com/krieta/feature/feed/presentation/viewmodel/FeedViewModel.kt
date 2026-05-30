package com.krieta.feature.feed.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.feed.domain.model.Post
import com.krieta.feature.feed.domain.repository.FeedRepository
import com.krieta.feature.sponsored.presentation.SponsoredContentManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.Job
import kotlinx.coroutines.isActive

data class FeedState(
    val items: List<Post> = emptyList(),
    val nextCursor: String? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val sponsoredIndices: Set<Int> = emptySet()
)

class FeedViewModel(
    private val repository: FeedRepository,
    private val sponsoredManager: SponsoredContentManager
) : ScreenModel {

    private val _state = MutableStateFlow(FeedState(isLoading = true))
    val state: StateFlow<FeedState> = _state.asStateFlow()
    
    private var autoRefreshJob: Job? = null

    init { 
        loadFeed()
        startAutoRefresh()
    }
    
    override fun onDispose() {
        super.onDispose()
        autoRefreshJob?.cancel()
    }
    
    private fun startAutoRefresh() {
        autoRefreshJob = screenModelScope.launch {
            while (isActive) {
                delay(30 * 60 * 1000L) // 30 minutes
                refresh()
            }
        }
    }

    fun refresh() {
        _state.value = _state.value.copy(isRefreshing = true, error = null)
        screenModelScope.launch {
            when (val result = repository.getFeed(null)) {
                is NetworkResult.Success -> {
                    val items = injectSponsoredContent(result.data.items)
                    _state.value = FeedState(
                        items = items,
                        nextCursor = result.data.nextCursor
                    )
                }
                is NetworkResult.Loading -> {}
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
                    val newItems = injectSponsoredContent(result.data.items, _state.value.items.size)
                    _state.value = _state.value.copy(
                        items = _state.value.items + newItems,
                        nextCursor = result.data.nextCursor,
                        isLoadingMore = false
                    )
                }
                is NetworkResult.Loading -> {}
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
                    val items = injectSponsoredContent(result.data.items)
                    _state.value = FeedState(
                        items = items,
                        nextCursor = result.data.nextCursor,
                        isLoading = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = FeedState(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    private suspend fun injectSponsoredContent(items: List<Post>, startIndex: Int = 0): List<Post> {
        if (items.isEmpty()) return items
        
        // Inject every 5 items (best practice for text-based feeds)
        val result = mutableListOf<Post>()
        val sponsoredIndices = mutableSetOf<Int>()
        
        items.forEachIndexed { index, post ->
            result.add(post)
            
            // Inject sponsored content every 5 items
            if ((startIndex + index + 1) % 5 == 0) {
                sponsoredManager.fetchSponsoredContent("post")
                val sponsored = sponsoredManager.sponsoredContent.value
                
                if (sponsored != null) {
                    try {
                        when (val postResult = repository.getPostById(sponsored.contentId)) {
                            is NetworkResult.Success -> {
                                result.add(postResult.data)
                                sponsoredIndices.add(result.size - 1)
                            }
                            else -> {}
                        }
                    } catch (e: Exception) {
                        // Silent fail
                    }
                }
            }
        }
        
        _state.value = _state.value.copy(sponsoredIndices = _state.value.sponsoredIndices + sponsoredIndices)
        return result
    }

    fun isSponsored(index: Int): Boolean = _state.value.sponsoredIndices.contains(index)

    fun recordSponsoredImpression(index: Int) {
        if (!isSponsored(index)) return
        screenModelScope.launch {
            sponsoredManager.recordImpression()
        }
    }

    fun recordSponsoredEngagement(index: Int, type: String) {
        if (!isSponsored(index)) return
        screenModelScope.launch {
            sponsoredManager.recordEngagement(type)
        }
    }

    /**
     * Add a newly created post to the top of the feed (optimistic update)
     * This provides instant feedback without waiting for a full refresh
     */
    fun addNewPost(postId: String) {
        screenModelScope.launch {
            when (val result = repository.getPostById(postId)) {
                is NetworkResult.Success -> {
                    val newPost = result.data
                    // Add to the top of the feed
                    _state.value = _state.value.copy(
                        items = listOf(newPost) + _state.value.items
                    )
                    // Log analytics
                    println("Analytics: Post created - ID: $postId")
                }
                is NetworkResult.Error -> {
                    // If fetch fails, fall back to full refresh
                    println("Error fetching new post, falling back to refresh: ${result.message}")
                    refresh()
                }
                else -> {}
            }
        }
    }
}
