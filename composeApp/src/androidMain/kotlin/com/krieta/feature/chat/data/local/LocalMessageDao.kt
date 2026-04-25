package com.krieta.feature.chat.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

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
