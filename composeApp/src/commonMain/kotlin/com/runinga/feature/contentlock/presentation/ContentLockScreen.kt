package com.runinga.feature.contentlock.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.runinga.feature.contentlock.domain.ContentType

@Composable
fun LockedContentOverlay(
    contentId: String,
    contentType: ContentType,
    unlockAmountKr: Int?,
    requiresSubscription: Boolean,
    requiresUnlock: Boolean,
    creatorName: String,
    userCurrency: String,
    viewModel: ContentLockViewModel,
    onUnlockSuccess: () -> Unit,
    onSubscribe: () -> Unit,
    onDismiss: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val unlockPrice by viewModel.unlockPrice.collectAsState()

    LaunchedEffect(unlockAmountKr, userCurrency) {
        unlockAmountKr?.let {
            viewModel.getUnlockPrice(it, userCurrency)
        }
    }

    LaunchedEffect(uiState) {
        if (uiState is ContentLockUiState.UnlockSuccess) {
            onUnlockSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.85f)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(24.dp),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("🔒", fontSize = 48.sp)
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "This content is locked",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold
                )
                
                Text(
                    text = "by $creatorName",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray
                )
                
                Spacer(modifier = Modifier.height(24.dp))

                if (requiresSubscription) {
                    Button(
                        onClick = onSubscribe,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Subscribe to Unlock")
                    }
                }

                if (requiresSubscription && requiresUnlock) {
                    Text(
                        text = "OR",
                        modifier = Modifier.padding(vertical = 12.dp),
                        color = Color.Gray
                    )
                }

                if (requiresUnlock && unlockPrice != null) {
                    OutlinedButton(
                        onClick = { viewModel.unlockContent(contentId, contentType) },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = uiState !is ContentLockUiState.Loading
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "${unlockPrice!!.krAmount} Rc",
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            Text(
                                text = "(≈ ${unlockPrice!!.fiatAmount} ${unlockPrice!!.currency})",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                if (uiState is ContentLockUiState.Loading) "Unlocking..." else "Unlock Once"
                            )
                        }
                    }
                }

                if (uiState is ContentLockUiState.Error) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = (uiState as ContentLockUiState.Error).message,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                TextButton(onClick = onDismiss) {
                    Text("Cancel")
                }
            }
        }
    }
}
