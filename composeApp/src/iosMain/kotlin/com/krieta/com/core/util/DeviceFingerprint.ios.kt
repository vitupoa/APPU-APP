package com.krieta.com.core.util

import platform.UIKit.UIDevice

actual object DeviceFingerprint {
    actual fun getFingerprint(): String {
        return UIDevice.currentDevice.identifierForVendor?.UUIDString ?: "unknown-ios-device"
    }
}
