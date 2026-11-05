package com.runinga.feature.shop.data.local

import com.runinga.db.RuningaDatabase
import com.runinga.feature.shop.domain.model.Product
import com.runinga.feature.shop.domain.model.ProductSeller
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext

class ProductLocalDataSource(private val database: RuningaDatabase) {
    
    private val productQueries = database.productQueries
    
    suspend fun cacheProducts(products: List<Product>) = withContext(Dispatchers.IO) {
        products.forEach { product ->
            productQueries.insertOrReplaceProduct(
                id = product.id,
                sellerId = product.seller.id,
                sellerUsername = product.seller.username,
                sellerDisplayName = product.seller.displayName,
                sellerAvatarUrl = product.seller.avatarUrl,
                title = product.title,
                description = product.description,
                price = product.priceKr,
                currency = product.currency ?: "KR",
                category = product.category ?: "",
                condition = product.condition ?: "NEW",
                stockQuantity = product.stock.toLong(),
                isAvailable = if (product.status == "ACTIVE") 1L else 0L,
                viewsCount = product.viewCount.toLong(),
                likesCount = 0L,
                isLiked = 0L,
                createdAt = product.createdAt,
                updatedAt = product.createdAt,
                cachedAt = System.currentTimeMillis()
            )
            
            productQueries.deleteImagesByProductId(product.id)
            product.imageUrls.forEachIndexed { index, imageUrl ->
                productQueries.insertOrReplaceProductImage(
                    id = "${product.id}_img_$index",
                    productId = product.id,
                    imageUrl = imageUrl,
                    sortOrder = index.toLong()
                )
            }
        }
    }
    
    suspend fun getCachedProducts(): List<Product> = withContext(Dispatchers.IO) {
        productQueries.getAllProducts().executeAsList().map { entity ->
            val images = productQueries.getImagesByProductId(entity.id).executeAsList().map { it.imageUrl }
            mapToProduct(entity, images)
        }
    }
    
    suspend fun getCachedProductById(productId: String): Product? = withContext(Dispatchers.IO) {
        productQueries.getProductById(productId).executeAsOneOrNull()?.let { entity ->
            val images = productQueries.getImagesByProductId(entity.id).executeAsList().map { it.imageUrl }
            mapToProduct(entity, images)
        }
    }
    
    suspend fun updateProductLike(productId: String, isLiked: Boolean, likesCount: Int) = withContext(Dispatchers.IO) {
        productQueries.updateProductLike(if (isLiked) 1L else 0L, likesCount.toLong(), productId)
    }
    
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        productQueries.deleteAllProducts()
    }
    
    private fun mapToProduct(entity: com.runinga.db.Product, images: List<String>) = Product(
        id = entity.id,
        seller = ProductSeller(
            id = entity.sellerId,
            username = entity.sellerUsername,
            displayName = entity.sellerDisplayName,
            avatarUrl = entity.sellerAvatarUrl,
            isVerified = false
        ),
        title = entity.title,
        description = entity.description,
        imageUrls = images,
        priceRc = entity.price,
        currency = entity.currency,
        category = entity.category,
        condition = entity.condition,
        whatsappNumber = "",
        stock = entity.stockQuantity.toInt(),
        viewCount = entity.viewsCount.toInt(),
        status = if (entity.isAvailable != 0L) "ACTIVE" else "INACTIVE",
        createdAt = entity.createdAt
    )
}
