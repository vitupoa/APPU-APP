# API Key Security & DTO Schema Alignment

I have successfully mapped the backend structure to your local android environments while enforcing the tightest security protocols through KMP native tools. Your `RAILWAY_URL` and API secrets are securely passed directly into the compile process without committing to Version Control.

## Key Changes Made

### Secure BuildConfig Integration
- Injected `com.github.gmazzo.buildconfig` plugin into your Jetpack Compose Multiplatform build scripts (`libs.versions.toml` and `build.gradle.kts`).
- Programmed Gradle to parse `local.properties` dynamically and construct a safe `BuildConfig` class strictly accessible to KMP source code.
- Removed the hardcoded `https://krieta-api.up.railway.app` from `ApiConstants.kt`. It now dynamically derives API paths via `"https://${BuildConfig.RAILWAY_URL}"`.

### Ktor Token Refresh Implementation
- Completely removed the stub placeholder located inside your `KtorClient.kt` token interceptor block.
- Implemented a direct network fetch against `ApiConstants.AUTH_REFRESH` to retrieve the latest `accessToken` and `refreshToken`.
- Resolved compiler constraints regarding deep generic inline resolution (`call.body()`) missing package contexts.

### Strict Prisma 1:1 Parity
- Your backend `schema.prisma` model tracks significant user data: `firstName`, `lastName`, `phone`, `avatarUrl`, `currency`, etc. Your KMP App completely lacked awareness of these fields.
- Upgraded the Mobile KMP `UserDto` completely aligning it to the Prisma schema logic to prevent frontend UI data starvation later on.
- Upgraded the central Domain layer `User.kt` state and refactored the factory method `mapUser(dto)` inside your `AuthRepositoryImpl.kt` to serialize everything perfectly.

> [!TIP]
> Google client auth variables (`GOOGLE_CLIENT_ID`) and Apple Auth (`APPLE_CLIENT_ID`) have been appended to your `local.properties` file as placeholders. Whenever you register your Firebase/Apple-Dev accounts, populating them locally will immediately map them natively!

## Validation
- ✅ Gradle Sync successful 
- ✅ Compiled Android Compose (`assembleDebug`) successfully without throwing unresolved Ktor/Syntax exceptions.
