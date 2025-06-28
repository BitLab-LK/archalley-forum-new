import { z } from "zod"

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Check rate limit for a given key
 * @param key - Unique identifier for rate limiting
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns boolean indicating if request is allowed
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const attempts = rateLimitMap.get(key)
  
  if (!attempts || now > attempts.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (attempts.count >= maxAttempts) {
    return false
  }
  
  attempts.count++
  return true
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [key, attempts] of rateLimitMap.entries()) {
    if (now > attempts.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000)

/**
 * Sanitize HTML content to prevent XSS
 * @param content - Raw HTML content
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate and sanitize filename
 * @param filename - Raw filename
 * @returns Sanitized filename or null if invalid
 */
export function sanitizeFilename(filename: string): string | null {
  if (!filename || typeof filename !== 'string') {
    return null
  }
  
  // Remove path traversal attempts and special characters
  const sanitized = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 100) // Limit length
  
  return sanitized || null
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns boolean indicating if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Generate CSRF token
 * @returns Random CSRF token
 */
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Validate CSRF token
 * @param token - Token to validate
 * @param expectedToken - Expected token value
 * @returns boolean indicating if token is valid
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken && token.length > 0
}

/**
 * Input validation schemas
 */
export const validationSchemas = {
  // User input validation
  userInput: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    bio: z.string().max(500, "Bio too long").optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
  }),

  // Post input validation
  postInput: z.object({
    content: z.string().min(1, "Content is required").max(10000, "Content too long"),
    categoryId: z.string().min(1, "Category is required"),
    isAnonymous: z.boolean().default(false),
    tags: z.array(z.string().max(50)).max(10, "Too many tags").optional(),
  }),

  // Comment input validation
  commentInput: z.object({
    content: z.string().min(1, "Content is required").max(2000, "Comment too long"),
    postId: z.string().min(1, "Post ID is required"),
    parentId: z.string().optional(),
  }),

  // Vote input validation
  voteInput: z.object({
    type: z.enum(["UP", "DOWN"]),
    postId: z.string().optional(),
    commentId: z.string().optional(),
  }),

  // File upload validation
  fileUpload: z.object({
    filename: z.string().min(1, "Filename is required"),
    size: z.number().max(5 * 1024 * 1024, "File too large"), // 5MB
    type: z.string().regex(/^image\/(jpeg|png|gif|webp)$/, "Invalid file type"),
  }),
}

/**
 * Validate input against schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}

/**
 * Escape SQL injection characters (for manual queries)
 * @param str - String to escape
 * @returns Escaped string
 */
export function escapeSql(str: string): string {
  return str
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
}

/**
 * Generate secure random string
 * @param length - Length of the string
 * @returns Random string
 */
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Check if string contains potentially dangerous content
 * @param content - Content to check
 * @returns boolean indicating if content is potentially dangerous
 */
export function containsDangerousContent(content: string): boolean {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ]
  
  return dangerousPatterns.some(pattern => pattern.test(content))
} 