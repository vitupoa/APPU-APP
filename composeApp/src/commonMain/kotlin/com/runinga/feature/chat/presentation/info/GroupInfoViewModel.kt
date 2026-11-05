package com.runinga.feature.chat.presentation.info

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.feature.chat.domain.model.Chat
import com.runinga.feature.chat.domain.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class GroupInfoState(
    val chat: Chat? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val deleteSuccess: Boolean = false
)

class GroupInfoViewModel(
    private val chatId: String,
    private val repository: ChatRepository
) : ScreenModel {

    private val _state = MutableStateFlow(GroupInfoState(isLoading = true))
    val state: StateFlow<GroupInfoState> = _state.asStateFlow()

    init {
        loadGroupInfo()
    }

    private fun loadGroupInfo() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.getChatById(chatId)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        chat = result.data,
                        isLoading = false,
                        error = null
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun updateGroup(name: String, description: String?) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.updateGroup(chatId, name, description)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        chat = result.data,
                        isLoading = false,
                        successMessage = "Group updated successfully",
                        error = null
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun deleteGroup() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            when (val result = repository.deleteGroup(chatId)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        deleteSuccess = true,
                        successMessage = "Group deleted successfully",
                        error = null
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = result.message
                    )
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun clearMessages() {
        _state.value = _state.value.copy(error = null, successMessage = null)
    }
}
