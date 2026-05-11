package com.krieta.com.core.offline

import com.krieta.com.db.KrietaDatabase
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@Serializable
data class OfflineAction(
    val id: String,
    val actionType: ActionType,
    val entityType: EntityType,
    val entityId: String,
    val payload: String,
    val createdAt: Long,
    val retryCount: Int = 0,
    val status: ActionStatus = ActionStatus.PENDING
)

enum class ActionType {
    // Non-financial actions (can be queued offline)
    LIKE, UNLIKE, BOOKMARK, UNBOOKMARK, COMMENT, SEND_MESSAGE, SHARE, VIEW,
    
    // Financial actions (NEVER queued offline)
    TIP, WITHDRAW, TOPUP, PURCHASE
}

enum class EntityType {
    DRIP, SHORT, PRODUCT, CONVERSATION, POST
}

enum class ActionStatus {
    PENDING, PROCESSING, COMPLETED, FAILED
}

@OptIn(ExperimentalUuidApi::class)
class OfflineActionQueue(
    private val database: KrietaDatabase,
    private val scope: CoroutineScope,
    private val offlineModeGuard: OfflineModeGuard
) {
    private val queries = database.offlineActionQueries
    private val _syncState = MutableStateFlow<SyncState>(SyncState.Idle)
    val syncState: StateFlow<SyncState> = _syncState
    
    private var syncJob: Job? = null
    
    sealed class SyncState {
        data object Idle : SyncState()
        data class Syncing(val progress: Int, val total: Int) : SyncState()
        data class Error(val message: String) : SyncState()
    }
    
    suspend fun queueAction(
        actionType: ActionType,
        entityType: EntityType,
        entityId: String,
        payload: Map<String, Any>
    ) = withContext(Dispatchers.IO) {
        // CRITICAL: Block financial transactions if offline
        if (!offlineModeGuard.canQueueOffline(actionType)) {
            throw OfflineTransactionException(
                offlineModeGuard.getBlockedActionMessage(actionType)
            )
        }
        
        val action = OfflineAction(
            id = Uuid.random().toString(),
            actionType = actionType,
            entityType = entityType,
            entityId = entityId,
            payload = Json.encodeToString(payload),
            createdAt = System.currentTimeMillis()
        )
        
        queries.insertAction(
            id = action.id,
            actionType = action.actionType.name,
            entityType = action.entityType.name,
            entityId = action.entityId,
            payload = action.payload,
            createdAt = action.createdAt,
            retryCount = action.retryCount.toLong(),
            status = action.status.name
        )
        
        println("✅ Queued offline action: ${action.actionType} on ${action.entityType} ${action.entityId}")
    }
    
    suspend fun getPendingActions(): List<OfflineAction> = withContext(Dispatchers.IO) {
        queries.getPendingActions().executeAsList().map { entity ->
            OfflineAction(
                id = entity.id,
                actionType = ActionType.valueOf(entity.actionType),
                entityType = EntityType.valueOf(entity.entityType),
                entityId = entity.entityId,
                payload = entity.payload,
                createdAt = entity.createdAt,
                retryCount = entity.retryCount.toInt(),
                status = ActionStatus.valueOf(entity.status)
            )
        }
    }
    
    suspend fun markActionCompleted(actionId: String) = withContext(Dispatchers.IO) {
        queries.updateActionStatus(ActionStatus.COMPLETED.name, 0, actionId)
    }
    
    suspend fun markActionFailed(actionId: String, retryCount: Int) = withContext(Dispatchers.IO) {
        val status = if (retryCount >= 3) ActionStatus.FAILED.name else ActionStatus.PENDING.name
        queries.updateActionStatus(status, retryCount.toLong(), actionId)
    }
    
    suspend fun clearCompletedActions() = withContext(Dispatchers.IO) {
        queries.deleteCompletedActions()
    }
    
    fun startAutoSync(syncHandler: suspend (OfflineAction) -> Boolean) {
        syncJob?.cancel()
        syncJob = scope.launch {
            while (isActive) {
                try {
                    val pendingActions = getPendingActions()
                    if (pendingActions.isNotEmpty()) {
                        _syncState.value = SyncState.Syncing(0, pendingActions.size)
                        
                        pendingActions.forEachIndexed { index, action ->
                            try {
                                val success = syncHandler(action)
                                if (success) {
                                    markActionCompleted(action.id)
                                } else {
                                    markActionFailed(action.id, action.retryCount + 1)
                                }
                            } catch (e: Exception) {
                                println("❌ Failed to sync action ${action.id}: ${e.message}")
                                markActionFailed(action.id, action.retryCount + 1)
                            }
                            
                            _syncState.value = SyncState.Syncing(index + 1, pendingActions.size)
                        }
                        
                        clearCompletedActions()
                        _syncState.value = SyncState.Idle
                    }
                } catch (e: Exception) {
                    println("❌ Sync error: ${e.message}")
                    _syncState.value = SyncState.Error(e.message ?: "Unknown error")
                }
                
                delay(30000) // Check every 30 seconds
            }
        }
    }
    
    fun stopAutoSync() {
        syncJob?.cancel()
        syncJob = null
    }
}
