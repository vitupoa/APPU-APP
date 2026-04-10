package com.krieta.feature.shop.data.repository

import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.network.safeApiCall
import com.krieta.feature.shop.data.remote.ShopApi
import com.krieta.feature.shop.data.remote.dto.*
import com.krieta.feature.shop.domain.model.Product
import com.krieta.feature.shop.domain.model.ProductSeller
import com.krieta.feature.shop.domain.repository.ProductListResult
import com.krieta.feature.shop.domain.repository.ShopRepository

class ShopRepositoryImpl(
    private val api: ShopApi
) : ShopRepository {

    override suspend fun listProducts(
        category: String?, query: String?, sellerId: String?, cursor: String?
    ): NetworkResult<ProductListResult> = safeApiCall {
        val dto = api.listProducts(category, query, sellerId, cursor)
        ProductListResult(
            items = dto.items.map { it.toDomain() },
            nextCursor = dto.nextCursor
        )
    }

    override suspend fun getProduct(productId: String): NetworkResult<Product> =
        safeApiCall { api.getProduct(productId).toDomain() }

    override suspend fun getMyProducts(): NetworkResult<List<Product>> =
        safeApiCall { api.getMyProducts().map { it.toDomain() } }

    override suspend fun createProduct(
        title: String, description: String?, imageUrls: List<String>,
        priceKr: Double, category: String?, whatsappNumber: String
    ): NetworkResult<Product> = safeApiCall {
        api.createProduct(
            CreateProductRequestDto(title, description, imageUrls, priceKr, category, whatsappNumber)
        ).toDomain()
    }

    override suspend fun updateProduct(
        productId: String, title: String?, description: String?, imageUrls: List<String>?,
        priceKr: Double?, category: String?, whatsappNumber: String?, status: String?
    ): NetworkResult<Product> = safeApiCall {
        api.updateProduct(
            productId,
            UpdateProductRequestDto(title, description, imageUrls, priceKr, category, whatsappNumber, status)
        ).toDomain()
    }

    override suspend fun deleteProduct(productId: String): NetworkResult<Unit> =
        safeApiCall { api.deleteProduct(productId) }

    private fun ProductDto.toDomain() = Product(
        id = id,
        seller = ProductSeller(
            id = seller.id,
            username = seller.username,
            displayName = seller.displayName,
            avatarUrl = seller.avatarUrl,
            isVerified = seller.isVerified
        ),
        title = title,
        description = description,
        imageUrls = imageUrls,
        priceKr = priceKr,
        category = category,
        whatsappNumber = whatsappNumber,
        status = status,
        createdAt = createdAt
    )
}
