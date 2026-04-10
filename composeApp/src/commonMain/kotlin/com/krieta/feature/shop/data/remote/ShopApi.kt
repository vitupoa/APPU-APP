package com.krieta.feature.shop.data.remote

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.shop.data.remote.dto.*
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.*
import io.ktor.http.ContentType
import io.ktor.http.contentType

class ShopApi(private val client: HttpClient) {

    suspend fun listProducts(
        category: String? = null,
        query: String? = null,
        sellerId: String? = null,
        cursor: String? = null,
        limit: Int = 20
    ): ProductListResponseDto {
        return client.get(ApiConstants.SHOP_PRODUCTS) {
            category?.let { parameter("category", it) }
            query?.let { parameter("q", it) }
            sellerId?.let { parameter("sellerId", it) }
            cursor?.let { parameter("cursor", it) }
            parameter("limit", limit)
        }.body()
    }

    suspend fun getProduct(productId: String): ProductDto {
        return client.get("${ApiConstants.SHOP_PRODUCTS}/$productId").body()
    }

    suspend fun getMyProducts(): List<ProductDto> {
        return client.get("${ApiConstants.SHOP_PRODUCTS}/mine").body()
    }

    suspend fun createProduct(request: CreateProductRequestDto): ProductDto {
        return client.post(ApiConstants.SHOP_PRODUCTS) {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }

    suspend fun updateProduct(productId: String, request: UpdateProductRequestDto): ProductDto {
        return client.put("${ApiConstants.SHOP_PRODUCTS}/$productId") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
    }

    suspend fun deleteProduct(productId: String) {
        client.delete("${ApiConstants.SHOP_PRODUCTS}/$productId")
    }
}
