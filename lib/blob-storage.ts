import { put, del } from '@vercel/blob'

export interface AdImageUploadResult {
  url: string
  name: string
  size: number
  type: string
  pathname: string
  downloadUrl: string
}

export interface AdImageUploadOptions {
  access?: 'public'
  addRandomSuffix?: boolean
  cacheControlMaxAge?: number
  folder?: string
}

// Advertisement-specific image validation
export function validateAdImage(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB for ads (larger than regular posts)
  const minSize = 1024 // 1KB minimum

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Only JPEG, PNG, WebP, and GIF are allowed for advertisements.`
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${file.name}. Maximum size is 10MB for advertisement images.`
    }
  }

  if (file.size < minSize) {
    return {
      valid: false,
      error: `File too small: ${file.name}. Minimum size is 1KB.`
    }
  }

  return { valid: true }
}

// Generate advertisement-specific filename
export function generateAdImageFilename(originalName: string, adId?: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  
  const prefix = adId ? `ad-${adId}` : 'ad'
  return `advertisements/${prefix}-${timestamp}-${randomString}.${extension}`
}

// Upload advertisement image to Vercel Blob
export async function uploadAdImageToBlob(
  file: File | Buffer,
  originalName: string,
  options?: AdImageUploadOptions & { adId?: string }
): Promise<AdImageUploadResult> {
  try {
    // Generate filename
    const filename = generateAdImageFilename(originalName, options?.adId)
    
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: options?.access || 'public',
      addRandomSuffix: options?.addRandomSuffix ?? false, // We already add our own suffix
      cacheControlMaxAge: options?.cacheControlMaxAge || 60 * 60 * 24 * 365, // 1 year for ads
    })

    return {
      url: blob.url,
      name: originalName,
      size: file instanceof File ? file.size : file.length,
      type: file instanceof File ? file.type : 'application/octet-stream',
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl || blob.url
    }
  } catch (error) {
    console.error('Advertisement image upload error:', error)
    throw new Error('Failed to upload advertisement image to blob storage')
  }
}

// Delete advertisement image from Vercel Blob
export async function deleteAdImageFromBlob(url: string): Promise<void> {
  try {
    await del(url)
    console.log(`🗑️ Deleted advertisement image: ${url}`)
  } catch (error) {
    console.error('Advertisement image delete error:', error)
    throw new Error('Failed to delete advertisement image from blob storage')
  }
}

// Batch upload multiple advertisement images
export async function uploadMultipleAdImages(
  files: File[],
  options?: AdImageUploadOptions & { adId?: string }
): Promise<AdImageUploadResult[]> {
  const results: AdImageUploadResult[] = []
  const errors: string[] = []

  for (const file of files) {
    try {
      // Validate each file
      const validation = validateAdImage(file)
      if (!validation.valid) {
        errors.push(validation.error!)
        continue
      }

      // Upload file
      const result = await uploadAdImageToBlob(file, file.name, options)
      results.push(result)
    } catch (error) {
      errors.push(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (errors.length > 0 && results.length === 0) {
    throw new Error(`All uploads failed: ${errors.join(', ')}`)
  }

  if (errors.length > 0) {
    console.warn('Some advertisement image uploads failed:', errors)
  }

  return results
}

// Get advertisement image info from URL
export function getAdImageInfoFromUrl(url: string): { 
  filename: string; 
  isAdImage: boolean; 
  pathname: string 
} {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop() || ''
    const isAdImage = pathname.includes('/advertisements/')
    
    return {
      filename,
      isAdImage,
      pathname
    }
  } catch (error) {
    return {
      filename: '',
      isAdImage: false,
      pathname: ''
    }
  }
}