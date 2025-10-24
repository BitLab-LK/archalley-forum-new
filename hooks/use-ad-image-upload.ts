import { useState, useCallback } from 'react'

export interface AdImageUploadResult {
  url: string
  name: string
  size: number
  type: string
  pathname: string
  downloadUrl: string
}

export interface AdImageUploadError {
  error: string
  details?: string[]
  errors?: string[]
}

export interface UseAdImageUploadOptions {
  maxFiles?: number
  onSuccess?: (results: AdImageUploadResult[]) => void
  onError?: (error: AdImageUploadError) => void
  onProgress?: (progress: number) => void
}

export function useAdImageUpload(options: UseAdImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedImages, setUploadedImages] = useState<AdImageUploadResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const uploadImages = useCallback(async (
    files: File[], 
    adId?: string
  ): Promise<AdImageUploadResult[]> => {
    if (!files || files.length === 0) {
      const error = 'No files selected'
      setError(error)
      throw new Error(error)
    }

    if (files.length > (options.maxFiles || 3)) {
      const error = `Maximum ${options.maxFiles || 3} images allowed`
      setError(error)
      throw new Error(error)
    }

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      
      files.forEach(file => {
        formData.append('adImages', file)
      })

      if (adId) {
        formData.append('adId', adId)
      }

      // Use XMLHttpRequest for progress tracking
      const result = await new Promise<AdImageUploadResult[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload/ad-images')
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(progress)
            options.onProgress?.(progress)
          }
        }
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              if (response.success && response.images) {
                resolve(response.images)
              } else {
                reject(new Error(response.error || 'Upload failed'))
              }
            } catch (error) {
              reject(new Error('Failed to parse response'))
            }
          } else {
            let errorMessage = 'Upload failed'
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              errorMessage = errorResponse.error || errorResponse.message || errorMessage
              
              // Handle validation errors
              if (errorResponse.details || errorResponse.errors) {
                const details = errorResponse.details || errorResponse.errors
                errorMessage += `\nDetails: ${details.join(', ')}`
              }
            } catch (parseError) {
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

      setUploadedImages(result)
      options.onSuccess?.(result)
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      options.onError?.({ error: errorMessage })
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [options])

  const deleteImage = useCallback(async (imageUrl: string): Promise<void> => {
    try {
      const response = await fetch(
        `/api/upload/ad-images?url=${encodeURIComponent(imageUrl)}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete image')
      }

      // Remove from uploaded images list
      setUploadedImages(prev => prev.filter(img => img.url !== imageUrl))
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed'
      setError(errorMessage)
      throw error
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setUploadedImages([])
    setError(null)
    setUploadProgress(0)
    setIsUploading(false)
  }, [])

  return {
    // State
    isUploading,
    uploadProgress,
    uploadedImages,
    error,
    
    // Actions
    uploadImages,
    deleteImage,
    clearError,
    reset,
    
    // Utilities
    hasImages: uploadedImages.length > 0,
    canUploadMore: uploadedImages.length < (options.maxFiles || 3)
  }
}