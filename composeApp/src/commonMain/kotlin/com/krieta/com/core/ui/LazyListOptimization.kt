package com.krieta.com.core.ui

import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.*

@Composable
fun LazyListState.isScrollingUp(): Boolean {
    var previousIndex by remember(this) { mutableStateOf(firstVisibleItemIndex) }
    var previousScrollOffset by remember(this) { mutableStateOf(firstVisibleItemScrollOffset) }
    
    return remember(this) {
        derivedStateOf {
            if (previousIndex != firstVisibleItemIndex) {
                previousIndex > firstVisibleItemIndex
            } else {
                previousScrollOffset >= firstVisibleItemScrollOffset
            }.also {
                previousIndex = firstVisibleItemIndex
                previousScrollOffset = firstVisibleItemScrollOffset
            }
        }
    }.value
}

@Composable
fun LazyListState.isItemVisible(index: Int, buffer: Int = 2): Boolean {
    val firstVisible by remember { derivedStateOf { firstVisibleItemIndex } }
    val lastVisible by remember { derivedStateOf { 
        layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: firstVisibleItemIndex 
    } }
    
    return index in (firstVisible - buffer)..(lastVisible + buffer)
}
