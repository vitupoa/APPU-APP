package com.krieta.feature.contentlock.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.krieta.feature.contentlock.domain.ContentType

@Composable
fun LockedContentCard(
    contentId: String,
    contentType: ContentType,
    isLocked: Boolean,
    hasAccess: Boolean,
    unlockAmountKr: Int?,
    requiresSubscription: Boolean,
    requiresUnlock: Boolean,
    creatorName: String,
    userCurrency: String,
    viewModel: ContentLockViewModel,
    onUnlockSuccess: () -> Unit,
    onSubscribe: () -> Unit,
    content: @Composable () -> Unit
) {
    var showUnlockDialog by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxWidth()) {
        content()

        if (isLocked && !hasAccess) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("🔒", style = MaterialTheme.typography.displaySmall)
                        Text("Locked Content", style = MaterialTheme.typography.titleMedium)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { showUnlockDialog = true }) {
                            Text("Unlock")
                        }
                    }
                }
            }
        }
    }

    if (showUnlockDialog) {
        LockedContentOverlay(
            contentId = contentId,
            contentType = contentType,
            unlockAmountKr = unlockAmountKr,
            requiresSubscription = requiresSubscription,
            requiresUnlock = requiresUnlock,
            creatorName = creatorName,
            userCurrency = userCurrency,
            viewModel = viewModel,
            onUnlockSuccess = {
                showUnlockDialog = false
                onUnlockSuccess()
            },
            onSubscribe = onSubscribe,
            onDismiss = { showUnlockDialog = false }
        )
    }
}
