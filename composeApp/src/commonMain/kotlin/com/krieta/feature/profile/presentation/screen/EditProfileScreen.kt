package com.krieta.feature.profile.presentation.screen

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState


import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.feature.profile.presentation.viewmodel.EditProfileViewModel
import io.github.vinceglb.filekit.compose.rememberFilePickerLauncher
import io.github.vinceglb.filekit.core.PickerMode
import io.github.vinceglb.filekit.core.PickerType
import kotlinx.coroutines.launch

class EditProfileScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<EditProfileViewModel>()
        val state by viewModel.state.collectAsState()
        val scope = rememberCoroutineScope()

        LaunchedEffect(state.saveSuccess) {
            if (state.saveSuccess) navigator.pop()
        }

        val avatarPicker = rememberFilePickerLauncher(
            type = PickerType.Image,
            mode = PickerMode.Single
        ) { file ->
            file?.let {
                scope.launch {
                    val bytes = it.readBytes()
                    viewModel.uploadAvatar(bytes)
                }
            }
        }

        val bannerPicker = rememberFilePickerLauncher(
            type = PickerType.Image,
            mode = PickerMode.Single
        ) { file ->
            file?.let {
                scope.launch {
                    val bytes = it.readBytes()
                    viewModel.uploadBanner(bytes)
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Edit Profile") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                        }
                    }
                )
            }
        ) { padding ->
            when {
                state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                else -> {
                    val isLocked = state.profile?.isWalletUnlocked == true

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding)
                            .verticalScroll(rememberScrollState())
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Identity lock banner
                        if (isLocked) {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.Lock,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.error,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(
                                        "Name and username permanently locked for accountability and security",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onErrorContainer
                                    )
                                }
                            }
                        } else {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.tertiaryContainer),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text(
                                    "⚠️ Your name and username will be permanently locked after your wallet is activated",
                                    modifier = Modifier.padding(12.dp),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onTertiaryContainer
                                )
                            }
                        }

                        // Name fields — locked if wallet unlocked
                        LockedTextField(
                            value = state.firstName,
                            onValueChange = { viewModel.onFirstNameChange(it) },
                            label = "First Name",
                            isLocked = isLocked
                        )
                        LockedTextField(
                            value = state.lastName,
                            onValueChange = { viewModel.onLastNameChange(it) },
                            label = "Last Name",
                            isLocked = isLocked
                        )
                        LockedTextField(
                            value = state.displayName,
                            onValueChange = { viewModel.onDisplayNameChange(it) },
                            label = "Display Name",
                            isLocked = isLocked
                        )
                        LockedTextField(
                            value = state.username,
                            onValueChange = { viewModel.onUsernameChange(it) },
                            label = "Username",
                            isLocked = isLocked
                        )

                        // Always editable fields
                        OutlinedTextField(
                            value = state.bio,
                            onValueChange = { viewModel.onBioChange(it) },
                            label = { Text("Bio") },
                            modifier = Modifier.fillMaxWidth(),
                            maxLines = 4,
                            shape = RoundedCornerShape(12.dp)
                        )

                        // Avatar Image Picker
                        Text("Avatar Image", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (state.avatarUrl.isNotEmpty()) {
                                AsyncImage(
                                    model = state.avatarUrl,
                                    contentDescription = "Avatar",
                                    modifier = Modifier.size(80.dp).clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            }
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(
                                    onClick = { avatarPicker.launch() },
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Icon(Icons.Default.PhotoCamera, "Upload")
                                    Spacer(Modifier.width(8.dp))
                                    Text("Upload from Device")
                                }
                            }
                        }

                        if (state.isUploadingAvatar) {
                            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                        }

                        // Banner Image Picker
                        Text("Banner Image", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            if (state.coverPhotoUrl.isNotEmpty()) {
                                AsyncImage(
                                    model = state.coverPhotoUrl,
                                    contentDescription = "Banner",
                                    modifier = Modifier.fillMaxWidth().height(120.dp).clip(RoundedCornerShape(12.dp)),
                                    contentScale = ContentScale.Crop
                                )
                            }
                            Button(
                                onClick = { bannerPicker.launch() },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.PhotoCamera, "Upload")
                                Spacer(Modifier.width(8.dp))
                                Text("Upload from Device")
                            }
                        }

                        if (state.isUploadingBanner) {
                            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                        }

                        // Error
                        state.error?.let {
                            Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                        }

                        Spacer(Modifier.height(8.dp))

                        // Save button
                        Button(
                            onClick = { viewModel.save() },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(12.dp),
                            enabled = !state.isSaving
                        ) {
                            if (state.isSaving) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary)
                            } else {
                                Text("Save Changes", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun LockedTextField(
        value: String,
        onValueChange: (String) -> Unit,
        label: String,
        isLocked: Boolean
    ) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            enabled = !isLocked,
            readOnly = isLocked,
            trailingIcon = if (isLocked) {
                { Icon(Icons.Default.Lock, contentDescription = "Locked", modifier = Modifier.size(18.dp)) }
            } else null,
            shape = RoundedCornerShape(12.dp)
        )
    }
}

