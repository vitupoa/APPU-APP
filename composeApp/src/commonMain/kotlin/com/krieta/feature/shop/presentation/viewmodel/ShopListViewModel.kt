package com.krieta.feature.shop.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.shop.domain.model.Product
import com.krieta.feature.shop.domain.repository.ShopRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ShopListState(
    val items: List<Product> = emptyList(),
    val nextCursor: String? = null,
    val isLoading: Boolean = true,
    val isLoadingMore: Boolean = false,
    val searchQuery: String = "",
    val selectedCategory: String? = null,
    val error: String? = null
)

class ShopListViewModel(
    private val repository: ShopRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ShopListState())
    val state: StateFlow<ShopListState> = _state.asStateFlow()

    init { load() }

    fun search(query: String) {
        _state.value = _state.value.copy(searchQuery = query)
        load()
    }

    fun selectCategory(category: String?) {
        _state.value = _state.value.copy(selectedCategory = category)
        load()
    }

    fun loadMore() {
        val cursor = _state.value.nextCursor ?: return
        if (_state.value.isLoadingMore) return
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoadingMore = true)
            val result = repository.listProducts(
                category = _state.value.selectedCategory,
                query = _state.value.searchQuery.ifBlank { null },
                sellerId = null,
                cursor = cursor
            )
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
            _state.value = _state.value.copy(isLoading = true, error = null)
            val result = repository.listProducts(
                category = _state.value.selectedCategory,
                query = _state.value.searchQuery.ifBlank { null },
                sellerId = null,
                cursor = null
            )
            when (result) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        items = result.data.items,
                        nextCursor = result.data.nextCursor,
                        isLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
