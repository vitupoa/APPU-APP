package com.krieta.feature.profile.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.com.core.util.currentTimeMillis
import com.krieta.feature.profile.domain.model.BioLink
import com.krieta.feature.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class BioLinksState(
    val links: List<BioLink> = emptyList(),
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val error: String? = null
)

class BioLinksViewModel(
    private val repository: ProfileRepository
) : ScreenModel {

    private val _state = MutableStateFlow(BioLinksState())
    val state: StateFlow<BioLinksState> = _state.asStateFlow()

    init { load() }

    private fun load() {
        screenModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            when (val result = repository.getMyProfile()) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(
                        links = result.data.bioLinks,
                        isLoading = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isLoading = false, error = result.message)
                }
            }
        }
    }

    fun addLink(label: String, url: String) {
        val newLink = BioLink(
            id = "temp_${currentTimeMillis()}",
            label = label,
            url = url,
            icon = null,
            sortOrder = _state.value.links.size
        )
        val updated = _state.value.links + newLink
        _state.value = _state.value.copy(links = updated)
        saveLinks(updated)
    }

    fun deleteLink(id: String) {
        val updated = _state.value.links.filter { it.id != id }
        _state.value = _state.value.copy(links = updated)
        saveLinks(updated)
    }

    private fun saveLinks(links: List<BioLink>) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isSaving = true)
            when (val result = repository.updateBioLinks(links)) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(links = result.data, isSaving = false)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isSaving = false, error = result.message)
                }
            }
        }
    }
}
