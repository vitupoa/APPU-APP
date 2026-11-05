package com.runinga.com.core.theme

import androidx.compose.ui.graphics.Color

object RuningaColors {
    // Primary — High-Energy Yellow
    val Primary = Color(0xFFFFCC00) // Electric Yellow
    val PrimaryDark = Color(0xFFCC9900)
    val PrimaryLight = Color(0xFFFFD633)
    val PrimaryContainer = Color(0xFF332900)
    val OnPrimary = Color(0xFF000000) // Black text on Yellow buttons looks insanely sharp
    val OnPrimaryContainer = Color(0xFFFFE680)

    // Secondary Colors
    val SecondaryContainer = Color(0xFF2A2A2A)
    val OnSecondaryContainer = Color(0xFFE0E0E0)

    // Accent — Aggressive Red (For important actions / notifications)
    val Accent = Color(0xFFE60000) // Racing Red
    val AccentDark = Color(0xFF990000)
    val AccentLight = Color(0xFFFF3333)
    val AccentContainer = Color(0xFF330000)
    val OnAccent = Color(0xFFFFFFFF)
    val OnAccentContainer = Color(0xFFFF9999)

    // Surface / Background — Pure Black & Charcoal
    val Background = Color(0xFF050505) // Near Pure Black
    val BackgroundElevated = Color(0xFF111111) // Very Dark Charcoal 
    val Surface = Color(0xFF161616)
    val SurfaceVariant = Color(0xFF1E1E1E)
    val SurfaceHigh = Color(0xFF262626)
    
    // Text remain Grey-scales for supreme legibility against Black!
    val OnBackground = Color(0xFFE1E1E1)
    val OnSurface = Color(0xFFD4D4D4)
    val OnSurfaceVariant = Color(0xFFA0A0A0)

    // Status Colors (Aligned slightly to match the intense new theme)
    val Success = Color(0xFF34C759)
    val SuccessContainer = Color(0xFF0A2912)
    val OnSuccess = Color(0xFF003920)
    val Error = Color(0xFFFF3B30) // Vibrant iOS Red
    val ErrorContainer = Color(0xFF330C0A)
    val OnError = Color(0xFF410002)
    val Warning = Color(0xFFFF9F0A)
    val WarningContainer = Color(0xFF332002)
    val Info = Color(0xFF0A84FF)
    val InfoContainer = Color(0xFF021A33)

    // Rc Currency — Blends organically with the Yellow primary now
    val RcGold = Color(0xFFFFD700) 
    val RcGoldDim = Color(0xFFCCAA00)

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
