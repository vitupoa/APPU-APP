package com.krieta.feature.budget.data.scanner

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlinx.coroutines.tasks.await
import java.util.regex.Pattern

data class ReceiptData(
    val amount: Double?,
    val merchant: String?,
    val date: String?,
    val items: List<String>
)

class AndroidReceiptScanner(private val context: Context) {
    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    suspend fun scanReceipt(uri: Uri): ReceiptData {
        val image = InputImage.fromFilePath(context, uri)
        val result = recognizer.process(image).await()
        
        val text = result.text
        val lines = result.textBlocks.flatMap { it.lines }.map { it.text }
        
        return ReceiptData(
            amount = extractAmount(lines),
            merchant = extractMerchant(lines),
            date = extractDate(lines),
            items = extractItems(lines)
        )
    }

    suspend fun scanReceipt(bitmap: Bitmap): ReceiptData {
        val image = InputImage.fromBitmap(bitmap, 0)
        val result = recognizer.process(image).await()
        
        val lines = result.textBlocks.flatMap { it.lines }.map { it.text }
        
        return ReceiptData(
            amount = extractAmount(lines),
            merchant = extractMerchant(lines),
            date = extractDate(lines),
            items = extractItems(lines)
        )
    }

    private fun extractAmount(lines: List<String>): Double? {
        val amountPattern = Pattern.compile("(?:total|amount|sum)[:\\s]*([0-9,]+\\.?[0-9]*)", Pattern.CASE_INSENSITIVE)
        val numberPattern = Pattern.compile("([0-9,]+\\.[0-9]{2})")
        
        // Look for "Total" or "Amount" keywords
        for (line in lines.reversed()) {
            val matcher = amountPattern.matcher(line)
            if (matcher.find()) {
                val amountStr = matcher.group(1)?.replace(",", "")
                return amountStr?.toDoubleOrNull()
            }
        }
        
        // Fallback: find largest number
        var maxAmount = 0.0
        for (line in lines) {
            val matcher = numberPattern.matcher(line)
            while (matcher.find()) {
                val amount = matcher.group(1)?.replace(",", "")?.toDoubleOrNull()
                if (amount != null && amount > maxAmount) {
                    maxAmount = amount
                }
            }
        }
        
        return if (maxAmount > 0) maxAmount else null
    }

    private fun extractMerchant(lines: List<String>): String? {
        // Usually the merchant name is in the first few lines
        return lines.take(3).firstOrNull { it.length > 3 && !it.matches(Regex("[0-9/\\-:]+")) }
    }

    private fun extractDate(lines: List<String>): String? {
        val datePattern = Pattern.compile("([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})")
        
        for (line in lines) {
            val matcher = datePattern.matcher(line)
            if (matcher.find()) {
                return matcher.group(1)
            }
        }
        
        return null
    }

    private fun extractItems(lines: List<String>): List<String> {
        // Extract lines that look like items (contain text and numbers)
        return lines.filter { line ->
            line.length > 3 && 
            line.any { it.isLetter() } && 
            line.any { it.isDigit() } &&
            !line.matches(Regex("^[0-9/\\-:]+$"))
        }.take(10)
    }

    fun release() {
        recognizer.close()
    }
}
