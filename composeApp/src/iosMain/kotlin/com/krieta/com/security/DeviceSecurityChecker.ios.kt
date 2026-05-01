package com.krieta.com.security

import platform.Foundation.NSFileManager
import platform.UIKit.UIApplication

actual class DeviceSecurityChecker {
    
    actual fun checkDeviceSecurity(): DeviceSecurityStatus {
        val threats = mutableListOf<String>()
        var isRooted = false
        var isEmulator = false
        
        // Check for jailbreak
        if (checkJailbreak()) {
            isRooted = true
            threats.add("Device is jailbroken")
        }
        
        // Check for simulator
        if (isSimulator()) {
            isEmulator = true
            threats.add("Running on simulator")
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
    
    private fun checkJailbreak(): Boolean {
        // Check for common jailbreak files
        val jailbreakPaths = listOf(
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/etc/apt",
            "/private/var/lib/apt/",
            "/Applications/blackra1n.app",
            "/Applications/FakeCarrier.app",
            "/Applications/Icy.app",
            "/Applications/IntelliScreen.app",
            "/Applications/MxTube.app",
            "/Applications/RockApp.app",
            "/Applications/SBSettings.app",
            "/Applications/WinterBoard.app"
        )
        
        return jailbreakPaths.any { 
            NSFileManager.defaultManager.fileExistsAtPath(it)
        }
    }
    
    private fun isSimulator(): Boolean {
        // Check if running on simulator
        return try {
            #if TARGET_OS_SIMULATOR
            true
            #else
            false
            #endif
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
