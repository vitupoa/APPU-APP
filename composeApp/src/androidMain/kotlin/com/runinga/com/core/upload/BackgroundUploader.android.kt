package com.runinga.com.core.upload

import android.content.Context
import androidx.work.*
import io.github.vinceglb.filekit.core.PlatformFile
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject

actual object BackgroundUploader : KoinComponent {
    private val context: Context by inject()

    actual fun enqueueUpload(
        type: UploadType,
        filePath: String,
        caption: String,
        additionalData: Map<String, String>,
        isLocked: Boolean,
        unlockAmountKr: Double?
    ) {
        val inputDataBuilder = Data.Builder()
            .putString("UPLOAD_TYPE", type.name)
            .putString("FILE_PATH", filePath)
            .putString("CAPTION", caption)
            .putBoolean("IS_LOCKED", isLocked)
            
        unlockAmountKr?.let {
            inputDataBuilder.putDouble("UNLOCK_AMOUNT_KR", it)
        }
            
        additionalData.forEach { (key, value) ->
            inputDataBuilder.putString(key, value)
        }
            
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
            
        val uploadWorkRequest = OneTimeWorkRequestBuilder<UploadWorker>()
            .setConstraints(constraints)
            .setInputData(inputDataBuilder.build())
            .build()
            
        WorkManager.getInstance(context).enqueue(uploadWorkRequest)
    }
}
