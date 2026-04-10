# Krieta Development Guidelines

## Core Principles

### Code Quality
- Avoid unnecessary abstractions - Don't create interfaces unless you have multiple implementations
- Keep functions small (<50 lines)
- Avoid deep nesting (max 3 levels)
- Use composition over inheritance
- Use modern Kotlin Multiplatform + Compose Multiplatform app development best practices and architecture
- Keep it minimal! 🎯

### No Duplicates Rule
- Before creating a file, repository, or folder, make sure they don't exist yet
- If there's a duplicate, merge the files and delete the inferior file
- Check for existing implementations before creating new ones

### Security Guidelines

#### API Keys & Secrets
- Do not hardcode API keys in the frontend for security purposes
- Store keys in .env file (backend)
- Use environment variables for CI/CD
- Use HMAC key
- Do not delete or remove existing keys without permission
- Feel free to add new keys and secure them properly

#### Password Security
- SHA-256 without salt is vulnerable to rainbow table attacks
- Passwords should never be hashed client-side
- Remove client-side password hashing entirely
- Send passwords over HTTPS
- Let backend handle password hashing with bcrypt/Argon2
- Backend should use proper salting and key stretching

#### Network Security
- Enable certificate pinning for production
- Use backup pins for certificate rotation
- Implement certificate pinning with proper pin rotation strategy
- Make sure the App is not vulnerable to man-in-the-middle attacks
- Disable cleartext traffic
- Add certificate pinning configuration


#### Token Storage
- Do not implement SharedPreferences storage
- Access tokens stored in unencrypted SharedPreferences can be extracted from rooted devices or backups
- Use only EncryptedSharedPreferences
- Store tokens exclusively in DataStore with encryption

#### Token Refresh
- Implement token refresh interceptor
- Detect 401 responses and refresh token automatically
- Queue failed requests and retry after refresh
- Clear session if refresh token is invalid

#### WebSocket Security
- Use secure WebSocket (wss://)
- Implement token refresh for long-lived connections
- Add connection timeout and retry limits
- Validate server certificate

#### Input Validation
- Implement input validation for all user inputs
- Sanitize data before sending to API

#### Request Signing
- Use per-device signing keys
- Implement nonce-based replay attack prevention
- Add timestamp validation on backend (5-minute window)
- Rotate signing keys periodically

#### Device Security
- Implement root detection (RootBeer library)
- Warn users or limit functionality on rooted devices
- Add SafetyNet/Play Integrity API checks
- Detect debugging and emulator environments

#### Logging Security
- Remove all sensitive data from logs
- Use Timber with custom tree that strips PII
- Ensure ProGuard removes logs in release
- Never log tokens, passwords, amounts, or PII

#### Session Management
- Implement session timeout (5-15 minutes)
- Re-authenticate for sensitive operations (transfers, withdrawals)
- Lock app when backgrounded for extended period

#### Code Obfuscation
- Review and minimize -keep rules
- Enable aggressive obfuscation for security classes
- Use DexGuard for enhanced protection (commercial)
- Obfuscate API endpoints and keys

#### Network Resilience
- Implement exponential backoff
- Limit retry attempts
- Add request throttling for sensitive operations
- Cache responses to reduce API calls

### Architecture
- Continue with modular monolith architecture approach
- Maintain Service-Oriented Modules (Within Monolith)
- Have security in mind and protect the app against hackers, external attacks and malicious activities or injections

### Performance Optimization
- Database query optimization
- Image/video caching strategies
- Network request batching

### Security Hardening
- API rate limiting
- Input validation
- Security audit

### Repository & ViewModel Integration
- Confirm all ViewModels inject repositories properly
- Confirm all UI are all properly connected
- Create the required UI & screens, connect UI to backend

### Currency Display Rules
- When Kr is used, always show fiat below it conversion based on user's location-based currency
- Where user enters amount, they enter amount in their local location based fiat currency and realtime conversion is done as they type the amount
- In the front end always show Kr amount with the user's location based fiat currency conversion below it
- Always show Kr currency in this order: Kr.Amount ie Kr.1 (note the dot and no spaces)
- 4.5% platform margin for buy/sell rates (topup and withdrawals)

### Backend Integration
- Fix DTOs to match backend responses
- Do not create stubs
- Use proper camelCase in all DTOs
- Configure the JSON serializer to handle snake_case ↔ camelCase conversion automatically
- Keep backend responses in snake_case (database standard)
- Let the serialization layer handle the conversion

### Code Quality Standards
- Make sure the codebase is cleaner, more maintainable, and follows React Native best practices
- Follow React Native naming conventions

### Implementation Philosophy
- If there are calls to non-existent repository methods, do not remove the calls
- Do not implement placeholders, instead implement the non-existent repository methods
- Fix everything properly, do not break the app
- If domain models are missing, implement them
- Implement non-existent components and API methods referenced
- Do not simplify the code, instead implement what is needed to make the code work
- Do not simplify anything whether viewmodel, screen features etc
- Do not remove anything non-existent. Implement them instead

Recommended tech stack:
Kotlin Multiplatform + Compose Multiplatform for the mobile app
Node.js microservices per module, communicating via message queue (e.g. Redis)
PostgreSQL for relational data (users, contests, transactions), Redis for feed/leaderboard caching
WebSockets for real-time milestone race notifications
railway for backend
cloudinary for file storage (video, photo, pdfs etc)

use modern Kotlin Multiplatform + Compose Multiplatform best practicess, we are in the year 2026

be mindful of safe areas in different devices

practice best design considering all design principals and typography, hirachy, spacing, visual restraint, responsive bahaviour motion, consistency across screens
make the design fit the product -give it a premioum feel

protect against ss7 attack

impplement proper inbuilt authenticator for the wallet

Fawaz Ahmed exchange api https://github.com/fawazahmed0/exchange-api

 Security Measures

1. Root/Jailbreak Detection

2. Emulator Detection

3. SSL Pinning

4. Code Obfuscation

5. Anti-Tampering

6. Runtime Integrity Checks

7. Secure Storage

8. Anti-Debugging

9. Screen Capture Prevention

10. Device Binding

Data Storage:

Use Android Keystore / iOS Secure Enclave for storing wallet keys and tokens — never plain SharedPreferences
Use SQLDelight with encryption (SQLCipher) for local database
Never hardcode API keys in your code

Authentication:

Use JWT with short expiry
Implement refresh tokens
Add multi-factor authentication (MFA)
Biometric login (fingerprint/face) using AndroidX Biometric / iOS LocalAuthentication
PIN/passcode as fallback
Rate limit login attempts

Code Quality:

Use Kotlin Multiplatform best practices
Follow clean architecture
Write unit and integration tests

Network:

Certificate pinning — so even if someone intercepts traffic they can't read it
All API calls over HTTPS only
Use short-lived JWT tokens with refresh token rotation for auth

Code Protection:

Enable R8/ProGuard on Android release builds
Use root detection (library: RootBeer for Android, DTTJailbreakDetection for iOS)
Screenshot prevention on wallet and payment screens

expect/actual in KMP — how to handle it: expect/actual is how KMP handles platform-specific code. You write an expect declaration in commonMain and an actual implementation in androidMain and iosMain.Do not forget to add actual in both platforms. Do not use Android-only APIs inside commonMain. Do not use Wrong package names between expect and actual files
The golden rule: if a library already supports KMP, don't use expect/actual — let the library handle it. Only use expect/actual when you're touching something truly native.

access Redis via Railway backend REST endpoints rather than connecting directly from mobile.

Architecture: Modular Clean Architecture with commonMain/androidMain/iosMain.

always make sure the backend fields match Prisma schema exactly
 No stubs — make sure all repositories, ViewModels, and screens are fully implemented and injected properly
