package com.krieta.com.core.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = KrietaColors.Primary,
    onPrimary = KrietaColors.OnPrimary,
    primaryContainer = KrietaColors.PrimaryContainer,
    onPrimaryContainer = KrietaColors.OnPrimaryContainer,
    secondary = KrietaColors.Accent,
    onSecondary = KrietaColors.OnAccent,
    secondaryContainer = KrietaColors.AccentContainer,
    onSecondaryContainer = KrietaColors.OnAccentContainer,
    tertiary = KrietaColors.Info,
    background = KrietaColors.Background,
    onBackground = KrietaColors.OnBackground,
    surface = KrietaColors.Surface,
    onSurface = KrietaColors.OnSurface,
    surfaceVariant = KrietaColors.SurfaceVariant,
    onSurfaceVariant = KrietaColors.OnSurfaceVariant,
    error = KrietaColors.Error,
    onError = KrietaColors.OnError,
    errorContainer = KrietaColors.ErrorContainer,
    outline = KrietaColors.Outline,
    outlineVariant = KrietaColors.OutlineVariant,
    scrim = KrietaColors.Scrim,
)

private val LightColorScheme = lightColorScheme(
    primary = KrietaColors.Primary,
    onPrimary = KrietaColors.OnPrimary,
    primaryContainer = KrietaColors.PrimaryLight,
    onPrimaryContainer = KrietaColors.PrimaryDark,
    secondary = KrietaColors.Accent,
    onSecondary = KrietaColors.OnAccent,
    secondaryContainer = KrietaColors.AccentLight,
    onSecondaryContainer = KrietaColors.AccentDark,
    tertiary = KrietaColors.Info,
    background = KrietaColors.Light.Background,
    onBackground = KrietaColors.Light.OnBackground,
    surface = KrietaColors.Light.Surface,
    onSurface = KrietaColors.Light.OnSurface,
    surfaceVariant = KrietaColors.Light.SurfaceVariant,
    onSurfaceVariant = KrietaColors.Light.OnSurfaceVariant,
    error = KrietaColors.Error,
    onError = KrietaColors.OnError,
    errorContainer = KrietaColors.ErrorContainer,
    outline = KrietaColors.Light.Outline,
    scrim = KrietaColors.Scrim,
)

@Composable
fun KrietaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = KrietaTypography,
        content = content
    )
}
