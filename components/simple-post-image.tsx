"use client"

import { useState, useEffect } from "react"
import { ImageIcon } from "lucide-react"

interface SimplePostImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  onClick?: () => void
  enableDownload?: boolean
}

export default function SimplePostImage({ 
  src, 
  alt, 
  className = "", 
  fill = false, 
  width,
  height,
  sizes, // Not used in native img, but kept for API compatibility
  priority = false, // Not used in native img, but kept for API compatibility
  onClick,
  enableDownload = false // Kept for API compatibility but not used
}: SimplePostImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [imageSrc, setImageSrc] = useState(src)

  // Suppress unused variable warnings for Next.js Image compatibility props
  void sizes
  void priority
  void enableDownload

  // Update image source when src prop changes (for real-time updates)
  useEffect(() => {
    if (src !== imageSrc) {
      setImageSrc(src)
      setImageError(false)
      setIsLoading(true)
      setRetryCount(0)
    }
  }, [src, imageSrc])

  // Auto-retry once after 1 second if image fails to load
  useEffect(() => {
    if (imageError && retryCount === 0) {
      const timer = setTimeout(() => {
        console.log('🔄 SimplePostImage: Auto-retrying image load:', imageSrc)
        setRetryCount(1)
        setImageError(false)
        setIsLoading(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [imageError, retryCount, imageSrc])

  // Preload image to check if it's accessible
  useEffect(() => {
    if (imageSrc) {
      const img = document.createElement('img')
      img.onload = () => {
        console.log('✅ SimplePostImage: Image preload successful:', imageSrc)
      }
      img.onerror = () => {
        console.warn('⚠️ SimplePostImage: Image preload failed:', imageSrc)
      }
      img.src = imageSrc
    }
  }, [imageSrc])

  const handleImageLoad = () => {
    console.log('✅ SimplePostImage: Image loaded successfully:', imageSrc)
    setIsLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    console.error('❌ SimplePostImage: Image failed to load:', imageSrc)
    setIsLoading(false)
    setImageError(true)
  }

  // Add cache busting to image URL for better real-time updates
  const getCacheBustedUrl = (url: string) => {
    if (!url) return url
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${Date.now()}`
  }

  const imageUrl = retryCount > 0 ? getCacheBustedUrl(imageSrc) : imageSrc

  if (imageError && retryCount > 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Image unavailable</p>
          <p className="text-xs text-gray-400 mb-2 break-all max-w-xs">{imageSrc.split('/').pop()}</p>
          <div className="space-x-2">
            <button 
              className="text-xs text-blue-500 underline"
              onClick={(e) => {
                e.stopPropagation()
                setImageError(false)
                setIsLoading(true)
                setRetryCount(0)
              }}
            >
              Retry
            </button>
            <button 
              className="text-xs text-green-500 underline"
              onClick={(e) => {
                e.stopPropagation()
                window.open(imageSrc, '_blank')
              }}
            >
              Open Direct
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${onClick ? 'cursor-pointer' : ''} ${fill ? 'absolute inset-0 w-full h-full object-cover' : ''}`}
        width={!fill ? width || undefined : undefined}
        height={!fill ? height || undefined : undefined}
        onClick={onClick}
        onError={handleImageError}
        onLoad={handleImageLoad}
        onLoadStart={() => {
          setIsLoading(true)
        }}
        crossOrigin="anonymous"
        style={{ imageRendering: 'auto' }}
        loading="lazy"
      />
    </div>
  )
}
