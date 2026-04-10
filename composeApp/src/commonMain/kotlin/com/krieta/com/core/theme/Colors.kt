package com.krieta.com.core.theme

import androidx.compose.ui.graphics.Color

object KrietaColors {
    // Primary — Deep Teal/Emerald
    val Primary = Color(0xFF0D9373)
    val PrimaryDark = Color(0xFF076B54)
    val PrimaryLight = Color(0xFF14B890)
    val PrimaryContainer = Color(0xFF0A2E25)
    val OnPrimary = Color(0xFFFFFFFF)
    val OnPrimaryContainer = Color(0xFFB8F5E5)

    // Accent — Warm Gold/Amber
    val Accent = Color(0xFFE5A340)
    val AccentDark = Color(0xFFC48A2D)
    val AccentLight = Color(0xFFF0C068)
    val AccentContainer = Color(0xFF3D2E10)
    val OnAccent = Color(0xFF1A1200)
    val OnAccentContainer = Color(0xFFFCE4B8)

    // Surface / Background — Rich Dark Grays
    val Background = Color(0xFF0A0E0D)
    val BackgroundElevated = Color(0xFF121917)
    val Surface = Color(0xFF161D1B)
    val SurfaceVariant = Color(0xFF1E2826)
    val SurfaceHigh = Color(0xFF253230)
    val OnBackground = Color(0xFFE1E8E5)
    val OnSurface = Color(0xFFD4DDD9)
    val OnSurfaceVariant = Color(0xFF9EAAA6)

    // Status Colors
    val Success = Color(0xFF3DD68C)
    val SuccessContainer = Color(0xFF0F3324)
    val OnSuccess = Color(0xFF003920)
    val Error = Color(0xFFEF6461)
    val ErrorContainer = Color(0xFF3C1414)
    val OnError = Color(0xFF410002)
    val Warning = Color(0xFFFFB74D)
    val WarningContainer = Color(0xFF3D2A08)
    val Info = Color(0xFF64B5F6)
    val InfoContainer = Color(0xFF0D2944)

    // Kr Currency — Distinctive color for Kr amounts
    val KrGold = Color(0xFFD4A843)
    val KrGoldDim = Color(0xFF8B7230)

    // Overlay
    val Scrim = Color(0x99000000)
    val BottomSheetHandle = Color(0xFF3A4745)

    // Outline
    val Outline = Color(0xFF2E3B38)
    val OutlineVariant = Color(0xFF1E2826)

    // Light Theme Overrides
    object Light {
        val Background = Color(0xFFF5FAF8)
        val Surface = Color(0xFFFFFFFF)
        val SurfaceVariant = Color(0xFFEDF3F0)
        val OnBackground = Color(0xFF0A0E0D)
        val OnSurface = Color(0xFF161D1B)
        val OnSurfaceVariant = Color(0xFF4A5652)
        val Outline = Color(0xFFCCD5D2)
    }
}
