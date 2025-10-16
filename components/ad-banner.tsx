"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"
import { getRandomAdBanner, trackAdClick, type AdBanner } from "@/lib/adConfig"

interface AdBannerProps {
  size: '680x180' | '350x350' | '970x180'
  className?: string
  showLabel?: boolean
}

export default function AdBannerComponent({ size, className = "", showLabel = true }: AdBannerProps) {
  const [banner, setBanner] = useState<AdBanner | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    // Get a random banner for the specified size
    const randomBanner = getRandomAdBanner(size)
    setBanner(randomBanner)
  }, [size])

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
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 border-gray-200"
        onClick={handleClick}
        style={{
          animation: `fadeInAd 0.8s ease-out forwards`,
          opacity: 0
        }}
      >
        <div 
          className="relative overflow-hidden bg-gray-50"
          style={{
            aspectRatio: size === '350x350' ? '1/1' : size === '680x180' ? '680/180' : '970/180'
          }}
        >
          <Image
            src={imageError ? placeholderUrl : banner.imageUrl}
            alt={banner.title}
            fill
            className={`object-cover transition-all duration-300 ease-in-out group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            sizes={
              size === '350x350' 
                ? "(max-width: 768px) 100vw, 350px"
                : size === '680x180'
                ? "(max-width: 768px) 100vw, 680px" 
                : "(max-width: 768px) 100vw, 970px"
            }
          />
          
          {/* Loading placeholder */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="text-white font-semibold text-sm mb-1">
              {banner.title}
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

// Specific sized components for easier usage
export function LeaderboardAd({ className }: { className?: string }) {
  return <AdBannerComponent size="970x180" className={className} />
}

export function HorizontalAd({ className }: { className?: string }) {
  return <AdBannerComponent size="680x180" className={className} />
}

export function SquareAd({ className }: { className?: string }) {
  return <AdBannerComponent size="350x350" className={className} />
}