package com.runinga.com.core.offline

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Offline Mode Guard
 * Prevents financial transactions when device is offline
 */
class OfflineModeGuard {
    
    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline
    
    /**
     * Update network connectivity status
     */
    fun updateConnectivity(isConnected: Boolean) {
        _isOnline.value = isConnected
        if (isConnected) {
            println("✅ Network online - financial transactions enabled")
        } else {
            println("⚠️ Network offline - financial transactions blocked")
        }
    }
    
    /**
     * Check if financial transactions are allowed
     * @throws OfflineTransactionException if offline
     */
    fun requireOnlineForFinancialTransaction() {
        if (!_isOnline.value) {
            throw OfflineTransactionException(
                "Financial transactions require an active internet connection. " +
                "Please check your network and try again."
            )
        }
    }
    
    /**
     * Check if action can be queued offline
     * Financial actions are NEVER queued
     */
    fun canQueueOffline(actionType: ActionType): Boolean {
        return when (actionType) {
            // Safe to queue offline
            ActionType.LIKE,
            ActionType.UNLIKE,
            ActionType.BOOKMARK,
            ActionType.UNBOOKMARK,
            ActionType.VIEW,
            ActionType.SHARE -> true
            
            // Comments and messages can be queued (non-financial)
            ActionType.COMMENT,
            ActionType.SEND_MESSAGE -> true
            
            // Financial actions NEVER queued
            ActionType.TIP,
            ActionType.WITHDRAW,
            ActionType.TOPUP,
            ActionType.PURCHASE -> false
        }
    }
    
    /**
     * Get user-friendly message for blocked action
     */
    fun getBlockedActionMessage(actionType: ActionType): String {
        return when (actionType) {
            ActionType.TIP -> "Tips require an active internet connection to ensure secure payment processing."
            ActionType.WITHDRAW -> "Withdrawals require an active internet connection for security verification."
            ActionType.TOPUP -> "Top-ups require an active internet connection to process your payment."
            ActionType.PURCHASE -> "Purchases require an active internet connection to complete the transaction."
            else -> "This action requires an active internet connection."
        }
    }
}

/**
 * Exception thrown when attempting financial transaction offline
 */
class OfflineTransactionException(message: String) : Exception(message)
