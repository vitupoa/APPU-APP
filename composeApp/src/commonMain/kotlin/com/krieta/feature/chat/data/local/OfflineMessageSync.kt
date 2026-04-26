package com.krieta.feature.chat.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow
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
    val status: String = "pending",
    val createdAt: Long = System.currentTimeMillis(),
    val isSynced: Boolean = false,
    val retryCount: Int = 0
)

/**
 * DAO interface for local message operations
 */
@Dao
interface LocalMessageDao {
    @Query("SELECT * FROM local_messages WHERE chatId = :chatId ORDER BY createdAt DESC")
    fun getMessagesByChatId(chatId: String): Flow<List<LocalMessageEntity>>

    @Query("SELECT * FROM local_messages WHERE isSynced = 0 ORDER BY createdAt ASC")
    suspend fun getUnsyncedMessages(): List<LocalMessageEntity>

    @Query("SELECT * FROM local_messages WHERE id = :messageId")
    suspend fun getMessageById(messageId: String): LocalMessageEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: LocalMessageEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(messages: List<LocalMessageEntity>)

    @Update
    suspend fun updateMessage(message: LocalMessageEntity)

    @Query("UPDATE local_messages SET isSynced = 1, status = 'sent' WHERE id = :messageId")
    suspend fun markAsSynced(messageId: String)

    @Query("UPDATE local_messages SET status = :status, retryCount = retryCount + 1 WHERE id = :messageId")
    suspend fun updateMessageStatus(messageId: String, status: String)

    @Query("DELETE FROM local_messages WHERE id = :messageId")
    suspend fun deleteMessage(messageId: String)

    @Query("DELETE FROM local_messages WHERE chatId = :chatId AND isSynced = 1 AND createdAt < :timestamp")
    suspend fun deleteOldSyncedMessages(chatId: String, timestamp: Long)

    @Query("DELETE FROM local_messages WHERE chatId = :chatId")
    suspend fun deleteAllMessagesForChat(chatId: String)
}
