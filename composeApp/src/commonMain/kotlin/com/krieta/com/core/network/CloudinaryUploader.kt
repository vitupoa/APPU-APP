package com.krieta.com.core.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.forms.MultiPartFormDataContent
import io.ktor.client.request.forms.formData
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.Serializable

@Serializable
data class CloudinarySignatureDto(
    val signature: String,
    val timestamp: Long,
    val folder: String,
    val apiKey: String,
    val cloudName: String
)

@Serializable
data class CloudinaryUploadResponse(
    val secure_url: String,
    val public_id: String
)

class CloudinaryUploader(private val authenticatedClient: HttpClient) {

    // A dedicated plain HTTP client for Cloudinary that has NO Auth plugin or interceptors installed.
    private val plainClient = HttpClient {
        install(ContentNegotiation) {
            json(KtorClientFactory.json)
        }
        install(io.ktor.client.plugins.logging.Logging) {
            logger = object : io.ktor.client.plugins.logging.Logger {
                override fun log(message: String) {
                    println("CloudinaryHttp: $message")
                }
            }
            level = io.ktor.client.plugins.logging.LogLevel.INFO
        }
    }

    suspend fun uploadMedia(folder: String, fileBytes: ByteArray, isVideo: Boolean = false): NetworkResult<String> {
        return safeApiCall {
            // 1. Get Signature from our backend
            val signatureResponse = authenticatedClient.get("${ApiConstants.API_VERSION}/media/upload-signature") {
                parameter("folder", folder)
            }
            
            if (!signatureResponse.status.let { it.value in 200..299 }) {
                throw Exception("Failed to fetch upload signature: HTTP ${signatureResponse.status.value}. Ensure you are authenticated and backend is updated.")
            }
            
            val signatureDto: CloudinarySignatureDto = signatureResponse.body()

            // 2. Upload to Cloudinary directly
            val uploadUrl = "https://api.cloudinary.com/v1_1/${signatureDto.cloudName}/${if (isVideo) "video" else "image"}/upload"
            
            val uploadResponse = plainClient.post(uploadUrl) {
                setBody(
                    MultiPartFormDataContent(
                        formData {
                            append("file", fileBytes, Headers.build {
                                append(HttpHeaders.ContentDisposition, "filename=\"upload.${if (isVideo) "mp4" else "jpg"}\"")
                            })
                            append("api_key", signatureDto.apiKey)
                            append("timestamp", signatureDto.timestamp.toString())
                            append("signature", signatureDto.signature)
                            append("folder", signatureDto.folder)
                        }
                    )
                )
            }

            if (uploadResponse.status.value !in 200..299) {
                val errorBody = uploadResponse.bodyAsText()
                throw Exception("Cloudinary upload failed (HTTP ${uploadResponse.status.value}): $errorBody")
            }

            val result: CloudinaryUploadResponse = uploadResponse.body()
            result.secure_url
        }
    }
}

