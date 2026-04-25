package com.krieta.feature.budget.presentation.create

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.feature.budget.data.remote.*
import com.krieta.feature.budget.domain.BudgetPeriod
import kotlinx.coroutines.launch

sealed class CreateBudgetState {
    object Idle : CreateBudgetState()
    object Loading : CreateBudgetState()
    object Success : CreateBudgetState()
    data class Error(val message: String) : CreateBudgetState()
}

class CreateBudgetViewModel(private val budgetApi: BudgetApi) : ScreenModel {
    var state by mutableStateOf<CreateBudgetState>(CreateBudgetState.Idle)
        private set

    fun createBudget(
        name: String,
        description: String?,
        totalAmount: Double,
        currency: String,
        period: BudgetPeriod,
        startDate: Long,
        endDate: Long,
        alertAt: Int,
        categories: List<CategoryInput>
    ) {
        screenModelScope.launch {
            state = CreateBudgetState.Loading
            
            val request = CreateBudgetRequest(
                name = name,
                description = description,
                totalAmount = totalAmount,
                currency = currency,
                period = period.name,
                startDate = startDate,
                endDate = endDate,
                alertAt = alertAt,
                categories = categories.map {
                    CategoryRequest(
                        name = it.name,
                        allocatedAmount = it.amount.toDoubleOrNull() ?: 0.0,
                        icon = it.icon,
                        color = it.color
                    )
                }
            )
            
            budgetApi.createBudget(request).fold(
                onSuccess = {
                    state = CreateBudgetState.Success
                },
                onFailure = { error ->
                    state = CreateBudgetState.Error(error.message ?: "Failed to create budget")
                }
            )
        }
    }

    fun resetState() {
        state = CreateBudgetState.Idle
    }
}
