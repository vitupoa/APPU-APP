package com.krieta.com.core.util

actual fun formatString(format: String, vararg args: Any): String {
    return String.format(format, *args)
}
