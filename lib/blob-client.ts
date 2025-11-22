export interface UploadResult {
  url: string
  name: string
  size: number
  type: string
  pathname: string
  downloadUrl: string
}

export interface UploadError {
  error: string
  details?: string
  maxFileSize?: string
  allowedTypes?: string[]
}

// Upload files using the server-side blob API endpoint
export async function uploadToBlob(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<UploadResult[]> {
  
  if (!files || files.length === 0) {
    throw new Error('No files provided')
  }

  if (files.length > 5) {
    throw new Error('Maximum 5 files allowed per upload')
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  // Validate files
  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG, GIF, and WebP are allowed.`)
    }
    if (file.size > maxSize) {
      throw new Error(`File too large: ${file.name}. Maximum size is 5MB.`)
    }
  }

  const formData = new FormData()
  files.forEach(file => {
    formData.append('images', file)
  })

  try {
    // Use XMLHttpRequest for upload progress
    return new Promise<UploadResult[]>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload/blob')
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      }
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            if (response.images && Array.isArray(response.images)) {
              resolve(response.images)
            } else {
              reject(new Error('Invalid response format'))
            }
          } catch (error) {
            reject(new Error('Failed to parse response'))
          }
        } else {
          let errorMessage = 'Upload failed'
          try {
            const errorResponse = JSON.parse(xhr.responseText)
            console.error('❌ Server error response:', errorResponse)
            errorMessage = errorResponse.error || errorResponse.message || 'Cloud storage upload failed. Please try again.'
            
            // Add specific error details if available
            if (errorResponse.details) {
              errorMessage += ` Details: ${errorResponse.details}`
            }
          } catch (parseError) {
            console.error('❌ Failed to parse error response:', xhr.responseText)
            errorMessage = `Upload failed with status ${xhr.status}: ${xhr.statusText}`
          }
          reject(new Error(errorMessage))
        }
      }
      
      xhr.onerror = () => {
        reject(new Error('Network error during upload'))
      }
      
      xhr.send(formData)
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Delete a blob
export async function deleteBlob(url: string): Promise<void> {
  try {
    const response = await fetch(`/api/upload/blob?url=${encodeURIComponent(url)}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete file')
    }
  } catch (error) {
    console.error('Delete error:', error)
    throw error
  }
}

// Server-side upload (for API routes)
export async function uploadToBlobServer(
  file: File | Buffer,
  filename: string,
  fileSize: number,
  options?: {
    access?: 'public'
    addRandomSuffix?: boolean
    cacheControlMaxAge?: number
  }
): Promise<UploadResult> {
  
  const { uploadToAzureBlob } = await import('@/lib/azure-blob-storage')
  
  try {
    // Determine content type
    const contentType = file instanceof File ? file.type : 'application/octet-stream'
    
    const result = await uploadToAzureBlob(file, filename, {
      containerName: 'uploads',
      contentType,
      addRandomSuffix: options?.addRandomSuffix ?? true,
      cacheControl: `public, max-age=${options?.cacheControlMaxAge || 2592000}`, // 30 days
    })

    return {
      url: result.url,
      name: filename,
      size: fileSize,
      type: contentType,
      pathname: result.pathname,
      downloadUrl: result.downloadUrl
    }
  } catch (error) {
    console.error('Server upload error:', error)
    throw error
  }
}
