# Certificate Pinning Implementation Guide

## Overview

Certificate pinning protects Runinga from man-in-the-middle (MITM) attacks by validating that the server's SSL certificate matches a known set of trusted certificates. This prevents attackers from intercepting network traffic even if they compromise a Certificate Authority.

## Current Status

✅ **Framework**: Complete  
✅ **Android Implementation**: Complete with OkHttp  
✅ **iOS Implementation**: Complete with NSURLSession challenge handling  
🔄 **Production Certificates**: Need to be updated when deploying

## Security Benefits

- **Prevents MITM attacks**: Even if a CA is compromised, attackers cannot intercept your traffic
- **Protects sensitive data**: User credentials, payment information, and personal data remain secure
- **Defense in depth**: Works alongside HTTPS for additional security
- **User safety**: Blocks rogue certificates from user-installed trust stores (configurable)

## How It Works

### Android (OkHttp)
1. OkHttp's `CertificatePinner` validates the server's certificate chain
2. Extracts the SHA-256 hash of each certificate's public key
3. Compares against our pinned hashes
4. Rejects the connection if no match is found

### iOS (NSURLSession)
1. Intercepts authentication challenges via `URLSessionDelegate`
2. Evaluates server trust using Security framework
3. Extracts public keys from certificate chain
4. Compares SHA-256 hashes against pinned values
5. Accepts or rejects the challenge based on validation

## Configuration

Pins are configured in:
```
composeApp/src/commonMain/kotlin/com/runinga/com/core/security/pinning/CertificatePinningConfig.kt
```

```kotlin
object CertificatePinningConfig {
    const val API_HOSTNAME = "api.runinga.com"
    
    val CERTIFICATE_PINS = listOf(
        "sha256/AAAA...", // Leaf certificate
        "sha256/BBBB...", // Intermediate CA
        "sha256/CCCC..."  // Root CA (backup)
    )
    
    const val PINNING_ENABLED = true
    const val ALLOW_USER_CERTIFICATES = false
}
```

## Getting Production Certificate Pins

### Option 1: Use Our Script (Recommended)

```bash
cd backend
node scripts/get-certificate-pins.js api.runinga.com
```

This will:
- Connect to your server
- Extract the certificate chain
- Calculate SHA-256 pins
- Generate ready-to-use Kotlin configuration

### Option 2: Manual Extraction

#### On macOS/Linux:
```bash
# Get certificate chain
openssl s_client -connect api.runinga.com:443 -showcerts < /dev/null | \
  openssl x509 -pubkey -noout | \
  openssl pkey -pubin -outform der | \
  openssl dgst -sha256 -binary | \
  openssl enc -base64
```

#### On Windows (PowerShell):
```powershell
# This requires OpenSSL for Windows
# Download from: https://slproweb.com/products/Win32OpenSSL.html

openssl s_client -connect api.runinga.com:443 -showcerts | `
  openssl x509 -pubkey -noout | `
  openssl pkey -pubin -outform der | `
  openssl dgst -sha256 -binary | `
  openssl enc -base64
```

### Option 3: Use Online Tools

⚠️ **Security Note**: Never use online tools for production pins as they may log your certificates.

For testing/development only:
- https://www.ssllabs.com/ssltest/
- https://report-uri.com/home/pubkey_hash

## Pin Management Best Practices

### 1. Always Pin Multiple Certificates

**Minimum**: 2 pins (leaf + intermediate)  
**Recommended**: 3 pins (leaf + intermediate + root)

```kotlin
val CERTIFICATE_PINS = listOf(
    "sha256/leaf-cert-hash",        // Your domain's certificate
    "sha256/intermediate-ca-hash",  // Intermediate CA (backup)
    "sha256/root-ca-hash"          // Root CA (emergency backup)
)
```

### 2. Certificate Rotation Process

**Before rotation** (60-90 days before expiry):
1. Get pins for the NEW certificate
2. Add new pins to `CERTIFICATE_PINS` list
3. Deploy app update with both old AND new pins
4. Wait 2-4 weeks for users to update
5. Rotate certificate on server
6. Remove old pins in next app release

**Timeline Example**:
```
Day 0:   Add new pins to app → Deploy v1.5.0
Day 14:  95% of users on v1.5.0
Day 30:  Rotate certificate on server
Day 60:  Remove old pins → Deploy v1.6.0
```

### 3. Emergency Pin Bypass

If you need to disable pinning in an emergency (certificate rotation failure):

```kotlin
object CertificatePinningConfig {
    // Temporarily disable - NEVER commit this to main branch
    const val PINNING_ENABLED = false
}
```

Deploy immediately and fix the root cause.

### 4. Testing

#### Test in Staging First
```kotlin
// staging-config
const val API_HOSTNAME = "staging-api.runinga.com"
val CERTIFICATE_PINS = listOf("sha256/staging-cert-hash")
```

#### Test MITM Detection
Use a proxy like Charles or Burp Suite to verify pinning blocks intercepted traffic.

Expected result: Connection should **FAIL** with a certificate validation error.

## Validation & Monitoring

### On App Start

```kotlin
val status = CertificatePinningManager.validateConfiguration()
if (!status.isValid) {
    Log.e("Security", "Certificate pinning misconfigured!")
    // Report to your error tracking service
}
```

### Generate Configuration Report

```kotlin
val report = CertificatePinningManager.getConfigurationReport()
println(report)
```

Output:
```
📋 Certificate Pinning Configuration Report
Generated: 2026-11-05T10:30:00

Hostname: api.runinga.com
Pinning Enabled: true
Allow User Certs: false
Pin Count: 3

Pins:
  [0] sha256/AAAA...
  [1] sha256/BBBB...
  [2] sha256/CCCC...

Status:
  ✅ 3 pins configured (good redundancy)
  ✅ Hostname configured: api.runinga.com
  ✅ User-installed certificates are blocked

Overall: ✅ VALID - Ready for production
```

### Check Rotation Needs

```kotlin
val recommendation = CertificatePinningManager.shouldRotatePins()
if (recommendation.shouldRotate) {
    Log.w("Security", "Pin rotation recommended: ${recommendation.reason}")
}
```

## Debugging

### Android

Enable debug logging in `AndroidCertificatePinner`:

```kotlin
Log.d("CertificatePinner", "Checking pin: $pin")
```

Use `logCertificateChain()` to inspect actual pins:

```kotlin
// In OkHttp interceptor
pinner.logCertificateChain(chain)
```

### iOS

Check Xcode console for pinning logs:

```
✅ Certificate pin matched: sha256/AAAA... (position 0 in chain)
```

If validation fails:
```
❌ No matching certificate pins found in chain
```

## Troubleshooting

### "No matching certificate pins found"

**Cause**: Your server's certificate doesn't match any configured pins.

**Solutions**:
1. Verify you're connecting to the correct hostname
2. Re-extract pins from your production server
3. Check if certificate was recently rotated
4. Ensure pins are in correct format: `sha256/BASE64HASH`

### "SecTrustEvaluate failed" (iOS)

**Cause**: iOS rejected the certificate before pin validation.

**Solutions**:
1. Verify your server has a valid SSL certificate
2. Check certificate chain is complete
3. Ensure server hostname matches certificate CN/SAN

### App can't connect after deploying

**Cause**: Pins don't match server certificate.

**Emergency Fix**:
1. Deploy hotfix with `PINNING_ENABLED = false`
2. Extract correct pins from production server
3. Deploy proper fix with correct pins
4. Re-enable pinning

## Production Deployment Checklist

- [ ] Extract pins from production server using the script
- [ ] Update `CertificatePinningConfig.kt` with production pins
- [ ] Verify hostname matches production domain
- [ ] Set `PINNING_ENABLED = true`
- [ ] Set `ALLOW_USER_CERTIFICATES = false`
- [ ] Test on staging environment first
- [ ] Run `CertificatePinningManager.validateConfiguration()`
- [ ] Test MITM detection with a proxy
- [ ] Document current certificate expiry date
- [ ] Set calendar reminder for rotation (60 days before expiry)
- [ ] Deploy to production
- [ ] Monitor error logs for pinning failures

## When to Update Pins

1. **Certificate Rotation**: 60-90 days before expiry
2. **Server Migration**: Moving to new hosting/CDN
3. **CA Change**: Switching Certificate Authority
4. **Security Incident**: If current CA is compromised

## Security Considerations

### DO:
✅ Pin multiple certificates (leaf + intermediate + root)  
✅ Test in staging before production  
✅ Monitor certificate expiry dates  
✅ Have an emergency disable mechanism  
✅ Block user-installed certificates in production  
✅ Use SHA-256 hashes (not SHA-1)  

### DON'T:
❌ Pin only one certificate  
❌ Hardcode pins without backup rotation plan  
❌ Use online tools for production pins  
❌ Disable pinning permanently  
❌ Ignore validation errors  
❌ Allow user certificates in production  

## Additional Resources

- [OWASP Certificate Pinning Guide](https://owasp.org/www-community/controls/Certificate_and_Public_Key_Pinning)
- [OkHttp Certificate Pinning](https://square.github.io/okhttp/features/https/)
- [Apple App Transport Security](https://developer.apple.com/documentation/security/preventing_insecure_network_connections)

## Support

For questions or issues:
1. Check logs for specific error messages
2. Verify pins match production server
3. Test with staging environment first
4. Review this guide's troubleshooting section
5. Contact security team if persistent issues occur

---

**Last Updated**: 2026-11-05  
**Security Level**: ✅ Production Ready  
**Maintenance**: Review quarterly, update before certificate rotation
