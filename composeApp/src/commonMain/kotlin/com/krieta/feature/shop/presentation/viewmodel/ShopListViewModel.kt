package com.krieta.feature.shop.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.shop.data.remote.ShopSocketEvent
import com.krieta.feature.shop.data.remote.ShopWebSocketManager
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
    private val repository: ShopRepository,
    private val webSocketManager: ShopWebSocketManager
) : ScreenModel {

    private val _state = MutableStateFlow(ShopListState())
    val state: StateFlow<ShopListState> = _state.asStateFlow()

    init { 
        load()
        observeWebSocket()
    }

    private fun observeWebSocket() {
        screenModelScope.launch {
            webSocketManager.connect()
            webSocketManager.events.collect { event ->
                when (event) {
                    is ShopSocketEvent.ProductCreated -> handleProductCreated(event.product)
                    is ShopSocketEvent.ProductUpdated -> handleProductUpdated(event.product)
                    is ShopSocketEvent.ProductDeleted -> handleProductDeleted(event.productId)
                }
            }
        }
    }

    private fun handleProductCreated(product: Product) {
        val current = _state.value
        if (matchesFilters(product)) {
            _state.value = current.copy(items = listOf(product) + current.items)
        }
    }

    private fun handleProductUpdated(product: Product) {
        val current = _state.value
        val items = current.items.toMutableList()
        val index = items.indexOfFirst { it.id == product.id }
        if (index != -1) {
            if (matchesFilters(product)) {
                items[index] = product
            } else {
                items.removeAt(index)
            }
            _state.value = current.copy(items = items)
        }
    }

    private fun handleProductDeleted(productId: String) {
        val current = _state.value
        _state.value = current.copy(items = current.items.filter { it.id != productId })
    }

    private fun matchesFilters(product: Product): Boolean {
        val query = _state.value.searchQuery
        val category = _state.value.selectedCategory
        
        if (category != null && product.category != category) return false
        if (query.isNotBlank() && !product.title.contains(query, ignoreCase = true)) return false
        
        return true
    }

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

    // Error handling has been enhanced with proper error messages and security measures
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
                        isLoading = false,
                        error = null
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false, 
                        error = "Failed to load products. Please check your connection and try again."
                    )
                }
            }
        }
    }
    
    fun refreshProducts() {
        load()
    }
    
    override fun onDispose() {
        super.onDispose()
        screenModelScope.launch {
            webSocketManager.disconnect()
        }
    }
}
