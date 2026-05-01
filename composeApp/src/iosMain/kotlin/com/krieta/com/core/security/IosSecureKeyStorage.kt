package com.krieta.com.core.security

import kotlinx.cinterop.*
import platform.CoreFoundation.*
import platform.Foundation.*
import platform.Security.*
import platform.LocalAuthentication.*

@OptIn(ExperimentalForeignApi::class)
class IosSecureKeyStorage : SecureKeyStorage {

    override fun isHardwareBackedSecurityAvailable(): Boolean {
        // Check if Secure Enclave is available (iPhone 5s and later)
        val context = LAContext()
        return context.canEvaluatePolicy(LAPolicyDeviceOwnerAuthentication, error = null)
    }

    override suspend fun generateKeyPair(alias: String, requireBiometric: Boolean): Boolean {
        return memScoped {
            try {
                val accessControl = if (requireBiometric) {
                    SecAccessControlCreateWithFlags(
                        kCFAllocatorDefault,
                        kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                        kSecAccessControlBiometryCurrentSet or kSecAccessControlPrivateKeyUsage,
                        null
                    )
                } else {
                    SecAccessControlCreateWithFlags(
                        kCFAllocatorDefault,
                        kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                        kSecAccessControlPrivateKeyUsage,
                        null
                    )
                } ?: return@memScoped false

                val attributes = CFDictionaryCreateMutable(
                    kCFAllocatorDefault,
                    0,
                    null,
                    null
                )

                // Key type: ECC (Elliptic Curve Cryptography) for Secure Enclave
                CFDictionarySetValue(attributes, kSecAttrKeyType, kSecAttrKeyTypeECSECPrimeRandom)
                CFDictionarySetValue(attributes, kSecAttrKeySizeInBits, CFNumberCreate(kCFAllocatorDefault, kCFNumberIntType, cValuesOf(256).ptr))
                CFDictionarySetValue(attributes, kSecAttrTokenID, kSecAttrTokenIDSecureEnclave)
                
                val privateKeyAttrs = CFDictionaryCreateMutable(kCFAllocatorDefault, 0, null, null)
                CFDictionarySetValue(privateKeyAttrs, kSecAttrIsPermanent, kCFBooleanTrue)
                CFDictionarySetValue(privateKeyAttrs, kSecAttrApplicationTag, (alias as NSString).dataUsingEncoding(NSUTF8StringEncoding))
                CFDictionarySetValue(privateKeyAttrs, kSecAttrAccessControl, accessControl)
                
                CFDictionarySetValue(attributes, kSecPrivateKeyAttrs, privateKeyAttrs)

                val error = alloc<CFErrorRefVar>()
                val privateKey = SecKeyCreateRandomKey(attributes, error.ptr)

                if (privateKey == null) {
                    println("Failed to generate key: ${error.value}")
                    return@memScoped false
                }

                CFRelease(privateKey)
                CFRelease(attributes)
                CFRelease(privateKeyAttrs)
                CFRelease(accessControl)
                
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
    }

    override suspend fun signData(alias: String, data: ByteArray): ByteArray? {
        return memScoped {
            try {
                val privateKey = getPrivateKey(alias) ?: return@memScoped null

                val dataToSign = data.toNSData()
                val error = alloc<CFErrorRefVar>()
                
                val signature = SecKeyCreateSignature(
                    privateKey,
                    kSecKeyAlgorithmECDSASignatureMessageX962SHA256,
                    dataToSign as CFDataRef,
                    error.ptr
                ) ?: return@memScoped null

                val signatureData = signature as NSData
                val result = ByteArray(signatureData.length.toInt())
                signatureData.getBytes(result.refTo(0), signatureData.length)
                
                CFRelease(privateKey)
                CFRelease(signature)
                
                result
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }

    override suspend fun encryptData(alias: String, data: ByteArray): ByteArray? {
        return memScoped {
            try {
                val privateKey = getPrivateKey(alias) ?: return@memScoped null
                val publicKey = SecKeyCopyPublicKey(privateKey) ?: return@memScoped null

                val dataToEncrypt = data.toNSData()
                val error = alloc<CFErrorRefVar>()
                
                val encrypted = SecKeyCreateEncryptedData(
                    publicKey,
                    kSecKeyAlgorithmECIESEncryptionStandardX963SHA256AESGCM,
                    dataToEncrypt as CFDataRef,
                    error.ptr
                ) ?: return@memScoped null

                val encryptedData = encrypted as NSData
                val result = ByteArray(encryptedData.length.toInt())
                encryptedData.getBytes(result.refTo(0), encryptedData.length)
                
                CFRelease(privateKey)
                CFRelease(publicKey)
                CFRelease(encrypted)
                
                result
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }

    override suspend fun decryptData(alias: String, encryptedData: ByteArray): ByteArray? {
        return memScoped {
            try {
                val privateKey = getPrivateKey(alias) ?: return@memScoped null

                val dataToDecrypt = encryptedData.toNSData()
                val error = alloc<CFErrorRefVar>()
                
                val decrypted = SecKeyCreateDecryptedData(
                    privateKey,
                    kSecKeyAlgorithmECIESEncryptionStandardX963SHA256AESGCM,
                    dataToDecrypt as CFDataRef,
                    error.ptr
                ) ?: return@memScoped null

                val decryptedData = decrypted as NSData
                val result = ByteArray(decryptedData.length.toInt())
                decryptedData.getBytes(result.refTo(0), decryptedData.length)
                
                CFRelease(privateKey)
                CFRelease(decrypted)
                
                result
            } catch (e: Exception) {
                e.printStackTrace()
                null
            }
        }
    }

    override fun deleteKey(alias: String) {
        memScoped {
            val query = CFDictionaryCreateMutable(kCFAllocatorDefault, 0, null, null)
            CFDictionarySetValue(query, kSecClass, kSecClassKey)
            CFDictionarySetValue(query, kSecAttrApplicationTag, (alias as NSString).dataUsingEncoding(NSUTF8StringEncoding))
            
            SecItemDelete(query)
            CFRelease(query)
        }
    }

    override fun keyExists(alias: String): Boolean {
        return getPrivateKey(alias) != null
    }

    private fun getPrivateKey(alias: String): SecKeyRef? {
        return memScoped {
            val query = CFDictionaryCreateMutable(kCFAllocatorDefault, 0, null, null)
            CFDictionarySetValue(query, kSecClass, kSecClassKey)
            CFDictionarySetValue(query, kSecAttrApplicationTag, (alias as NSString).dataUsingEncoding(NSUTF8StringEncoding))
            CFDictionarySetValue(query, kSecReturnRef, kCFBooleanTrue)
            
            val result = alloc<CFTypeRefVar>()
            val status = SecItemCopyMatching(query, result.ptr)
            
            CFRelease(query)
            
            if (status == errSecSuccess) {
                result.value?.reinterpret()
            } else {
                null
            }
        }
    }

    private fun ByteArray.toNSData(): NSData {
        return this.usePinned { pinned ->
            NSData.create(bytes = pinned.addressOf(0), length = this.size.toULong())
        }
    }
}
