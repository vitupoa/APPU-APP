package com.krieta.com.core.network

import io.ktor.client.request.forms.MultiPartFormDataContent
import io.ktor.client.request.forms.formData
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import io.ktor.utils.io.core.readBytes
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val fileBytes = ByteArray(10)
    val content = MultiPartFormDataContent(
        formData {
            append("api_key", "12345")
            append("file", fileBytes, Headers.build {
                append(HttpHeaders.ContentType, "image/jpeg")
                append(HttpHeaders.ContentDisposition, "form-data; name=\"file\"; filename=\"upload.jpg\"")
            })
        }
    )
    
    val bytes = content.readFrom().readBytes()
    println(String(bytes))
}
