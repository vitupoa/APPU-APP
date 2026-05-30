package com.krieta.feature.shop.presentation.component

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.krieta.feature.shop.data.remote.ListingFeeCalculation
import com.krieta.feature.shop.data.remote.UserListingQuota

@Composable
fun ListingFeeDialog(
    feeCalculation: ListingFeeCalculation?,
    quota: UserListingQuota?,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Listing Fee") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (feeCalculation != null) {
                    if (feeCalculation.isFree) {
                        Text(
                            text = "✓ Free Listing",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold
                        )
                        
                        feeCalculation.quotaType?.let { quotaType ->
                            Text(
                                text = "Using ${quotaType} free quota",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    } else {
                        Text(
                            text = "Listing Fee: ${feeCalculation.fee} KR",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        
                        Text(
                            text = "This fee will be deducted from your wallet",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    
                    quota?.let { q ->
                        Text(
                            text = "Your Free Quota",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.SemiBold
                        )
                        
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            QuotaRow("Daily", q.dailyUsed, q.dailyLimit)
                            QuotaRow("Weekly", q.weeklyUsed, q.weeklyLimit)
                            QuotaRow("Monthly", q.monthlyUsed, q.monthlyLimit)
                        }
                    }
                } else {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = feeCalculation != null
            ) {
                Text("Post Product")
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
private fun QuotaRow(label: String, used: Int, limit: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall
        )
        Text(
            text = "$used / $limit",
            style = MaterialTheme.typography.bodySmall,
            fontWeight = FontWeight.Medium,
            color = if (used >= limit) MaterialTheme.colorScheme.error 
                   else MaterialTheme.colorScheme.primary
        )
    }
}
