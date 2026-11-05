package com.runinga.com.core.security

import kotlin.text.Regex

/**
 * Input validator and sanitizer to prevent SQL injection and XSS attacks
 * Protects against:
 * - SQL injection
 * - XSS attacks
 * - Script injection
 * - Path traversal
 * - Command injection
 */
object InputValidator {
    
    // SQL injection patterns
    private val SQL_INJECTION_PATTERNS = listOf(
        Regex("('.+(--|\\/\\*))|(--)|(;)|(\\|\\|)|(&&)", RegexOption.IGNORE_CASE),
        Regex("(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|eval|expression)", RegexOption.IGNORE_CASE),
        Regex("(\\bor\\b|\\band\\b)\\s*['\"]?\\s*['\"]?\\s*=\\s*['\"]?", RegexOption.IGNORE_CASE),
        Regex("(\\bor\\b|\\band\\b)\\s+\\d+\\s*=\\s*\\d+", RegexOption.IGNORE_CASE),
        Regex("(\\bor\\b|\\band\\b)\\s+['\"]\\w+['\"]\\s*=\\s*['\"]\\w+['\"]", RegexOption.IGNORE_CASE)
    )
    
    // XSS patterns
    private val XSS_PATTERNS = listOf(
        Regex("<script[^>]*>.*?</script>", RegexOption.IGNORE_CASE),
        Regex("<iframe[^>]*>.*?</iframe>", RegexOption.IGNORE_CASE),
        Regex("javascript:", RegexOption.IGNORE_CASE),
        Regex("on\\w+\\s*=", RegexOption.IGNORE_CASE),
        Regex("<img[^>]+src[^>]*>", RegexOption.IGNORE_CASE)
    )
    
    // Path traversal patterns
    private val PATH_TRAVERSAL_PATTERNS = listOf(
        Regex("\\.\\./"),
        Regex("\\.\\.\\\\"),
        Regex("%2e%2e/", RegexOption.IGNORE_CASE),
        Regex("%2e%2e\\\\", RegexOption.IGNORE_CASE)
    )
    
    /**
     * Validates and sanitizes text input
     * @throws SecurityException if malicious content detected
     */
    fun validateText(input: String, fieldName: String = "input"): String {
        if (input.isBlank()) return input
        
        // Check for SQL injection
        SQL_INJECTION_PATTERNS.forEach { pattern ->
            if (pattern.containsMatchIn(input)) {
                println("⚠️ SQL injection attempt detected in $fieldName: ${input.take(50)}")
                throw SecurityException("Invalid $fieldName: contains prohibited characters")
            }
        }
        
        // Check for XSS
        XSS_PATTERNS.forEach { pattern ->
            if (pattern.containsMatchIn(input)) {
                println("⚠️ XSS attempt detected in $fieldName: ${input.take(50)}")
                throw SecurityException("Invalid $fieldName: contains prohibited content")
            }
        }
        
        // Sanitize HTML entities
        return sanitizeHtml(input)
    }
    
    /**
     * Validates URL input
     */
    fun validateUrl(url: String): String {
        if (url.isBlank()) return url
        
        // Check for path traversal
        PATH_TRAVERSAL_PATTERNS.forEach { pattern ->
            if (pattern.containsMatchIn(url)) {
                println("⚠️ Path traversal attempt detected: ${url.take(50)}")
                throw SecurityException("Invalid URL: contains prohibited patterns")
            }
        }
        
        // Check for javascript: protocol
        if (url.trim().startsWith("javascript:", ignoreCase = true)) {
            println("⚠️ JavaScript protocol detected in URL")
            throw SecurityException("Invalid URL: javascript protocol not allowed")
        }
        
        // Validate URL format
        if (!url.matches(Regex("^https?://.*", RegexOption.IGNORE_CASE))) {
            println("⚠️ Invalid URL protocol: $url")
            throw SecurityException("Invalid URL: must use HTTP or HTTPS")
        }
        
        return url
    }
    
    /**
     * Validates numeric input
     */
    fun validateNumber(input: String, fieldName: String = "number"): Long {
        try {
            val number = input.toLongOrNull() 
                ?: throw SecurityException("Invalid $fieldName: not a valid number")
            
            // Prevent overflow attacks
            if (number < Long.MIN_VALUE / 2 || number > Long.MAX_VALUE / 2) {
                throw SecurityException("Invalid $fieldName: number out of safe range")
            }
            
            return number
        } catch (e: NumberFormatException) {
            throw SecurityException("Invalid $fieldName: not a valid number")
        }
    }
    
    /**
     * Validates ID format (UUID or alphanumeric)
     */
    fun validateId(id: String, fieldName: String = "ID"): String {
        if (id.isBlank()) {
            throw SecurityException("Invalid $fieldName: cannot be empty")
        }
        
        // Allow only alphanumeric, hyphens, and underscores
        if (!id.matches(Regex("^[a-zA-Z0-9_-]+$"))) {
            println("⚠️ Invalid ID format: $id")
            throw SecurityException("Invalid $fieldName: contains prohibited characters")
        }
        
        // Limit length to prevent DoS
        if (id.length > 100) {
            throw SecurityException("Invalid $fieldName: too long")
        }
        
        return id
    }
    
    /**
     * Validates email format
     */
    fun validateEmail(email: String): String {
        if (email.isBlank()) return email
        
        val emailRegex = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
        if (!email.matches(emailRegex)) {
            throw SecurityException("Invalid email format")
        }
        
        return email.lowercase()
    }
    
    /**
     * Sanitizes HTML content
     */
    private fun sanitizeHtml(input: String): String {
        return input
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;")
            .replace("/", "&#x2F;")
    }
    
    /**
     * Validates JSON payload
     */
    fun validateJson(json: String): String {
        if (json.isBlank()) return json
        
        // Check for excessive nesting (DoS prevention)
        val nestingLevel = json.count { it == '{' || it == '[' }
        if (nestingLevel > 50) {
            throw SecurityException("Invalid JSON: excessive nesting")
        }
        
        // Check for size (DoS prevention)
        if (json.length > 1_000_000) { // 1MB limit
            throw SecurityException("Invalid JSON: payload too large")
        }
        
        return json
    }
    
    /**
     * Rate limiting check (simple implementation)
     */
    private val actionTimestamps = mutableMapOf<String, MutableList<Long>>()
    
    fun checkRateLimit(action: String, maxRequests: Int = 10, windowMs: Long = 60000): Boolean {
        val now = System.currentTimeMillis()
        val timestamps = actionTimestamps.getOrPut(action) { mutableListOf() }
        
        // Remove old timestamps
        timestamps.removeAll { now - it > windowMs }
        
        // Check limit
        if (timestamps.size >= maxRequests) {
            println("⚠️ Rate limit exceeded for action: $action")
            return false
        }
        
        timestamps.add(now)
        return true
    }
}
