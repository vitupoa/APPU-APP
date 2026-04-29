package com.krieta.feature.chama.presentation.payout
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape

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

data class ChamaPayoutScreen(val chamaId: String, val chamaName: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var showRequestDialog by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Payouts - $chamaName") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { showRequestDialog = true },
                    containerColor = KrietaColors.Primary
                ) {
                    Text("+", fontSize = 24.sp, fontWeight = FontWeight.Bold)
                }
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Text(
                        "Pending Payouts",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = KrietaColors.OnSurface
                    )
                }

                // TODO: Load actual payouts from API
                items(emptyList<String>()) { payout ->
                    PayoutCard(payout)
                }
            }
        }

        if (showRequestDialog) {
            RequestPayoutDialog(
                onDismiss = { showRequestDialog = false },
                onConfirm = { recipientId, amount ->
                    // TODO: Request payout
                    showRequestDialog = false
                }
            )
        }
    }
}

@Composable
private fun PayoutCard(payout: String) {
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
                    Text("Recipient Name", fontWeight = FontWeight.Bold)
                    Text("1000 Kr", fontSize = 18.sp, color = KrietaColors.Primary)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(onClick = { /* Approve */ }) {
                        Icon(painterResource(Res.drawable.ic_check), "Approve", tint = KrietaColors.Success)
                    }
                    IconButton(onClick = { /* Reject */ }) {
                        Icon(painterResource(Res.drawable.ic_close), "Reject", tint = KrietaColors.Error)
                    }
                }
            }
            Text("Approvals: 1/2", fontSize = 12.sp, color = KrietaColors.OnSurfaceVariant)
        }
    }
}

@Composable
private fun RequestPayoutDialog(
    onDismiss: () -> Unit,
    onConfirm: (String, Int) -> Unit
) {
    var recipientId by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Request Payout") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = recipientId,
                    onValueChange = { recipientId = it },
                    label = { Text("Recipient ID") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount (Kr)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amountKr = amount.toIntOrNull()
                    if (recipientId.isNotBlank() && amountKr != null) {
                        onConfirm(recipientId, amountKr)
                    }
                }
            ) {
                Text("Request")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
