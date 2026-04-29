package com.krieta.com.core.util

actual fun parseColor(hexColor: String): Long {
    return android.graphics.Color.parseColor(hexColor).toLong() and 0xFFFFFFFF
}
