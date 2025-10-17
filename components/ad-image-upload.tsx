"use client"

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { useAdImageUpload, type AdImageUploadResult } from '@/hooks/use-ad-image-upload'
import { cn } from '@/lib/utils'

interface AdImageUploadProps {
  adId?: string
  maxImages?: number
  onImagesChange?: (images: AdImageUploadResult[]) => void
  initialImages?: AdImageUploadResult[]
  className?: string
  disabled?: boolean
}

export default function AdImageUpload({
  adId,
  maxImages = 3,
  onImagesChange,
  initialImages = [],
  className,
  disabled = false
}: AdImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const {
    isUploading,
    uploadProgress,
    uploadedImages,
    error,
    uploadImages,
    deleteImage,
    clearError,
    canUploadMore
  } = useAdImageUpload({
    maxFiles: maxImages,
    onSuccess: (results) => {
      onImagesChange?.(results)
      console.log('✅ Advertisement images uploaded successfully:', results)
    },
    onError: (error) => {
      console.error('❌ Advertisement image upload error:', error)
    }
  })

  // Combine initial images with uploaded images
  const allImages = [...initialImages, ...uploadedImages]

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (disabled) return
    
    try {
      clearError()
      await uploadImages(files, adId)
    } catch (error) {
      // Error is handled by the hook
    }
  }, [uploadImages, adId, disabled, clearError])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setDragActive(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect, disabled])

  const handleRemoveImage = useCallback(async (imageUrl: string, index: number) => {
    try {
      // If it's an uploaded image, delete from server
      if (index >= initialImages.length) {
        await deleteImage(imageUrl)
      }
      
      // Update parent component
      const updatedImages = allImages.filter((_, i) => i !== index)
      onImagesChange?.(updatedImages)
    } catch (error) {
      console.error('Failed to remove image:', error)
    }
  }, [deleteImage, allImages, onImagesChange, initialImages.length])

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {canUploadMore && allImages.length < maxImages && (
        <Card>
          <CardContent className="p-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                dragActive 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
                disabled={disabled}
              />
              
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                
                <div>
                  <p className="text-lg font-medium">Upload Advertisement Images</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Drag and drop images here, or click to select files
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                  <Badge variant="secondary">JPEG</Badge>
                  <Badge variant="secondary">PNG</Badge>
                  <Badge variant="secondary">WebP</Badge>
                  <Badge variant="secondary">GIF</Badge>
                  <Badge variant="secondary">Max 10MB</Badge>
                  <Badge variant="secondary">{maxImages} images max</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading advertisement images...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Image Preview Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allImages.map((image, index) => (
            <Card key={`${image.url}-${index}`} className="group relative overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  
                  {/* Remove Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                    onClick={() => handleRemoveImage(image.url, index)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  {/* Image Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-medium truncate">{image.name}</p>
                    <p className="text-xs text-gray-300">
                      {(image.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Instructions */}
      {allImages.length === 0 && !isUploading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>No advertisement images uploaded yet</p>
          <p className="text-sm mt-1">Upload high-quality images for your advertisement</p>
        </div>
      )}

      {/* Image Count Info */}
      {allImages.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          {allImages.length} of {maxImages} images uploaded
          {!canUploadMore && allImages.length >= maxImages && (
            <span className="text-amber-600 dark:text-amber-400 ml-2">
              (Maximum reached)
            </span>
          )}
        </div>
      )}
    </div>
  )
}