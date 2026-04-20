package com.krieta.com.core.video

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.pager.PagerState
import androidx.compose.runtime.*
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filter

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun rememberOptimizedPagerState(
    initialPage: Int = 0,
    pageCount: () -> Int,
    onPageChanged: (Int) -> Unit = {}
): PagerState {
    val pagerState = androidx.compose.foundation.pager.rememberPagerState(
        initialPage = initialPage,
        pageCount = pageCount
    )
    
    LaunchedEffect(pagerState) {
        snapshotFlow { pagerState.currentPage }
            .distinctUntilChanged()
            .filter { !pagerState.isScrollInProgress }
            .collect { page ->
                onPageChanged(page)
            }
    }
    
    return pagerState
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun PagerState.isPageVisible(page: Int): Boolean {
    val currentPage by remember { derivedStateOf { this.currentPage } }
    val offset by remember { derivedStateOf { this.currentPageOffsetFraction } }
    
    return when {
        page == currentPage -> true
        page == currentPage + 1 && offset > 0.1f -> true
        page == currentPage - 1 && offset < -0.1f -> true
        else -> false
    }
}
