package com.krieta.feature.budget.data.local

import androidx.room.*

@Entity(tableName = "offline_budgets")
data class LocalBudgetEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val name: String,
    val description: String?,
    val totalAmount: Double,
    val currency: String,
    val period: String,
    val startDate: Long,
    val endDate: Long,
    val status: String,
    val alertAt: Int,
    val syncStatus: String,
    val lastSyncedAt: Long?
)

@Entity(tableName = "offline_expenses")
data class LocalExpenseEntity(
    @PrimaryKey val id: String,
    val budgetId: String,
    val categoryId: String?,
    val userId: String,
    val amount: Double,
    val currency: String,
    val description: String,
    val notes: String?,
    val receiptUrl: String?,
    val merchant: String?,
    val location: String?,
    val isRecurring: Boolean,
    val recurrence: String,
    val expenseDate: Long,
    val syncStatus: String,
    val lastSyncedAt: Long?
)

@Dao
interface BudgetDao {
    @Query("SELECT * FROM offline_budgets WHERE userId = :userId")
    suspend fun getAllBudgets(userId: String): List<LocalBudgetEntity>

    @Query("SELECT * FROM offline_budgets WHERE id = :id")
    suspend fun getBudgetById(id: String): LocalBudgetEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBudget(budget: LocalBudgetEntity)

    @Query("DELETE FROM offline_budgets WHERE id = :id")
    suspend fun deleteBudget(id: String)

    @Query("SELECT * FROM offline_budgets WHERE syncStatus = 'PENDING'")
    suspend fun getPendingBudgets(): List<LocalBudgetEntity>

    @Query("UPDATE offline_budgets SET syncStatus = :status, lastSyncedAt = :timestamp WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: String, timestamp: Long)
}

@Dao
interface ExpenseDao {
    @Query("SELECT * FROM offline_expenses WHERE budgetId = :budgetId")
    suspend fun getExpensesByBudget(budgetId: String): List<LocalExpenseEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: LocalExpenseEntity)

    @Query("DELETE FROM offline_expenses WHERE id = :id")
    suspend fun deleteExpense(id: String)

    @Query("SELECT * FROM offline_expenses WHERE syncStatus = 'PENDING'")
    suspend fun getPendingExpenses(): List<LocalExpenseEntity>

    @Query("UPDATE offline_expenses SET syncStatus = :status, lastSyncedAt = :timestamp WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: String, timestamp: Long)
}

@Database(
    entities = [LocalBudgetEntity::class, LocalExpenseEntity::class],
    version = 1,
    exportSchema = false
)
abstract class BudgetDatabase : RoomDatabase() {
    abstract fun budgetDao(): BudgetDao
    abstract fun expenseDao(): ExpenseDao
}
