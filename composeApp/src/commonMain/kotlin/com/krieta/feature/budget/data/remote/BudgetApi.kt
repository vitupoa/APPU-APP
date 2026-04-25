package com.krieta.feature.budget.data.remote

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import io.ktor.http.*
import com.krieta.feature.budget.domain.*
import kotlinx.serialization.Serializable

@Serializable
data class CreateBudgetRequest(
    val name: String,
    val description: String?,
    val totalAmount: Double,
    val currency: String,
    val period: String,
    val startDate: Long,
    val endDate: Long,
    val alertAt: Int,
    val categories: List<CategoryRequest>
)

@Serializable
data class CategoryRequest(
    val name: String,
    val allocatedAmount: Double,
    val icon: String?,
    val color: String?
)

@Serializable
data class AddExpenseRequest(
    val categoryId: String?,
    val amount: Double,
    val currency: String,
    val description: String,
    val notes: String?,
    val receiptUrl: String?,
    val merchant: String?,
    val location: String?,
    val isRecurring: Boolean,
    val recurrence: String,
    val nextDueDate: Long?,
    val expenseDate: Long
)

@Serializable
data class BudgetResponse(
    val success: Boolean,
    val budget: BudgetDto? = null,
    val budgets: List<BudgetDto>? = null,
    val error: String? = null
)

@Serializable
data class ExpenseResponse(
    val success: Boolean,
    val expense: ExpenseDto? = null,
    val expenses: List<ExpenseDto>? = null,
    val total: Int? = null,
    val page: Int? = null,
    val limit: Int? = null,
    val error: String? = null
)

@Serializable
data class AnalyticsResponse(
    val success: Boolean,
    val analytics: AnalyticsDto? = null,
    val error: String? = null
)

@Serializable
data class BudgetDto(
    val id: String,
    val userId: String,
    val name: String,
    val description: String?,
    val totalAmount: Double,
    val currency: String,
    val period: String,
    val startDate: String,
    val endDate: String,
    val status: String,
    val alertAt: Int,
    val categories: List<CategoryDto>? = null,
    val _count: CountDto? = null
)

@Serializable
data class CategoryDto(
    val id: String,
    val budgetId: String,
    val name: String,
    val allocatedAmount: Double,
    val icon: String?,
    val color: String?,
    val sortOrder: Int
)

@Serializable
data class ExpenseDto(
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
    val recurrence: String,
    val nextDueDate: String?,
    val expenseDate: String,
    val category: CategoryDto? = null
)

@Serializable
data class AnalyticsDto(
    val totalBudget: Double,
    val totalSpent: Double,
    val remaining: Double,
    val percentageSpent: Double,
    val status: String,
    val categoryBreakdown: List<CategoryBreakdownDto>,
    val dailySpending: List<DailySpendingDto>,
    val alertThreshold: Int,
    val shouldAlert: Boolean
)

@Serializable
data class CategoryBreakdownDto(
    val categoryId: String,
    val name: String,
    val allocated: Double,
    val spent: Double,
    val remaining: Double,
    val percentage: Double
)

@Serializable
data class DailySpendingDto(
    val date: String,
    val total: Double
)

@Serializable
data class CountDto(
    val expenses: Int
)

class BudgetApi(private val client: HttpClient, private val baseUrl: String) {
    
    suspend fun createBudget(request: CreateBudgetRequest): Result<Budget> = runCatching {
        val response: BudgetResponse = client.post("$baseUrl/api/v1/budgets") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
        
        response.budget?.toDomain() ?: throw Exception(response.error ?: "Failed to create budget")
    }
    
    suspend fun getBudgets(status: String? = null): Result<List<Budget>> = runCatching {
        val response: BudgetResponse = client.get("$baseUrl/api/v1/budgets") {
            status?.let { parameter("status", it) }
        }.body()
        
        response.budgets?.map { it.toDomain() } ?: throw Exception(response.error ?: "Failed to fetch budgets")
    }
    
    suspend fun getBudgetById(budgetId: String): Result<Budget> = runCatching {
        val response: BudgetResponse = client.get("$baseUrl/api/v1/budgets/$budgetId").body()
        response.budget?.toDomain() ?: throw Exception(response.error ?: "Budget not found")
    }
    
    suspend fun updateBudget(budgetId: String, name: String?, totalAmount: Double?, alertAt: Int?, status: String?): Result<Budget> = runCatching {
        val response: BudgetResponse = client.put("$baseUrl/api/v1/budgets/$budgetId") {
            contentType(ContentType.Application.Json)
            setBody(mapOf(
                "name" to name,
                "totalAmount" to totalAmount,
                "alertAt" to alertAt,
                "status" to status
            ))
        }.body()
        
        response.budget?.toDomain() ?: throw Exception(response.error ?: "Failed to update budget")
    }
    
    suspend fun deleteBudget(budgetId: String): Result<Unit> = runCatching {
        client.delete("$baseUrl/api/v1/budgets/$budgetId")
    }
    
    suspend fun addExpense(budgetId: String, request: AddExpenseRequest): Result<Expense> = runCatching {
        val response: ExpenseResponse = client.post("$baseUrl/api/v1/budgets/$budgetId/expenses") {
            contentType(ContentType.Application.Json)
            setBody(request)
        }.body()
        
        response.expense?.toDomain() ?: throw Exception(response.error ?: "Failed to add expense")
    }
    
    suspend fun getExpenses(budgetId: String, categoryId: String? = null, page: Int = 1, limit: Int = 50): Result<List<Expense>> = runCatching {
        val response: ExpenseResponse = client.get("$baseUrl/api/v1/budgets/$budgetId/expenses") {
            categoryId?.let { parameter("categoryId", it) }
            parameter("page", page)
            parameter("limit", limit)
        }.body()
        
        response.expenses?.map { it.toDomain() } ?: throw Exception(response.error ?: "Failed to fetch expenses")
    }
    
    suspend fun updateExpense(expenseId: String, amount: Double?, description: String?, categoryId: String?): Result<Expense> = runCatching {
        val response: ExpenseResponse = client.put("$baseUrl/api/v1/budgets/expenses/$expenseId") {
            contentType(ContentType.Application.Json)
            setBody(mapOf(
                "amount" to amount,
                "description" to description,
                "categoryId" to categoryId
            ))
        }.body()
        
        response.expense?.toDomain() ?: throw Exception(response.error ?: "Failed to update expense")
    }
    
    suspend fun deleteExpense(expenseId: String): Result<Unit> = runCatching {
        client.delete("$baseUrl/api/v1/budgets/expenses/$expenseId")
    }
    
    suspend fun getAnalytics(budgetId: String): Result<BudgetAnalytics> = runCatching {
        val response: AnalyticsResponse = client.get("$baseUrl/api/v1/budgets/$budgetId/analytics").body()
        response.analytics?.toDomain() ?: throw Exception(response.error ?: "Failed to fetch analytics")
    }
    
    suspend fun getDueRecurringExpenses(): Result<List<Expense>> = runCatching {
        val response: ExpenseResponse = client.get("$baseUrl/api/v1/budgets/recurring/due").body()
        response.expenses?.map { it.toDomain() } ?: throw Exception(response.error ?: "Failed to fetch recurring expenses")
    }
}

private fun BudgetDto.toDomain() = Budget(
    id = id,
    userId = userId,
    name = name,
    description = description,
    totalAmount = totalAmount,
    currency = currency,
    period = BudgetPeriod.valueOf(period),
    startDate = parseDate(startDate),
    endDate = parseDate(endDate),
    status = BudgetStatus.valueOf(status),
    alertAt = alertAt,
    categories = categories?.map { it.toDomain() } ?: emptyList(),
    expenseCount = _count?.expenses ?: 0
)

private fun CategoryDto.toDomain() = BudgetCategory(
    id = id,
    budgetId = budgetId,
    name = name,
    allocatedAmount = allocatedAmount,
    icon = icon,
    color = color,
    sortOrder = sortOrder
)

private fun ExpenseDto.toDomain() = Expense(
    id = id,
    budgetId = budgetId,
    categoryId = categoryId,
    userId = userId,
    amount = amount,
    currency = currency,
    description = description,
    notes = notes,
    receiptUrl = receiptUrl,
    merchant = merchant,
    location = location,
    isRecurring = isRecurring,
    recurrence = ExpenseRecurrence.valueOf(recurrence),
    nextDueDate = nextDueDate?.let { parseDate(it) },
    expenseDate = parseDate(expenseDate),
    category = category?.toDomain()
)

private fun AnalyticsDto.toDomain() = BudgetAnalytics(
    totalBudget = totalBudget,
    totalSpent = totalSpent,
    remaining = remaining,
    percentageSpent = percentageSpent,
    status = BudgetStatus.valueOf(status),
    categoryBreakdown = categoryBreakdown.map { it.toDomain() },
    dailySpending = dailySpending.map { it.toDomain() },
    alertThreshold = alertThreshold,
    shouldAlert = shouldAlert
)

private fun CategoryBreakdownDto.toDomain() = CategoryBreakdown(
    categoryId = categoryId,
    name = name,
    allocated = allocated,
    spent = spent,
    remaining = remaining,
    percentage = percentage
)

private fun DailySpendingDto.toDomain() = DailySpending(
    date = date,
    total = total
)

private fun parseDate(dateString: String): Long {
    return try {
        kotlinx.datetime.Instant.parse(dateString).toEpochMilliseconds()
    } catch (e: Exception) {
        System.currentTimeMillis()
    }
}
