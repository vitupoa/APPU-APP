package com.runinga.com

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform