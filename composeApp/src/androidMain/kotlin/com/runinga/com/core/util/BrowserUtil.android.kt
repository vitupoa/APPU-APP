package com.runinga.com.core.util

import android.content.Context
import android.content.Intent
import android.net.Uri

actual object BrowserUtil {
    private lateinit var context: Context
    
    fun init(context: Context) {
        this.context = context
    }
    
    actual fun openUrl(url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}
