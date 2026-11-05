package com.runinga.com.core.util

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat.startActivity

class AndroidShareManager(private val context: Context) : ShareManager {
    override suspend fun share(text: String, url: String?) {
        val shareIntent = Intent().apply {
            action = Intent.ACTION_SEND
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, if (url != null) "$text\n$url" else text)
        }
        val chooser = Intent.createChooser(shareIntent, "Share via")
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(chooser)
    }
}
