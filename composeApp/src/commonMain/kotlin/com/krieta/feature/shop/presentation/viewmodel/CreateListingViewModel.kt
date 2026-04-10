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

data class CreateListingState(
    val title: String = "",
    val description: String = "",
    val imageUrls: List<String> = emptyList(),
    val priceKr: String = "",
    val category: String = "",
    val whatsappNumber: String = "",
    val isSaving: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null
)

class CreateListingViewModel(
    private val repository: ShopRepository
) : ScreenModel {

    private val _state = MutableStateFlow(CreateListingState())
    val state: StateFlow<CreateListingState> = _state.asStateFlow()

    fun onTitleChange(v: String) { _state.value = _state.value.copy(title = v) }
    fun onDescriptionChange(v: String) { _state.value = _state.value.copy(description = v) }
    fun onPriceChange(v: String) { _state.value = _state.value.copy(priceKr = v) }
    fun onCategoryChange(v: String) { _state.value = _state.value.copy(category = v) }
    fun onWhatsappChange(v: String) { _state.value = _state.value.copy(whatsappNumber = v) }

    fun addImageUrl(url: String) {
        val current = _state.value.imageUrls
        if (current.size < 10) {
            _state.value = _state.value.copy(imageUrls = current + url)
        }
    }

    fun removeImageUrl(index: Int) {
        val current = _state.value.imageUrls.toMutableList()
        if (index in current.indices) {
            current.removeAt(index)
            _state.value = _state.value.copy(imageUrls = current)
        }
    }

    fun save() {
        val s = _state.value
        if (s.title.isBlank() || s.imageUrls.isEmpty() || s.priceKr.isBlank() || s.whatsappNumber.isBlank()) {
            _state.value = s.copy(error = "Title, at least 1 image, price, and WhatsApp number are required")
            return
        }
        val price = s.priceKr.toDoubleOrNull()
        if (price == null || price <= 0) {
            _state.value = s.copy(error = "Invalid price")
            return
        }

        screenModelScope.launch {
            _state.value = s.copy(isSaving = true, error = null)
            val result = repository.createProduct(
                title = s.title,
                description = s.description.ifBlank { null },
                imageUrls = s.imageUrls,
                priceKr = price,
                category = s.category.ifBlank { null },
                whatsappNumber = s.whatsappNumber
            )
            when (result) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(isSaving = false, saveSuccess = true)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isSaving = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
