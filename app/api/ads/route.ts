import { NextRequest, NextResponse } from "next/server"
import AdvertisementService from "@/lib/advertisement-service"
import { initialAdConfigs } from "@/lib/adConfig"

// Force this route to run in Node.js runtime (not Edge)
export const runtime = 'nodejs'

// Fallback function to provide mock ads when database is unavailable
function getFallbackAdsBySize(size: string) {
  return initialAdConfigs.filter(ad => ad.size === size && ad.active)
}

function getAllFallbackActiveAds() {
  return initialAdConfigs.filter(ad => ad.active)
}

function getFallbackSizes() {
  return [...new Set(initialAdConfigs.filter(ad => ad.active).map(ad => ad.size))].sort()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'bySize') {
      // Return active ads by specific size (for public consumption)
      const size = searchParams.get('size')
      if (!size) {
        return NextResponse.json({ error: "Size parameter required" }, { status: 400 })
      }
      
      try {
        const ads = await AdvertisementService.getAdsBySize(size)
        return NextResponse.json({
          success: true,
          ads: ads.map(ad => ({
            id: ad.id,
            size: ad.size,
            imageUrl: ad.imageUrl,
            redirectUrl: ad.redirectUrl,
            active: ad.active,
            title: ad.title,
            description: ad.description,
            weight: ad.weight,
            priority: ad.priority
          }))
        })
      } catch (error) {
        // Fallback to mock data if database is unavailable
        console.warn('Database unavailable, using fallback ads for size:', size)
        const fallbackAds = getFallbackAdsBySize(size)
        return NextResponse.json({
          success: true,
          ads: fallbackAds
        })
      }
    }

    if (action === 'sizes') {
      // Return available ad sizes (public)
      try {
        const sizes = await AdvertisementService.getAvailableSizes()
        const activeSizes = []
        
        // Only return sizes that have active ads
        for (const size of sizes) {
          const adsForSize = await AdvertisementService.getAdsBySize(size)
          if (adsForSize.length > 0) {
            activeSizes.push(size)
          }
        }
        
        return NextResponse.json({
          success: true,
          sizes: activeSizes
        })
      } catch (error) {
        console.warn('Database unavailable, using fallback sizes')
        const sizes = getFallbackSizes()
        return NextResponse.json({
          success: true,
          sizes
        })
      }
    }

    // Default: return all active ads (public)
    try {
      const ads = await AdvertisementService.getActiveAds()
      
      return NextResponse.json({
        success: true,
        ads: ads.map(ad => ({
          id: ad.id,
          size: ad.size,
          imageUrl: ad.imageUrl,
          redirectUrl: ad.redirectUrl,
          active: ad.active,
          title: ad.title,
          description: ad.description,
          weight: ad.weight,
          priority: ad.priority
        }))
      })
    } catch (error) {
      console.warn('Database unavailable, using fallback active ads')
      const ads = getAllFallbackActiveAds()
      return NextResponse.json({
        success: true,
        ads
      })
    }

  } catch (error) {
    console.error("Error in public ads API GET:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, adId } = body

    if (action === 'trackClick') {
      // Track advertisement click (public action)
      if (!adId) {
        return NextResponse.json({ error: "Ad ID required" }, { status: 400 })
      }

      try {
        const success = await AdvertisementService.trackClick(adId)
        if (success) {
          return NextResponse.json({
            success: true,
            message: "Click tracked successfully"
          })
        } else {
          return NextResponse.json({
            success: false,
            error: "Failed to track click"
          }, { status: 500 })
        }
      } catch (error) {
        console.error('Error tracking click:', error)
        return NextResponse.json({
          success: false,
          error: "Failed to track click"
        }, { status: 500 })
      }
    }

    if (action === 'trackImpression') {
      // Track advertisement impression (public action)
      if (!adId) {
        return NextResponse.json({ error: "Ad ID required" }, { status: 400 })
      }

      try {
        const success = await AdvertisementService.trackImpression(adId)
        if (success) {
          return NextResponse.json({
            success: true,
            message: "Impression tracked successfully"
          })
        } else {
          return NextResponse.json({
            success: false,
            error: "Failed to track impression"
          }, { status: 500 })
        }
      } catch (error) {
        console.error('Error tracking impression:', error)
        return NextResponse.json({
          success: false,
          error: "Failed to track impression"
        }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Error in public ads API POST:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}