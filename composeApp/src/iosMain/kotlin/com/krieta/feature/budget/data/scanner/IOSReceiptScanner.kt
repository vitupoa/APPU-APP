package com.krieta.feature.budget.data.scanner

import kotlinx.cinterop.*
import platform.CoreGraphics.*
import platform.Foundation.*
import platform.UIKit.*
import platform.Vision.*
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

data class IOSReceiptData(
    val amount: Double?,
    val merchant: String?,
    val date: String?,
    val items: List<String>
)

class IOSReceiptScanner {
    suspend fun scanReceipt(image: UIImage): IOSReceiptData = suspendCoroutine { continuation ->
        val request = VNRecognizeTextRequest { request, error ->
            if (error != null) {
                continuation.resumeWithException(Exception(error.localizedDescription))
                return@VNRecognizeTextRequest
            }
            
            val observations = request.results as? List<VNRecognizedTextObservation> ?: emptyList()
            val lines = observations.mapNotNull { it.topCandidates(1)?.firstOrNull()?.string }
            
            val receiptData = IOSReceiptData(
                amount = extractAmount(lines),
                merchant = extractMerchant(lines),
                date = extractDate(lines),
                items = extractItems(lines)
            )
            
            continuation.resume(receiptData)
        }
        
        request.recognitionLevel = VNRequestTextRecognitionLevelAccurate
        request.usesLanguageCorrection = true
        
        val cgImage = image.CGImage ?: run {
            continuation.resumeWithException(Exception("Failed to get CGImage"))
            return@suspendCoroutine
        }
        
        val handler = VNImageRequestHandler(cgImage, mapOf<Any?, Any?>())
        
        try {
            handler.performRequests(listOf(request), null)
        } catch (e: Exception) {
            continuation.resumeWithException(e)
        }
    }

    private fun extractAmount(lines: List<String>): Double? {
        val amountRegex = Regex("(?:total|amount|sum)[:\\s]*([0-9,]+\\.?[0-9]*)", RegexOption.IGNORE_CASE)
        val numberRegex = Regex("([0-9,]+\\.[0-9]{2})")
        
        // Look for "Total" or "Amount" keywords
        for (line in lines.reversed()) {
            val match = amountRegex.find(line)
            if (match != null) {
                val amountStr = match.groupValues[1].replace(",", "")
                return amountStr.toDoubleOrNull()
            }
        }
        
        // Fallback: find largest number
        var maxAmount = 0.0
        for (line in lines) {
            val matches = numberRegex.findAll(line)
            for (match in matches) {
                val amount = match.groupValues[1].replace(",", "").toDoubleOrNull()
                if (amount != null && amount > maxAmount) {
                    maxAmount = amount
                }
            }
        }
        
        return if (maxAmount > 0) maxAmount else null
    }

    private fun extractMerchant(lines: List<String>): String? {
        return lines.take(3).firstOrNull { 
            it.length > 3 && !it.matches(Regex("[0-9/\\-:]+"))
        }
    }

    private fun extractDate(lines: List<String>): String? {
        val dateRegex = Regex("([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})")
        
        for (line in lines) {
            val match = dateRegex.find(line)
            if (match != null) {
                return match.groupValues[1]
            }
        }
        
        return null
    }

    private fun extractItems(lines: List<String>): List<String> {
        return lines.filter { line ->
            line.length > 3 && 
            line.any { it.isLetter() } && 
            line.any { it.isDigit() } &&
            !line.matches(Regex("^[0-9/\\-:]+$"))
        }.take(10)
    }
}
