package com.krieta.com.core.security

import com.krieta.com.BuildConfig

actual object SecureConfig {
    actual val TRANSACTION_SIGNING_SECRET: String = BuildConfig.TRANSACTION_SIGNING_SECRET
}
