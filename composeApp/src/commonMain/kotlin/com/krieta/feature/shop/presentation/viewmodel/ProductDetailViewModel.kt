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

data class ProductDetailState(
    val product: Product? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

class ProductDetailViewModel(
    private val productId: String,
    private val repository: ShopRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ProductDetailState())
    val state: StateFlow<ProductDetailState> = _state.asStateFlow()

    init { load() }

    private fun load() {
        screenModelScope.launch {
            when (val result = repository.getProduct(productId)) {
                is NetworkResult.Success -> {
                    _state.value = ProductDetailState(product = result.data, isLoading = false)
                }
                is NetworkResult.Error -> {
                    _state.value = ProductDetailState(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
