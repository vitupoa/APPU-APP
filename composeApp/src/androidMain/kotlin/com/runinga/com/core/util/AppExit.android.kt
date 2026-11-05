package com.runinga.com.core.util

import android.os.Process
import kotlin.system.exitProcess

actual fun exitApp() {
    Process.killProcess(Process.myPid())
    exitProcess(0)
}
