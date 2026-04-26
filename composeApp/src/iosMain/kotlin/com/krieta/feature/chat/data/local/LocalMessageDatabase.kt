package com.krieta.feature.chat.data.local

import co.touchlab.sqliter.DatabaseConfiguration
import com.squareup.sqldelight.db.SqlDriver
import com.squareup.sqldelight.drivers.native.NativeSqliteDriver
import com.squareup.sqldelight.drivers.native.wrapConnection
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import platform.Foundation.NSDocumentDirectory
import platform.Foundation.NSFileManager
import platform.Foundation.NSUserDomainMask

actual class LocalMessageDatabase {
    private val driver: SqlDriver by lazy {
        val documentDirectory = NSFileManager.defaultManager.URLForDirectory(
            directory = NSDocumentDirectory,
            inDomain = NSUserDomainMask,
            appropriateForURL = null,
            create = false,
            error = null
        )
        
        val dbPath = documentDirectory?.path + "/krieta_chat.db"
        
        NativeSqliteDriver(
            DatabaseConfiguration(
                name = dbPath,
                version = 1,
                create = { connection ->
                    wrapConnection(connection) { 
                        it.execute(
                            null,
                            """
                            CREATE TABLE IF NOT EXISTS local_messages (
                                id TEXT PRIMARY KEY NOT NULL,
                                chatId TEXT NOT NULL,
                                senderId TEXT NOT NULL,
                                payload TEXT NOT NULL,
                                mediaUrl TEXT,
                                mediaType TEXT,
                                replyToId TEXT,
                                status TEXT NOT NULL DEFAULT 'pending',
                                createdAt INTEGER NOT NULL,
                                isSynced INTEGER NOT NULL DEFAULT 0,
                                retryCount INTEGER NOT NULL DEFAULT 0
                            )
                            """.trimIndent(),
                            0
                        )
                    }
                },
                upgrade = { _, _, _ -> }
            )
        )
    }

    suspend fun insertMessage(message: LocalMessageEntity) {
        driver.execute(
            null,
            """
            INSERT OR REPLACE INTO local_messages 
            (id, chatId, senderId, payload, mediaUrl, mediaType, replyToId, status, createdAt, isSynced, retryCount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """.trimIndent(),
            11
        ) {
            bindString(0, message.id)
            bindString(1, message.chatId)
            bindString(2, message.senderId)
            bindString(3, message.payload)
            bindString(4, message.mediaUrl)
            bindString(5, message.mediaType)
            bindString(6, message.replyToId)
            bindString(7, message.status)
            bindLong(8, message.createdAt)
            bindLong(9, if (message.isSynced) 1 else 0)
            bindLong(10, message.retryCount.toLong())
        }
    }

    suspend fun getUnsyncedMessages(): List<LocalMessageEntity> {
        val messages = mutableListOf<LocalMessageEntity>()
        
        driver.executeQuery(
            null,
            "SELECT * FROM local_messages WHERE isSynced = 0 ORDER BY createdAt ASC",
            0
        ).use { cursor ->
            while (cursor.next()) {
                messages.add(
                    LocalMessageEntity(
                        id = cursor.getString(0)!!,
                        chatId = cursor.getString(1)!!,
                        senderId = cursor.getString(2)!!,
                        payload = cursor.getString(3)!!,
                        mediaUrl = cursor.getString(4),
                        mediaType = cursor.getString(5),
                        replyToId = cursor.getString(6),
                        status = cursor.getString(7)!!,
                        createdAt = cursor.getLong(8)!!,
                        isSynced = cursor.getLong(9)!! == 1L,
                        retryCount = cursor.getLong(10)!!.toInt()
                    )
                )
            }
        }
        
        return messages
    }

    suspend fun markAsSynced(messageId: String) {
        driver.execute(
            null,
            "UPDATE local_messages SET isSynced = 1, status = 'sent' WHERE id = ?",
            1
        ) {
            bindString(0, messageId)
        }
    }

    suspend fun updateMessageStatus(messageId: String, status: String) {
        driver.execute(
            null,
            "UPDATE local_messages SET status = ?, retryCount = retryCount + 1 WHERE id = ?",
            2
        ) {
            bindString(0, status)
            bindString(1, messageId)
        }
    }

    fun getMessagesByChatId(chatId: String): Flow<List<LocalMessageEntity>> {
        // For iOS, we'll use a simple polling mechanism
        // In production, consider using a more sophisticated reactive approach
        val flow = MutableStateFlow<List<LocalMessageEntity>>(emptyList())
        
        // TODO: Implement proper reactive queries for iOS
        
        return flow
    }
}
