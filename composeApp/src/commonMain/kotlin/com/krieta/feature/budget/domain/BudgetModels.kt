package com.krieta.feature.budget.domain

data class Budget(
    val id: String,
    val userId: String,
    val name: String,
    val description: String?,
    val totalAmount: Double,
    val currency: String,
    val period: BudgetPeriod,
    val startDate: Long,
    val endDate: Long,
    val status: BudgetStatus,
    val alertAt: Int,
    val categories: List<BudgetCategory> = emptyList(),
    val expenseCount: Int = 0
)

data class BudgetCategory(
    val id: String,
    val budgetId: String,
    val name: String,
    val allocatedAmount: Double,
    val icon: String?,
    val color: String?,
    val sortOrder: Int,
    val expenseCount: Int = 0
)

data class Expense(
    val id: String,
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
    val recurrence: ExpenseRecurrence,
    val nextDueDate: Long?,
    val expenseDate: Long,
    val category: BudgetCategory? = null
)

data class BudgetAnalytics(
    val totalBudget: Double,
    val totalSpent: Double,
    val remaining: Double,
    val percentageSpent: Double,
    val status: BudgetStatus,
    val categoryBreakdown: List<CategoryBreakdown>,
    val dailySpending: List<DailySpending>,
    val alertThreshold: Int,
    val shouldAlert: Boolean
)

data class CategoryBreakdown(
    val categoryId: String,
    val name: String,
    val allocated: Double,
    val spent: Double,
    val remaining: Double,
    val percentage: Double
)

data class DailySpending(
    val date: String,
    val total: Double
)

enum class BudgetPeriod {
    WEEKLY, MONTHLY, YEARLY, CUSTOM
}

enum class BudgetStatus {
    ACTIVE, PAUSED, COMPLETED, EXCEEDED
}

enum class ExpenseRecurrence {
    NONE, DAILY, WEEKLY, MONTHLY, YEARLY
}
