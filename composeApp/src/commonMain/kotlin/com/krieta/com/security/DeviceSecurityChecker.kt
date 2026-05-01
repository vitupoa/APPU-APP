package com.krieta.com.security

data class DeviceSecurityStatus(
    val isRooted: Boolean,
    val isEmulator: Boolean,
    val securityScore: Int, // 0-100
    val threats: List<String>
)

expect class DeviceSecurityChecker {
    fun checkDeviceSecurity(): DeviceSecurityStatus
}
