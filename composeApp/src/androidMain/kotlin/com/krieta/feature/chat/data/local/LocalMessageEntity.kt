package com.krieta.feature.chat.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "local_messages")
data class LocalMessageEntity(
    @PrimaryKey
    val id: String,
    val chatId: String,
    val senderId: String,
    val payload: String,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val replyToId: String? = null,
    val status: String = "pending", // pending, sent, failed
    val createdAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false,
    val retryCount: Int = 0
)
