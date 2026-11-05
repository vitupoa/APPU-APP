package com.runinga.com.core.util

import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import android.content.Context
import androidx.core.content.edit
import java.util.UUID

actual object DeviceFingerprint : KoinComponent {
    private val context: Context by inject()
    private const val PREFS_NAME = "device_fingerprint"
    private const val KEY_FINGERPRINT = "fingerprint_id"
    
    actual fun getFingerprint(): String {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.getString(KEY_FINGERPRINT, null) ?: run {
                val newId = UUID.randomUUID().toString()
                prefs.edit { putString(KEY_FINGERPRINT, newId) }
                newId
            }
        } catch (e: Exception) {
            e.printStackTrace()
            UUID.randomUUID().toString()
        }
    }
}
