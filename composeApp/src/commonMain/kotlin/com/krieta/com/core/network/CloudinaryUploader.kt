package com.krieta.com.core.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.forms.MultiPartFormDataContent
import io.ktor.client.request.forms.formData
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.request.headers
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
    val uploadPreset: String,
    val resourceType: String,
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
        install(io.ktor.client.plugins.HttpTimeout) {
            requestTimeoutMillis = 180_000L
            connectTimeoutMillis = 180_000L
            socketTimeoutMillis = 180_000L
        }
    }

    suspend fun uploadMedia(folder: String, fileBytes: ByteArray, isVideo: Boolean = false): NetworkResult<String> {
        return safeApiCall {
            // 1. Get Signature from our backend
            val resourceType = if (isVideo) "video" else "image"
            val signatureResponse = authenticatedClient.get("${ApiConstants.API_VERSION}/media/upload-signature") {
                parameter("folder", folder)
                parameter("resourceType", resourceType)
            }
            
            if (!signatureResponse.status.let { it.value in 200..299 }) {
                throw Exception("Failed to fetch upload signature: HTTP ${signatureResponse.status.value}. Ensure you are authenticated and backend is updated.")
            }
            
            val signatureDto: CloudinarySignatureDto = signatureResponse.body()
            
            println("Cloudinary Signature Response: signature=${signatureDto.signature}, timestamp=${signatureDto.timestamp}, uploadPreset=${signatureDto.uploadPreset}, resourceType=${signatureDto.resourceType}")

            // 2. Upload to Cloudinary directly
            // For signed uploads with a preset: send api_key, timestamp, signature, upload_preset, and file.
            val uploadUrl = "https://api.cloudinary.com/v1_1/${signatureDto.cloudName}/${signatureDto.resourceType}/upload"
            
            println("Cloudinary Upload URL: $uploadUrl")
            
            val chunkSize = 5 * 1024 * 1024 // 5 MB chunks
            val totalBytes = fileBytes.size
            val uniqueUploadId = (1..16).map { kotlin.random.Random.nextInt(0, 16).toString(16) }.joinToString("")
            
            // For files smaller than chunk size, use standard upload
            if (totalBytes <= chunkSize) {
                val uploadResponse = plainClient.post(uploadUrl) {
                    setBody(
                        MultiPartFormDataContent(
                            formData {
                                // For signed uploads with a preset: send api_key, timestamp, signature, upload_preset, and file
                                append("api_key", signatureDto.apiKey)
                                append("timestamp", signatureDto.timestamp.toString())
                                append("signature", signatureDto.signature)
                                append("upload_preset", signatureDto.uploadPreset)
                                append("file", fileBytes, Headers.build {
                                    append(HttpHeaders.ContentType, if (isVideo) "video/mp4" else "image/jpeg")
                                    append(HttpHeaders.ContentDisposition, "filename=\"upload.${if (isVideo) "mp4" else "jpg"}\"")
                                })
                            }
                        )
                    )
                }

                if (uploadResponse.status.value !in 200..299) {
                    val errorBody = uploadResponse.bodyAsText()
                    println("Cloudinary RAW ERROR: $errorBody")
                    throw Exception("Cloudinary upload failed (HTTP ${uploadResponse.status.value}): $errorBody")
                }

                val result: CloudinaryUploadResponse = uploadResponse.body()
                return@safeApiCall result.secure_url
            } 
            
            // For larger files, perform chunked upload
            var startByte = 0
            var finalResultUrl: String? = null
            
            while (startByte < totalBytes) {
                val endByte = kotlin.math.min(startByte + chunkSize - 1, totalBytes - 1)
                val chunkBytes = fileBytes.sliceArray(startByte..endByte)
                
                println("Cloudinary Chunked Upload: sending bytes $startByte-$endByte/$totalBytes")
                
                val uploadResponse = plainClient.post(uploadUrl) {
                    headers {
                        append("X-Unique-Upload-Id", uniqueUploadId)
                        append("Content-Range", "bytes $startByte-$endByte/$totalBytes")
                    }
                    setBody(
                        MultiPartFormDataContent(
                            formData {
                                // For signed uploads with a preset: send api_key, timestamp, signature, upload_preset, and file
                                append("api_key", signatureDto.apiKey)
                                append("timestamp", signatureDto.timestamp.toString())
                                append("signature", signatureDto.signature)
                                append("upload_preset", signatureDto.uploadPreset)
                                append("file", chunkBytes, Headers.build {
                                    append(HttpHeaders.ContentType, if (isVideo) "video/mp4" else "image/jpeg")
                                    append(HttpHeaders.ContentDisposition, "filename=\"upload.${if (isVideo) "mp4" else "jpg"}\"")
                                })
                            }
                        )
                    )
                }

                if (uploadResponse.status.value !in 200..299) {
                    val errorBody = uploadResponse.bodyAsText()
                    println("Cloudinary RAW ERROR on chunk: $errorBody")
                    throw Exception("Cloudinary chunk upload failed (HTTP ${uploadResponse.status.value}): $errorBody")
                }

                // If this is the last chunk, it will contain the final response JSON
                if (endByte == totalBytes - 1) {
                    val result: CloudinaryUploadResponse = uploadResponse.body()
                    finalResultUrl = result.secure_url
                }
                
                startByte = endByte + 1
            }
            
            finalResultUrl ?: throw Exception("Chunked upload completed but final result URL was null")
        }
    }

    suspend fun uploadImage(fileBytes: ByteArray, folder: String): String {
        val result = uploadMedia(folder, fileBytes, isVideo = false)
        return when (result) {
            is NetworkResult.Success -> result.data
            is NetworkResult.Error -> throw Exception(result.message)
            is NetworkResult.Loading -> throw Exception("Upload in progress")
        }
    }
}
