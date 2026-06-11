package com.krieta.com.core.util

import platform.UIKit.UIActivityViewController
import platform.UIKit.UIApplication
import platform.Foundation.NSURL

class IosShareManager : ShareManager {
    override suspend fun share(text: String, url: String?) {
        val itemsToShare = mutableListOf<Any>()
        itemsToShare.add(text)
        url?.let { itemsToShare.add(NSURL.URLWithString(it)!!) }
        
        val activityViewController = UIActivityViewController(
            activityItems = itemsToShare,
            applicationActivities = null
        )
        
        UIApplication.sharedApplication.keyWindow?.rootViewController?.presentViewController(
            activityViewController,
            animated = true,
            completion = null
        )
    }
}
