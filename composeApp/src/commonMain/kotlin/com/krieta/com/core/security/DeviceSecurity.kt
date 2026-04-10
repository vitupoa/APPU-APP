package com.krieta.com.core.security

interface DeviceSecurity {
    fun isRooted(): Boolean
    fun isEmulator(): Boolean
    fun isDebuggerAttached(): Boolean
    fun getDeviceId(): String
}
