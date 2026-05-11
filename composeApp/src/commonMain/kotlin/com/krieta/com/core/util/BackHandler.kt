package com.krieta.com.core.util

import androidx.compose.runtime.Composable

/**
 * Cross-platform back handler
 * Handles back button press on Android, does nothing on iOS
 */
@Composable
expect fun BackHandler(enabled: Boolean = true, onBack: () -> Unit)
