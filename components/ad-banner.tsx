"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { 
  getEnhancedAdBanner, 
  getNextRotationAd, 
  releaseAdPosition, 
  trackAdClickClient, 
  type AdBanner 
} from "@/lib/adConfig"

interface AdBannerProps {
  size: '680x180' | '350x350' | '970x180' | '800x200' | '400x400' | '320x320' | '1200x240' | '1200x300' | '100%x250' | '90%x180'
  className?: string
  showLabel?: boolean
  positionId?: string  // Unique identifier for this ad position
  autoRotate?: boolean // Enable auto-rotation (default: true)
  rotationInterval?: number // Rotation interval in seconds (30-60)
}

export default function AdBannerComponent({ 
  size, 
  className = "", 
  showLabel = false,  // Changed default to false
  positionId = `ad-${Math.random().toString(36).substr(2, 9)}`,
  autoRotate = true,
  rotationInterval = 45 // 45 seconds default
}: AdBannerProps) {
  const [banner, setBanner] = useState<AdBanner | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const componentMountedRef = useRef(true)

  // Derive fixed pixel dimensions when size is WxH (keep responsive for 100%x250)
  const isResponsive = size === '100%x250'
  const parsed = /^([0-9]+)x([0-9]+)$/.exec(size)
  const fixedWidth = !isResponsive && parsed ? parseInt(parsed[1], 10) : undefined
  const fixedHeight = !isResponsive && parsed ? parseInt(parsed[2], 10) : undefined

  // Load initial ad
  const loadInitialAd = useCallback(async () => {
    const selectedBanner = await getEnhancedAdBanner(size, positionId)
    setBanner(selectedBanner)
    setImageLoaded(false)
    setImageError(false)
  }, [size, positionId])

  // Rotate to next ad
  const rotateAd = useCallback(async () => {
    if (!banner || !componentMountedRef.current) return
    
    setIsRotating(true)
    
    // Get next ad for rotation
    const nextBanner = await getNextRotationAd(banner.id, size, positionId)
    
    if (nextBanner && nextBanner.id !== banner.id) {
      // Fade out current ad, then load new one
      setTimeout(() => {
        if (componentMountedRef.current) {
          setBanner(nextBanner)
          setImageLoaded(false)
          setImageError(false)
          setIsRotating(false)
        }
      }, 300) // 300ms fade transition
    } else {
      setIsRotating(false)
    }
  }, [banner, size, positionId])

  // Set up auto-rotation
  useEffect(() => {
    if (!autoRotate || !banner) return

    const intervalMs = rotationInterval * 1000
    rotationTimerRef.current = setInterval(rotateAd, intervalMs)

    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current)
      }
    }
  }, [autoRotate, rotationInterval, rotateAd, banner])

  // Load initial ad on mount
  useEffect(() => {
    loadInitialAd()
  }, [loadInitialAd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      componentMountedRef.current = false
      if (banner) {
        releaseAdPosition(banner.id)
      }
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current)
      }
    }
  }, [banner])

  const handleClick = () => {
    if (banner) {
      trackAdClickClient(banner.id)
      window.open(banner.redirectUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  if (!banner) {
    // Show loading indicator while ads are being fetched (no text, just visual)
    return (
      <div className={`${className} relative rounded-none overflow-visible`} style={{ width: fixedWidth, height: fixedHeight, margin: fixedWidth ? '0 auto' : undefined, borderRadius: 0, overflow: 'visible' }}>
        <div 
          className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center relative rounded-none"
          style={
            isResponsive
              ? { aspectRatio: '1200/250', minHeight: '250px', borderRadius: 0 }
              : { width: fixedWidth, height: fixedHeight, borderRadius: 0 }
          }
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 dark:border-gray-500"></div>
          
          {/* Small "Ad" label in top right corner */}
          {showLabel && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium text-gray-700 shadow-sm border border-gray-200/50">
                Ad
              </div>
            </div>
          )}
        </div>
        <div className="text-center mt-2 text-xs uppercase tracking-[0.35em] text-gray-500">ADVERTISEMENT</div>
      </div>
    )
  }

  // Generate placeholder image URL if actual image fails to load
  const placeholderUrl = `https://via.placeholder.com/${size.replace('x', 'x')}/f0f0f0/666666?text=Advertisement`

  return (
    <div className={`${className} relative group rounded-none overflow-visible`} style={{ width: fixedWidth, margin: fixedWidth ? '0 auto' : undefined, borderRadius: 0, overflow: 'visible' }}>
      <Card 
        className={`overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 border-gray-200 rounded-none ${
          isRotating ? 'opacity-70' : 'opacity-100'
        }`}
        onClick={handleClick}
        style={{
          animation: `fadeInAd 0.8s ease-out forwards`,
          opacity: isRotating ? 0.7 : 1,
          transition: 'opacity 0.3s ease-in-out',
          width: isResponsive ? '100%' : fixedWidth,
          margin: fixedWidth ? '0 auto' : 'auto',
          borderRadius: 0
        }}
      >
        <div 
          className="relative overflow-hidden bg-gray-50 rounded-none"
          style={
            isResponsive
              ? { aspectRatio: '1200/250', minHeight: '250px', borderRadius: 0 }
              : { width: fixedWidth, height: fixedHeight, borderRadius: 0 }
          }
        >
          <Image
            src={imageError ? placeholderUrl : banner.imageUrl}
            alt="Advertisement"
            fill
            className={`object-contain transition-all duration-300 ease-in-out ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            sizes={isResponsive ? '100vw' : fixedWidth ? `${fixedWidth}px` : undefined}
          />
          
          {/* Loading placeholder */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-none" />
          )}
          
          {/* Subtle hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-none" />
          
          {/* Small "Ad" label in top right corner (Google-style) */}
          {showLabel && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium text-gray-700 shadow-sm border border-gray-200/50">
                Ad
              </div>
            </div>
          )}
        </div>
      </Card>
      <div className="text-center mt-2 text-xs uppercase tracking-[0.35em] text-gray-500">ADVERTISEMENT</div>

      <style jsx>{`
        @keyframes fadeInAd {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// Enhanced sized components with unique position IDs and auto-rotation
export function LeaderboardAd({ className }: { className?: string }) {
  return (
    <AdBannerComponent 
      size="100%x250" 
      className={`w-full ${className}`} 
      positionId="leaderboard-main"
      autoRotate={true}
      rotationInterval={60} // 60 seconds for leaderboard
    />
  )
}

export function HorizontalAd({ className }: { className?: string }) {
  return (
    <AdBannerComponent 
      size="970x180" 
      className={`w-full ${className}`} 
      positionId="horizontal-main"
      autoRotate={true}
      rotationInterval={45}
      showLabel={false}
    />
  )
}

export function SquareAd({ className }: { className?: string }) {
  return (
    <AdBannerComponent 
      size="320x320" 
      className={className} 
      positionId="square-sidebar"
      autoRotate={true}
      rotationInterval={30}
      showLabel={false}
    />
  )
}

// Fixed Exel ad for sidebar
export function ExelAd({ className }: { className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 border-gray-200 rounded-none"
        onClick={() => {
          // Track click and open link
          console.log('Exel ad clicked')
          window.open('https://exel.com', '_blank', 'noopener,noreferrer')
        }}
        style={{
          animation: `fadeInAd 0.8s ease-out forwards`,
          opacity: 0,
          maxWidth: '320px',
          margin: '0 auto',
          borderRadius: 0
        }}
      >
        <div 
          className="relative overflow-hidden bg-gray-50 rounded-none"
          style={{
            aspectRatio: '1/1',
            minHeight: '320px',
            borderRadius: 0
          }}
        >
          <Image
            src="https://archalley.com/wp-content/uploads/2025/02/Exel-Banner-345-x-345-main-banner.webp"
            alt="Advertisement"
            fill
            className="object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 320px"
          />
          
          {/* Subtle hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-none" />
          
          {/* Small "Ad" label in top right corner (Google-style) */}
          <div className="absolute top-2 right-2 z-10">
            <div className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-medium text-gray-700 shadow-sm border border-gray-200/50">
              Ad
            </div>
          </div>
        </div>
      </Card>
      <div className="text-center mt-2 text-xs uppercase tracking-[0.35em] text-gray-500">ADVERTISEMENT</div>

      <style jsx>{`
        @keyframes fadeInAd {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}