// Chat Media Upload Implementation for Kotlin Multiplatform
// Location: composeApp/src/commonMain/kotlin/com/runinga/chat/media/

package com.runinga.chat.media

import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.request.forms.*
import io.ktor.http.*
import kotlinx.serialization.Serializable

@Serializable
data class UploadSignatureRequest(
    val mediaType: String, // "image", "video", "document"
    val resourceType: String // "image", "video", "raw"
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

class ChatMediaUploader(
    private val httpClient: HttpClient,
    private val baseUrl: String,
    private val authToken: String
) {
    
    /**
     * Upload media to chat
     * @param chatId Chat ID
     * @param fileBytes File content as ByteArray
     * @param fileName File name
     * @param mimeType MIME type (e.g., "image/jpeg")
     * @return Cloudinary URL or null if failed
     */
    suspend fun uploadMedia(
        chatId: String,
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String
    ): Result<String> {
        return try {
            // Step 1: Validate file locally
            val validation = validateFileLocally(fileBytes, fileName, mimeType)
            if (!validation.isValid) {
                return Result.failure(Exception(validation.error))
            }
            
            // Step 2: Get upload signature from backend
            val signature = getUploadSignature(
                chatId = chatId,
                mediaType = validation.mediaType!!,
                resourceType = validation.resourceType!!
            )
            
            // Step 3: Upload to Cloudinary
            val cloudinaryUrl = uploadToCloudinary(
                fileBytes = fileBytes,
                fileName = fileName,
                mimeType = mimeType,
                uploadParams = signature.uploadParams
            )
            
            // Step 4: Validate uploaded URL with backend
            val validatedUrl = validateMediaUrl(cloudinaryUrl, validation.mediaType)
            
            Result.success(validatedUrl)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    /**
     * Get upload signature from backend
     */
    private suspend fun getUploadSignature(
        chatId: String,
        mediaType: String,
        resourceType: String
    ): UploadSignatureResponse {
        return httpClient.post("$baseUrl/api/v1/chat/$chatId/media/signature") {
            headers {
                append(HttpHeaders.Authorization, "Bearer $authToken")
                append(HttpHeaders.ContentType, ContentType.Application.Json)
            }
            setBody(UploadSignatureRequest(mediaType, resourceType))
        }
    }
    
    /**
     * Upload file to Cloudinary
     */
    private suspend fun uploadToCloudinary(
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String,
        uploadParams: UploadParams
    ): String {
        val response: CloudinaryUploadResponse = httpClient.submitFormWithBinaryData(
            url = "https://api.cloudinary.com/v1_1/${uploadParams.cloudName}/${uploadParams.resourceType}/upload",
            formData = formData {
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
        
        return response.secure_url
    }
    
    /**
     * Validate uploaded media URL with backend
     */
    private suspend fun validateMediaUrl(
        mediaUrl: String,
        mediaType: String
    ): String {
        val response: ValidateMediaResponse = httpClient.post("$baseUrl/api/v1/chat/media/validate") {
            headers {
                append(HttpHeaders.Authorization, "Bearer $authToken")
                append(HttpHeaders.ContentType, ContentType.Application.Json)
            }
            setBody(ValidateMediaRequest(mediaUrl, mediaType))
        }
        
        if (!response.success) {
            throw Exception(response.error ?: "Media validation failed")
        }
        
        return response.sanitizedUrl ?: mediaUrl
    }
    
    /**
     * Validate file locally before upload
     */
    private fun validateFileLocally(
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String
    ): LocalValidationResult {
        // Check file size
        val maxSizes = mapOf(
            "image" to 10 * 1024 * 1024, // 10MB
            "video" to 100 * 1024 * 1024, // 100MB
            "document" to 20 * 1024 * 1024 // 20MB
        )
        
        // Determine media type
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
        
        // Check file size
        val maxSize = maxSizes[mediaType] ?: 10 * 1024 * 1024
        if (fileBytes.size > maxSize) {
            return LocalValidationResult(
                false, 
                "File size exceeds ${maxSize / 1024 / 1024}MB limit"
            )
        }
        
        // Check dangerous extensions
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

@Serializable
data class CloudinaryUploadResponse(
    val secure_url: String,
    val public_id: String,
    val format: String,
    val resource_type: String
)

// Usage Example in ViewModel
class ChatViewModel {
    private val mediaUploader = ChatMediaUploader(
        httpClient = httpClient,
        baseUrl = "https://your-api.com",
        authToken = authToken
    )
    
    suspend fun sendMediaMessage(
        chatId: String,
        messageText: String,
        fileBytes: ByteArray,
        fileName: String,
        mimeType: String
    ) {
        try {
            // Upload media
            val mediaUrl = mediaUploader.uploadMedia(
                chatId = chatId,
                fileBytes = fileBytes,
                fileName = fileName,
                mimeType = mimeType
            ).getOrThrow()
            
            // Send message with media
            val mediaType = when {
                mimeType.startsWith("image/") -> "image"
                mimeType.startsWith("video/") -> "video"
                else -> "document"
            }
            
            chatRepository.sendMessage(
                chatId = chatId,
                payload = messageText,
                mediaUrl = mediaUrl,
                mediaType = mediaType
            )
            
            println("Media message sent successfully")
        } catch (e: Exception) {
            println("Failed to send media: ${e.message}")
        }
    }
}

// UI Component Example (Compose)
@Composable
fun ChatMediaPicker(
    onMediaSelected: (ByteArray, String, String) -> Unit
) {
    var showPicker by remember { mutableStateOf(false) }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Image picker
        IconButton(onClick = { /* Launch image picker */ }) {
            Icon(Icons.Default.Image, "Send image")
        }
        
        // Video picker
        IconButton(onClick = { /* Launch video picker */ }) {
            Icon(Icons.Default.VideoLibrary, "Send video")
        }
        
        // Document picker
        IconButton(onClick = { /* Launch document picker */ }) {
            Icon(Icons.Default.AttachFile, "Send document")
        }
    }
}
