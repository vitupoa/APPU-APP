package com.runinga.com.core.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = RuningaColors.Primary,
    onPrimary = RuningaColors.OnPrimary,
    primaryContainer = RuningaColors.PrimaryContainer,
    onPrimaryContainer = RuningaColors.OnPrimaryContainer,
    secondary = RuningaColors.Accent,
    onSecondary = RuningaColors.OnAccent,
    secondaryContainer = RuningaColors.AccentContainer,
    onSecondaryContainer = RuningaColors.OnAccentContainer,
    tertiary = RuningaColors.Info,
    background = RuningaColors.Background,
    onBackground = RuningaColors.OnBackground,
    surface = RuningaColors.Surface,
    onSurface = RuningaColors.OnSurface,
    surfaceVariant = RuningaColors.SurfaceVariant,
    onSurfaceVariant = RuningaColors.OnSurfaceVariant,
    error = RuningaColors.Error,
    onError = RuningaColors.OnError,
    errorContainer = RuningaColors.ErrorContainer,
    outline = RuningaColors.Outline,
    outlineVariant = RuningaColors.OutlineVariant,
    scrim = RuningaColors.Scrim,
)

private val LightColorScheme = lightColorScheme(
    primary = RuningaColors.Primary,
    onPrimary = RuningaColors.OnPrimary,
    primaryContainer = RuningaColors.PrimaryLight,
    onPrimaryContainer = RuningaColors.PrimaryDark,
    secondary = RuningaColors.Accent,
    onSecondary = RuningaColors.OnAccent,
    secondaryContainer = RuningaColors.AccentLight,
    onSecondaryContainer = RuningaColors.AccentDark,
    tertiary = RuningaColors.Info,
    background = RuningaColors.Light.Background,
    onBackground = RuningaColors.Light.OnBackground,
    surface = RuningaColors.Light.Surface,
    onSurface = RuningaColors.Light.OnSurface,
    surfaceVariant = RuningaColors.Light.SurfaceVariant,
    onSurfaceVariant = RuningaColors.Light.OnSurfaceVariant,
    error = RuningaColors.Error,
    onError = RuningaColors.OnError,
    errorContainer = RuningaColors.ErrorContainer,
    outline = RuningaColors.Light.Outline,
    scrim = RuningaColors.Scrim,
)

@Composable
fun RuningaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = RuningaTypography,
        content = content
    )
}
