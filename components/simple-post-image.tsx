"use client"

import { useState, useEffect } from "react"
import { ImageIcon, Download } from "lucide-react"

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

// Function to force download the image in WebP format
const downloadImageAsWebP = async (src: string, filename: string) => {
  try {
    const response = await fetch(src)
    await response.blob() // Ensure the response is consumed
    
    // Create canvas to convert to WebP
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx?.drawImage(img, 0, 0)
      
      canvas.toBlob((webpBlob) => {
        if (webpBlob) {
          const url = URL.createObjectURL(webpBlob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${filename.replace(/\.[^/.]+$/, '')}.webp`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
      }, 'image/webp', 0.9)
    }
    
    img.src = src
  } catch (error) {
    console.error('Failed to download image:', error)
    // Fallback: direct download
    const a = document.createElement('a')
    a.href = src
    a.download = filename
    a.click()
  }
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
  enableDownload = false
}: SimplePostImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })

  // Suppress unused variable warnings for Next.js Image compatibility props
  void sizes
  void priority

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
        onContextMenu={handleContextMenu}
        onError={(e) => {
          console.error('❌ Image failed to load:', src, e)
          setImageError(true)
          setIsLoading(false)
        }}
        onLoad={() => {
          console.log('✅ Image loaded successfully:', src)
          setIsLoading(false)
        }}
        onLoadStart={() => {
          console.log('🔄 Image loading started:', src)
          setIsLoading(true)
        }}
        crossOrigin="anonymous"
        style={{ imageRendering: 'auto' }}
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
    </>
  )
}
