import { NextRequest, NextResponse } from "next/server"
import AdvertisementService from "@/lib/advertisement-service"
import { initialAdConfigs } from "@/lib/adConfig"

// Force this route to run in Node.js runtime (not Edge)
export const runtime = 'nodejs'

// WordPress API configuration
const WORDPRESS_API_BASE = process.env.WORDPRESS_API_URL || 'https://archalley.com/wp-json/wp/v2'

// Fetch ads from WordPress API
async function fetchWordPressAds(): Promise<any[]> {
  try {
    // Fetch ads from your WordPress custom post type or posts
    const response = await fetch(`${WORDPRESS_API_BASE}/advertisements?per_page=100&status=publish`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status}`)
    }
    
    const wpAds = await response.json()
    
    // Transform WordPress ads to our format
    return wpAds.map((ad: any) => ({
      id: `wp-${ad.id}`,
      size: ad.acf?.ad_size || ad.meta?.ad_size || '970x180', // ACF or meta fields
      imageUrl: ad.acf?.ad_image?.url || ad.featured_media_url || ad.acf?.ad_image,
      redirectUrl: ad.acf?.ad_link || ad.meta?.ad_link || '#',
      active: ad.status === 'publish',
      title: ad.title?.rendered || ad.acf?.ad_title || 'Advertisement',
      description: ad.acf?.ad_description || ad.excerpt?.rendered || '',
      weight: parseInt(ad.acf?.ad_weight || ad.meta?.ad_weight || '50'),
      priority: ad.acf?.ad_priority || ad.meta?.ad_priority || 'medium',
      source: 'wordpress'
    }))
  } catch (error) {
    console.error('Error fetching WordPress ads:', error)
    return []
  }
}

// Hybrid function: Get ads from database + WordPress + fallback
async function getHybridAdsBySize(size: string): Promise<any[]> {
  let allAds: any[] = []
  
  try {
    // 1. First, get ads from your database
    const dbAds = await AdvertisementService.getAdsBySize(size)
    allAds = dbAds.map(ad => ({ ...ad, source: 'database' }))
    console.log(`Found ${dbAds.length} database ads for size ${size}`)
  } catch (error) {
    console.error('Database error:', error)
  }
  
  try {
    // 2. Then, get ads from WordPress
    const wpAds = await fetchWordPressAds()
    const wpAdsForSize = wpAds.filter(ad => ad.size === size)
    allAds = [...allAds, ...wpAdsForSize]
    console.log(`Found ${wpAdsForSize.length} WordPress ads for size ${size}`)
  } catch (error) {
    console.error('WordPress API error:', error)
  }
  
  // 3. Finally, add sample ads if we still have no ads
  if (allAds.length === 0) {
    const sampleAds = initialAdConfigs.filter(ad => ad.size === size && ad.active)
    allAds = sampleAds.map(ad => ({ ...ad, source: 'sample' }))
    console.log(`Using ${sampleAds.length} sample ads for size ${size}`)
  }
  
  return allAds
}

async function getHybridActiveAds(): Promise<any[]> {
  let allAds: any[] = []
  
  try {
    // 1. Database ads
    const dbAds = await AdvertisementService.getActiveAds()
    allAds = dbAds.map(ad => ({ ...ad, source: 'database' }))
  } catch (error) {
    console.error('Database error:', error)
  }
  
  try {
    // 2. WordPress ads
    const wpAds = await fetchWordPressAds()
    allAds = [...allAds, ...wpAds]
  } catch (error) {
    console.error('WordPress API error:', error)
  }
  
  // 3. Sample ads as last resort
  if (allAds.length === 0) {
    allAds = initialAdConfigs.filter(ad => ad.active).map(ad => ({ ...ad, source: 'sample' }))
  }
  
  return allAds
}

// Fallback function to provide mock ads when all sources fail
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
      // Return active ads by specific size (hybrid: database + WordPress + sample)
      const size = searchParams.get('size')
      if (!size) {
        return NextResponse.json({ error: "Size parameter required" }, { status: 400 })
      }
      
      try {
        console.log(`🎯 Fetching ads for size: ${size}`)
        const ads = await getHybridAdsBySize(size)
        
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
        // Final fallback to sample data
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

    // Default: return all active ads (hybrid approach)
    try {
      console.log('🎯 Fetching all active ads (hybrid)')
      const ads = await getHybridActiveAds()
      
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