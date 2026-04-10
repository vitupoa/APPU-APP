package com.krieta.com

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform