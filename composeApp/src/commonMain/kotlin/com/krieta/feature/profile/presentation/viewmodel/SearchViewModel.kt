package com.krieta.feature.profile.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.model.SocialUser
import com.krieta.feature.profile.domain.repository.ProfileRepository
import com.krieta.feature.chat.domain.repository.ChatRepository
import com.krieta.feature.shop.domain.repository.ShopRepository
import com.krieta.feature.contests.domain.repository.ContestsRepository
import com.krieta.feature.explore.domain.repository.ExploreRepository
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.async

enum class SearchResultType { USER, PRODUCT, CONTEST, SHORT, GROUP, HASHTAG, CHAMA, DRIP }

data class SearchResult(
    val id: String,
    val title: String,
    val subtitle: String,
    val type: SearchResultType,
    val imageUrl: String? = null
)

data class SearchState(
    val query: String = "",
    val results: List<SearchResult> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class SearchViewModel(
    private val repository: ProfileRepository,
    private val chatRepository: ChatRepository,
    private val shopRepository: ShopRepository,
    private val contestsRepository: ContestsRepository,
    private val exploreRepository: ExploreRepository
) : ScreenModel {

    private val _state = MutableStateFlow(SearchState())
    val state: StateFlow<SearchState> = _state.asStateFlow()

    private val queryFlow = MutableStateFlow("")

    init {
        @OptIn(FlowPreview::class, kotlinx.coroutines.ExperimentalCoroutinesApi::class)
        queryFlow
            .debounce(300)
            .distinctUntilChanged()
            .filter { it.length >= 2 }
            .onEach { _state.value = _state.value.copy(isLoading = true, query = it) }
            .mapLatest { query ->
                // Search across all categories in parallel
                screenModelScope.async {
                    val userResults = repository.searchUsers(query)
                    val groupResults = chatRepository.searchGroups(query)
                    val productResults = shopRepository.listProducts(category = null, query = query, sellerId = null, cursor = null)
                    val contestResults = contestsRepository.listContests(status = "ACTIVE", cursor = null)
                    val hashtagResults = exploreRepository.getTrendingHashtags(limit = 50)
                    val shortsResults = exploreRepository.getTrendingShorts(category = null, limit = 50)
                    
                    listOf(userResults, groupResults, productResults, contestResults, hashtagResults, shortsResults, query)
                }.await()
            }
            .onEach { searchData ->
                @Suppress("UNCHECKED_CAST")
                val userResult = searchData[0] as NetworkResult<List<SocialUser>>
                @Suppress("UNCHECKED_CAST")
                val groupResult = searchData[1] as NetworkResult<List<com.krieta.feature.chat.domain.model.Chat>>
                @Suppress("UNCHECKED_CAST")
                val productResult = searchData[2] as NetworkResult<com.krieta.feature.shop.domain.repository.ProductListResult>
                @Suppress("UNCHECKED_CAST")
                val contestResult = searchData[3] as NetworkResult<com.krieta.feature.contests.domain.repository.ContestListResult>
                @Suppress("UNCHECKED_CAST")
                val hashtagResults = searchData[4] as List<com.krieta.feature.explore.domain.model.TrendingHashtag>
                @Suppress("UNCHECKED_CAST")
                val shortResults = searchData[5] as List<com.krieta.feature.explore.domain.model.TrendingShort>
                val query = searchData[6] as String
                
                val results = mutableListOf<SearchResult>()
                val lowerQuery = query.lowercase()
                
                // Users
                when (userResult) {
                    is NetworkResult.Success -> {
                        results.addAll(userResult.data.map { 
                            SearchResult(
                                id = it.id,
                                title = it.displayName,
                                subtitle = "@${it.username}",
                                type = SearchResultType.USER,
                                imageUrl = it.avatarUrl
                            )
                        })
                    }
                    else -> {}
                }
                
                // Groups/Chamas
                when (groupResult) {
                    is NetworkResult.Success -> {
                        results.addAll(groupResult.data.map { chat ->
                            SearchResult(
                                id = chat.id,
                                title = chat.name ?: "Group",
                                subtitle = "${chat.participants.size} members",
                                type = SearchResultType.GROUP
                            )
                        })
                    }
                    else -> {}
                }
                
                // Products/Shop
                when (productResult) {
                    is NetworkResult.Success -> {
                        results.addAll(productResult.data.items.map { product ->
                            SearchResult(
                                id = product.id,
                                title = product.title,
                                subtitle = "Kr.${product.priceKr} • ${product.category ?: "Product"}",
                                type = SearchResultType.PRODUCT,
                                imageUrl = product.imageUrls.firstOrNull()
                            )
                        })
                    }
                    else -> {}
                }
                
                // Contests
                when (contestResult) {
                    is NetworkResult.Success -> {
                        results.addAll(contestResult.data.items
                            .filter { it.title.lowercase().contains(lowerQuery) }
                            .map { contest ->
                            SearchResult(
                                id = contest.id,
                                title = contest.title,
                                subtitle = "Prize: Kr.${contest.prizeKr} • ${contest.participantsCount} participants",
                                type = SearchResultType.CONTEST,
                                imageUrl = contest.coverMediaUrl
                            )
                        })
                    }
                    else -> {}
                }
                
                // Hashtags
                val matchingHashtags = hashtagResults.filter { 
                    it.tag.lowercase().contains(lowerQuery) 
                }.take(5)
                results.addAll(matchingHashtags.map { hashtag ->
                    SearchResult(
                        id = hashtag.tag,
                        title = hashtag.tag,
                        subtitle = "${formatCount(hashtag.viewCount)} views",
                        type = SearchResultType.HASHTAG
                    )
                })
                
                // Shorts
                val matchingShorts = shortResults.filter { short ->
                    short.creatorUsername.lowercase().contains(lowerQuery)
                }.take(5)
                results.addAll(matchingShorts.map { short ->
                    SearchResult(
                        id = short.id,
                        title = "Short by ${short.creatorUsername}",
                        subtitle = "${formatCount(short.viewCount)} views",
                        type = SearchResultType.SHORT,
                        imageUrl = short.thumbnailUrl
                    )
                })
                
                _state.value = _state.value.copy(results = results, isLoading = false)
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
    
    private fun formatCount(count: Long): String {
        return when {
            count >= 1_000_000 -> "${count / 1_000_000}M"
            count >= 1_000 -> "${count / 1_000}K"
            else -> count.toString()
        }
    }
}
