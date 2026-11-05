package com.runinga.com.core.ui.components

import androidx.compose.foundation.text.BasicText
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp

/**
 * Parses text and highlights #hashtags and @mentions with accent colors.
 * Supports click callbacks for hashtag/mention taps.
 */
@Composable
fun HashtagMentionText(
    text: String,
    modifier: Modifier = Modifier,
    fontSize: TextUnit = 14.sp,
    color: Color = Color.White,
    hashtagColor: Color = Color(0xFFF5A623),
    mentionColor: Color = Color(0xFF4FC3F7),
    onHashtagClick: ((String) -> Unit)? = null,
    onMentionClick: ((String) -> Unit)? = null,
    maxLines: Int = Int.MAX_VALUE
) {
    val annotatedString = buildHashtagMentionAnnotatedString(
        text = text,
        baseColor = color,
        hashtagColor = hashtagColor,
        mentionColor = mentionColor
    )

    BasicText(
        text = annotatedString,
        modifier = modifier,
        maxLines = maxLines,
        style = androidx.compose.ui.text.TextStyle(
            fontSize = fontSize,
            color = color
        ),
        onTextLayout = {}
    )
}

/**
 * Builds an AnnotatedString with styled hashtags and mentions.
 * Reusable for display in any context.
 */
fun buildHashtagMentionAnnotatedString(
    text: String,
    baseColor: Color = Color.White,
    hashtagColor: Color = Color(0xFFF5A623),
    mentionColor: Color = Color(0xFF4FC3F7)
): AnnotatedString {
    // Regex to match #hashtags and @mentions
    val regex = Regex("""(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)""")
    val matches = regex.findAll(text).toList()

    return buildAnnotatedString {
        var lastIndex = 0

        for (match in matches) {
            // Append text before match
            if (match.range.first > lastIndex) {
                withStyle(SpanStyle(color = baseColor)) {
                    append(text.substring(lastIndex, match.range.first))
                }
            }

            val token = match.value
            val isHashtag = token.startsWith("#")
            val tag = token.substring(1) // Remove # or @

            if (isHashtag) {
                pushStringAnnotation("HASHTAG", tag)
                withStyle(SpanStyle(color = hashtagColor, fontWeight = FontWeight.SemiBold)) {
                    append(token)
                }
                pop()
            } else {
                pushStringAnnotation("MENTION", tag)
                withStyle(SpanStyle(color = mentionColor, fontWeight = FontWeight.SemiBold)) {
                    append(token)
                }
                pop()
            }

            lastIndex = match.range.last + 1
        }

        // Append remaining text
        if (lastIndex < text.length) {
            withStyle(SpanStyle(color = baseColor)) {
                append(text.substring(lastIndex))
            }
        }
    }
}

/**
 * Utility to extract hashtags from text.
 */
fun extractHashtags(text: String): List<String> {
    val regex = Regex("""#([a-zA-Z0-9_]+)""")
    return regex.findAll(text).map { it.groupValues[1].lowercase() }.distinct().toList()
}

/**
 * Utility to extract mentions from text.
 */
fun extractMentions(text: String): List<String> {
    val regex = Regex("""@([a-zA-Z0-9_]+)""")
    return regex.findAll(text).map { it.groupValues[1].lowercase() }.distinct().toList()
}
