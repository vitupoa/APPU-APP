package com.krieta.feature.chama.presentation.dashboard

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.chama.data.remote.dto.*
import com.krieta.feature.chama.domain.repository.ChamaRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

data class ChamaDashboardState(
    val chama: ChamaDto? = null,
    val transactions: List<ChamaTransactionDto> = emptyList(),
    val activeElections: List<ChamaElectionDto> = emptyList(),
    val cycles: List<ChamaCycleDto> = emptyList(),
    val walletBalance: String = "0",
    val currentUserId: String? = null,
    val isLoading: Boolean = true,
    val isContributing: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val selectedTab: Int = 0 // 0=Overview, 1=Members, 2=Transactions, 3=Elections
)

class ChamaDashboardViewModel(
    private val chamaId: String,
    private val repository: ChamaRepository,
    private val tokenManager: com.krieta.com.core.security.TokenManager,
    private val uploadApi: com.krieta.com.core.upload.UploadApi
) : ScreenModel {

    private val _state = MutableStateFlow(ChamaDashboardState())
    val state = _state.asStateFlow()

    init {
        loadCurrentUser()
        loadChama()
    }

    @OptIn(ExperimentalEncodingApi::class)
    private fun loadCurrentUser() {
        screenModelScope.launch {
            // Decode JWT to get user ID
            val token = tokenManager.getAccessToken()
            if (token != null) {
                try {
                    val payload = token.split(".")[1]
                    val decoded = Json.decodeFromString<JsonObject>(
                        Base64.decode(payload).decodeToString()
                    )
                    val userId = decoded["userId"]?.toString()?.removeSurrounding("\"")
                    _state.update { it.copy(currentUserId = userId) }
                } catch (e: Exception) {
                    println("Error decoding token: ${e.message}")
                }
            }
        }
    }

    fun loadChama() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.getChamaById(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update {
                        it.copy(
                            chama = result.data,
                            walletBalance = result.data.chamaWallet?.krBalance ?: "0",
                            isLoading = false
                        )
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }

    fun loadTransactions(page: Int = 1) {
        screenModelScope.launch {
            when (val result = repository.getTransactions(chamaId, page)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(transactions = result.data.transactions) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = result.message) }
                }
            }
        }
    }

    fun loadCycles() {
        screenModelScope.launch {
            when (val result = repository.getCycles(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(cycles = result.data) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = result.message) }
                }
            }
        }
    }

    fun openCycle() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.openCycle(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isLoading = false, successMessage = "Cycle #${result.data.cycleNumber} opened successfully") }
                    loadCycles()
                    loadChama()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }

    fun disburseCycle(cycleId: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.disburseCycle(chamaId, cycleId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isLoading = false, successMessage = "Cycle disbursed successfully") }
                    loadCycles()
                    loadChama()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }

    fun loadElections() {
        screenModelScope.launch {
            when (val result = repository.getActiveElections(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(activeElections = result.data) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = result.message) }
                }
            }
        }
    }

    fun contribute(amountKr: Double) {
        screenModelScope.launch {
            _state.update { it.copy(isContributing = true) }
            when (val result = repository.contribute(chamaId, amountKr)) {
                is NetworkResult.Success -> {
                    _state.update {
                        it.copy(
                            isContributing = false,
                            successMessage = "Contribution of $amountKr Kr successful!"
                        )
                    }
                    loadChama()
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isContributing = false, error = result.message) }
                }
            }
        }
    }

    fun leaveChama() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.leaveChama(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(isLoading = false, successMessage = "You have left the Chama") }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }

    fun activateChama() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.activateChama(chamaId)) {
                is NetworkResult.Success -> {
                    _state.update {
                        it.copy(isLoading = false, chama = result.data, successMessage = "Chama activated!")
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }

    fun setTab(index: Int) {
        _state.update { it.copy(selectedTab = index) }
        when (index) {
            2 -> if (_state.value.transactions.isEmpty()) loadTransactions()
            3 -> if (_state.value.activeElections.isEmpty()) loadElections()
            4 -> if (_state.value.cycles.isEmpty()) loadCycles()
        }
    }

    fun clearMessages() = _state.update { it.copy(error = null, successMessage = null) }

    fun uploadAndUpdateGroupPhoto(imageBytes: ByteArray) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            // Save to temp file
            val tempFile = com.krieta.com.core.util.FileStreamer.saveTempFile(imageBytes, "group_photo.jpg")
            
            // Upload to Cloudinary using signed upload
            val uploadResult = uploadApi.uploadImage(
                tempFile,
                com.krieta.com.core.upload.CloudinaryFolders.CHAT_GROUP_AVATAR_IMAGES
            )
            
            when (uploadResult) {
                is com.krieta.com.core.network.NetworkResult.Success -> {
                    // Update chama with new photo URL
                    when (val result = repository.updateChama(
                        chamaId,
                        com.krieta.feature.chama.data.remote.dto.UpdateChamaRequest(avatarUrl = uploadResult.data)
                    )) {
                        is NetworkResult.Success -> {
                            _state.update { 
                                it.copy(
                                    isLoading = false, 
                                    chama = result.data,
                                    successMessage = "Photo updated successfully"
                                ) 
                            }
                        }
                        is NetworkResult.Loading -> {}
                        is NetworkResult.Error -> {
                            _state.update { it.copy(isLoading = false, error = result.message) }
                        }
                    }
                }
                is com.krieta.com.core.network.NetworkResult.Error -> {
                    _state.update { 
                        it.copy(
                            isLoading = false,
                            error = uploadResult.message
                        )
                    }
                }
                is com.krieta.com.core.network.NetworkResult.Loading -> {}
            }
        }
    }

    fun updateGroupPhoto(photoUrl: String) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            
            when (val result = repository.updateChama(
                chamaId,
                com.krieta.feature.chama.data.remote.dto.UpdateChamaRequest(avatarUrl = photoUrl)
            )) {
                is NetworkResult.Success -> {
                    _state.update { 
                        it.copy(
                            isLoading = false, 
                            chama = result.data,
                            successMessage = "Photo updated successfully"
                        ) 
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }

    fun deleteGroupPhoto() {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.updateChama(
                chamaId,
                com.krieta.feature.chama.data.remote.dto.UpdateChamaRequest(avatarUrl = null)
            )) {
                is NetworkResult.Success -> {
                    _state.update { 
                        it.copy(
                            isLoading = false,
                            chama = result.data,
                            successMessage = "Photo deleted successfully"
                        ) 
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }

    fun updateChamaDetails(name: String, description: String?, avatarUrl: String?) {
        screenModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            when (val result = repository.updateChama(
                chamaId,
                com.krieta.feature.chama.data.remote.dto.UpdateChamaRequest(
                    name = name,
                    description = description,
                    avatarUrl = avatarUrl
                )
            )) {
                is NetworkResult.Success -> {
                    _state.update { 
                        it.copy(
                            isLoading = false,
                            chama = result.data,
                            successMessage = "Group details updated successfully"
                        ) 
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoading = false, error = result.message) }
                }
            }
        }
    }
}
