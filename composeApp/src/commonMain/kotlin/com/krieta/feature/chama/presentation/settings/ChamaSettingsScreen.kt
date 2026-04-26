package com.krieta.feature.chama.presentation.settings

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn

import androidx.compose.material.painterResource(Res.drawable.ic_arrow_back)
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors

data class ChamaSettingsScreen(val chamaId: String, val chamaName: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var isLocked by remember { mutableStateOf(false) }
        var autoLockOnFull by remember { mutableStateOf(false) }
        var allowMidTermVoteOut by remember { mutableStateOf(true) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Settings - $chamaName") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text(
                        "Chama Settings",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = KrietaColors.OnSurface
                    )
                }

                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = KrietaColors.BackgroundElevated
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Lock Chama", fontWeight = FontWeight.Bold)
                                    Text(
                                        "Prevent new members from joining",
                                        fontSize = 12.sp,
                                        color = KrietaColors.OnSurfaceVariant
                                    )
                                }
                                Switch(
                                    checked = isLocked,
                                    onCheckedChange = { isLocked = it }
                                )
                            }
                        }
                    }
                }

                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = KrietaColors.BackgroundElevated
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Auto-lock when full", fontWeight = FontWeight.Bold)
                                    Text(
                                        "Lock automatically at max members",
                                        fontSize = 12.sp,
                                        color = KrietaColors.OnSurfaceVariant
                                    )
                                }
                                Switch(
                                    checked = autoLockOnFull,
                                    onCheckedChange = { autoLockOnFull = it }
                                )
                            }
                        }
                    }
                }

                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = KrietaColors.BackgroundElevated
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("Allow mid-term vote-outs", fontWeight = FontWeight.Bold)
                                    Text(
                                        "Members can vote to remove officials",
                                        fontSize = 12.sp,
                                        color = KrietaColors.OnSurfaceVariant
                                    )
                                }
                                Switch(
                                    checked = allowMidTermVoteOut,
                                    onCheckedChange = { allowMidTermVoteOut = it }
                                )
                            }
                        }
                    }
                }

                item {
                    Button(
                        onClick = { /* TODO: Save settings */ },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = KrietaColors.Primary
                        )
                    ) {
                        Text("Save Changes")
                    }
                }

                item {
                    Divider()
                    Text(
                        "Danger Zone",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = KrietaColors.Error
                    )
                }

                item {
                    OutlinedButton(
                        onClick = { /* TODO: Dissolve chama */ },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = KrietaColors.Error
                        )
                    ) {
                        Text("Dissolve Chama")
                    }
                }
            }
        }
    }
}
