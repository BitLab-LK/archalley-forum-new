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

/**
 * Deletes a file from Vercel Blob storage
 * @param url - The blob URL to delete
 * @returns Promise that resolves when deletion is complete
 */
export async function deleteBlobFile(url: string): Promise<void> {
  try {
    const { del } = await import('@vercel/blob')
    await del(url)
    console.log("✅ Blob file deleted successfully:", url)
  } catch (error) {
    console.error("❌ Failed to delete blob file:", url, error)
    throw error
  }
}

/**
 * Deletes multiple files from Vercel Blob storage
 * @param urls - Array of blob URLs to delete
 * @returns Promise that resolves when all deletions are complete
 */
export async function deleteBlobFiles(urls: string[]): Promise<PromiseSettledResult<void>[]> {
  const deletionPromises = urls.map(url => deleteBlobFile(url))
  return Promise.allSettled(deletionPromises)
}

/**
 * Cleans up orphaned blob files for a specific post
 * @param postId - The post ID to clean up attachments for
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupPostBlobs(postId: string): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    // Get all attachments for this post
    const attachments = await prisma.attachments.findMany({
      where: { postId },
      select: { url: true, filename: true }
    })

    if (attachments.length === 0) {
      console.log("No attachments found for post:", postId)
      return
    }

    console.log(`Cleaning up ${attachments.length} blob files for post:`, postId)

    // Delete all blob files
    const deletionResults = await deleteBlobFiles(attachments.map(a => a.url))
    
    // Log results
    const successful = deletionResults.filter(r => r.status === 'fulfilled').length
    const failed = deletionResults.filter(r => r.status === 'rejected').length
    
    console.log(`Blob cleanup complete for post ${postId}: ${successful} successful, ${failed} failed`)
    
    if (failed > 0) {
      console.warn(`Some blob files could not be deleted for post ${postId}`)
    }
  } catch (error) {
    console.error("Error during blob cleanup for post:", postId, error)
    throw error
  }
}
