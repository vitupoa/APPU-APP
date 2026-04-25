package com.krieta.feature.budget.presentation.expense

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.feature.budget.data.remote.AddExpenseRequest
import com.krieta.feature.budget.data.remote.BudgetApi
import com.krieta.feature.budget.data.scanner.ReceiptScanner
import com.krieta.feature.budget.domain.ExpenseRecurrence
import kotlinx.coroutines.launch

sealed class AddExpenseState {
    object Idle : AddExpenseState()
    object Loading : AddExpenseState()
    object Success : AddExpenseState()
    data class Error(val message: String) : AddExpenseState()
    data class ReceiptScanned(
        val amount: Double?,
        val merchant: String?,
        val date: String?
    ) : AddExpenseState()
}

class AddExpenseViewModel(
    private val budgetApi: BudgetApi,
    private val receiptScanner: ReceiptScanner
) : ScreenModel {
    var state by mutableStateOf<AddExpenseState>(AddExpenseState.Idle)
        private set

    fun scanReceipt(uri: String) {
        screenModelScope.launch {
            state = AddExpenseState.Loading
            try {
                val result = receiptScanner.scanReceiptFromUri(uri)
                state = AddExpenseState.ReceiptScanned(
                    amount = result.amount,
                    merchant = result.merchant,
                    date = result.date
                )
            } catch (e: Exception) {
                state = AddExpenseState.Error("Failed to scan receipt: ${e.message}")
            }
        }
    }

    fun addExpense(
        budgetId: String,
        categoryId: String?,
        amount: Double,
        currency: String,
        description: String,
        notes: String?,
        receiptUrl: String?,
        merchant: String?,
        location: String?,
        isRecurring: Boolean,
        recurrence: ExpenseRecurrence,
        nextDueDate: Long?,
        expenseDate: Long
    ) {
        screenModelScope.launch {
            state = AddExpenseState.Loading
            
            val request = AddExpenseRequest(
                categoryId = categoryId,
                amount = amount,
                currency = currency,
                description = description,
                notes = notes,
                receiptUrl = receiptUrl,
                merchant = merchant,
                location = location,
                isRecurring = isRecurring,
                recurrence = recurrence.name,
                nextDueDate = nextDueDate,
                expenseDate = expenseDate
            )
            
            budgetApi.addExpense(budgetId, request).fold(
                onSuccess = {
                    state = AddExpenseState.Success
                },
                onFailure = { error ->
                    state = AddExpenseState.Error(error.message ?: "Failed to add expense")
                }
            )
        }
    }

    fun resetState() {
        state = AddExpenseState.Idle
    }

    override fun onDispose() {
        super.onDispose()
        receiptScanner.release()
    }
}
