import { NextRequest, NextResponse } from "next/server"
import AdvertisementService from "@/lib/advertisement-service"
import { initialAdConfigs } from "@/lib/adConfig"

// Force this route to run in Node.js runtime (not Edge)
export const runtime = 'nodejs'

// Simplified: Database-only with sample fallback
async function getAdsBySize(size: string): Promise<any[]> {
  try {
    console.log(`🎯 Fetching ads for size: ${size}`)
    
    // Get ads from database
    const dbAds = await AdvertisementService.getAdsBySize(size)
    
    if (dbAds.length > 0) {
      console.log(`✅ Found ${dbAds.length} database ads for size ${size}`)
      return dbAds.map(ad => ({ ...ad, source: 'database' }))
    }
    
    // Fallback to sample ads if no database ads
    console.log(`⚠️ No database ads found for size ${size}, using sample ads`)
    const sampleAds = initialAdConfigs.filter(ad => ad.size === size && ad.active)
    return sampleAds.map(ad => ({ ...ad, source: 'sample' }))
    
  } catch (error) {
    console.error('Database error, using sample ads:', error)
    const sampleAds = initialAdConfigs.filter(ad => ad.size === size && ad.active)
    return sampleAds.map(ad => ({ ...ad, source: 'sample_fallback' }))
  }
}

async function getActiveAds(): Promise<any[]> {
  try {
    console.log('🎯 Fetching all active ads from database')
    
    const dbAds = await AdvertisementService.getActiveAds()
    
    if (dbAds.length > 0) {
      console.log(`✅ Found ${dbAds.length} active database ads`)
      return dbAds.map(ad => ({ ...ad, source: 'database' }))
    }
    
    // Fallback to sample ads if no database ads
    console.log('⚠️ No database ads found, using sample ads')
    return initialAdConfigs.filter(ad => ad.active).map(ad => ({ ...ad, source: 'sample' }))
    
  } catch (error) {
    console.error('Database error, using sample ads:', error)
    return initialAdConfigs.filter(ad => ad.active).map(ad => ({ ...ad, source: 'sample_fallback' }))
  }
}

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
      const size = searchParams.get('size')
      if (!size) {
        return NextResponse.json({ error: "Size parameter required" }, { status: 400 })
      }
      
      try {
        const ads = await getAdsBySize(size)
        
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
            weight: ad.weight || 50,
            priority: ad.priority || 'medium',
            source: ad.source
          })),
          count: ads.length,
          sources: [...new Set(ads.map(ad => ad.source))]
        })
      } catch (error) {
        console.error('All sources failed, using sample ads for size:', size, error)
        const fallbackAds = getFallbackAdsBySize(size)
        return NextResponse.json({
          success: true,
          ads: fallbackAds.map(ad => ({ ...ad, source: 'sample_fallback' })),
          count: fallbackAds.length,
          sources: ['sample_fallback']
        })
      }
    }

    if (action === 'sizes') {
      try {
        const sizes = await AdvertisementService.getAvailableSizes()
        const activeSizes = []
        
        for (const size of sizes) {
          const adsForSize = await AdvertisementService.getAdsBySize(size)
          if (adsForSize.length > 0) {
            activeSizes.push(size)
          }
        }
        
        return NextResponse.json({
          success: true,
          sizes: activeSizes.length > 0 ? activeSizes : getFallbackSizes()
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

    // Default: return all active ads
    try {
      const ads = await getActiveAds()
      
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
          weight: ad.weight || 50,
          priority: ad.priority || 'medium',
          source: ad.source
        })),
        count: ads.length,
        sources: [...new Set(ads.map((ad: any) => ad.source))]
      })
    } catch (error) {
      console.error('All sources failed, using sample ads')
      const ads = getAllFallbackActiveAds()
      return NextResponse.json({
        success: true,
        ads: ads.map(ad => ({ ...ad, source: 'sample_fallback' })),
        count: ads.length,
        sources: ['sample_fallback']
      })
    }

  } catch (error) {
    console.error("Error in ads API GET:", error)
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
      if (!adId) {
        return NextResponse.json({ error: "Ad ID required" }, { status: 400 })
      }

      try {
        // Only track clicks for database ads (not sample ads)
        if (adId.startsWith('sample-')) {
          console.log(`📊 Sample ad click tracked (not persisted): ${adId}`)
          return NextResponse.json({
            success: true,
            message: "Click tracked (sample ad)"
          })
        }

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
      if (!adId) {
        return NextResponse.json({ error: "Ad ID required" }, { status: 400 })
      }

      try {
        // Only track impressions for database ads (not sample ads)
        if (adId.startsWith('sample-')) {
          return NextResponse.json({
            success: true,
            message: "Impression tracked (sample ad)"
          })
        }

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
    console.error("Error in ads API POST:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}