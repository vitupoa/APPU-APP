package com.krieta.com.core.security

import com.krieta.com.BuildConfig

actual object AppConfig {
    actual val RAILWAY_URL: String = BuildConfig.RAILWAY_URL
    actual val TRANSACTION_SIGNING_SECRET: String = BuildConfig.TRANSACTION_SIGNING_SECRET
}
