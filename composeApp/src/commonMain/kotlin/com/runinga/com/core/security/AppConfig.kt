package com.runinga.com.core.security

expect object AppConfig {
    val RAILWAY_URL: String
    val TRANSACTION_SIGNING_SECRET: String
}
