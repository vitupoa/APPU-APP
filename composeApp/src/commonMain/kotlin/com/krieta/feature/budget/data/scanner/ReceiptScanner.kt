package com.krieta.feature.budget.data.scanner

expect class ReceiptScanner {
    suspend fun scanReceiptFromUri(uri: String): ReceiptScanResult
    fun release()
}

data class ReceiptScanResult(
    val amount: Double?,
    val merchant: String?,
    val date: String?,
    val items: List<String>
)
