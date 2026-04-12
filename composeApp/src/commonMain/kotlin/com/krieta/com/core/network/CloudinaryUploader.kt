package com.krieta.com.core.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.forms.MultiPartFormDataContent
import io.ktor.client.request.forms.formData
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
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

class CloudinaryUploader(private val httpClient: HttpClient) {

    suspend fun uploadMedia(folder: String, fileBytes: ByteArray, isVideo: Boolean = false): NetworkResult<String> {
        return safeApiCall {
            // 1. Get Signature from our backend
            val signatureDto: CloudinarySignatureDto = httpClient.get("${ApiConstants.API_VERSION}/media/upload-signature") {
                parameter("folder", folder)
            }.body()

            // 2. Upload to Cloudinary directly
            val uploadUrl = "https://api.cloudinary.com/v1_1/${signatureDto.cloudName}/${if (isVideo) "video" else "image"}/upload"
            
            val response: CloudinaryUploadResponse = httpClient.post(uploadUrl) {
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
            }.body()

            response.secure_url
        }
    }
}
