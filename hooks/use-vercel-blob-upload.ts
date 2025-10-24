import { useState, useCallback } from 'react'
import { uploadToBlob, deleteBlob, type UploadResult } from '@/lib/blob-client'
import { toast } from 'sonner'

interface UseVercelBlobUploadOptions {
  maxFiles?: number
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
  onProgress?: (progress: number) => void
  onSuccess?: (files: UploadResult[]) => void
  onError?: (error: string) => void
}

export function useVercelBlobUpload(options: UseVercelBlobUploadOptions = {}) {
  const {
    maxFiles = 5,
    maxFileSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    onProgress,
    onSuccess,
    onError
  } = options

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const validateFiles = useCallback((files: FileList | File[]): File[] => {
    const fileArray = Array.from(files)
    
    if (fileArray.length === 0) {
      throw new Error('No files selected')
    }

    if (fileArray.length > maxFiles) {
      throw new Error(`Maximum ${maxFiles} files allowed`)
    }

    // Validate each file
    fileArray.forEach((file, index) => {
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File ${index + 1} (${file.name}) has invalid type: ${file.type}`)
      }

      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
        throw new Error(`File ${index + 1} (${file.name}) is too large. Maximum size is ${maxSizeMB}MB`)
      }
    })

    return fileArray
  }, [maxFiles, maxFileSize, allowedTypes])

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    try {
      setIsUploading(true)
      setError(null)
      setUploadProgress(0)

      const validatedFiles = validateFiles(files)

      // Use the blob client to upload
      const results = await uploadToBlob(validatedFiles, (progress) => {
        setUploadProgress(progress)
        onProgress?.(progress)
      })

      setUploadedFiles(prev => [...prev, ...results])
      setUploadProgress(100)
      
      toast.success(`Successfully uploaded ${results.length} file${results.length > 1 ? 's' : ''}`)
      onSuccess?.(results)

      return results
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMessage)
      toast.error(errorMessage)
      onError?.(errorMessage)
      throw error
    } finally {
      setIsUploading(false)
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 2000)
    }
  }, [validateFiles, onProgress, onSuccess, onError])

  const removeFile = useCallback(async (index: number) => {
    try {
      const fileToRemove = uploadedFiles[index]
      if (fileToRemove) {
        await deleteBlob(fileToRemove.url)
        setUploadedFiles(prev => prev.filter((_, i) => i !== index))
        toast.success('File removed successfully')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove file'
      toast.error(errorMessage)
    }
  }, [uploadedFiles])

  const clearAllFiles = useCallback(async () => {
    try {
      // Delete all uploaded files from blob storage
      await Promise.all(uploadedFiles.map(file => deleteBlob(file.url)))
      setUploadedFiles([])
      setError(null)
      toast.success('All files cleared')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear files'
      toast.error(errorMessage)
    }
  }, [uploadedFiles])

  const resetUpload = useCallback(() => {
    setUploadedFiles([])
    setError(null)
    setUploadProgress(0)
  }, [])

  return {
    // State
    isUploading,
    uploadProgress,
    uploadedFiles,
    error,
    
    // Actions
    uploadFiles,
    removeFile,
    clearAllFiles,
    resetUpload,
    
    // Computed
    hasFiles: uploadedFiles.length > 0,
    canUploadMore: uploadedFiles.length < maxFiles,
    remainingSlots: maxFiles - uploadedFiles.length
  }
}
