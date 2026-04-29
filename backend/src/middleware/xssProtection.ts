import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';
import { escape } from 'html-escaper';

/**
 * Sanitize configuration for different content types
 */
const SANITIZE_CONFIG = {
  // Strict: Remove all HTML tags (for captions, comments, usernames)
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },
  
  // Basic: Allow safe formatting tags only (for descriptions, bios)
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },
  
  // Rich: Allow more formatting (for contest descriptions, product details)
  rich: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?):\/\/)/i,
    KEEP_CONTENT: true
  }
};

/**
 * Sanitize a single string value
 */
export function sanitizeString(value: string, level: 'strict' | 'basic' | 'rich' = 'strict'): string {
  if (!value || typeof value !== 'string') {
    return value;
  }

  // Remove null bytes
  let sanitized = value.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Apply DOMPurify based on level
  sanitized = DOMPurify.sanitize(sanitized, SANITIZE_CONFIG[level]);
  
  // Additional escape for strict mode
  if (level === 'strict') {
    sanitized = escape(sanitized);
  }
  
  return sanitized;
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any, fieldsConfig: Record<string, 'strict' | 'basic' | 'rich'>): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, fieldsConfig));
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && fieldsConfig[key]) {
      sanitized[key] = sanitizeString(value, fieldsConfig[key]);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, fieldsConfig);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * XSS Protection Middleware Factory
 * Sanitizes specified fields in request body
 */
export function xssProtection(fieldsConfig: Record<string, 'strict' | 'basic' | 'rich'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, fieldsConfig);
    }
    
    next();
  };
}

/**
 * Strict XSS protection for user-generated content
 * Use for: comments, captions, usernames, display names
 */
export const strictXssProtection = (fields: string[]) => {
  const config: Record<string, 'strict'> = {};
  fields.forEach(field => config[field] = 'strict');
  return xssProtection(config);
};

/**
 * Basic XSS protection with safe formatting
 * Use for: bios, short descriptions
 */
export const basicXssProtection = (fields: string[]) => {
  const config: Record<string, 'basic'> = {};
  fields.forEach(field => config[field] = 'basic');
  return xssProtection(config);
};

/**
 * Rich XSS protection with more formatting
 * Use for: contest descriptions, product details, long-form content
 */
export const richXssProtection = (fields: string[]) => {
  const config: Record<string, 'rich'> = {};
  fields.forEach(field => config[field] = 'rich');
  return xssProtection(config);
};

/**
 * Sanitize query parameters
 */
export function sanitizeQueryParams(req: Request, res: Response, next: NextFunction): void {
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeString(value, 'strict');
      }
    }
  }
  
  next();
}

/**
 * Validate and sanitize URL parameters
 */
export function sanitizeUrlParams(req: Request, res: Response, next: NextFunction): void {
  if (req.params && typeof req.params === 'object') {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        // For UUIDs and IDs, just validate format
        if (key.toLowerCase().includes('id')) {
          if (!/^[a-f0-9-]{36}$/i.test(value)) {
            res.status(400).json({ error: `Invalid ${key} format` });
            return;
          }
        } else {
          req.params[key] = sanitizeString(value, 'strict');
        }
      }
    }
  }
  
  next();
}
