package com.krieta.com.core.util

actual fun parseColor(hexColor: String): Long {
    val hex = hexColor.removePrefix("#")
    return hex.toLongOrNull(16) ?: 0xFF000000
}
