package com.krieta.com.core.ui.components

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation

class HashtagMentionVisualTransformation(
    private val baseColor: Color = Color.White,
    private val hashtagColor: Color = Color(0xFFF5A623),
    private val mentionColor: Color = Color(0xFF4FC3F7)
) : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val styledText = buildHashtagMentionAnnotatedString(
            text = text.text,
            baseColor = baseColor,
            hashtagColor = hashtagColor,
            mentionColor = mentionColor
        )
        return TransformedText(styledText, OffsetMapping.Identity)
    }
}
