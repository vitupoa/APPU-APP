package com.krieta.feature.profile.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.model.Milestone
import com.krieta.feature.profile.domain.repository.ProfileRepository
import com.krieta.com.core.network.WebSocketService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.intOrNull

data class MilestonesState(
    val milestones: List<Milestone> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

class MilestonesViewModel(
    private val repository: ProfileRepository,
    private val webSocketService: WebSocketService
) : ScreenModel {

    private val _state = MutableStateFlow(MilestonesState())
    val state: StateFlow<MilestonesState> = _state.asStateFlow()

    init { 
        load() 
        webSocketService.connect()
        listenForLiveUpdates()
    }

    private fun listenForLiveUpdates() {
        screenModelScope.launch {
            webSocketService.milestonesFlow.collectLatest { payload ->
                try {
                    val jsonObj = Json.parseToJsonElement(payload).jsonObject
                    val milestoneId = jsonObj["milestoneId"]?.jsonPrimitive?.content ?: return@collectLatest
                    val isCompleted = jsonObj["isCompleted"]?.jsonPrimitive?.booleanOrNull ?: true
                    
                    // Direct Memory Hydration mitigating Rest API Roundtrips!
                    val currentList = _state.value.milestones.toMutableList()
                    val index = currentList.indexOfFirst { it.id == milestoneId }
                    if (index != -1) {
                        val updatedMilestone = currentList[index].copy(isCompleted = isCompleted)
                        currentList[index] = updatedMilestone
                        _state.value = _state.value.copy(milestones = currentList)
                    }
                } catch (e: Exception) {
                    println("WebSocket Parsing failed for milestone: ${e.message}")
                }
            }
        }
    }

    private fun load() {
        screenModelScope.launch {
            when (val result = repository.getMyMilestones()) {
                is NetworkResult.Success -> {
                    _state.value = MilestonesState(milestones = result.data, isLoading = false)
                }
                is NetworkResult.Error -> {
                    _state.value = MilestonesState(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    override fun onDispose() {
        webSocketService.disconnect()
        super.onDispose()
    }
}
