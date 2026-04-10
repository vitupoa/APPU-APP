package com.krieta.com.core.security

import platform.Foundation.NSProcessInfo
import platform.UIKit.UIDevice

class IosDeviceSecurity : DeviceSecurity {

    override fun isRooted(): Boolean {
        // Check for common jailbreak indicators
        val jailbreakPaths = listOf(
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/etc/apt",
            "/private/var/lib/apt/",
            "/usr/bin/ssh"
        )
        return jailbreakPaths.any { path ->
            platform.Foundation.NSFileManager.defaultManager.fileExistsAtPath(path)
        }
    }

    override fun isEmulator(): Boolean {
        val model = UIDevice.currentDevice.model
        return model.contains("Simulator") ||
               NSProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] != null
    }

    override fun isDebuggerAttached(): Boolean {
        // Simplified check — full implementation would use sysctl
        return false
    }

    override fun getDeviceId(): String {
        return UIDevice.currentDevice.identifierForVendor?.UUIDString ?: "unknown"
    }
}
