package com.krieta.com.core.network

import com.krieta.com.BuildConfig

object ApiConstants {
    // Railway backend base URL securely passed via local.properties
    const val BASE_URL = "https://${BuildConfig.RAILWAY_URL}"
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

    // Analytics
    const val ANALYTICS = "$API_VERSION/analytics"

    // Cloudinary folder paths
    object CloudinaryFolders {
        const val PROFILE_PHOTO = "Krieta/profile/photo"
        const val PROFILE_VIDEO = "Krieta/profile/video"
        const val SHORTS_VIDEO = "Krieta/shorts/video"
        const val SHORTS_PHOTO = "Krieta/shorts/photo"
        const val CONTESTS_PHOTO = "Krieta/contests/photo"
        const val CONTESTS_VIDEO = "Krieta/contests/video"
        const val FEED_PHOTO = "Krieta/feed/photo"
        const val SHOP_PHOTO = "Krieta/shop/photo"
        const val CHAT_PHOTO = "Krieta/chat/photo"
        const val CHAT_VIDEO = "Krieta/chat/video"
        const val CHAT_AUDIO = "Krieta/chat/audio"
    }
}
