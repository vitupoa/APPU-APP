package com.krieta.com.core.security

import android.content.Context
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.annotation.RequiresApi
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class AndroidSecureKeyStorage(private val context: Context) : SecureKeyStorage {

    private val keyStore: KeyStore = KeyStore.getInstance("AndroidKeyStore").apply {
        load(null)
    }

    override fun isHardwareBackedSecurityAvailable(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // Check for StrongBox support
            context.packageManager.hasSystemFeature("android.hardware.strongbox_keystore")
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            // Check for hardware-backed keystore
            true
        } else {
            false
        }
    }

    @RequiresApi(Build.VERSION_CODES.M)
    override suspend fun generateKeyPair(alias: String, requireBiometric: Boolean): Boolean {
        return try {
            val keyPairGenerator = KeyPairGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_RSA,
                "AndroidKeyStore"
            )

            val builder = KeyGenParameterSpec.Builder(
                alias,
                KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY or
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
                .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_OAEP)
                .setKeySize(2048)
                .setUserAuthenticationRequired(requireBiometric)

            // Use StrongBox if available (Android 9+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                if (isHardwareBackedSecurityAvailable()) {
                    builder.setIsStrongBoxBacked(true)
                }
                if (requireBiometric) {
                    builder.setUserAuthenticationParameters(
                        30, // 30 seconds validity after auth
                        KeyProperties.AUTH_BIOMETRIC_STRONG
                    )
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && requireBiometric) {
                builder.setUserAuthenticationParameters(
                    30,
                    KeyProperties.AUTH_BIOMETRIC_STRONG
                )
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && requireBiometric) {
                @Suppress("DEPRECATION")
                builder.setUserAuthenticationValidityDurationSeconds(30)
            }

            keyPairGenerator.initialize(builder.build())
            keyPairGenerator.generateKeyPair()
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    override suspend fun signData(alias: String, data: ByteArray): ByteArray? {
        return try {
            val entry = keyStore.getEntry(alias, null) as? KeyStore.PrivateKeyEntry
            val privateKey = entry?.privateKey ?: return null

            val signature = Signature.getInstance("SHA256withRSA")
            signature.initSign(privateKey)
            signature.update(data)
            signature.sign()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    @RequiresApi(Build.VERSION_CODES.M)
    override suspend fun encryptData(alias: String, data: ByteArray): ByteArray? {
        return try {
            // Generate AES key for encryption
            val aesAlias = "${alias}_aes"
            if (!keyExists(aesAlias)) {
                generateAESKey(aesAlias, requireBiometric = true)
            }

            val secretKey = keyStore.getKey(aesAlias, null) as? SecretKey ?: return null
            
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.ENCRYPT_MODE, secretKey)
            
            val iv = cipher.iv
            val encrypted = cipher.doFinal(data)
            
            // Prepend IV to encrypted data
            iv + encrypted
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    @RequiresApi(Build.VERSION_CODES.M)
    override suspend fun decryptData(alias: String, encryptedData: ByteArray): ByteArray? {
        return try {
            val aesAlias = "${alias}_aes"
            val secretKey = keyStore.getKey(aesAlias, null) as? SecretKey ?: return null
            
            // Extract IV (first 12 bytes for GCM)
            val iv = encryptedData.copyOfRange(0, 12)
            val ciphertext = encryptedData.copyOfRange(12, encryptedData.size)
            
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            val spec = GCMParameterSpec(128, iv)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, spec)
            
            cipher.doFinal(ciphertext)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    @RequiresApi(Build.VERSION_CODES.M)
    private fun generateAESKey(alias: String, requireBiometric: Boolean) {
        val keyGenerator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES,
            "AndroidKeyStore"
        )

        val builder = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .setUserAuthenticationRequired(requireBiometric)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            if (isHardwareBackedSecurityAvailable()) {
                builder.setIsStrongBoxBacked(true)
            }
            if (requireBiometric) {
                builder.setUserAuthenticationParameters(
                    30,
                    KeyProperties.AUTH_BIOMETRIC_STRONG
                )
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && requireBiometric) {
            builder.setUserAuthenticationParameters(
                30,
                KeyProperties.AUTH_BIOMETRIC_STRONG
            )
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && requireBiometric) {
            @Suppress("DEPRECATION")
            builder.setUserAuthenticationValidityDurationSeconds(30)
        }

        keyGenerator.init(builder.build())
        keyGenerator.generateKey()
    }

    override fun deleteKey(alias: String) {
        try {
            keyStore.deleteEntry(alias)
            keyStore.deleteEntry("${alias}_aes")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun keyExists(alias: String): Boolean {
        return try {
            keyStore.containsAlias(alias)
        } catch (e: Exception) {
            false
        }
    }

    @RequiresApi(Build.VERSION_CODES.M)
    override suspend fun storeKey(alias: String, keyData: ByteArray) {
        try {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                "AndroidKeyStore"
            )
            val builder = KeyGenParameterSpec.Builder(
                alias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
            keyGenerator.init(builder.build())
            keyGenerator.generateKey()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override suspend fun retrieveKey(alias: String): ByteArray? {
        return try {
            val secretKey = keyStore.getKey(alias, null) as? SecretKey
            secretKey?.encoded
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
