package com.krieta.com.core.util

import android.provider.Settings
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import android.content.Context

actual object DeviceFingerprint : KoinComponent {
    private val context: Context by inject()
    
    actual fun getFingerprint(): String {
        return try {
            Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ANDROID_ID
            ) ?: "unknown-android-device"
        } catch (e: Exception) {
            "unknown-android-device"
        }
    }
}
