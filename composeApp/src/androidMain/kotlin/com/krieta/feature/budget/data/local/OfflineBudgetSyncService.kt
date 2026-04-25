package com.krieta.feature.budget.data.local

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import androidx.room.Room
import kotlinx.coroutines.*
import java.util.UUID

class OfflineBudgetSyncService(private val context: Context) {
    private val database = Room.databaseBuilder(
        context,
        BudgetDatabase::class.java,
        "budget_database"
    ).build()

    private val budgetDao = database.budgetDao()
    private val expenseDao = database.expenseDao()
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    init {
        startNetworkMonitoring()
    }

    private fun startNetworkMonitoring() {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val networkRequest = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        connectivityManager.registerNetworkCallback(networkRequest, object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                scope.launch { syncPendingData() }
            }
        })
    }

    suspend fun saveBudgetOffline(budget: LocalBudgetEntity) {
        budgetDao.insertBudget(budget.copy(syncStatus = "PENDING"))
    }

    suspend fun saveExpenseOffline(expense: LocalExpenseEntity) {
        expenseDao.insertExpense(expense.copy(syncStatus = "PENDING"))
    }

    suspend fun getBudgets(userId: String): List<LocalBudgetEntity> {
        return budgetDao.getAllBudgets(userId)
    }

    suspend fun getExpenses(budgetId: String): List<LocalExpenseEntity> {
        return expenseDao.getExpensesByBudget(budgetId)
    }

    private suspend fun syncPendingData() {
        val pendingBudgets = budgetDao.getPendingBudgets()
        val pendingExpenses = expenseDao.getPendingExpenses()

        pendingBudgets.forEach { budget ->
            try {
                // TODO: Call API to sync budget
                budgetDao.updateSyncStatus(budget.id, "SYNCED", System.currentTimeMillis())
            } catch (e: Exception) {
                budgetDao.updateSyncStatus(budget.id, "FAILED", System.currentTimeMillis())
            }
        }

        pendingExpenses.forEach { expense ->
            try {
                // TODO: Call API to sync expense
                expenseDao.updateSyncStatus(expense.id, "SYNCED", System.currentTimeMillis())
            } catch (e: Exception) {
                expenseDao.updateSyncStatus(expense.id, "FAILED", System.currentTimeMillis())
            }
        }
    }
}
