import crypto from 'crypto';
import { URL } from 'url';

// Allowed MIME types for chat media
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Max file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 20 * 1024 * 1024, // 20MB
};

// Malicious file patterns
const MALICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
];

// Dangerous file extensions
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js',
  '.jar', '.msi', '.app', '.deb', '.rpm', '.dmg', '.pkg',
  '.sh', '.bash', '.ps1', '.psm1',
];

export interface MediaValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
}

/**
 * Validate media file type and size
 */
export function validateMediaFile(
  mimeType: string,
  fileSize: number,
  fileName: string
): MediaValidationResult {
  // Check for dangerous extensions
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      error: 'File type not allowed for security reasons',
    };
  }

  // Determine media type
  let mediaType: 'image' | 'video' | 'document' | undefined;
  
  if (ALLOWED_MIME_TYPES.image.includes(mimeType)) {
    mediaType = 'image';
  } else if (ALLOWED_MIME_TYPES.video.includes(mimeType)) {
    mediaType = 'video';
  } else if (ALLOWED_MIME_TYPES.document.includes(mimeType)) {
    mediaType = 'document';
  } else {
    return {
      isValid: false,
      error: `File type ${mimeType} is not allowed`,
    };
  }

  // Check file size
  const maxSize = MAX_FILE_SIZES[mediaType];
  if (fileSize > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed (${maxSize / 1024 / 1024}MB)`,
    };
  }

  return {
    isValid: true,
    mediaType,
  };
}

/**
 * Validate and sanitize media URL
 * Ensures URL is from Cloudinary and hasn't been tampered with
 */
export function validateMediaUrl(url: string): MediaValidationResult {
  try {
    const parsedUrl = new URL(url);

    // Only allow Cloudinary URLs
    if (!parsedUrl.hostname.includes('cloudinary.com')) {
      return {
        isValid: false,
        error: 'Only Cloudinary URLs are allowed',
      };
    }

    // Ensure HTTPS
    if (parsedUrl.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Only HTTPS URLs are allowed',
      };
    }

    // Check for malicious patterns in URL
    const urlString = url.toLowerCase();
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(urlString)) {
        return {
          isValid: false,
          error: 'URL contains potentially malicious content',
        };
      }
    }

    // Sanitize URL (remove any query params that could be malicious)
    const sanitizedUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`;

    return {
      isValid: true,
      sanitizedUrl,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Validate link URL for security
 * Used when users share external links
 */
export function validateExternalLink(url: string): MediaValidationResult {
  try {
    const parsedUrl = new URL(url);

    // Block dangerous protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return {
        isValid: false,
        error: 'Only HTTP/HTTPS links are allowed',
      };
    }

    // Block localhost and private IPs
    const hostname = parsedUrl.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^0\.0\.0\.0$/,
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return {
          isValid: false,
          error: 'Private/local URLs are not allowed',
        };
      }
    }

    // Check for malicious patterns
    const urlString = url.toLowerCase();
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(urlString)) {
        return {
          isValid: false,
          error: 'URL contains potentially malicious content',
        };
      }
    }

    return {
      isValid: true,
      sanitizedUrl: url,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Generate a secure hash for media verification
 */
export function generateMediaHash(url: string, userId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${url}:${userId}:${Date.now()}`)
    .digest('hex');
}

/**
 * Scan text content for malicious patterns
 */
export function sanitizeTextContent(text: string): string {
  let sanitized = text;

  // Remove script tags and event handlers
  for (const pattern of MALICIOUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized.trim();
}
