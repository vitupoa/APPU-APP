package com.runinga.feature.shop.data.repository

import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.network.safeApiCall
import com.runinga.com.core.offline.OfflineActionQueue
import com.runinga.feature.shop.data.local.ProductLocalDataSource
import com.runinga.feature.shop.data.remote.ShopApi
import com.runinga.feature.shop.data.remote.dto.*
import com.runinga.feature.shop.domain.model.Product
import com.runinga.feature.shop.domain.model.ProductSeller
import com.runinga.feature.shop.domain.repository.ProductListResult
import com.runinga.feature.shop.domain.repository.ShopRepository

class ShopRepositoryImpl(
    private val api: ShopApi,
    private val localDataSource: ProductLocalDataSource,
    private val offlineQueue: OfflineActionQueue
) : ShopRepository {

    override suspend fun listProducts(
        category: String?, query: String?, sellerId: String?, cursor: String?
    ): NetworkResult<ProductListResult> {
        // Load from cache first
        val cachedProducts = localDataSource.getCachedProducts()
        
        return when (val result = safeApiCall {
            val dto = api.listProducts(category, query, sellerId, cursor)
            ProductListResult(
                items = dto.items.map { it.toDomain() },
                nextCursor = dto.nextCursor
            )
        }) {
            is NetworkResult.Success -> {
                // Cache fresh data
                localDataSource.cacheProducts(result.data.items)
                result
            }
            is NetworkResult.Error -> {
                // Return cached data if available
                if (cachedProducts.isNotEmpty()) {
                    NetworkResult.Success(ProductListResult(cachedProducts, null))
                } else {
                    result
                }
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun getProduct(productId: String): NetworkResult<Product> {
        // Load from cache first
        val cachedProduct = localDataSource.getCachedProductById(productId)
        
        return when (val result = safeApiCall { api.getProduct(productId).toDomain() }) {
            is NetworkResult.Success -> {
                // Cache fresh data
                localDataSource.cacheProducts(listOf(result.data))
                result
            }
            is NetworkResult.Error -> {
                // Return cached data if available
                if (cachedProduct != null) {
                    NetworkResult.Success(cachedProduct)
                } else {
                    result
                }
            }
            is NetworkResult.Loading -> result
        }
    }

    override suspend fun getMyProducts(): NetworkResult<List<Product>> =
        safeApiCall { api.getMyProducts().map { it.toDomain() } }

    override suspend fun createProduct(
        title: String, description: String?, imageUrls: List<String>,
        priceKr: Double, category: String?, whatsappNumber: String
    ): NetworkResult<Product> = safeApiCall {
        api.createProduct(
            CreateProductRequestDto(
                title = title,
                description = description,
                imageUrls = imageUrls,
                priceRc = priceKr,
                category = category ?: "OTHER",
                whatsappNumber = whatsappNumber,
                brand = null,
                condition = null,
                categoryDetails = null
            )
        ).toDomain()
    }

    suspend fun createProductWithDetails(
        title: String,
        description: String?,
        imageUrls: List<String>,
        priceKr: Double,
        wholesalePrice: Double? = null,
        wholesaleMinQty: Int? = null,
        bargainEnabled: Boolean = false,
        bargainMinPrice: Double? = null,
        category: String,
        whatsappNumber: String,
        brand: String?,
        condition: String?,
        categoryDetails: kotlinx.serialization.json.JsonObject?,
        subcategory: String? = null,
        location: String? = null
    ): NetworkResult<Product> = safeApiCall {
        api.createProduct(
            CreateProductRequestDto(
                title = title,
                description = description,
                imageUrls = imageUrls,
                priceRc = priceKr,
                wholesalePrice = wholesalePrice,
                wholesaleMinQty = wholesaleMinQty,
                bargainEnabled = bargainEnabled,
                bargainMinPrice = bargainMinPrice,
                category = category,
                subcategory = subcategory,
                whatsappNumber = whatsappNumber,
                brand = brand,
                condition = condition,
                location = location,
                categoryDetails = categoryDetails
            )
        ).toDomain()
    }

    override suspend fun updateProduct(
        productId: String, title: String?, description: String?, imageUrls: List<String>?,
        priceKr: Double?, category: String?, whatsappNumber: String?, status: String?
    ): NetworkResult<Product> = safeApiCall {
        api.updateProduct(
            productId,
            UpdateProductRequestDto(title, description, imageUrls, priceKr, category, whatsappNumber = whatsappNumber, status = status)
        ).toDomain()
    }

    override suspend fun deleteProduct(productId: String): NetworkResult<Unit> =
        safeApiCall { api.deleteProduct(productId) }

    suspend fun getProductReviews(productId: String, cursor: String? = null): NetworkResult<com.runinga.feature.shop.domain.model.ReviewListResult> =
        safeApiCall {
            val dto = api.getProductReviews(productId, cursor)
            com.runinga.feature.shop.domain.model.ReviewListResult(
                items = dto.items.map { it.toDomain() },
                nextCursor = dto.nextCursor
            )
        }

    suspend fun createReview(
        productId: String,
        rating: Int,
        title: String? = null,
        text: String? = null,
        videoUrl: String? = null,
        imageUrls: List<String> = emptyList()
    ): NetworkResult<com.runinga.feature.shop.domain.model.ProductReview> =
        safeApiCall {
            api.createReview(
                CreateReviewRequestDto(
                    productId = productId,
                    rating = rating,
                    title = title,
                    text = text,
                    videoUrl = videoUrl,
                    imageUrls = imageUrls
                )
            ).toDomain()
        }

    suspend fun deleteReview(reviewId: String): NetworkResult<Unit> =
        safeApiCall { api.deleteReview(reviewId) }

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
        priceRc = priceKr,
        category = category,
        whatsappNumber = whatsappNumber,
        status = status,
        createdAt = createdAt
    )

    private fun ProductReviewDto.toDomain() = com.runinga.feature.shop.domain.model.ProductReview(
        id = id,
        user = com.runinga.feature.shop.domain.model.ReviewUser(
            id = user.id,
            username = user.username,
            displayName = user.displayName,
            avatarUrl = user.avatarUrl
        ),
        rating = rating,
        title = title,
        text = text,
        videoUrl = videoUrl,
        imageUrls = imageUrls,
        isVerified = isVerified,
        createdAt = createdAt
    )
}
