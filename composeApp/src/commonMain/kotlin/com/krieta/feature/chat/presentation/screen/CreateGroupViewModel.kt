package com.krieta.feature.chat.presentation.screen

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chat.domain.repository.ChatRepository
import com.krieta.feature.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class CreateGroupState(
    val groupName: String = "",
    val groupDescription: String = "",
    val searchQuery: String = "",
    val users: List<UserSearchResult> = emptyList(),
    val selectedUserIds: Set<String> = emptySet(),
    val isSearching: Boolean = false,
    val isCreating: Boolean = false,
    val error: String? = null,
    val successChatId: String? = null
)

class CreateGroupViewModel(
    private val profileRepository: ProfileRepository,
    private val chatRepository: ChatRepository
) : ScreenModel {

    private val _state = MutableStateFlow(CreateGroupState())
    val state: StateFlow<CreateGroupState> = _state.asStateFlow()

    private val queryFlow = MutableStateFlow("")

    init {
        @OptIn(FlowPreview::class, kotlinx.coroutines.ExperimentalCoroutinesApi::class)
        queryFlow
            .debounce(400)
            .distinctUntilChanged()
            .filter { it.length >= 2 }
            .onEach { _state.value = _state.value.copy(isSearching = true, searchQuery = it) }
            .mapLatest { profileRepository.searchUsers(it) }
            .onEach { result ->
                when (result) {
                    is NetworkResult.Success -> {
                        val users = result.data.map { 
                            UserSearchResult(
                                id = it.id,
                                username = it.username,
                                displayName = it.displayName,
                                avatarUrl = it.avatarUrl
                            )
                        }
                        _state.value = _state.value.copy(users = users, isSearching = false)
                    }
                    is NetworkResult.Error -> {
                        _state.value = _state.value.copy(error = result.message, isSearching = false)
                    }
                    else -> {}
                }
            }
            .launchIn(screenModelScope)
    }

    fun onGroupNameChange(name: String) {
        _state.value = _state.value.copy(groupName = name)
    }

    fun onGroupDescriptionChange(description: String) {
        _state.value = _state.value.copy(groupDescription = description)
    }

    fun onSearchQueryChange(query: String) {
        _state.value = _state.value.copy(searchQuery = query)
        queryFlow.value = query
        if (query.isBlank()) {
            _state.value = _state.value.copy(users = emptyList(), isSearching = false)
        }
    }

    fun toggleUserSelection(userId: String) {
        val current = _state.value.selectedUserIds
        _state.value = _state.value.copy(
            selectedUserIds = if (current.contains(userId)) {
                current - userId
            } else {
                current + userId
            }
        )
    }

    fun createGroup() {
        val currentState = _state.value
        if (currentState.groupName.isBlank() || currentState.selectedUserIds.size < 2) {
            _state.value = _state.value.copy(error = "Group name required and at least 2 members needed")
            return
        }

        screenModelScope.launch {
            _state.value = _state.value.copy(isCreating = true, error = null)
            when (val result = chatRepository.createGroupChat(
                name = currentState.groupName,
                description = currentState.groupDescription.takeIf { it.isNotBlank() },
                participantIds = currentState.selectedUserIds.toList()
            )) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        isCreating = false,
                        successChatId = result.data.id
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(
                        isCreating = false,
                        error = result.message ?: "Failed to create group"
                    )
                }
                else -> {}
            }
        }
    }
}
