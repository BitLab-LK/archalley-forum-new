"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { 
  getEnhancedAdBanner, 
  getNextRotationAd, 
  releaseAdPosition, 
  trackAdClick, 
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
  showLabel = true,
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

  // Load initial ad
  const loadInitialAd = useCallback(() => {
    const selectedBanner = getEnhancedAdBanner(size, positionId)
    setBanner(selectedBanner)
    setImageLoaded(false)
    setImageError(false)
  }, [size, positionId])

  // Rotate to next ad
  const rotateAd = useCallback(() => {
    if (!banner || !componentMountedRef.current) return
    
    setIsRotating(true)
    
    // Get next ad for rotation
    const nextBanner = getNextRotationAd(banner.id, size, positionId)
    
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
      trackAdClick(banner.id)
      window.open(banner.redirectUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleImageError = () => {
    setImageError(true)
  }

  if (!banner) {
    return null
  }

  // Generate placeholder image URL if actual image fails to load
  const placeholderUrl = `https://via.placeholder.com/${size.replace('x', 'x')}/f0f0f0/666666?text=Advertisement`

  return (
    <div className={`relative group ${className}`}>
      {showLabel && (
        <div className="flex justify-center mb-2">
          <Badge variant="outline" className="text-xs text-muted-foreground bg-gray-50">
            Advertisement
          </Badge>
        </div>
      )}
      
      <Card 
        className={`overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 border-gray-200 w-full rounded-xl ${
          isRotating ? 'opacity-70' : 'opacity-100'
        }`}
        onClick={handleClick}
        style={{
          animation: `fadeInAd 0.8s ease-out forwards`,
          opacity: isRotating ? 0.7 : 1,
          transition: 'opacity 0.3s ease-in-out',
          maxWidth: size === '90%x180' ? '90%' : size === '320x320' ? '320px' : '100%',
          margin: size === '90%x180' || size === '320x320' ? '0 auto' : 'auto'
        }}
      >
        <div 
          className="relative overflow-hidden bg-gray-50 w-full rounded-xl"
          style={{
            aspectRatio: size === '350x350' || size === '400x400' || size === '320x320' ? '1/1' : 
                        size === '680x180' || size === '800x200' || size === '90%x180' ? '5/1' : 
                        size === '970x180' || size === '1200x240' ? '5/1' : 
                        size === '1200x300' ? '4/1' :
                        size === '100%x250' ? '5/1' : '5/1',
            minHeight: size === '100%x250' ? '250px' : 
                      size === '90%x180' ? '180px' :
                      size === '1200x300' ? '300px' :
                      size === '1200x240' ? '240px' :
                      size === '800x200' ? '200px' :
                      size === '400x400' ? '400px' : 
                      size === '320x320' ? '320px' : 'auto'
          }}
        >
          <Image
            src={imageError ? placeholderUrl : banner.imageUrl}
            alt={banner.title || banner.id}
            fill
            className={`object-cover transition-all duration-300 ease-in-out group-hover:scale-105 rounded-xl ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            sizes={
              size === '350x350' || size === '400x400' || size === '320x320'
                ? "(max-width: 768px) 100vw, 320px"
                : size === '680x180' || size === '800x200' || size === '90%x180'
                ? "(max-width: 768px) 100vw, 90vw" 
                : size === '100%x250'
                ? "100vw"
                : "(max-width: 768px) 100vw, 90vw"
            }
          />
          
          {/* Loading placeholder */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded-xl" />
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-xl">
            <h3 className="text-white font-semibold text-sm mb-1">
              {banner.title || 'Advertisement'}
            </h3>
            {banner.description && (
              <p className="text-white/90 text-xs">
                {banner.description}
              </p>
            )}
            <div className="flex items-center mt-2">
              <ExternalLink className="h-3 w-3 text-white/80 mr-1" />
              <span className="text-white/80 text-xs">Click to visit</span>
            </div>
          </div>

          {/* Click indicator */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/90 rounded-full p-1">
              <ExternalLink className="h-3 w-3 text-gray-600" />
            </div>
          </div>
        </div>
      </Card>

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
      size="100%x250" 
      className={`w-full ${className}`} 
      positionId="horizontal-main"
      autoRotate={true}
      rotationInterval={45} // 45 seconds for horizontal
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
      rotationInterval={30} // 30 seconds for sidebar (faster rotation)
    />
  )
}

// Fixed Exel ad for sidebar
export function ExelAd({ className }: { className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="flex justify-center mb-2">
        <Badge variant="outline" className="text-xs text-muted-foreground bg-gray-50">
          Advertisement
        </Badge>
      </div>
      
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 border-gray-200 rounded-xl"
        onClick={() => {
          // Track click and open link
          console.log('Exel ad clicked')
          window.open('https://exel.com', '_blank', 'noopener,noreferrer')
        }}
        style={{
          animation: `fadeInAd 0.8s ease-out forwards`,
          opacity: 0,
          maxWidth: '320px',
          margin: '0 auto'
        }}
      >
        <div 
          className="relative overflow-hidden bg-gray-50 rounded-xl"
          style={{
            aspectRatio: '1/1',
            minHeight: '320px'
          }}
        >
          <Image
            src="https://archalley.com/wp-content/uploads/2025/02/Exel-Banner-345-x-345-main-banner.webp"
            alt="Exel Design Software"
            fill
            className="object-cover transition-all duration-300 ease-in-out group-hover:scale-105 rounded-xl"
            sizes="(max-width: 768px) 100vw, 320px"
          />
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-xl">
            <h3 className="text-white font-semibold text-sm mb-1">
              Exel Design Software
            </h3>
            <p className="text-white/90 text-xs">
              Professional architectural design tools
            </p>
            <div className="flex items-center mt-2">
              <ExternalLink className="h-3 w-3 text-white/80 mr-1" />
              <span className="text-white/80 text-xs">Click to visit</span>
            </div>
          </div>

          {/* Click indicator */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/90 rounded-full p-1">
              <ExternalLink className="h-3 w-3 text-gray-600" />
            </div>
          </div>
        </div>
      </Card>

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