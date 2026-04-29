package com.krieta.com.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun PhotoCarousel(
    photos: List<String>,
    aspectRatio: Float?,
    isActive: Boolean,
    photoDuration: Long = 3000L,
    modifier: Modifier = Modifier
) {
    var currentIndex by remember { mutableStateOf(0) }
    var isPaused by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val pagerState = rememberPagerState(pageCount = { photos.size })

    // Auto-advance
    LaunchedEffect(isActive, currentIndex, isPaused) {
        if (isActive && !isPaused && photos.size > 1) {
            delay(photoDuration)
            val nextIndex = (currentIndex + 1) % photos.size
            currentIndex = nextIndex
            pagerState.animateScrollToPage(nextIndex)
        }
    }

    // Sync pager with currentIndex
    LaunchedEffect(pagerState.currentPage) {
        currentIndex = pagerState.currentPage
    }

    Box(modifier = modifier.fillMaxSize()) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            ZoomableImage(
                imageUrl = photos[page],
                aspectRatio = aspectRatio,
                modifier = Modifier.fillMaxSize()
            )
        }

        // Progress dots
        if (photos.size > 1) {
            Row(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 60.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                photos.forEachIndexed { index, _ ->
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(
                                if (index == currentIndex) Color.White
                                else Color.White.copy(alpha = 0.5f),
                                CircleShape
                            )
                    )
                }
            }
        }
    }
}
