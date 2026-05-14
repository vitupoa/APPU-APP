package com.krieta.feature.wallet.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.security.MultiSignatureManager
import kotlinx.coroutines.launch
import kotlinx.datetime.Instant
import kotlin.time.Duration.Companion.minutes

data class MultiSigApprovalScreen(
    val transactionId: String
) : Screen {
    
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val scope = rememberCoroutineScope()
        
        // TODO: Inject via Koin
        val multiSigManager = remember { MultiSignatureManager() }
        
        var transaction by remember { mutableStateOf<MultiSignatureManager.PendingTransaction?>(null) }
        var isLoading by remember { mutableStateOf(true) }
        var error by remember { mutableStateOf<String?>(null) }
        
        LaunchedEffect(transactionId) {
            transaction = multiSigManager.getPendingTransaction(transactionId)
            isLoading = false
        }
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Multi-Signature Approval") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                        }
                    }
                )
            }
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                when {
                    isLoading -> {
                        CircularProgressIndicator(
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }
                    transaction == null -> {
                        ErrorState(
                            message = "Transaction not found or expired",
                            onRetry = { navigator.pop() }
                        )
                    }
                    else -> {
                        MultiSigContent(
                            transaction = transaction!!,
                            onCancel = {
                                scope.launch {
                                    // TODO: Get userId from session
                                    multiSigManager.cancelTransaction(transactionId, "userId")
                                    navigator.pop()
                                }
                            },
                            onApprove = {
                                // TODO: Implement approval with biometric + hardware signature
                                scope.launch {
                                    // This would trigger biometric auth and hardware signing
                                    navigator.pop()
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MultiSigContent(
    transaction: MultiSignatureManager.PendingTransaction,
    onCancel: () -> Unit,
    onApprove: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Warning Banner
        item {
            WarningBanner(transaction)
        }
        
        // Transaction Details
        item {
            TransactionDetailsCard(transaction)
        }
        
        // Signature Progress
        item {
            SignatureProgressCard(transaction)
        }
        
        // Existing Signatures
        item {
            ExistingSignaturesCard(transaction)
        }
        
        // Action Buttons
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onCancel,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Cancel")
                }
                Button(
                    onClick = onApprove,
                    modifier = Modifier.weight(1f),
                    enabled = transaction.signatures.size < transaction.requiredSignatures
                ) {
                    Icon(Icons.Default.Fingerprint, null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Approve")
                }
            }
        }
    }
}

@Composable
private fun WarningBanner(transaction: MultiSignatureManager.PendingTransaction) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.Warning,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error,
                modifier = Modifier.size(32.dp)
            )
            Column {
                Text(
                    "High-Value Transaction",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error
                )
                Text(
                    "This transaction requires ${transaction.requiredSignatures} approvals",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }
    }
}

@Composable
private fun TransactionDetailsCard(transaction: MultiSignatureManager.PendingTransaction) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                "Transaction Details",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            DetailRow("Amount", "${transaction.amountKr.toInt()} Kr")
            DetailRow("Provider", transaction.provider.uppercase())
            DetailRow("Account", transaction.accountDetails["account"]?.toString() ?: "N/A")
            DetailRow("Created", formatTimestamp(transaction.createdAt))
            DetailRow("Expires", formatExpiry(transaction.createdAt))
        }
    }
}

@Composable
private fun SignatureProgressCard(transaction: MultiSignatureManager.PendingTransaction) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Approval Progress",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "${transaction.signatures.size}/${transaction.requiredSignatures}",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            LinearProgressIndicator(
                progress = { transaction.signatures.size.toFloat() / transaction.requiredSignatures },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
            )
            
            Text(
                "${transaction.requiredSignatures - transaction.signatures.size} more approval(s) needed",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ExistingSignaturesCard(transaction: MultiSignatureManager.PendingTransaction) {
    if (transaction.signatures.isEmpty()) return
    
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                "Approved By",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            transaction.signatures.forEach { signature ->
                SignatureItem(signature)
            }
        }
    }
}

@Composable
private fun SignatureItem(signature: MultiSignatureManager.TransactionSignature) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                Icons.Default.CheckCircle,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
        }
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                signature.signerName,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            Text(
                formatTimestamp(signature.timestamp),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        Icon(
            Icons.Default.Security,
            contentDescription = "Hardware Signed",
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun ErrorState(message: String, onRetry: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.Error,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            message,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onRetry) {
            Text("Go Back")
        }
    }
}

private fun formatTimestamp(instant: Instant): String {
    // TODO: Format properly with kotlinx-datetime
    return instant.toString().substringBefore('T')
}

private fun formatExpiry(createdAt: Instant): String {
    val expiryTime = createdAt + 30.minutes
    // TODO: Calculate remaining time
    return "30 minutes from creation"
}
