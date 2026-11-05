package com.runinga.com.core.security.pinning

import io.ktor.client.HttpClientConfig

interface CertificatePinner {
    fun configurePinning(config: HttpClientConfig<*>)
    fun validateCertificate(hostname: String, pins: List<String>): Boolean
}

expect fun createCertificatePinner(): CertificatePinner
