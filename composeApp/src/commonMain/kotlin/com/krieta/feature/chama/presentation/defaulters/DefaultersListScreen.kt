package com.krieta.feature.chama.presentation.defaulters
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape
import cafe.adriel.voyager.koin.koinScreenModel

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors

class DefaultersListScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<DefaultersViewModel>()
        val state by viewModel.state.collectAsState()

        LaunchedEffect(state.error) {
            state.error?.let {
                viewModel.clearError()
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("List of Shame") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    },
                    actions = {
                        IconButton(onClick = { viewModel.refresh() }) {
                            Icon(Icons.Filled.Refresh, "Refresh")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            }
        ) { padding ->
            if (state.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = KrietaColors.Error.copy(alpha = 0.1f)
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(painterResource(Res.drawable.ic_warning),
                                    contentDescription = null,
                                    tint = KrietaColors.Error
                                )
                                Column {
                                    Text(
                                        "Public Defaulter Registry",
                                        fontWeight = FontWeight.Bold,
                                        color = KrietaColors.Error
                                    )
                                    Text(
                                        "Members who failed to meet their Chama obligations",
                                        fontSize = 12.sp,
                                        color = KrietaColors.OnSurfaceVariant
                                    )
                                }
                            }
                        }
                    }

                    if (state.defaulters.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 48.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        "🎉",
                                        fontSize = 48.sp
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    Text(
                                        "No defaulters found!",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        "All members are in good standing",
                                        fontSize = 14.sp,
                                        color = KrietaColors.OnSurfaceVariant
                                    )
                                }
                            }
                        }
                    } else {
                        items(state.defaulters) { defaulter ->
                            DefaulterCard(
                                defaulter = defaulter,
                                onResolve = { viewModel.resolveDefault(defaulter.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DefaulterCard(
    defaulter: com.krieta.feature.chama.data.remote.dto.ChamaDefaulterDto,
    onResolve: () -> Unit
) {
    var showResolveDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = KrietaColors.BackgroundElevated
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .then(Modifier)
            )

            Column(modifier = Modifier.weight(1f)) {
                Text(defaulter.user?.displayName ?: "Unknown User", fontWeight = FontWeight.Bold)
                Text(
                    defaulter.chamaName,
                    fontSize = 12.sp,
                    color = KrietaColors.OnSurfaceVariant
                )
                Text(
                    "Owes: ${defaulter.amountOwedKr} Kr",
                    fontSize = 14.sp,
                    color = KrietaColors.Error,
                    fontWeight = FontWeight.Bold
                )
                if (defaulter.fineAmountKr.toDoubleOrNull() ?: 0.0 > 0) {
                    Text(
                        "Fine: ${defaulter.fineAmountKr} Kr",
                        fontSize = 12.sp,
                        color = KrietaColors.Error
                    )
                }
            }

            if (!defaulter.isResolved) {
                IconButton(onClick = { showResolveDialog = true }) {
                    Icon(
                        painterResource(Res.drawable.ic_check),
                        contentDescription = "Resolve",
                        tint = KrietaColors.Primary
                    )
                }
            } else {
                Icon(
                    painterResource(Res.drawable.ic_check),
                    contentDescription = "Resolved",
                    tint = KrietaColors.Success
                )
            }
        }
    }

    if (showResolveDialog) {
        AlertDialog(
            onDismissRequest = { showResolveDialog = false },
            title = { Text("Resolve Default") },
            text = { Text("Mark this default as resolved? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        onResolve()
                        showResolveDialog = false
                    }
                ) {
                    Text("Resolve")
                }
            },
            dismissButton = {
                TextButton(onClick = { showResolveDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
