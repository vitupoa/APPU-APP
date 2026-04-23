package com.krieta.com.core.util

import io.github.vinceglb.filekit.core.PlatformFile

expect object FileStreamer {
    fun getFileSize(filePath: String): Long
    suspend fun readChunk(filePath: String, startByte: Long, length: Int): ByteArray
    fun getFilePathOrUri(file: PlatformFile): String
}
