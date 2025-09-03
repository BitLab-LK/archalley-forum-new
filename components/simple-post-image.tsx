"use client"

import { useState } from "react"
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

  // Suppress unused variable warnings for Next.js Image compatibility props
  void sizes
  void priority
  void enableDownload

  if (imageError) {
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
                setImageError(false)
                setIsLoading(true)
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
        className={`${className} ${onClick ? 'cursor-pointer' : ''} ${fill ? 'absolute inset-0 w-full h-full object-cover' : ''}`}
        width={!fill ? width || undefined : undefined}
        height={!fill ? height || undefined : undefined}
        onClick={onClick}
        onError={() => {
          setImageError(true)
          setIsLoading(false)
        }}
        onLoad={() => {
          setIsLoading(false)
        }}
        onLoadStart={() => {
          setIsLoading(true)
        }}
        crossOrigin="anonymous"
        style={{ imageRendering: 'auto' }}
      />
    </>
  )
}
