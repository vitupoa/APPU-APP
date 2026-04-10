# KMP Secrets & Prisma alignment

I apologize for the oversight regarding the UI! You are absolutely right—the mobile app Architecture, Repositories, ViewModels, and many UI features (including the Login Screen) are already robustly built in `composeApp/src/commonMain`. 

My new goal is to securely bridge your local setups, eliminate any remaining stubbed logic, and verify strict 1:1 parity between your Backend's Prisma Schema and the Mobile App's Data Transfer Objects (DTOs).

## Proposed Changes

### 1. Secure API Key Injection (No more hardcoding)

> [!TIP]
> We will use the `com.github.gmazzo.buildconfig` plugin to read `RAILWAY_URL` from your `local.properties` file securely, compile it into Kotlin, and dynamically configure Ktor, completely hiding your server URL from source control.

#### [MODIFY] [libs.versions.toml](file:///c:/Users/ADMIN/appu/gradle/libs.versions.toml) & [build.gradle.kts (root)](file:///c:/Users/ADMIN/appu/build.gradle.kts)
- Add the `gmazzo.buildconfig` Gradle plugin (version `5.3.5`).

#### [MODIFY] [composeApp/build.gradle.kts](file:///c:/Users/ADMIN/appu/composeApp/build.gradle.kts)
- Apply the plugin and configure it to parse `RAILWAY_URL` strictly from `local.properties`.

#### [MODIFY] [ApiConstants.kt](file:///c:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/com/core/network/ApiConstants.kt)
- Remove the hardcoded `https://krieta-api.up.railway.app`. Replace it by referencing `BuildConfig.RAILWAY_URL`.

### 2. Eliminating Stubs (Ktor Client)

#### [MODIFY] [KtorClient.kt](file:///c:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/com/core/network/KtorClient.kt)
- Right now, your Token Manager's `refreshTokens` block has a comment saying `// This is a placeholder`. I will inject the `AuthRepository` dependency or correctly map the endpoint so the app actually attempts a token refresh via `/auth/refresh` upon a 401 Unauthorized API error, ensuring no stubs remain.

### 3. Strict Prisma ↔ Mobile DTO Parity

Your backend Prisma schema defines:
```prisma
  id, email, phone, username, firstName, lastName, displayName, avatarUrl, coverPhotoUrl, bio, country, currency, googleId, appleId, accountType, isAdmin, isVerified, isWalletUnlocked 
```

However, your mobile app's `UserDto` inside `AuthDtos.kt` only tracks:
```kotlin
  id, username, email, displayName, accountType, isWalletUnlocked
```

#### [MODIFY] [AuthDtos.kt](file:///c:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/auth/data/remote/dto/AuthDtos.kt)
- Expand `UserDto` to include `firstName`, `lastName`, `phone`, `avatarUrl`, `currency`, `country`, `bio`, and `isVerified`. So the mobile app is fully aware of the precise user state tracked by Prisma.

#### [MODIFY] [User.kt](file:///c:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/auth/domain/model/User.kt)
- Expand the core Domain Model to support these newly un-stubbed Prisma fields.

#### [MODIFY] [AuthRepositoryImpl.kt](file:///c:/Users/ADMIN/appu/composeApp/src/commonMain/kotlin/com/krieta/feature/auth/data/repository/AuthRepositoryImpl.kt)
- Update the internal mapper function to map all new fields successfully from the expanded DTO payload.


## Open Questions

> [!IMPORTANT]
> - Are there any exact external API keys (like Google Auth IDs or Apple Sign In Client IDs) that you would also like me to append to `local.properties` / `BuildConfig` while I setup `RAILWAY_URL`?

## Verification Plan
1. Project syncs successfully with BuildConfig code-generation intact.
2. `ApiConstants` correctly accesses `RAILWAY_URL`.
3. DTO models compile with full Prisma parity.
