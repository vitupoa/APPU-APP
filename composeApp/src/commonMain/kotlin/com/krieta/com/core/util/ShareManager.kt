package com.krieta.com.core.util

interface ShareManager {
    suspend fun share(text: String, url: String? = null)
}
