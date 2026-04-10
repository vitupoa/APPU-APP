Recommended Library
Networking: Ktor Client (KMP native)
Local Database: SQLDelight
Dependency Injection: Koin (KMP friendly)
State Management: Decompose or Voyager
Navigation: Voyager (simplest for CMP)
Image Loading: Coil 3 (now supports KMP)
Video (Shorts): ExoPlayer on Android, AVPlayer on iOS via expect/actual
Cloudinary: Use Ktor to call Cloudinary REST API directly
Backend (Railway): Ktor Client with REST/GraphQL endpoints
Auth: Firebase Auth KMP or custom JWT via Ktor (which one do you sugest, and why)
Serialization: Kotlinx Serialization
Async/Coroutines: Kotlinx Coroutines (built into KMP)

SDK versions:
Kotlin: 2.1+
Compose Multiplatform: 1.7+
Ktor: 3+
SQLDelight: 2+
Koin: 3.6+
Voyager: 1.0.0
Coil 3: 3+
ExoPlayer: 2.19.1
AVPlayer: Use native iOS AVPlayer via expect/actual
Firebase Auth KMP: 
Kotlinx Serialization:
Kotlinx Coroutines:
KMP Gradle Plugin: 2.1.x
Gradle Wrapper: 8.11
Android minSdk: 24
Android targetSdk: 35
Android compileSdk: 35
DI: Koin 3.6.x
Currency API: https://github.com/fawazahmed0/exchange-api

Architecture: Modular Clean Architecture with commonMain/androidMain/iosMain.