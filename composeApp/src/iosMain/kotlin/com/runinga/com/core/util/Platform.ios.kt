package com.runinga.com.core.util

import platform.Foundation.NSDate

actual fun currentTimeMillis(): Long = (NSDate().timeIntervalSince1970() * 1000).toLong()
