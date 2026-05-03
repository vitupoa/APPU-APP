package com.krieta.feature.profile.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll

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
                    val filePath = com.krieta.com.core.util.FileStreamer.getFilePathOrUri(it)
                    viewModel.uploadAvatar(filePath)
                }
            }
        }

        val bannerPicker = rememberFilePickerLauncher(
            type = PickerType.Image,
            mode = PickerMode.Single
        ) { file ->
            file?.let {
                scope.launch {
                    val filePath = com.krieta.com.core.util.FileStreamer.getFilePathOrUri(it)
                    viewModel.uploadBanner(filePath)
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Edit Profile") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
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
                                        painterResource(Res.drawable.ic_lock),
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
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box {
                                    if (state.avatarUrl.isNotEmpty()) {
                                        AsyncImage(
                                            model = state.avatarUrl,
                                            contentDescription = "Avatar",
                                            modifier = Modifier.size(120.dp).clip(CircleShape),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .size(120.dp)
                                                .clip(CircleShape)
                                                .background(MaterialTheme.colorScheme.surfaceVariant),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                painterResource(Res.drawable.ic_person),
                                                contentDescription = "No avatar",
                                                modifier = Modifier.size(60.dp),
                                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                                
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = { avatarPicker.launch() }
                                    ) {
                                        Icon(painterResource(Res.drawable.ic_photo_camera), "Upload", modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(8.dp))
                                        Text(if (state.avatarUrl.isEmpty()) "Add Photo" else "Change")
                                    }
                                    
                                    if (state.avatarUrl.isNotEmpty()) {
                                        OutlinedButton(
                                            onClick = { viewModel.removeAvatar() }
                                        ) {
                                            Icon(painterResource(Res.drawable.ic_delete), "Remove", modifier = Modifier.size(18.dp))
                                            Spacer(Modifier.width(8.dp))
                                            Text("Remove")
                                        }
                                    }
                                }
                            }
                        }

                        if (state.isUploadingAvatar) {
                            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                        }

                        // Banner Image Picker
                        Text("Banner Image", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            if (state.coverPhotoUrl.isNotEmpty()) {
                                AsyncImage(
                                    model = state.coverPhotoUrl,
                                    contentDescription = "Banner",
                                    modifier = Modifier.fillMaxWidth().height(150.dp).clip(RoundedCornerShape(12.dp)),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(150.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(MaterialTheme.colorScheme.surfaceVariant),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        painterResource(Res.drawable.ic_image),
                                        contentDescription = "No banner",
                                        modifier = Modifier.size(48.dp),
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                            
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = { bannerPicker.launch() },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(painterResource(Res.drawable.ic_photo_camera), "Upload", modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text(if (state.coverPhotoUrl.isEmpty()) "Add Banner" else "Change")
                                }
                                
                                if (state.coverPhotoUrl.isNotEmpty()) {
                                    OutlinedButton(
                                        onClick = { viewModel.removeBanner() },
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Icon(painterResource(Res.drawable.ic_delete), "Remove", modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(8.dp))
                                        Text("Remove")
                                    }
                                }
                            }
                        }

                        if (state.isUploadingBanner) {
                            LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                        }
                        
                        // Niches Section
                        Text("Your Niches", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.SemiBold)
                        Text(
                            "Select or add niches that describe your content",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        
                        var showNicheDialog by remember { mutableStateOf(false) }
                        
                        OutlinedButton(
                            onClick = { showNicheDialog = true },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(painterResource(Res.drawable.ic_add), "Add Niche")
                            Spacer(Modifier.width(8.dp))
                            Text("Manage Niches")
                        }
                        
                        if (state.selectedNiches.isNotEmpty() || state.customNiches.isNotEmpty()) {
                            androidx.compose.foundation.layout.FlowRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                (state.selectedNiches + state.customNiches).forEach { niche ->
                                    FilterChip(
                                        selected = true,
                                        onClick = { viewModel.removeNiche(niche) },
                                        label = { Text(niche) },
                                        trailingIcon = {
                                            Icon(
                                                painterResource(Res.drawable.ic_close),
                                                contentDescription = "Remove",
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    )
                                }
                            }
                        }
                        
                        if (showNicheDialog) {
                            NicheSelectionDialog(
                                selectedNiches = state.selectedNiches,
                                customNiches = state.customNiches,
                                onDismiss = { showNicheDialog = false },
                                onNicheSelected = { viewModel.addNiche(it) },
                                onCustomNicheAdded = { viewModel.addCustomNiche(it) }
                            )
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
                { Icon(painterResource(Res.drawable.ic_lock), contentDescription = "Locked", modifier = Modifier.size(18.dp)) }
            } else null,
            shape = RoundedCornerShape(12.dp)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NicheSelectionDialog(
    selectedNiches: List<String>,
    customNiches: List<String>,
    onDismiss: () -> Unit,
    onNicheSelected: (String) -> Unit,
    onCustomNicheAdded: (String) -> Unit
) {
    var customNicheText by remember { mutableStateOf("") }
    val predefinedNiches = listOf(
        "Tech", "Gadgets", "Fashion", "Beauty", "Automotive", "Food & Beverage",
        "Health & Fitness", "Education", "Entertainment", "Gaming", "Travel",
        "Real Estate", "Finance", "Sports", "Music", "Art", "Business",
        "Lifestyle", "Parenting", "Pets", "Home Decor"
    )
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Your Niches") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Predefined Niches", style = MaterialTheme.typography.labelMedium)
                androidx.compose.foundation.layout.FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    predefinedNiches.forEach { niche ->
                        val isSelected = selectedNiches.contains(niche)
                        FilterChip(
                            selected = isSelected,
                            onClick = { if (!isSelected) onNicheSelected(niche) },
                            label = { Text(niche) }
                        )
                    }
                }
                
                Spacer(Modifier.height(8.dp))
                Text("Add Custom Niche", style = MaterialTheme.typography.labelMedium)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = customNicheText,
                        onValueChange = { customNicheText = it },
                        label = { Text("Custom Niche") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    IconButton(
                        onClick = {
                            if (customNicheText.isNotBlank()) {
                                onCustomNicheAdded(customNicheText)
                                customNicheText = ""
                            }
                        }
                    ) {
                        Icon(painterResource(Res.drawable.ic_add), "Add")
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Done")
            }
        }
    )
}