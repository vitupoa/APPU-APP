package com.runinga.com.core.network

import com.runinga.com.core.security.AppConfig

object ApiConstants {
    // Railway backend base URL securely passed via local.properties
    val BASE_URL = run {
        val railwayUrl = AppConfig.RAILWAY_URL
        println("🔧 Configuring BASE_URL with RAILWAY_URL: $railwayUrl")
        
        when {
            railwayUrl.startsWith("http://") || railwayUrl.startsWith("https://") -> {
                println("✅ Using URL as-is: $railwayUrl")
                railwayUrl
            }
            railwayUrl.contains("10.0.2.2") || railwayUrl.contains("localhost") || railwayUrl.contains("127.0.0.1") -> {
                val url = "http://$railwayUrl"
                println("✅ Local development URL: $url")
                url
            }
            else -> {
                val url = "https://$railwayUrl"
                println("✅ Production URL: $url")
                url
            }
        }
    }
    const val API_VERSION = "/api/v1"

    // Auth
    const val AUTH_REGISTER = "$API_VERSION/auth/register"
    const val AUTH_LOGIN = "$API_VERSION/auth/login"
    const val AUTH_REFRESH = "$API_VERSION/auth/refresh"
    const val AUTH_VERIFY_OTP = "$API_VERSION/auth/verify-otp"
    const val AUTH_LOGOUT = "$API_VERSION/auth/logout"
    const val AUTH_BIOMETRIC = "$API_VERSION/auth/biometric"

    // Wallet
    const val WALLET_BALANCE = "$API_VERSION/wallet/balance"
    const val WALLET_TOPUP_INITIATE = "$API_VERSION/wallet/topup/initiate"
    const val WALLET_WITHDRAW_INITIATE = "$API_VERSION/wallet/withdraw/initiate"
    const val WALLET_TRANSACTIONS = "$API_VERSION/wallet/transactions"
    const val WALLET_TIP = "$API_VERSION/wallet/tip"
    const val WALLET_EXCHANGE_RATE = "$API_VERSION/wallet/exchange-rate"
    const val WALLET_SEARCH_USERS = "$API_VERSION/wallet/search-users"

    // Users / Profile
    const val USERS = "$API_VERSION/users"
    const val USERS_ME = "$API_VERSION/users/me"
    const val USERS_ME_MILESTONES = "$API_VERSION/users/me/milestones"
    const val USERS_ME_SUBSCRIPTION_TIERS = "$API_VERSION/users/me/subscription-tiers"
    const val MILESTONES = "$API_VERSION/milestones"

    // Shorts
    const val SHORTS = "$API_VERSION/shorts"
    const val SHORTS_FEED = "$API_VERSION/shorts/feed"
    const val SHORTS_UPLOAD_SIGNATURE = "$API_VERSION/shorts/upload-signature"
    const val SHORTS_COLLECTIONS = "$API_VERSION/shorts/collections"

    // Feed
    const val FEED = "$API_VERSION/feed"

    // Contests
    const val CONTESTS = "$API_VERSION/contests"
    const val CONTESTS_MY_CONTESTS = "$API_VERSION/contests/my-contests"
    const val CONTESTS_MY_ENTRIES = "$API_VERSION/contests/my-entries"

    // Shop
    const val SHOP_PRODUCTS = "$API_VERSION/shop/products"
    const val SHOP_BASE = "$API_VERSION/shop"

    // Analytics
    const val ANALYTICS = "$API_VERSION/analytics"

    // Chat
    const val CHAT = "$API_VERSION/chat"

    // Stories
    const val STORIES = "$API_VERSION/stories"

    // Chama
    const val CHAMAS = "$API_VERSION/chamas"
    const val CHAMAS_DISCOVER = "$API_VERSION/chamas/discover"
    const val CHAMAS_DEFAULTERS = "$API_VERSION/chamas/defaulters"

    // Cloudinary folder paths
    object CloudinaryFolders {
        const val PROFILE_PHOTO = "Runinga/Profile/Images"
        const val PROFILE_VIDEO = "Runinga/Profile/Videos"
        const val SHORTS_VIDEO = "Runinga/Shorts/Videos"
        const val SHORTS_PHOTO = "Runinga/Shorts/Images"
        const val STORIES_IMAGE = "Runinga/Stories/Images"
        const val STORIES_VIDEO = "Runinga/Stories/Videos"
        const val CONTESTS_PHOTO = "Runinga/Contests/Images"
        const val CONTESTS_VIDEO = "Runinga/Contests/Videos"
        const val FEED_PHOTO = "Runinga/Drips/Images"
        const val SHOP_PHOTO = "Runinga/Shop/Images"
        const val CHAT_PHOTO = "Runinga/Chats/Images"
        const val CHAT_VIDEO = "Runinga/Chats/Videos"
        const val CHAT_AUDIO = "Runinga/Chats/Audio"
        const val CHAMA_RECEIPTS = "Runinga/Chama/Receipts"
    }
}
