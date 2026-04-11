package com.krieta.com.core.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Universal Glassmorphic Component!
 * Enforces the Premium "Frosted Glass" architectural rule set securely across Mobile rendering engines!
 */
@Composable
fun GlassmorphicContainer(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(24.dp), // 24dp for massive luxury Pill-shaped rounding rules natively!
    alpha: Float = 0.15f,
    borderWidth: Dp = 1.dp,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .clip(shape)
            // Beautiful Frosted Background tint extracting native UI layouts seamlessly under darker surfaces!
            .background(Color.White.copy(alpha = alpha))
            // The "Glass Edge" highlight mapping light structures perfectly
            .border(
                width = borderWidth,
                color = Color.White.copy(alpha = 0.2f),
                shape = shape
            )
    ) {
        content()
    }
}
