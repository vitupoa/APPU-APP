package com.krieta.com.core.security

import android.content.Context
import android.os.Build
import android.provider.Settings
import java.io.File

class AndroidDeviceSecurity(private val context: Context) : DeviceSecurity {

    override fun isRooted(): Boolean {
        val rootIndicators = listOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su"
        )
        return rootIndicators.any { File(it).exists() } ||
               Build.TAGS?.contains("test-keys") == true
    }

    override fun isEmulator(): Boolean {
        return Build.FINGERPRINT.startsWith("generic") ||
               Build.FINGERPRINT.startsWith("unknown") ||
               Build.MODEL.contains("google_sdk") ||
               Build.MODEL.contains("Emulator") ||
               Build.MODEL.contains("Android SDK built for x86") ||
               Build.MANUFACTURER.contains("Genymotion") ||
               Build.HARDWARE.contains("goldfish") ||
               Build.HARDWARE.contains("ranchu") ||
               Build.PRODUCT.contains("sdk_gphone") ||
               Build.PRODUCT.contains("emulator") ||
               Build.PRODUCT.contains("simulator")
    }

    override fun isDebuggerAttached(): Boolean {
        return android.os.Debug.isDebuggerConnected()
    }

    override fun getDeviceId(): String {
        return Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: "unknown"
    }
}
