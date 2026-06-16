package com.krieta.feature.profile.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.CloudinaryUploader
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
    val username: String = "",
    val bio: String = "",
    val avatarUrl: String = "",
    val coverPhotoUrl: String = "",
    val selectedNiches: List<String> = emptyList(),
    val customNiches: List<String> = emptyList(),
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val isUploadingAvatar: Boolean = false,
    val isUploadingBanner: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null
)

class EditProfileViewModel(
    private val repository: ProfileRepository,
    private val cloudinaryUploader: CloudinaryUploader
) : ScreenModel {

    private val _state = MutableStateFlow(EditProfileState())
    val state: StateFlow<EditProfileState> = _state.asStateFlow()

    init { loadProfile() }

    fun onFirstNameChange(v: String) { _state.value = _state.value.copy(firstName = v) }
    fun onLastNameChange(v: String) { _state.value = _state.value.copy(lastName = v) }
    fun onUsernameChange(v: String) { _state.value = _state.value.copy(username = v) }
    fun onBioChange(v: String) { _state.value = _state.value.copy(bio = v) }
    
    fun removeAvatar() {
        _state.value = _state.value.copy(avatarUrl = "")
    }
    
    fun removeBanner() {
        _state.value = _state.value.copy(coverPhotoUrl = "")
    }
    
    fun addNiche(niche: String) {
        val current = _state.value.selectedNiches
        if (!current.contains(niche)) {
            _state.value = _state.value.copy(selectedNiches = current + niche)
        }
    }
    
    fun removeNiche(niche: String) {
        _state.value = _state.value.copy(
            selectedNiches = _state.value.selectedNiches.filter { it != niche },
            customNiches = _state.value.customNiches.filter { it != niche }
        )
    }
    
    fun addCustomNiche(niche: String) {
        val current = _state.value.customNiches
        if (!current.contains(niche) && niche.isNotBlank()) {
            _state.value = _state.value.copy(customNiches = current + niche)
        }
    }

    fun uploadAvatar(filePath: String) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isUploadingAvatar = true, error = null)
            try {
                val url = cloudinaryUploader.uploadImage(filePath, "Krieta/Profile/Images")
                _state.value = _state.value.copy(avatarUrl = url, isUploadingAvatar = false)
            } catch (e: Exception) {
                _state.value = _state.value.copy(isUploadingAvatar = false, error = e.message)
            }
        }
    }

    fun uploadBanner(filePath: String) {
        screenModelScope.launch {
            _state.value = _state.value.copy(isUploadingBanner = true, error = null)
            try {
                val url = cloudinaryUploader.uploadImage(filePath, "Krieta/Profile/Images")
                _state.value = _state.value.copy(coverPhotoUrl = url, isUploadingBanner = false)
            } catch (e: Exception) {
                _state.value = _state.value.copy(isUploadingBanner = false, error = e.message)
            }
        }
    }

    fun save() {
        val s = _state.value
        val p = s.profile ?: return
        screenModelScope.launch {
            _state.value = s.copy(isSaving = true, error = null)
            
            val result = repository.updateProfile(
                firstName = if (s.firstName != p.firstName) s.firstName else null,
                lastName = if (s.lastName != p.lastName) s.lastName else null,
                username = if (s.username != p.username) s.username else null,
                bio = if (s.bio != (p.bio ?: "")) s.bio else null,
                avatarUrl = if (s.avatarUrl != (p.avatarUrl ?: "")) s.avatarUrl.ifEmpty { "" } else null,
                coverPhotoUrl = if (s.coverPhotoUrl != (p.coverPhotoUrl ?: "")) s.coverPhotoUrl.ifEmpty { "" } else null,
                selectedNiches = if (s.selectedNiches != p.selectedNiches) s.selectedNiches else null,
                customNiches = if (s.customNiches != p.customNiches) s.customNiches else null
            )
            when (result) {
                is NetworkResult.Success -> {
                    _state.value = s.copy(isSaving = false, saveSuccess = true, profile = result.data)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = s.copy(isSaving = false, error = result.message)
                }
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
                        username = p.username,
                        bio = p.bio ?: "",
                        avatarUrl = p.avatarUrl ?: "",
                        coverPhotoUrl = p.coverPhotoUrl ?: "",
                        selectedNiches = p.selectedNiches,
                        customNiches = p.customNiches,
                        isLoading = false
                    )
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.value = EditProfileState(isLoading = false, error = result.message)
                }
            }
        }
    }
}
