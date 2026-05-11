package com.krieta.feature.chat.presentation.room

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Link
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object UrlUtils {
    private val urlPattern = Regex(
        "(https?://)?([\\w-]+\\.)+[\\w-]+(/[\\w-./?%&=]*)?",
        RegexOption.IGNORE_CASE
    )
    
    fun extractUrls(text: String): List<String> {
        return urlPattern.findAll(text).map { it.value }.toList()
    }
    
    fun containsUrl(text: String): Boolean {
        return urlPattern.containsMatchIn(text)
    }
    
    fun getDomain(url: String): String {
        return try {
            val cleanUrl = if (!url.startsWith("http")) "https://$url" else url
            val domain = cleanUrl.substringAfter("://").substringBefore("/")
            domain
        } catch (e: Exception) {
            url
        }
    }
}

@Composable
fun LinkPreview(
    url: String,
    textColor: Color,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color.Gray.copy(alpha = 0.2f))
            .clickable { /* Open URL */ }
            .padding(12.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.Link,
                contentDescription = "Link",
                modifier = Modifier.size(24.dp),
                tint = textColor.copy(alpha = 0.7f)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = UrlUtils.getDomain(url),
                    fontSize = 13.sp,
                    color = textColor,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = url,
                    fontSize = 11.sp,
                    color = textColor.copy(alpha = 0.6f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}
