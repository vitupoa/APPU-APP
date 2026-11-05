package com.runinga.com.core.util

import io.github.vinceglb.filekit.core.PlatformFile

expect object FileStreamer {
    fun getFileSize(filePath: String): Long
    suspend fun readChunk(filePath: String, startByte: Long, length: Int): ByteArray
    fun getFilePathOrUri(file: PlatformFile): String
    fun saveTempFile(bytes: ByteArray, fileName: String): String
}
