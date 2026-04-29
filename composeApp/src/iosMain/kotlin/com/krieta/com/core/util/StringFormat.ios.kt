package com.krieta.com.core.util

import platform.Foundation.NSString
import platform.Foundation.create

actual fun formatString(format: String, vararg args: Any): String {
    return when (args.size) {
        0 -> format
        1 -> NSString.create(format = format, args[0])
        2 -> NSString.create(format = format, args[0], args[1])
        3 -> NSString.create(format = format, args[0], args[1], args[2])
        else -> format // Fallback for more args
    }
}
