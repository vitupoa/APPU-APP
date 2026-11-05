package com.runinga.com.core.util

import io.github.vinceglb.filekit.core.PlatformFile
import platform.Foundation.NSData
import platform.Foundation.NSFileHandle
import platform.Foundation.NSURL
import platform.Foundation.dataWithBytesNoCopy
import platform.Foundation.dataWithContentsOfURL
import platform.Foundation.getBytes
import platform.Foundation.length
import platform.Foundation.fileHandleForReadingFromURL
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.usePinned
import kotlinx.cinterop.ExperimentalForeignApi

@OptIn(ExperimentalForeignApi::class)
actual object FileStreamer {

    actual fun getFileSize(filePath: String): Long {
        if (filePath.isEmpty()) return 0L
        val attr = platform.Foundation.NSFileManager.defaultManager.attributesOfItemAtPath(filePath, null)
        return (attr?.get(platform.Foundation.NSFileSize) as? platform.Foundation.NSNumber)?.longLongValue ?: 0L
    }

    actual suspend fun readChunk(filePath: String, startByte: Long, length: Int): ByteArray {
        if (filePath.isEmpty()) return ByteArray(0)
        
        val url = NSURL.fileURLWithPath(filePath)
        val fileHandle = NSFileHandle.fileHandleForReadingFromURL(url, null) ?: return ByteArray(0)
        
        try {
            fileHandle.seekToFileOffset(startByte.toULong())
            val data = fileHandle.readDataOfLength(length.toULong())
            
            val bytes = ByteArray(data.length.toInt())
            if (bytes.isNotEmpty()) {
                bytes.usePinned { pinned ->
                    data.getBytes(pinned.addressOf(0), data.length)
                }
            }
            return bytes
        } finally {
            fileHandle.closeFile()
        }
    }

    actual fun getFilePathOrUri(file: PlatformFile): String {
        return file.path ?: ""
    }
    
    actual fun saveTempFile(bytes: ByteArray, fileName: String): String {
        val tempDir = platform.Foundation.NSTemporaryDirectory()
        val filePath = "$tempDir$fileName"
        
        bytes.usePinned { pinned ->
            val data = NSData.dataWithBytesNoCopy(
                bytes = pinned.addressOf(0),
                length = bytes.size.toULong(),
                freeWhenDone = false
            )
            data.writeToFile(filePath, atomically = true)
        }
        
        return filePath
    }
}
