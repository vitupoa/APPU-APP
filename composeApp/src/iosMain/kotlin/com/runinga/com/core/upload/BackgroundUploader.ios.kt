package com.runinga.com.core.upload

import platform.UIKit.UIApplication
import platform.UIKit.UIBackgroundTaskIdentifier
import platform.UIKit.UIBackgroundTaskInvalid
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.DelicateCoroutinesApi

@OptIn(DelicateCoroutinesApi::class)
actual object BackgroundUploader {
    actual fun enqueueUpload(
        type: UploadType,
        filePath: String,
        caption: String,
        additionalData: Map<String, String>,
        isLocked: Boolean,
        unlockAmountKr: Double?
    ) {
        println("iOS Background Upload Queued for: $filePath")
        
        // 1. Immediately request background execution time to survive suspension
        var taskId: UIBackgroundTaskIdentifier = UIBackgroundTaskInvalid
        taskId = UIApplication.sharedApplication.beginBackgroundTaskWithName("UploadTask") {
            // Expiration handler
            UIApplication.sharedApplication.endBackgroundTask(taskId)
            taskId = UIBackgroundTaskInvalid
        }

        // 2. We can also submit a BGProcessingTaskRequest for reliability if the process dies.
        // However, iOS file streaming and Ktor chunking require process memory. 
        // Thus, the beginBackgroundTask gives us ~3 minutes of immediate execution time.
        
        GlobalScope.launch(Dispatchers.Default) {
            try {
                val success = IosUploadProcessor.processUpload(type, filePath, caption, additionalData, isLocked, unlockAmountKr)
                if (success) {
                    println("iOS Upload Completed Successfully!")
                } else {
                    println("iOS Upload Failed.")
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                if (taskId != UIBackgroundTaskInvalid) {
                    UIApplication.sharedApplication.endBackgroundTask(taskId)
                    taskId = UIBackgroundTaskInvalid
                }
            }
        }
    }
}
