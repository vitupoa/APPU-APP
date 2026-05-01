package com.krieta.feature.chat.presentation.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.com.core.util.ImagePicker
import com.krieta.feature.chat.domain.model.ChatParticipant
import org.koin.core.parameter.parametersOf

data class GroupSettingsScreen(val chatId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val viewModel = koinScreenModel<GroupSettingsViewModel> { parametersOf(chatId) }
        val state by viewModel.state.collectAsState()
        val navigator = LocalNavigator.currentOrThrow

        var showEditDialog by remember { mutableStateOf(false) }
        var showMemberOptions by remember { mutableStateOf<ChatParticipant?>(null) }
        var showTransferOwnership by remember { mutableStateOf(false) }
        var showLeaveConfirm by remember { mutableStateOf(false) }
        val imagePicker = remember { ImagePicker() }
        
        imagePicker.registerPicker { imageBytes ->
            viewModel.uploadAndUpdateGroupPhoto(imageBytes)
        }

        LaunchedEffect(Unit) {
            viewModel.loadChat()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Group Settings") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, "Back")
                        }
                    },
                    actions = {
                        if (state.isAdmin) {
                            IconButton(onClick = { showEditDialog = true }) {
                                Icon(Icons.Default.Edit, "Edit")
                            }
                        }
                    }
                )
            }
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
                if (state.isLoading) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(16.dp)
                    ) {
                        // Group Photo
                        item {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Box(
                                    modifier = Modifier.size(120.dp).clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.surfaceVariant)
                                        .clickable(enabled = state.isAdmin) {
                                            imagePicker.pickImage()
                                        }
                                ) {
                                    if (state.chat?.avatarUrl != null) {
                                        AsyncImage(
                                            model = state.chat?.avatarUrl,
                                            contentDescription = "Group Photo",
                                            modifier = Modifier.fillMaxSize(),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        Icon(
                                            Icons.Default.Group,
                                            contentDescription = null,
                                            modifier = Modifier.size(60.dp).align(Alignment.Center),
                                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    if (state.isAdmin) {
                                        Icon(
                                            Icons.Default.CameraAlt,
                                            contentDescription = "Change Photo",
                                            modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp)
                                                .background(MaterialTheme.colorScheme.primary, CircleShape)
                                                .padding(4.dp),
                                            tint = MaterialTheme.colorScheme.onPrimary
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                Text(
                                    text = state.chat?.name ?: "Group",
                                    style = MaterialTheme.typography.headlineSmall
                                )

                                if (state.chat?.description != null) {
                                    Text(
                                        text = state.chat?.description ?: "",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                Spacer(modifier = Modifier.height(24.dp))
                            }
                        }

                        // Members Section
                        item {
                            Text(
                                text = "${state.chat?.participants?.size ?: 0} members",
                                style = MaterialTheme.typography.titleMedium,
                                modifier = Modifier.padding(vertical = 8.dp)
                            )
                        }

                        // Member List
                        items(state.chat?.participants ?: emptyList()) { participant ->
                            MemberListItem(
                                participant = participant,
                                isCurrentUserAdmin = state.isAdmin,
                                isOwner = participant.role == "admin",
                                onClick = {
                                    if (state.isAdmin && participant.userId != state.currentUserId) {
                                        showMemberOptions = participant
                                    }
                                }
                            )
                        }

                        // Actions Section
                        if (state.isAdmin) {
                            item {
                                Spacer(modifier = Modifier.height(24.dp))
                                Text(
                                    text = "Admin Actions",
                                    style = MaterialTheme.typography.titleMedium,
                                    modifier = Modifier.padding(vertical = 8.dp)
                                )
                            }

                            item {
                                ListItem(
                                    headlineContent = { Text("Transfer Ownership") },
                                    leadingContent = {
                                        Icon(Icons.Default.SwapHoriz, "Transfer")
                                    },
                                    modifier = Modifier.clickable { showTransferOwnership = true }
                                )
                            }
                        }

                        item {
                            Spacer(modifier = Modifier.height(24.dp))
                            ListItem(
                                headlineContent = { Text("Leave Group", color = MaterialTheme.colorScheme.error) },
                                leadingContent = {
                                    Icon(Icons.Default.ExitToApp, "Leave", tint = MaterialTheme.colorScheme.error)
                                },
                                modifier = Modifier.clickable { showLeaveConfirm = true }
                            )
                        }
                    }
                }

                state.error?.let { error ->
                    Snackbar(
                        modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp)
                    ) {
                        Text(error)
                    }
                    LaunchedEffect(error) {
                        kotlinx.coroutines.delay(3000)
                        viewModel.clearMessages()
                    }
                }

                state.successMessage?.let { message ->
                    Snackbar(
                        modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp),
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    ) {
                        Text(message)
                    }
                    LaunchedEffect(message) {
                        kotlinx.coroutines.delay(2000)
                        viewModel.clearMessages()
                    }
                }
            }
        }

        if (showEditDialog) {
            EditGroupDialog(
                currentName = state.chat?.name ?: "",
                currentDescription = state.chat?.description,
                onDismiss = { showEditDialog = false },
                onSave = { name, description ->
                    viewModel.updateGroupDetails(name, description, state.chat?.avatarUrl)
                    showEditDialog = false
                }
            )
        }

        showMemberOptions?.let { member ->
            MemberOptionsDialog(
                member = member,
                onDismiss = { showMemberOptions = null },
                onPromote = {
                    viewModel.promoteMember(member.userId)
                    showMemberOptions = null
                },
                onDemote = {
                    viewModel.demoteMember(member.userId)
                    showMemberOptions = null
                },
                onKick = {
                    viewModel.kickMember(member.userId)
                    showMemberOptions = null
                }
            )
        }

        if (showTransferOwnership) {
            TransferOwnershipDialog(
                members = state.chat?.participants?.filter { it.userId != state.currentUserId } ?: emptyList(),
                onDismiss = { showTransferOwnership = false },
                onTransfer = { newOwnerId ->
                    viewModel.transferOwnership(newOwnerId)
                    showTransferOwnership = false
                }
            )
        }

        if (showLeaveConfirm) {
            AlertDialog(
                onDismissRequest = { showLeaveConfirm = false },
                title = { Text("Leave Group?") },
                text = { Text("Are you sure you want to leave this group?") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            viewModel.leaveGroup()
                            showLeaveConfirm = false
                            navigator.pop()
                        }
                    ) {
                        Text("Leave", color = MaterialTheme.colorScheme.error)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showLeaveConfirm = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
fun MemberListItem(
    participant: ChatParticipant,
    isCurrentUserAdmin: Boolean,
    isOwner: Boolean,
    onClick: () -> Unit
) {
    ListItem(
        headlineContent = { Text(participant.user?.displayName ?: "Unknown") },
        supportingContent = {
            Text(
                text = if (isOwner) "Admin" else "Member",
                style = MaterialTheme.typography.bodySmall
            )
        },
        leadingContent = {
            Box(
                modifier = Modifier.size(40.dp).clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
            ) {
                if (participant.user?.avatarUrl != null) {
                    AsyncImage(
                        model = participant.user?.avatarUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(24.dp).align(Alignment.Center)
                    )
                }
            }
        },
        trailingContent = {
            if (isOwner) {
                Icon(Icons.Default.Star, "Admin", tint = MaterialTheme.colorScheme.primary)
            }
        },
        modifier = Modifier.clickable(enabled = isCurrentUserAdmin) { onClick() }
    )
}

@Composable
fun MemberOptionsDialog(
    member: ChatParticipant,
    onDismiss: () -> Unit,
    onPromote: () -> Unit,
    onDemote: () -> Unit,
    onKick: () -> Unit
) {
    val isAdmin = member.role == "admin"

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(member.user?.displayName ?: "Unknown") },
        text = {
            Column {
                if (!isAdmin) {
                    TextButton(
                        onClick = onPromote,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.Star, "Promote")
                        Spacer(Modifier.width(8.dp))
                        Text("Promote to Admin")
                    }
                } else {
                    TextButton(
                        onClick = onDemote,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.StarBorder, "Demote")
                        Spacer(Modifier.width(8.dp))
                        Text("Demote to Member")
                    }
                }

                TextButton(
                    onClick = onKick,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.PersonRemove, "Kick", tint = MaterialTheme.colorScheme.error)
                    Spacer(Modifier.width(8.dp))
                    Text("Remove from Group", color = MaterialTheme.colorScheme.error)
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun TransferOwnershipDialog(
    members: List<ChatParticipant>,
    onDismiss: () -> Unit,
    onTransfer: (String) -> Unit
) {
    var selectedMember by remember { mutableStateOf<ChatParticipant?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Transfer Ownership") },
        text = {
            Column {
                Text(
                    "Select a member to transfer group ownership to:",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                members.forEach { member ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedMember = member }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedMember == member,
                            onClick = { selectedMember = member }
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(member.user?.displayName ?: "Unknown")
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { selectedMember?.let { onTransfer(it.userId) } },
                enabled = selectedMember != null
            ) {
                Text("Transfer")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun EditGroupDialog(
    currentName: String,
    currentDescription: String?,
    onDismiss: () -> Unit,
    onSave: (String, String?) -> Unit
) {
    var name by remember { mutableStateOf(currentName) }
    var description by remember { mutableStateOf(currentDescription ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Group") },
        text = {
            Column {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Group Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSave(name, description.ifBlank { null }) },
                enabled = name.isNotBlank()
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
