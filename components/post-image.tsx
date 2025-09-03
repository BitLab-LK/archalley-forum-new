"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { ImageIcon } from "lucide-react"

interface PostImageProps {
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

export default function PostImage({ 
  src, 
  alt, 
  className = "", 
  fill = false, 
  width,
  height,
  sizes, 
  priority = false,
  onClick,
  enableDownload = false // Kept for API compatibility but not used
}: PostImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [useNativeImg, setUseNativeImg] = useState(false)

  // Suppress unused variable warning
  void enableDownload

  // Auto-retry once after 2 seconds if image fails to load
  useEffect(() => {
    if (imageError && retryCount === 0) {
      const timer = setTimeout(() => {
        setRetryCount(1)
        setImageError(false)
        setIsLoading(true)
        setUseNativeImg(true) // Switch to native img for retry
      }, 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [imageError, retryCount, src])

  // If both Next.js Image and native img fail, show error UI
  if (imageError && retryCount > 0) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <div className="text-center p-4">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Image failed to load</p>
          <p className="text-xs text-gray-400 mb-2 break-all max-w-xs">{src.split('/').pop()}</p>
          <div className="space-x-2">
            <button 
              className="text-xs text-blue-500 underline"
              onClick={(e) => {
                e.stopPropagation()
                console.log('🔄 Manual retry image load:', src)
                setImageError(false)
                setIsLoading(true)
                setRetryCount(0)
                setUseNativeImg(false)
              }}
            >
              Retry
            </button>
            <button 
              className="text-xs text-green-500 underline"
              onClick={(e) => {
                e.stopPropagation()
                window.open(src, '_blank')
              }}
            >
              Open Direct
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Use native img tag as fallback after first failure
  if (useNativeImg) {
    if (fill) {
      return (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={`absolute inset-0 w-full h-full object-cover ${className} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            onError={(e) => {
              console.error('❌ Native img failed to load:', src, e)
              setImageError(true)
              setIsLoading(false)
            }}
            onLoad={() => {
              console.log('✅ Native img loaded successfully:', src)
              setIsLoading(false)
            }}
            onLoadStart={() => {
              console.log('🔄 Native img loading started:', src)
              setIsLoading(true)
            }}
            crossOrigin="anonymous"
            style={{ imageRendering: 'auto' }}
          />
        </>
      )
    } else {
      return (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            onError={(e) => {
              console.error('❌ Native img failed to load:', src, e)
              setImageError(true)
              setIsLoading(false)
            }}
            onLoad={() => {
              console.log('✅ Native img loaded successfully:', src)
              setIsLoading(false)
            }}
            onLoadStart={() => {
              console.log('🔄 Native img loading started:', src)
              setIsLoading(true)
            }}
            crossOrigin="anonymous"
            style={{ imageRendering: 'auto' }}
          />
        </>
      )
    }
  }

  // Try Next.js Image first
  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        className={`${className} ${onClick ? 'cursor-pointer' : ''}`}
        fill={fill}
        width={!fill ? width || 800 : undefined}
        height={!fill ? height || 600 : undefined}
        sizes={sizes}
        priority={priority}
        unoptimized={true} // Add this to bypass Next.js optimization
        onClick={onClick}
        onError={(e) => {
          console.error('❌ Next.js Image failed to load:', src, e)
          console.error('❌ Error details:', {
            currentSrc: e.currentTarget.currentSrc,
            naturalWidth: e.currentTarget.naturalWidth,
            naturalHeight: e.currentTarget.naturalHeight,
            complete: e.currentTarget.complete
          })
          setImageError(true)
          setIsLoading(false)
        }}
        onLoad={() => {
          console.log('✅ Next.js Image loaded successfully:', src)
          setIsLoading(false)
        }}
        onLoadStart={() => {
          console.log('🔄 Next.js Image loading started:', src)
          setIsLoading(true)
        }}
      />
    </>
  )
}
