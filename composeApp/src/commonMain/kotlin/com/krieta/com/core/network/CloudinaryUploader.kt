package com.krieta.com.core.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.headers
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.content.OutgoingContent
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.utils.io.ByteReadChannel
import kotlinx.serialization.Serializable

@Serializable
data class CloudinarySignatureDto(
    val signature: String,
    val timestamp: Long,
    val folder: String,
    val resourceType: String,
    val apiKey: String,
    val cloudName: String
)

@Serializable
data class CloudinaryUploadResponse(
    val secure_url: String,
    val public_id: String
)

/**
 * Manually builds a multipart/form-data body as raw bytes.
 * This bypasses Ktor's formData builder which has issues with Cloudinary
 * (generates BinaryItem with conflicting Content-Disposition headers in Ktor 3.x).
 */
private class RawMultipartContent(
    private val fields: Map<String, String>,
    private val fileFieldName: String,
    private val fileBytes: ByteArray,
    private val fileName: String,
    private val fileMimeType: String
) : OutgoingContent.ByteArrayContent() {

    private val boundary = "----KrietaUpload${kotlin.random.Random.nextLong().toString(16)}"

    override val contentType: ContentType =
        ContentType.MultiPart.FormData.withParameter("boundary", boundary)

    override fun bytes(): ByteArray {
        val sb = StringBuilder()

        // Text fields
        for ((key, value) in fields) {
            sb.append("--$boundary\r\n")
            sb.append("Content-Disposition: form-data; name=\"$key\"\r\n")
            sb.append("\r\n")
            sb.append("$value\r\n")
        }

        // File field header
        sb.append("--$boundary\r\n")
        sb.append("Content-Disposition: form-data; name=\"$fileFieldName\"; filename=\"$fileName\"\r\n")
        sb.append("Content-Type: $fileMimeType\r\n")
        sb.append("\r\n")

        val headerBytes = sb.toString().encodeToByteArray()
        val footerBytes = "\r\n--$boundary--\r\n".encodeToByteArray()

        // Combine: headers + file bytes + footer
        val result = ByteArray(headerBytes.size + fileBytes.size + footerBytes.size)
        headerBytes.copyInto(result, 0)
        fileBytes.copyInto(result, headerBytes.size)
        footerBytes.copyInto(result, headerBytes.size + fileBytes.size)
        return result
    }
}

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

    private fun buildMultipartBody(
        signatureDto: CloudinarySignatureDto,
        fileBytes: ByteArray,
        isVideo: Boolean
    ): RawMultipartContent {
        val fields = linkedMapOf(
            "api_key" to signatureDto.apiKey,
            "timestamp" to signatureDto.timestamp.toString(),
            "signature" to signatureDto.signature,
            "folder" to signatureDto.folder
        )
        val mimeType = if (isVideo) "video/mp4" else "image/jpeg"
        val fileName = "upload.${if (isVideo) "mp4" else "jpg"}"

        return RawMultipartContent(
            fields = fields,
            fileFieldName = "file",
            fileBytes = fileBytes,
            fileName = fileName,
            fileMimeType = mimeType
        )
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
            
            println("Cloudinary Signature Response: signature=${signatureDto.signature}, timestamp=${signatureDto.timestamp}, folder=${signatureDto.folder}, resourceType=${signatureDto.resourceType}")

            // 2. Upload to Cloudinary directly (signed upload, no preset)
            val uploadUrl = "https://api.cloudinary.com/v1_1/${signatureDto.cloudName}/${signatureDto.resourceType}/upload"
            
            println("Cloudinary Upload URL: $uploadUrl")
            
            val chunkSize = 5 * 1024 * 1024 // 5 MB chunks
            val totalBytes = fileBytes.size
            val uniqueUploadId = (1..16).map { kotlin.random.Random.nextInt(0, 16).toString(16) }.joinToString("")
            
            if (totalBytes <= chunkSize) {
                println("Cloudinary Upload Parameters being sent:")
                println("  - api_key: ${signatureDto.apiKey}")
                println("  - timestamp: ${signatureDto.timestamp}")
                println("  - signature: ${signatureDto.signature}")
                println("  - folder: ${signatureDto.folder}")
                println("  - file size: ${fileBytes.size} bytes")
                
                val uploadResponse = plainClient.post(uploadUrl) {
                    setBody(buildMultipartBody(signatureDto, fileBytes, isVideo))
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
                    setBody(buildMultipartBody(signatureDto, chunkBytes, isVideo))
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
