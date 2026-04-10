package com.krieta.feature.shop.domain.model

data class ProductSeller(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean
)

data class Product(
    val id: String,
    val seller: ProductSeller,
    val title: String,
    val description: String?,
    val imageUrls: List<String>,
    val priceKr: Double,
    val category: String?,
    val whatsappNumber: String,
    val status: String,
    val createdAt: String
)
