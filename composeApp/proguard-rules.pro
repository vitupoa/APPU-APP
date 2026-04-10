# ─── Krieta Android ProGuard Rules ──────────────────────────

# ─── KOTLIN SERIALIZATION ──────────────────────────────────
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep all @Serializable data classes
-keep,includedescriptorclasses class com.krieta.**$$serializer { *; }
-keepclassmembers class com.krieta.** {
    *** Companion;
}
-keepclasseswithmembers class com.krieta.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep serializable DTOs explicitly
-keep class com.krieta.feature.**.dto.** { *; }
-keep class com.krieta.feature.**.model.** { *; }

# ─── KTOR ──────────────────────────────────────────────────
-keep class io.ktor.** { *; }
-keepclassmembers class io.ktor.** { *; }
-dontwarn io.ktor.**
-keep class io.ktor.client.engine.okhttp.** { *; }

# ─── KOIN DI ──────────────────────────────────────────────
-keep class org.koin.** { *; }
-keep class com.krieta.**.di.** { *; }
-dontwarn org.koin.**

# ─── VOYAGER NAVIGATION ───────────────────────────────────
-keep class cafe.adriel.voyager.** { *; }
-dontwarn cafe.adriel.voyager.**

# ─── COIL IMAGE LOADING ──────────────────────────────────
-keep class coil3.** { *; }
-dontwarn coil3.**

# ─── OKHTTP / OKIO ────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# ─── COMPOSE ──────────────────────────────────────────────
-keep class androidx.compose.** { *; }
-dontwarn androidx.compose.**

# ─── MEDIA3 / EXOPLAYER ──────────────────────────────────
-keep class androidx.media3.** { *; }
-dontwarn androidx.media3.**

# ─── SECURITY / CRYPTO ───────────────────────────────────
-keep class androidx.security.crypto.** { *; }

# ─── SQLDELIGHT ───────────────────────────────────────────
-keep class app.cash.sqldelight.** { *; }
-keep class com.krieta.com.db.** { *; }

# ─── DATASTORE ────────────────────────────────────────────
-keep class androidx.datastore.** { *; }

# ─── COROUTINES ───────────────────────────────────────────
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}

# ─── GENERAL KOTLIN ───────────────────────────────────────
-keep class kotlin.Metadata { *; }
-keepattributes RuntimeVisibleAnnotations
-dontwarn kotlin.**

# ─── AGGRESSIVE OBFUSCATION FOR SECURITY CLASSES ─────────
# Wallet, auth, and payment DTOs/models are kept (for serialization)
# but implementation classes are fully obfuscated
-keep class com.krieta.com.core.security.** { *; }
-keep class com.krieta.feature.wallet.data.remote.dto.** { *; }
-keep class com.krieta.feature.auth.data.remote.dto.** { *; }

# ─── RELEASE: REMOVE LOGGING ─────────────────────────────
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
-assumenosideeffects class io.ktor.client.plugins.logging.** {
    public <methods>;
}

# ─── ENUMS ────────────────────────────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ─── PARCELABLE ───────────────────────────────────────────
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}
