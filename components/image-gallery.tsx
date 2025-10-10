'use client'

import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react'

interface ImageGalleryProps {
  images: (string | { url: string })[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function ImageGallery({ images, isOpen, onClose, initialIndex = 0 }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoom, setZoom] = useState(100)

  const imageUrls = images.map(img => typeof img === 'string' ? img : img.url)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
    setZoom(100)
    setIsZoomed(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))
    setZoom(100)
    setIsZoomed(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
    if (e.key === 'Escape') onClose()
  }

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25))
  }

  const resetZoom = () => {
    setZoom(100)
    setIsZoomed(false)
  }

  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = imageUrls[currentIndex]
    link.download = `image-${currentIndex + 1}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (imageUrls.length === 0) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0"
        onKeyDown={handleKeyDown}
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Header with controls */}
          <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <span className="text-sm font-medium">
                {currentIndex + 1} of {imageUrls.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                disabled={zoom <= 25}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <span className="text-white text-sm min-w-[3rem] text-center">
                {zoom}%
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                disabled={zoom >= 200}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Main image display */}
          <div className="flex-1 flex items-center justify-center p-4 pt-16 pb-20">
            <div 
              className="relative overflow-auto max-w-full max-h-full"
              style={{ 
                transform: `scale(${zoom / 100})`,
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <img
                src={imageUrls[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{
                  maxWidth: '90vw',
                  maxHeight: '70vh',
                  cursor: isZoomed ? 'grab' : 'zoom-in'
                }}
                onClick={() => setIsZoomed(!isZoomed)}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg'
                  e.currentTarget.alt = 'Image failed to load'
                }}
              />
            </div>
          </div>

          {/* Navigation arrows */}
          {imageUrls.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 p-0 rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 p-0 rounded-full"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Thumbnail strip */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-full">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentIndex(index)
                      setZoom(100)
                      setIsZoomed(false)
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === currentIndex
                        ? 'border-white shadow-lg scale-110'
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Keyboard shortcuts info */}
          <div className="absolute bottom-4 left-4 text-white/70 text-xs space-y-1">
            <div>← → Navigate</div>
            <div>ESC Close</div>
            <div>Click Zoom</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}