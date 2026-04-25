package com.krieta.feature.budget.presentation.list

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.feature.budget.data.remote.BudgetApi
import com.krieta.feature.budget.domain.Budget
import com.krieta.feature.budget.domain.BudgetStatus
import kotlinx.coroutines.launch

sealed class BudgetListState {
    object Loading : BudgetListState()
    data class Success(val budgets: List<Budget>) : BudgetListState()
    data class Error(val message: String) : BudgetListState()
}

class BudgetListViewModel(private val budgetApi: BudgetApi) : ScreenModel {
    var state by mutableStateOf<BudgetListState>(BudgetListState.Loading)
        private set

    init {
        loadBudgets()
    }

    fun loadBudgets(status: BudgetStatus? = null) {
        screenModelScope.launch {
            state = BudgetListState.Loading
            budgetApi.getBudgets(status?.name).fold(
                onSuccess = { budgets ->
                    state = BudgetListState.Success(budgets)
                },
                onFailure = { error ->
                    state = BudgetListState.Error(error.message ?: "Failed to load budgets")
                }
            )
        }
    }

    fun deleteBudget(budgetId: String) {
        screenModelScope.launch {
            budgetApi.deleteBudget(budgetId).fold(
                onSuccess = { loadBudgets() },
                onFailure = { error ->
                    state = BudgetListState.Error(error.message ?: "Failed to delete budget")
                }
            )
        }
    }
}
