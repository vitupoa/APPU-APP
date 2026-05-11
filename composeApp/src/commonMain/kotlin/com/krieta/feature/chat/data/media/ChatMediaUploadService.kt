package com.krieta.feature.chat.data.media

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class UploadSignatureRequest(
    val mediaType: String,
    val resourceType: String
)

@Serializable
data class UploadSignatureResponse(
    val success: Boolean,
    val uploadParams: UploadParams
)

@Serializable
data class UploadParams(
    val signature: String,
    val timestamp: Long,
    val folder: String,
    val resourceType: String,
    val apiKey: String,
    val cloudName: String
)

@Serializable
data class ValidateMediaRequest(
    val mediaUrl: String,
    val mediaType: String
)

@Serializable
data class ValidateMediaResponse(
    val success: Boolean,
    val sanitizedUrl: String? = null,
    val error: String? = null
)

@Serializable
data class CloudinaryUploadResponse(
    val secure_url: String,
    val public_id: String,
    val format: String,
    val resource_type: String,
    val bytes: Long
)

sealed class UploadProgress {
    data object Idle : UploadProgress()
    data class Compressing(val progress: Float) : UploadProgress()
    data class Uploading(val progress: Float, val bytesUploaded: Long, val totalBytes: Long) : UploadProgress()
    data object Validating : UploadProgress()
    data class Success(val url: String) : UploadProgress()
    data class Error(val message: String) : UploadProgress()
}

class ChatMediaUploadService(
    private val httpClient: HttpClient,
    private val baseUrl: String,
    private val authToken: String,
    private val imageCompressor: ImageCompressor
) {
    
    fun uploadMedia(
        chatId: String,
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String
    ): Flow<UploadProgress> = flow {
        try {
            emit(UploadProgress.Idle)
            
            val validation = validateFileLocally(fileBytes, fileName, mimeType)
            if (!validation.isValid) {
                emit(UploadProgress.Error(validation.error ?: "Invalid file"))
                return@flow
            }
            
            val processedBytes = if (validation.mediaType == "image") {
                emit(UploadProgress.Compressing(0f))
                val compressed = imageCompressor.compress(fileBytes, mimeType) { progress ->
                    // Compression progress callback
                }
                emit(UploadProgress.Compressing(1f))
                compressed
            } else {
                fileBytes
            }
            
            val signature = getUploadSignature(
                chatId = chatId,
                mediaType = validation.mediaType!!,
                resourceType = validation.resourceType!!
            )
            
            emit(UploadProgress.Uploading(0f, 0, processedBytes.size.toLong()))
            
            val cloudinaryUrl = uploadToCloudinary(
                fileBytes = processedBytes,
                fileName = fileName,
                mimeType = mimeType,
                uploadParams = signature.uploadParams,
                onProgress = { uploaded, total ->
                    val progress = uploaded.toFloat() / total.toFloat()
                    emit(UploadProgress.Uploading(progress, uploaded, total))
                }
            )
            
            emit(UploadProgress.Validating)
            val validatedUrl = validateMediaUrl(cloudinaryUrl, validation.mediaType!!)
            
            emit(UploadProgress.Success(validatedUrl))
            
        } catch (e: Exception) {
            emit(UploadProgress.Error(e.message ?: "Upload failed"))
        }
    }
    
    private suspend fun getUploadSignature(
        chatId: String,
        mediaType: String,
        resourceType: String
    ): UploadSignatureResponse {
        val response: HttpResponse = httpClient.post("$baseUrl/api/v1/chat/$chatId/media/signature") {
            headers {
                append(HttpHeaders.Authorization, "Bearer $authToken")
                append(HttpHeaders.ContentType, ContentType.Application.Json)
            }
            setBody(UploadSignatureRequest(mediaType, resourceType))
        }
        return Json.decodeFromString<UploadSignatureResponse>(response.bodyAsText())
    }
    
    private suspend fun uploadToCloudinary(
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String,
        uploadParams: UploadParams,
        onProgress: suspend (Long, Long) -> Unit
    ): String {
        val response: HttpResponse = httpClient.post(
            "https://api.cloudinary.com/v1_1/${uploadParams.cloudName}/${uploadParams.resourceType}/upload"
        ) {
            setBody(
                MultiPartFormDataContent(
                    formData {
                        append("file", fileBytes, Headers.build {
                            append(HttpHeaders.ContentType, mimeType)
                            append(HttpHeaders.ContentDisposition, "filename=\"$fileName\"")
                        })
                        append("signature", uploadParams.signature)
                        append("timestamp", uploadParams.timestamp.toString())
                        append("folder", uploadParams.folder)
                        append("api_key", uploadParams.apiKey)
                    }
                )
            )
        }
        
        val responseBody = response.bodyAsText()
        val cloudinaryResponse = Json.decodeFromString<CloudinaryUploadResponse>(responseBody)
        return cloudinaryResponse.secure_url
    }
    
    private suspend fun validateMediaUrl(
        mediaUrl: String,
        mediaType: String
    ): String {
        val httpResponse: HttpResponse = httpClient.post("$baseUrl/api/v1/chat/media/validate") {
            headers {
                append(HttpHeaders.Authorization, "Bearer $authToken")
                append(HttpHeaders.ContentType, ContentType.Application.Json)
            }
            setBody(ValidateMediaRequest(mediaUrl, mediaType))
        }
        val response = Json.decodeFromString<ValidateMediaResponse>(httpResponse.bodyAsText())
        
        if (!response.success) {
            throw Exception(response.error ?: "Media validation failed")
        }
        
        return response.sanitizedUrl ?: mediaUrl
    }
    
    private fun validateFileLocally(
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String
    ): LocalValidationResult {
        val maxSizes = mapOf(
            "image" to 10 * 1024 * 1024,
            "video" to 100 * 1024 * 1024,
            "document" to 20 * 1024 * 1024
        )
        
        val mediaType = when {
            mimeType.startsWith("image/") -> "image"
            mimeType.startsWith("video/") -> "video"
            mimeType == "application/pdf" -> "document"
            else -> return LocalValidationResult(false, "Unsupported file type")
        }
        
        val resourceType = when (mediaType) {
            "image" -> "image"
            "video" -> "video"
            "document" -> "raw"
            else -> "raw"
        }
        
        val maxSize = maxSizes[mediaType] ?: 10 * 1024 * 1024
        if (fileBytes.size > maxSize) {
            return LocalValidationResult(
                false,
                "File size exceeds ${maxSize / 1024 / 1024}MB limit"
            )
        }
        
        val dangerousExtensions = listOf(
            ".exe", ".bat", ".cmd", ".com", ".pif", ".scr",
            ".vbs", ".js", ".jar", ".msi", ".sh", ".ps1"
        )
        
        val extension = fileName.substringAfterLast('.', "").lowercase()
        if (dangerousExtensions.contains(".$extension")) {
            return LocalValidationResult(false, "File type not allowed for security reasons")
        }
        
        return LocalValidationResult(true, null, mediaType, resourceType)
    }
}

data class LocalValidationResult(
    val isValid: Boolean,
    val error: String? = null,
    val mediaType: String? = null,
    val resourceType: String? = null
)
