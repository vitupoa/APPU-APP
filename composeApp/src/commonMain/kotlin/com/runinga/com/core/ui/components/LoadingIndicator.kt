package com.runinga.com.core.ui.components

import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue


import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.unit.dp
import com.runinga.com.core.theme.RuningaColors

@Composable
fun LoadingIndicator(
    modifier: Modifier = Modifier,
    fullScreen: Boolean = true
) {
    val infiniteTransition = rememberInfiniteTransition()
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        )
    )

    val container: @Composable (@Composable () -> Unit) -> Unit = if (fullScreen) {
        { content -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { content() } }
    } else {
        { content -> Box(modifier = modifier, contentAlignment = Alignment.Center) { content() } }
    }

    container {
        CircularProgressIndicator(
            modifier = Modifier.size(48.dp).rotate(rotation),
            color = RuningaColors.Primary,
            strokeWidth = 3.dp,
            trackColor = RuningaColors.PrimaryContainer
        )
    }
}

