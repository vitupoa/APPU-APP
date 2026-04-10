package com.krieta.feature.shop.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ProductSellerDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val isVerified: Boolean = false
)

@Serializable
data class ProductDto(
    val id: String,
    val seller: ProductSellerDto,
    val title: String,
    val description: String? = null,
    val imageUrls: List<String> = emptyList(),
    val priceKr: Double,
    val category: String? = null,
    val whatsappNumber: String,
    val status: String = "active",
    val createdAt: String
)

@Serializable
data class ProductListResponseDto(
    val items: List<ProductDto>,
    val nextCursor: String? = null
)

@Serializable
data class CreateProductRequestDto(
    val title: String,
    val description: String? = null,
    val imageUrls: List<String>,
    val priceKr: Double,
    val category: String? = null,
    val whatsappNumber: String
)

@Serializable
data class UpdateProductRequestDto(
    val title: String? = null,
    val description: String? = null,
    val imageUrls: List<String>? = null,
    val priceKr: Double? = null,
    val category: String? = null,
    val whatsappNumber: String? = null,
    val status: String? = null
)
