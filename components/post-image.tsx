"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { ImageIcon, Download } from "lucide-react"

interface PostImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  onClick?: () => void
  enableDownload?: boolean
}

// Function to force download the image in WebP format
const downloadImageAsWebP = async (src: string, filename: string) => {
  try {
    // Fetch the image
    const response = await fetch(src)
    const blob = await response.blob()
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.replace(/\.[^/.]+$/, '.webp') // Ensure .webp extension
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download image:', error)
    // Fallback to opening in new tab
    window.open(src, '_blank')
  }
}

export default function PostImage({ 
  src, 
  alt, 
  className = "", 
  fill = false, 
  sizes, 
  priority = false,
  onClick,
  enableDownload = false
}: PostImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [useNativeImg, setUseNativeImg] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    if (enableDownload) {
      e.preventDefault()
      setContextMenuPosition({ x: e.clientX, y: e.clientY })
      setShowContextMenu(true)
    }
  }

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false)
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
    return undefined
  }, [showContextMenu])

  // Auto-retry once after 2 seconds if image fails to load
  useEffect(() => {
    if (imageError && retryCount === 0) {
      console.log('🔄 Auto-retrying with native img in 1 second:', src)
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
            {enableDownload && (
              <button 
                className="text-xs text-purple-500 underline"
                onClick={(e) => {
                  e.stopPropagation()
                  downloadImageAsWebP(src, alt || 'image')
                }}
              >
                Download WebP
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Use native img tag as fallback after first failure
  if (useNativeImg) {
    if (fill) {
      return (
        <div className="relative w-full h-full">
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
            onContextMenu={handleContextMenu}
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
        </div>
      )
    } else {
      return (
        <div className="relative">
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
            onContextMenu={handleContextMenu}
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
        </div>
      )
    }
  }

  // Try Next.js Image first
  return (
    <div className="relative">
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
        sizes={sizes}
        priority={priority}
        unoptimized={true} // Add this to bypass Next.js optimization
        onClick={onClick}
        onContextMenu={handleContextMenu}
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
      
      {/* Custom Context Menu */}
      {showContextMenu && enableDownload && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[150px]"
          style={{ 
            left: `${contextMenuPosition.x}px`, 
            top: `${contextMenuPosition.y}px` 
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              downloadImageAsWebP(src, alt || 'image')
              setShowContextMenu(false)
            }}
          >
            <Download className="w-4 h-4" />
            Download as WebP
          </button>
        </div>
      )}
    </div>
  )
}
