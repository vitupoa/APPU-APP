import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Input Sanitization Middleware
 * 
 * Prevents injection attacks by sanitizing user inputs:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection
 * - NoSQL Injection
 * - Command Injection
 * - Path Traversal
 * 
 * CRITICAL: This is the first line of defense against injection attacks.
 */

/**
 * Sanitize string input
 */
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;
  
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Sanitize HTML content (for bio, descriptions, etc.)
 */
function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return input;
  
  // Use DOMPurify to remove dangerous HTML
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * Validate and sanitize username
 */
function sanitizeUsername(username: string): string {
  if (typeof username !== 'string') return username;
  
  // Remove any characters that aren't alphanumeric, underscore, or hyphen
  let sanitized = username.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Ensure it starts with a letter
  if (!/^[a-zA-Z]/.test(sanitized)) {
    throw new Error('Username must start with a letter');
  }
  
  // Limit length
  if (sanitized.length < 3 || sanitized.length > 30) {
    throw new Error('Username must be between 3 and 30 characters');
  }
  
  return sanitized.toLowerCase();
}

/**
 * Validate and sanitize email
 */
function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return email;
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  return email.toLowerCase().trim();
}

/**
 * Validate and sanitize phone number
 */
function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') return phone;
  
  // Remove all non-digit characters
  let sanitized = phone.replace(/\D/g, '');
  
  // Validate length (10-15 digits)
  if (sanitized.length < 10 || sanitized.length > 15) {
    throw new Error('Invalid phone number length');
  }
  
  return sanitized;
}

/**
 * Validate and sanitize URL
 */
function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return url;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol');
    }
    
    return parsed.toString();
  } catch (error) {
    throw new Error('Invalid URL format');
  }
}

/**
 * Validate and sanitize amount (prevent negative, decimal manipulation)
 */
function sanitizeAmount(amount: number): number {
  if (typeof amount !== 'number') {
    throw new Error('Amount must be a number');
  }
  
  // Check for NaN, Infinity
  if (!Number.isFinite(amount)) {
    throw new Error('Invalid amount');
  }
  
  // Check for negative
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  
  // Round to 2 decimal places
  return Math.round(amount * 100) / 100;
}

/**
 * Recursively sanitize object
 */
function sanitizeObject(obj: any, depth = 0): any {
  // Prevent deep recursion attacks
  if (depth > 10) {
    throw new Error('Object nesting too deep');
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = sanitizeString(key);
      
      // Sanitize value
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[sanitizedKey] = sanitizeObject(value, depth + 1);
      } else {
        sanitized[sanitizedKey] = value;
      }
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * General input sanitization middleware
 */
export function sanitizeInputs(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query params
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize params
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error: any) {
    res.status(400).json({ 
      error: error.message || 'Invalid input',
      code: 'INVALID_INPUT'
    });
  }
}

/**
 * Profile update sanitization
 */
export function sanitizeProfileUpdate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { username, email, first_name, last_name, display_name, bio } = req.body;
    
    if (username !== undefined) {
      req.body.username = sanitizeUsername(username);
    }
    
    if (email !== undefined) {
      req.body.email = sanitizeEmail(email);
    }
    
    if (first_name !== undefined) {
      req.body.first_name = sanitizeString(first_name);
      if (req.body.first_name.length > 50) {
        throw new Error('First name too long');
      }
    }
    
    if (last_name !== undefined) {
      req.body.last_name = sanitizeString(last_name);
      if (req.body.last_name.length > 50) {
        throw new Error('Last name too long');
      }
    }
    
    if (display_name !== undefined) {
      req.body.display_name = sanitizeString(display_name);
      if (req.body.display_name.length > 50) {
        throw new Error('Display name too long');
      }
    }
    
    if (bio !== undefined) {
      req.body.bio = sanitizeHtml(bio);
      if (req.body.bio.length > 500) {
        throw new Error('Bio too long');
      }
    }
    
    next();
  } catch (error: any) {
    res.status(400).json({ 
      error: error.message || 'Invalid profile data',
      code: 'INVALID_PROFILE_DATA'
    });
  }
}

/**
 * Payment sanitization
 */
export function sanitizePaymentInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { amount, currency, phoneNumber, email, accountNumber } = req.body;
    
    if (amount !== undefined) {
      req.body.amount = sanitizeAmount(amount);
    }
    
    if (currency !== undefined) {
      // Validate currency code (ISO 4217)
      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new Error('Invalid currency code');
      }
      req.body.currency = currency.toUpperCase();
    }
    
    if (phoneNumber !== undefined) {
      req.body.phoneNumber = sanitizePhoneNumber(phoneNumber);
    }
    
    if (email !== undefined) {
      req.body.email = sanitizeEmail(email);
    }
    
    if (accountNumber !== undefined) {
      req.body.accountNumber = sanitizeString(accountNumber);
      // Remove any non-alphanumeric characters
      req.body.accountNumber = req.body.accountNumber.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    next();
  } catch (error: any) {
    res.status(400).json({ 
      error: error.message || 'Invalid payment data',
      code: 'INVALID_PAYMENT_DATA'
    });
  }
}

/**
 * Search query sanitization
 */
export function sanitizeSearchQuery(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const { query, q, search } = req.query;
    
    const searchTerm = query || q || search;
    
    if (searchTerm && typeof searchTerm === 'string') {
      // Remove special characters that could be used for injection
      let sanitized = searchTerm.replace(/[^\w\s-]/g, '');
      
      // Limit length
      if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100);
      }
      
      req.query.query = sanitized;
      req.query.q = sanitized;
      req.query.search = sanitized;
    }
    
    next();
  } catch (error: any) {
    res.status(400).json({ 
      error: error.message || 'Invalid search query',
      code: 'INVALID_SEARCH_QUERY'
    });
  }
}

/**
 * File upload sanitization
 */
export function sanitizeFileUpload(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (req.file) {
      // Validate file type
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime'
      ];
      
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new Error('Invalid file type');
      }
      
      // Validate file size (max 50MB)
      if (req.file.size > 50 * 1024 * 1024) {
        throw new Error('File too large');
      }
      
      // Sanitize filename
      req.file.originalname = sanitizeString(req.file.originalname);
      req.file.originalname = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    }
    
    next();
  } catch (error: any) {
    res.status(400).json({ 
      error: error.message || 'Invalid file upload',
      code: 'INVALID_FILE_UPLOAD'
    });
  }
}

/**
 * Zod schema validation middleware factory
 */
export function validateSchema<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      } else {
        res.status(400).json({
          error: 'Invalid input',
          code: 'INVALID_INPUT'
        });
      }
    }
  };
}

/**
 * Prevent path traversal attacks
 */
export function preventPathTraversal(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { path, file, filename } = req.query;
  
  const pathParams = [path, file, filename].filter(Boolean);
  
  for (const param of pathParams) {
    if (typeof param === 'string' && (param.includes('..') || param.includes('/'))) {
      res.status(400).json({
        error: 'Invalid path',
        code: 'PATH_TRAVERSAL_DETECTED'
      });
      return;
    }
  }
  
  next();
}

/**
 * Prevent command injection
 */
export function preventCommandInjection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const dangerousChars = ['|', '&', ';', '$', '`', '\n', '\r'];
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return dangerousChars.some(char => value.includes(char));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  
  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    res.status(400).json({
      error: 'Invalid input detected',
      code: 'COMMAND_INJECTION_DETECTED'
    });
    return;
  }
  
  next();
}
