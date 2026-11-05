package com.runinga.com.core.image

import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import coil3.compose.AsyncImagePainter
import coil3.compose.rememberAsyncImagePainter
import coil3.request.ImageRequest
import coil3.size.Size

enum class ImageSize(val pixels: Int) {
    THUMBNAIL(200),
    SMALL(400),
    MEDIUM(800),
    LARGE(1200),
    FULL(0) // Original size
}

@Composable
fun OptimizedAsyncImage(
    model: Any?,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
    size: ImageSize = ImageSize.MEDIUM,
    crossfade: Boolean = true
) {
    val painter = rememberAsyncImagePainter(
        model = model
    )
    
    Image(
        painter = painter,
        contentDescription = contentDescription,
        modifier = modifier,
        contentScale = contentScale
    )
}
