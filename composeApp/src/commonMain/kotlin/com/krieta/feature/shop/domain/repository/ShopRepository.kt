package com.krieta.feature.shop.domain.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.shop.domain.model.Product

data class ProductListResult(val items: List<Product>, val nextCursor: String?)

interface ShopRepository {
    suspend fun listProducts(category: String?, query: String?, sellerId: String?, cursor: String?): NetworkResult<ProductListResult>
    suspend fun getProduct(productId: String): NetworkResult<Product>
    suspend fun getMyProducts(): NetworkResult<List<Product>>
    suspend fun createProduct(
        title: String, description: String?, imageUrls: List<String>,
        priceKr: Double, category: String?, whatsappNumber: String
    ): NetworkResult<Product>
    suspend fun updateProduct(
        productId: String, title: String?, description: String?, imageUrls: List<String>?,
        priceKr: Double?, category: String?, whatsappNumber: String?, status: String?
    ): NetworkResult<Product>
    suspend fun deleteProduct(productId: String): NetworkResult<Unit>
}
