package com.krieta.com.core.upload

import io.github.vinceglb.filekit.core.PlatformFile

enum class UploadType {
    SHORT,
    CONTEST,
    DRIP,
    STORY
}

expect object BackgroundUploader {
    fun enqueueUpload(
        type: UploadType,
        filePath: String,
        caption: String,
        additionalData: Map<String, String> = emptyMap()
    )
}
