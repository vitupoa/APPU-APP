package com.krieta.com.core.security

import kotlinx.cinterop.*
import platform.CoreCrypto.*
import platform.Foundation.NSString
import platform.Foundation.create

@OptIn(ExperimentalForeignApi::class)
actual object HmacSha256 {
    actual fun sign(message: String, secret: String): ByteArray {
        val messageData = message.encodeToByteArray()
        val keyData = secret.encodeToByteArray()
        val result = ByteArray(CC_SHA256_DIGEST_LENGTH)
        
        result.usePinned { resultPinned ->
            messageData.usePinned { messagePinned ->
                keyData.usePinned { keyPinned ->
                    CCHmac(
                        kCCHmacAlgSHA256.toUInt(),
                        keyPinned.addressOf(0),
                        keyData.size.toULong(),
                        messagePinned.addressOf(0),
                        messageData.size.toULong(),
                        resultPinned.addressOf(0)
                    )
                }
            }
        }
        
        return result
    }
}
