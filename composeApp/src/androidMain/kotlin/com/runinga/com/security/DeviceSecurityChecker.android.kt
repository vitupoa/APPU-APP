package com.runinga.com.security

import android.content.Context
import android.os.Build
import java.io.File

actual class DeviceSecurityChecker(private val context: Context) {
    
    actual fun checkDeviceSecurity(): DeviceSecurityStatus {
        val threats = mutableListOf<String>()
        var isRooted = false
        var isEmulator = false
        
        // Check for root
        if (checkRootMethod1() || checkRootMethod2() || checkRootMethod3()) {
            isRooted = true
            threats.add("Device is rooted")
        }
        
        // Check for emulator
        if (isEmulatorDetected()) {
            isEmulator = true
            threats.add("Running on emulator")
        }
        
        // Check for dangerous apps
        if (checkDangerousApps()) {
            threats.add("Dangerous apps detected")
        }
        
        // Calculate security score
        val securityScore = calculateSecurityScore(isRooted, isEmulator, threats.size)
        
        return DeviceSecurityStatus(
            isRooted = isRooted,
            isEmulator = isEmulator,
            securityScore = securityScore,
            threats = threats
        )
    }
    
    // Method 1: Check for common root binaries
    private fun checkRootMethod1(): Boolean {
        val paths = arrayOf(
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
        
        return paths.any { File(it).exists() }
    }
    
    // Method 2: Check for root management apps
    private fun checkRootMethod2(): Boolean {
        val packages = arrayOf(
            "com.noshufou.android.su",
            "com.noshufou.android.su.elite",
            "eu.chainfire.supersu",
            "com.koushikdutta.superuser",
            "com.thirdparty.superuser",
            "com.yellowes.su",
            "com.topjohnwu.magisk"
        )
        
        return packages.any { isPackageInstalled(it) }
    }
    
    // Method 3: Check for test-keys (custom ROM indicator)
    private fun checkRootMethod3(): Boolean {
        val buildTags = Build.TAGS
        return buildTags != null && buildTags.contains("test-keys")
    }
    
    // Check if emulator
    private fun isEmulatorDetected(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || "google_sdk" == Build.PRODUCT)
    }
    
    // Check for dangerous apps (Xposed, Frida, etc.)
    private fun checkDangerousApps(): Boolean {
        val dangerousPackages = arrayOf(
            "de.robv.android.xposed.installer",
            "com.saurik.substrate",
            "com.zachspong.temprootremovejb",
            "com.ramdroid.appquarantine"
        )
        
        return dangerousPackages.any { isPackageInstalled(it) }
    }
    
    private fun isPackageInstalled(packageName: String): Boolean {
        return try {
            context.packageManager.getPackageInfo(packageName, 0)
            true
        } catch (e: Exception) {
            false
        }
    }
    
    private fun calculateSecurityScore(isRooted: Boolean, isEmulator: Boolean, threatCount: Int): Int {
        var score = 100
        
        if (isRooted) score -= 50
        if (isEmulator) score -= 20
        score -= (threatCount * 10)
        
        return maxOf(0, score)
    }
}
