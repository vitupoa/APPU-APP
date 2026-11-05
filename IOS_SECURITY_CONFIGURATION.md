# iOS Configuration for Security Features

## Info.plist

Add the following keys to your `Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Face ID Usage Description (Required for iOS 11+) -->
    <key>NSFaceIDUsageDescription</key>
    <string>Runinga uses Face ID to securely authenticate withdrawals and protect your wallet.</string>
    
    <!-- App Name -->
    <key>CFBundleDisplayName</key>
    <string>Runinga</string>
    
    <!-- Bundle Identifier -->
    <key>CFBundleIdentifier</key>
    <string>com.runinga.app</string>
    
    <!-- Other standard keys... -->
</dict>
</plist>
```

## Entitlements

Create or update `Runinga.entitlements`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Keychain Access Groups -->
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)com.runinga.app</string>
    </array>
    
    <!-- App Groups (if needed for shared data) -->
    <key>com.apple.security.application-groups</key>
    <array>
        <string>group.com.runinga.app</string>
    </array>
</dict>
</plist>
```

## Xcode Project Settings

### Capabilities

Enable the following capabilities in Xcode:

1. **Keychain Sharing**
   - Target → Signing & Capabilities
   - Click "+ Capability"
   - Add "Keychain Sharing"
   - Add keychain group: `com.runinga.app`

2. **App Groups** (Optional)
   - Add "App Groups"
   - Add group: `group.com.runinga.app`

### Build Settings

```
Deployment Target: iOS 11.0 or later
Swift Language Version: Swift 5.0
```

## Framework Linking

The following frameworks are automatically linked:

- `LocalAuthentication.framework` - For biometric authentication
- `Security.framework` - For Secure Enclave and Keychain
- `CoreCrypto.framework` - For cryptographic operations

No manual linking required for Kotlin Multiplatform.

## Testing on Physical Device

**Important**: Secure Enclave and biometric features require physical devices.

### Required Test Devices:
- iPhone 5s or later (Secure Enclave support)
- Device with Touch ID or Face ID enrolled
- iOS 11.0 or later

### Device Support:
- **Secure Enclave**: iPhone 5s and later, iPad Air 2 and later
- **Touch ID**: iPhone 5s - iPhone 8, iPad Pro, iPad Air 2+
- **Face ID**: iPhone X and later, iPad Pro (2018+)

### Test Checklist:
- [ ] Face ID/Touch ID prompt appears
- [ ] Biometric authentication works
- [ ] Passcode fallback works
- [ ] Secure Enclave key generation succeeds
- [ ] ECC key operations work
- [ ] Signing operations complete
- [ ] Encryption/decryption works
- [ ] Keys persist across app restarts
- [ ] Keys deleted on app uninstall

## Simulator Limitations

The iOS Simulator does NOT support:
- ❌ Secure Enclave
- ❌ Touch ID / Face ID (can be simulated but not real)
- ❌ Hardware-backed key storage

For testing, the code will:
- Detect simulator environment
- Fall back to software-based security
- Log warnings about missing hardware features

## Privacy & Security

### App Store Review

When submitting to App Store, ensure:

1. **Privacy Policy**: Explain biometric data usage
2. **Usage Description**: Clear NSFaceIDUsageDescription
3. **Data Handling**: Declare biometric data usage in App Store Connect
4. **Security**: Explain Secure Enclave usage in review notes

### User Privacy

- Biometric data never leaves the device
- Secure Enclave keys cannot be extracted
- No biometric templates stored by app
- All authentication handled by iOS

## Code Signing

Ensure proper code signing:

```bash
# Check code signing
codesign -dv --verbose=4 /path/to/Runinga.app

# Verify entitlements
codesign -d --entitlements :- /path/to/Runinga.app
```

## Troubleshooting

### "Face ID not available"
- Check Info.plist has NSFaceIDUsageDescription
- Verify device has Face ID enrolled
- Check iOS version >= 11.0

### "Secure Enclave error"
- Verify device is iPhone 5s or later
- Check device is not jailbroken
- Ensure proper entitlements

### "Keychain access denied"
- Verify keychain-access-groups in entitlements
- Check code signing is valid
- Ensure app group matches bundle ID

## Production Checklist

- [ ] NSFaceIDUsageDescription added to Info.plist
- [ ] Keychain Sharing capability enabled
- [ ] Entitlements file configured
- [ ] Code signing valid
- [ ] Tested on physical device with biometric
- [ ] Tested on device without biometric (fallback)
- [ ] Privacy policy updated
- [ ] App Store review notes prepared
