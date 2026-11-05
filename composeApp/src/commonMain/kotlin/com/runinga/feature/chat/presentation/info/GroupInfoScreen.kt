package com.runinga.feature.chat.presentation.info

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.runinga.feature.chat.domain.model.Chat
import com.runinga.feature.chat.domain.model.ChatParticipant
import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import org.koin.core.parameter.parametersOf
import kotlinx.coroutines.runBlocking

class GroupInfoScreen(private val chatId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<GroupInfoViewModel> { parametersOf(chatId) }
        val state by viewModel.state.collectAsState()
        val tokenManager = org.koin.compose.koinInject<com.runinga.com.core.security.TokenManager>()
        val currentUserId = runBlocking { tokenManager.getUserId() }
        
        var showEditDialog by remember { mutableStateOf(false) }
        var showDeleteDialog by remember { mutableStateOf(false) }
        
        val snackbarHostState = remember { SnackbarHostState() }
        LaunchedEffect(state.error, state.successMessage) {
            val msg = state.successMessage ?: state.error
            if (msg != null) {
                snackbarHostState.showSnackbar(msg)
                viewModel.clearMessages()
            }
        }
        
        LaunchedEffect(state.deleteSuccess) {
            if (state.deleteSuccess) {
                navigator.popUntilRoot()
            }
        }

        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                TopAppBar(
                    title = { Text("Group Info", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), contentDescription = "Back")
                        }
                    },
                    actions = {
                        val isCreator = state.chat?.participants?.find { it.userId == currentUserId }?.role == "admin"
                        if (isCreator) {
                            IconButton(onClick = { showEditDialog = true }) {
                                Icon(painterResource(Res.drawable.ic_edit), contentDescription = "Edit")
                            }
                            IconButton(onClick = { showDeleteDialog = true }) {
                                Icon(painterResource(Res.drawable.ic_delete), contentDescription = "Delete", tint = Color(0xFFE74C3C))
                            }
                        }
                    }
                )
            }
        ) { padding ->
            if (state.isLoading && state.chat == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (state.chat != null) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        GroupHeader(state.chat!!)
                    }
                    
                    if (!state.chat!!.description.isNullOrBlank()) {
                        item {
                            DescriptionCard(state.chat!!.description!!)
                        }
                    }
                    
                    item {
                        Text(
                            "Members (${state.chat!!.participants.size})",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    }
                    
                    items(state.chat!!.participants) { participant ->
                        MemberItem(participant)
                    }
                }
            }
        }
        
        if (showEditDialog && state.chat != null) {
            EditGroupDialog(
                chat = state.chat!!,
                onDismiss = { showEditDialog = false },
                onSave = { name, description ->
                    viewModel.updateGroup(name, description)
                    showEditDialog = false
                }
            )
        }
        
        if (showDeleteDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteDialog = false },
                title = { Text("Delete Group?") },
                text = { Text("This action cannot be undone. All messages will be permanently deleted.") },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.deleteGroup()
                            showDeleteDialog = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE74C3C))
                    ) {
                        Text("Delete")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteDialog = false }) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

@Composable
private fun GroupHeader(chat: Chat) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.secondaryContainer),
            contentAlignment = Alignment.Center
        ) {
            if (chat.avatarUrl != null) {
                AsyncImage(
                    model = chat.avatarUrl,
                    contentDescription = "Group Avatar",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Text("👥", fontSize = 48.sp)
            }
        }
        
        Spacer(Modifier.height(16.dp))
        
        Text(
            text = chat.name ?: "Group Chat",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun DescriptionCard(description: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    Icons.Default.Info,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    "Description",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }
            Spacer(Modifier.height(8.dp))
            Text(
                description,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun MemberItem(participant: ChatParticipant) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            if (participant.user?.avatarUrl != null) {
                AsyncImage(
                    model = participant.user.avatarUrl,
                    contentDescription = "Avatar",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Text(
                    participant.user?.displayName?.take(1)?.uppercase() ?: "?",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                participant.user?.displayName ?: "Unknown",
                fontWeight = FontWeight.SemiBold,
                fontSize = 15.sp
            )
            Text(
                "@${participant.user?.username ?: ""}",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        if (participant.role == "admin") {
            Surface(
                color = Color(0xFFFFCC00).copy(alpha = 0.15f),
                shape = RoundedCornerShape(6.dp)
            ) {
                Text(
                    "Admin",
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    color = Color(0xFFFFCC00),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun EditGroupDialog(
    chat: Chat,
    onDismiss: () -> Unit,
    onSave: (name: String, description: String?) -> Unit
) {
    var name by remember { mutableStateOf(chat.name ?: "") }
    var description by remember { mutableStateOf(chat.description ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Group") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Group Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    minLines = 3,
                    maxLines = 5,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
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
