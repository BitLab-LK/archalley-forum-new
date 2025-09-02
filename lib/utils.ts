import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomUUID } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a secure, anonymous filename for uploaded images
 * @param originalExtension - The original file extension (e.g., '.jpg', '.png')
 * @returns A secure filename like "img_abc123.ext"
 */
export function generateSecureImageFilename(originalExtension: string): string {
  // Generate shorter random string (8 characters)
  const randomStr = randomUUID().replace(/-/g, '').substring(0, 8)
  const extension = originalExtension.startsWith('.') ? originalExtension : `.${originalExtension}`
  
  // Format: img_abc123.ext (much shorter and cleaner)
  return `img_${randomStr}${extension}`
}

/**
 * Generates a user-friendly display filename for downloads
 * @param mimeType - The MIME type of the file
 * @param index - Optional index for multiple files
 * @returns A clean filename like "image.webp" or "photo_1.jpg"
 */
export function generateDisplayFilename(mimeType: string, index?: number): string {
  const extension = getExtensionFromMimeType(mimeType)
  
  if (index !== undefined && index > 0) {
    return `photo_${index + 1}${extension}`
  }
  
  // Simple, clean names for single images
  switch (mimeType) {
    case 'image/jpeg':
      return `photo${extension}`
    case 'image/png':
      return `image${extension}`
    case 'image/gif':
      return `animation${extension}`
    case 'image/webp':
      return `image${extension}`
    default:
      return `photo${extension}`
  }
}

/**
 * Gets the appropriate file extension based on MIME type
 * @param mimeType - The MIME type of the file
 * @returns The file extension
 */
export function getExtensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg'
    case 'image/png':
      return '.png'
    case 'image/gif':
      return '.gif'
    case 'image/webp':
      return '.webp'
    default:
      return '.jpg' // Default fallback
  }
}

/**
 * Sanitizes a filename by removing potentially dangerous characters
 * @param filename - The original filename
 * @returns A sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .substring(0, 100) // Limit length
}
