package com.runinga.com.core.util

import android.content.Context
import android.net.Uri
import io.github.vinceglb.filekit.core.PlatformFile
import org.koin.core.component.KoinComponent
import org.koin.core.component.inject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

actual object FileStreamer : KoinComponent {
    private val context: Context by inject()

    actual fun getFileSize(filePath: String): Long {
        val uri = Uri.parse(filePath)
        context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
            val sizeIndex = cursor.getColumnIndex(android.provider.OpenableColumns.SIZE)
            if (cursor.moveToFirst() && sizeIndex != -1) {
                return cursor.getLong(sizeIndex)
            }
        }
        return 0L
    }

    actual suspend fun readChunk(filePath: String, startByte: Long, length: Int): ByteArray = withContext(Dispatchers.IO) {
        val uri = Uri.parse(filePath)
        context.contentResolver.openInputStream(uri)?.use { inputStream ->
            inputStream.skip(startByte)
            val buffer = ByteArray(length)
            var totalRead = 0
            while (totalRead < length) {
                val read = inputStream.read(buffer, totalRead, length - totalRead)
                if (read == -1) break
                totalRead += read
            }
            if (totalRead == length) buffer else buffer.copyOf(totalRead)
        } ?: ByteArray(0)
    }

    actual fun getFilePathOrUri(file: PlatformFile): String {
        return getUri(file)?.toString() ?: ""
    }
    
    actual fun saveTempFile(bytes: ByteArray, fileName: String): String {
        val tempFile = java.io.File(context.cacheDir, fileName)
        tempFile.writeBytes(bytes)
        return tempFile.absolutePath
    }

    private fun getUri(file: PlatformFile): Uri? {
        return try {
            val field = file.javaClass.getDeclaredField("uri")
            field.isAccessible = true
            field.get(file) as? Uri
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
