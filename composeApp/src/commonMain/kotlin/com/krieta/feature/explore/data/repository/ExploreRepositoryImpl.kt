package com.krieta.feature.explore.data.repository

import com.krieta.feature.explore.domain.model.*
import com.krieta.feature.explore.domain.repository.ExploreRepository
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter

class ExploreRepositoryImpl(
    private val httpClient: HttpClient
) : ExploreRepository {
    
    private val baseUrl = "https://api.krieta.com/api/v1/explore"
    
    override suspend fun getTrendingHashtags(limit: Int): List<TrendingHashtag> {
        return try {
            httpClient.get("$baseUrl/trending/hashtags") {
                parameter("limit", limit)
            }.body()
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    override suspend fun getTrendingShorts(category: ContentCategory?, limit: Int): List<TrendingShort> {
        return try {
            httpClient.get("$baseUrl/trending/shorts") {
                category?.let { parameter("category", it.name) }
                parameter("limit", limit)
            }.body()
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    override suspend fun getTrendingContests(limit: Int): List<TrendingContest> {
        return try {
            httpClient.get("$baseUrl/trending/contests") {
                parameter("limit", limit)
            }.body()
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    override suspend fun getTrendingCreators(limit: Int): List<TrendingCreator> {
        return try {
            httpClient.get("$baseUrl/trending/creators") {
                parameter("limit", limit)
            }.body()
        } catch (e: Exception) {
            emptyList()
        }
    }
}
}
