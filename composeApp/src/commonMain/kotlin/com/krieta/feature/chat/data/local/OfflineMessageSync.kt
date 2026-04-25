package com.krieta.feature.chat.data.local

import kotlinx.coroutines.flow.StateFlow

/**
 * Common interface for offline message synchronization across platforms.
 */
expect class OfflineMessageSyncService {
    val isOnline: StateFlow<Boolean>
    
    fun syncPendingMessages()
    suspend fun queueMessage(message: LocalMessageEntity)
    fun cleanup()
}

/**
 * Common data class for local message storage.
 */
data class LocalMessage(
    val id: String,
    val chatId: String,
    val senderId: String,
    val payload: String,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val replyToId: String? = null,
    val status: MessageStatus = MessageStatus.PENDING,
    val createdAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false,
    val retryCount: Int = 0
)

enum class MessageStatus {
    PENDING,
    SENT,
    DELIVERED,
    READ,
    FAILED
}

/**
 * Extension to convert LocalMessage to LocalMessageEntity
 */
fun LocalMessage.toEntity(): LocalMessageEntity {
    return LocalMessageEntity(
        id = id,
        chatId = chatId,
        senderId = senderId,
        payload = payload,
        mediaUrl = mediaUrl,
        mediaType = mediaType,
        replyToId = replyToId,
        status = status.name.lowercase(),
        createdAt = createdAt,
        isSynced = isSynced,
        retryCount = retryCount
    )
}

/**
 * Extension to convert LocalMessageEntity to LocalMessage
 */
fun LocalMessageEntity.toModel(): LocalMessage {
    return LocalMessage(
        id = id,
        chatId = chatId,
        senderId = senderId,
        payload = payload,
        mediaUrl = mediaUrl,
        mediaType = mediaType,
        replyToId = replyToId,
        status = MessageStatus.valueOf(status.uppercase()),
        createdAt = createdAt,
        isSynced = isSynced,
        retryCount = retryCount
    )
}
