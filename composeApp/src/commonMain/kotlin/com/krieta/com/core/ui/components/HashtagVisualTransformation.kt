package com.krieta.com.core.ui.components

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation

class HashtagVisualTransformation(
    private val highlightColor: Color
) : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val inputText = text.text
        val annotatedString = buildAnnotatedString {
            append(inputText)
            
            // Regex for hashtags and mentions
            val regex = Regex("([#@][\\w]+)")
            val matches = regex.findAll(inputText)
            
            for (match in matches) {
                addStyle(
                    style = SpanStyle(color = highlightColor),
                    start = match.range.first,
                    end = match.range.last + 1
                )
            }
        }
        
        return TransformedText(annotatedString, OffsetMapping.Identity)
    }
}
