package com.krieta.com.core.util

import co.touchlab.kermit.Logger

/**
 * Safe conversion utilities with comprehensive error handling and logging
 */
object SafeConversion {
    private val logger = Logger.withTag("SafeConversion")

    /**
     * Safely converts String to Double with error handling and logging
     * @param value String to convert
     * @param fieldName Name of the field for logging
     * @param defaultValue Default value if conversion fails
     * @return Converted Double or default value
     */
    fun toDoubleOrDefault(
        value: String,
        fieldName: String,
        defaultValue: Double = 0.0
    ): Double {
        return value.toDoubleOrNull() ?: run {
            logger.w { "Failed to convert '$fieldName' to Double. Input: '$value'. Using default: $defaultValue" }
            defaultValue
        }
    }

    /**
     * Safely converts String to Double with validation
     * @param value String to convert
     * @param fieldName Name of the field for logging
     * @param min Minimum allowed value
     * @param max Maximum allowed value
     * @param defaultValue Default value if conversion fails
     * @return Converted and validated Double or default value
     */
    fun toDoubleOrDefaultWithValidation(
        value: String,
        fieldName: String,
        min: Double = 0.0,
        max: Double = Double.MAX_VALUE,
        defaultValue: Double = 0.0
    ): Double {
        val converted = value.toDoubleOrNull()
        
        return when {
            converted == null -> {
                logger.w { "Failed to convert '$fieldName' to Double. Input: '$value'. Using default: $defaultValue" }
                defaultValue
            }
            converted < min -> {
                logger.w { "'$fieldName' value $converted is below minimum $min. Using minimum." }
                min
            }
            converted > max -> {
                logger.w { "'$fieldName' value $converted exceeds maximum $max. Using maximum." }
                max
            }
            else -> converted
        }
    }

    /**
     * Safely converts String to Int with error handling
     */
    fun toIntOrDefault(
        value: String,
        fieldName: String,
        defaultValue: Int = 0
    ): Int {
        return value.toIntOrNull() ?: run {
            logger.w { "Failed to convert '$fieldName' to Int. Input: '$value'. Using default: $defaultValue" }
            defaultValue
        }
    }
}
