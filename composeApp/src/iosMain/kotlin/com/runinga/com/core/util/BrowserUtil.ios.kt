package com.runinga.com.core.util

import platform.Foundation.NSURL
import platform.UIKit.UIApplication

actual object BrowserUtil {
    actual fun openUrl(url: String) {
        val nsUrl = NSURL.URLWithString(url)
        if (nsUrl != null && UIApplication.sharedApplication.canOpenURL(nsUrl)) {
            UIApplication.sharedApplication.openURL(nsUrl)
        }
    }
}
