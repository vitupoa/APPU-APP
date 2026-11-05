package com.runinga.feature.shop.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.shop.domain.model.Product
import com.runinga.feature.shop.domain.repository.ShopRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProductDetailState(
    val product: Product? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
    val bargainPrice: String = "",
    val bargainError: String? = null,
    val bargainSuccess: Boolean = false,
    val reviews: List<com.runinga.feature.shop.domain.model.ProductReview> = emptyList(),
    val reviewsLoading: Boolean = false,
    val reviewsCursor: String? = null,
    val hasMoreReviews: Boolean = false,
    val showReviewDialog: Boolean = false,
    val reviewRating: Int = 5,
    val reviewTitle: String = "",
    val reviewText: String = "",
    val reviewSubmitting: Boolean = false,
    val reviewError: String? = null
)

class ProductDetailViewModel(
    private val productId: String,
    private val repository: ShopRepository
) : ScreenModel {

    private val _state = MutableStateFlow(ProductDetailState())
    val state: StateFlow<ProductDetailState> = _state.asStateFlow()

    init {
        load()
        loadReviews()
    }

    private fun load() {
        screenModelScope.launch {
            when (val result = repository.getProduct(productId)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(product = result.data, isLoading = false)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
            }
        }
    }

    private fun loadReviews(cursor: String? = null) {
        screenModelScope.launch {
            _state.value = _state.value.copy(reviewsLoading = true)
            when (val result = (repository as com.runinga.feature.shop.data.repository.ShopRepositoryImpl).getProductReviews(productId, cursor)) {
                is NetworkResult.Success -> {
                    val currentReviews = if (cursor == null) emptyList() else _state.value.reviews
                    _state.value = _state.value.copy(
                        reviews = currentReviews + result.data.items,
                        reviewsCursor = result.data.nextCursor,
                        hasMoreReviews = result.data.nextCursor != null,
                        reviewsLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(reviewsLoading = false)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun loadMoreReviews() {
        if (!_state.value.reviewsLoading && _state.value.hasMoreReviews) {
            loadReviews(_state.value.reviewsCursor)
        }
    }

    fun onBargainPriceChange(price: String) {
        _state.value = _state.value.copy(bargainPrice = price, bargainError = null, bargainSuccess = false)
    }

    fun submitBargain() {
        val product = _state.value.product ?: return
        val priceStr = _state.value.bargainPrice
        
        if (priceStr.isBlank()) {
            _state.value = _state.value.copy(bargainError = "Please enter your offer")
            return
        }
        
        val price = priceStr.toDoubleOrNull()
        if (price == null || price <= 0) {
            _state.value = _state.value.copy(bargainError = "Invalid price")
            return
        }
        
        if (product.bargainMinPrice != null && price < product.bargainMinPrice) {
            _state.value = _state.value.copy(
                bargainError = "Your offer is too low. Please try a higher amount.",
                bargainSuccess = false
            )
            return
        }
        
        _state.value = _state.value.copy(
            bargainSuccess = true,
            bargainError = null
        )
    }

    fun resetBargain() {
        _state.value = _state.value.copy(
            bargainPrice = "",
            bargainError = null,
            bargainSuccess = false
        )
    }

    fun showReviewDialog() {
        _state.value = _state.value.copy(showReviewDialog = true)
    }

    fun hideReviewDialog() {
        _state.value = _state.value.copy(
            showReviewDialog = false,
            reviewRating = 5,
            reviewTitle = "",
            reviewText = "",
            reviewError = null
        )
    }

    fun onReviewRatingChange(rating: Int) {
        _state.value = _state.value.copy(reviewRating = rating)
    }

    fun onReviewTitleChange(title: String) {
        _state.value = _state.value.copy(reviewTitle = title)
    }

    fun onReviewTextChange(text: String) {
        _state.value = _state.value.copy(reviewText = text)
    }

    fun submitReview() {
        val rating = _state.value.reviewRating
        val title = _state.value.reviewTitle
        val text = _state.value.reviewText

        if (text.isBlank()) {
            _state.value = _state.value.copy(reviewError = "Please write a review")
            return
        }

        screenModelScope.launch {
            _state.value = _state.value.copy(reviewSubmitting = true, reviewError = null)
            when (val result = (repository as com.runinga.feature.shop.data.repository.ShopRepositoryImpl).createReview(
                productId = productId,
                rating = rating,
                title = title.ifBlank { null },
                text = text
            )) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        reviewSubmitting = false,
                        showReviewDialog = false,
                        reviewRating = 5,
                        reviewTitle = "",
                        reviewText = "",
                        reviews = listOf(result.data) + _state.value.reviews
                    )
                    load() // Reload product to update rating
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        reviewSubmitting = false,
                        reviewError = result.message
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
