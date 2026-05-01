package com.krieta.feature.chat.presentation.settings

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.upload.CloudinaryFolders
import com.krieta.com.core.upload.UploadApi
import com.krieta.feature.chat.domain.model.Chat
import com.krieta.feature.chat.domain.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class GroupSettingsState(
    val chat: Chat? = null,
    val isAdmin: Boolean = false,
    val currentUserId: String? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
    val successMessage: String? = null
)

class GroupSettingsViewModel(
    private val chatId: String,
    private val repository: ChatRepository,
    private val uploadApi: UploadApi,
    private val tokenManager: com.krieta.com.core.security.TokenManager
) : ScreenModel {

    private val _state = MutableStateFlow(GroupSettingsState())
    val state = _state.asStateFlow()

    private var currentUserId: String? = null

    init {
        loadCurrentUser()
    }

    private fun loadCurrentUser() {
        screenModelScope.launch {
            currentUserId = tokenManager.getUserId()
        }
    }

    fun loadChat() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.getChats()) {
                is NetworkResult.Success -> {
                    val chat = result.data.find { it.id == chatId }
                    val isAdmin = chat?.participants?.any { 
                        it.userId == currentUserId && it.role == "admin" 
                    } ?: false
                    _state.update {
                        it.copy(
                            chat = chat,
                            isAdmin = isAdmin,
                            currentUserId = currentUserId,
                            isLoading = false
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun uploadAndUpdateGroupPhoto(imageBytes: ByteArray) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }

            val tempFile = com.krieta.com.core.util.FileStreamer.saveTempFile(imageBytes, "group_photo.jpg")

            val uploadResult = uploadApi.uploadImage(
                tempFile,
                CloudinaryFolders.CHAT_GROUP_AVATAR_IMAGES
            )

            when (uploadResult) {
                is NetworkResult.Success -> {
                    when (val result = repository.updateGroupChat(
                        chatId,
                        avatarUrl = uploadResult.data
                    )) {
                        is NetworkResult.Success -> {
                            _state.update {
                                it.copy(
                                    isLoading = false,
                                    chat = result.data,
                                    successMessage = "Photo updated successfully"
                                )
                            }
                        }
                        is NetworkResult.Error -> {
                            _state.update { it.copy(isLoading = false, error = result.message) }
                        }
                        is NetworkResult.Loading -> {}
                    }
                }
                is NetworkResult.Error -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            error = uploadResult.message
                        )
                    }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun updateGroupDetails(name: String, description: String?, avatarUrl: String?) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.updateGroupChat(
                chatId,
                name = name,
                description = description,
                avatarUrl = avatarUrl
            )) {
                is NetworkResult.Success -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            chat = result.data,
                            successMessage = "Group details updated successfully"
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun clearMessages() = _state.update { it.copy(error = null, successMessage = null) }

    fun promoteMember(userId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.manageMember(chatId, userId, "promote")) {
                is NetworkResult.Success -> {
                    loadChat()
                    _state.update {
                        it.copy(
                            isLoading = false,
                            successMessage = "Member promoted to admin"
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun demoteMember(userId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.manageMember(chatId, userId, "demote")) {
                is NetworkResult.Success -> {
                    loadChat()
                    _state.update {
                        it.copy(
                            isLoading = false,
                            successMessage = "Member demoted to member"
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun kickMember(userId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.manageMember(chatId, userId, "kick")) {
                is NetworkResult.Success -> {
                    loadChat()
                    _state.update {
                        it.copy(
                            isLoading = false,
                            successMessage = "Member removed from group"
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun transferOwnership(newOwnerId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.transferOwnership(chatId, newOwnerId)) {
                is NetworkResult.Success -> {
                    loadChat()
                    _state.update {
                        it.copy(
                            isLoading = false,
                            isAdmin = false,
                            successMessage = "Ownership transferred successfully"
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    fun leaveGroup() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.leaveGroup(chatId)) {
                is NetworkResult.Success -> {
                    _state.update {
                        it.copy(
                            isLoading = false,
                            successMessage = "You have left the group"
                        )
                    }
                }
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
