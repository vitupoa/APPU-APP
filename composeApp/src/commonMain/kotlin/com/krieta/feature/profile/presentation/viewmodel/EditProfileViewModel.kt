package com.krieta.feature.profile.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.profile.domain.model.UserProfile
import com.krieta.feature.profile.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class EditProfileState(
    val profile: UserProfile? = null,
    val firstName: String = "",
    val lastName: String = "",
    val displayName: String = "",
    val username: String = "",
    val bio: String = "",
    val avatarUrl: String = "",
    val coverPhotoUrl: String = "",
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null
)

class EditProfileViewModel(
    private val repository: ProfileRepository
) : ScreenModel {

    private val _state = MutableStateFlow(EditProfileState())
    val state: StateFlow<EditProfileState> = _state.asStateFlow()

    init { loadProfile() }

    fun onFirstNameChange(v: String) { _state.value = _state.value.copy(firstName = v) }
    fun onLastNameChange(v: String) { _state.value = _state.value.copy(lastName = v) }
    fun onDisplayNameChange(v: String) { _state.value = _state.value.copy(displayName = v) }
    fun onUsernameChange(v: String) { _state.value = _state.value.copy(username = v) }
    fun onBioChange(v: String) { _state.value = _state.value.copy(bio = v) }
    fun onAvatarUrlChange(v: String) { _state.value = _state.value.copy(avatarUrl = v) }
    fun onCoverPhotoUrlChange(v: String) { _state.value = _state.value.copy(coverPhotoUrl = v) }

    fun save() {
        val s = _state.value
        val p = s.profile ?: return
        screenModelScope.launch {
            _state.value = s.copy(isSaving = true, error = null)
            val result = repository.updateProfile(
                firstName = if (s.firstName != p.firstName) s.firstName else null,
                lastName = if (s.lastName != p.lastName) s.lastName else null,
                displayName = if (s.displayName != p.displayName) s.displayName else null,
                username = if (s.username != p.username) s.username else null,
                bio = if (s.bio != (p.bio ?: "")) s.bio else null,
                avatarUrl = if (s.avatarUrl != (p.avatarUrl ?: "")) s.avatarUrl else null,
                coverPhotoUrl = if (s.coverPhotoUrl != (p.coverPhotoUrl ?: "")) s.coverPhotoUrl else null
            )
            when (result) {
                is NetworkResult.Success -> {
                    _state.value = s.copy(isSaving = false, saveSuccess = true, profile = result.data)
                }
                is NetworkResult.Error -> {
                    _state.value = s.copy(isSaving = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    private fun loadProfile() {
        screenModelScope.launch {
            when (val result = repository.getMyProfile()) {
                is NetworkResult.Success -> {
                    val p = result.data
                    _state.value = EditProfileState(
                        profile = p,
                        firstName = p.firstName,
                        lastName = p.lastName,
                        displayName = p.displayName,
                        username = p.username,
                        bio = p.bio ?: "",
                        avatarUrl = p.avatarUrl ?: "",
                        coverPhotoUrl = p.coverPhotoUrl ?: "",
                        isLoading = false
                    )
                }
                is NetworkResult.Error -> {
                    _state.value = EditProfileState(isLoading = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }
}
