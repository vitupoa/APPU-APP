package com.krieta.feature.shop.data.local

import com.krieta.com.db.KrietaDatabase
import com.krieta.feature.shop.domain.model.Product
import com.krieta.feature.shop.domain.model.ProductSeller
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.IO
import kotlinx.coroutines.withContext

class ProductLocalDataSource(private val database: KrietaDatabase) {
    
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
                price = product.price,
                currency = product.currency,
                category = product.category,
                condition = product.condition,
                stockQuantity = product.stockQuantity.toLong(),
                isAvailable = product.isAvailable,
                viewsCount = product.viewsCount.toLong(),
                likesCount = product.likesCount.toLong(),
                isLiked = product.isLiked,
                createdAt = product.createdAt,
                updatedAt = product.updatedAt,
                cachedAt = System.currentTimeMillis()
            )
            
            // Cache product images
            productQueries.deleteImagesByProductId(product.id)
            product.images.forEachIndexed { index, imageUrl ->
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
            val images = productQueries.getImagesByProductId(entity.id)
                .executeAsList()
                .map { it.imageUrl }
            
            Product(
                id = entity.id,
                seller = ProductSeller(
                    id = entity.sellerId,
                    username = entity.sellerUsername,
                    displayName = entity.sellerDisplayName,
                    avatarUrl = entity.sellerAvatarUrl
                ),
                title = entity.title,
                description = entity.description,
                price = entity.price,
                currency = entity.currency,
                category = entity.category,
                condition = entity.condition,
                images = images,
                stockQuantity = entity.stockQuantity.toInt(),
                isAvailable = entity.isAvailable,
                viewsCount = entity.viewsCount.toInt(),
                likesCount = entity.likesCount.toInt(),
                isLiked = entity.isLiked,
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt
            )
        }
    }
    
    suspend fun getCachedProductById(productId: String): Product? = withContext(Dispatchers.IO) {
        productQueries.getProductById(productId).executeAsOneOrNull()?.let { entity ->
            val images = productQueries.getImagesByProductId(entity.id)
                .executeAsList()
                .map { it.imageUrl }
            
            Product(
                id = entity.id,
                seller = ProductSeller(
                    id = entity.sellerId,
                    username = entity.sellerUsername,
                    displayName = entity.sellerDisplayName,
                    avatarUrl = entity.sellerAvatarUrl
                ),
                title = entity.title,
                description = entity.description,
                price = entity.price,
                currency = entity.currency,
                category = entity.category,
                condition = entity.condition,
                images = images,
                stockQuantity = entity.stockQuantity.toInt(),
                isAvailable = entity.isAvailable,
                viewsCount = entity.viewsCount.toInt(),
                likesCount = entity.likesCount.toInt(),
                isLiked = entity.isLiked,
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt
            )
        }
    }
    
    suspend fun updateProductLike(productId: String, isLiked: Boolean, likesCount: Int) = withContext(Dispatchers.IO) {
        productQueries.updateProductLike(isLiked, likesCount.toLong(), productId)
    }
    
    suspend fun clearCache() = withContext(Dispatchers.IO) {
        productQueries.deleteAllProducts()
    }
}
