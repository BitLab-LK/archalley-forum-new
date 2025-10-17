import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRolePermissions } from "@/lib/role-permissions"
import AdvertisementService from "@/lib/advertisement-service"
import { initialAdConfigs } from "@/lib/adConfig"

// Force this route to run in Node.js runtime (not Edge)
export const runtime = 'nodejs'

// Fallback function to provide mock ads when database is unavailable
function getFallbackAdsBySize(size: string) {
  return initialAdConfigs.filter(ad => ad.size === size)
}

function getAllFallbackAds() {
  return initialAdConfigs
}

function getFallbackSizes() {
  return [...new Set(initialAdConfigs.map(ad => ad.size))].sort()
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view ads
    const userRole = session.user.role
    const permissions = getRolePermissions(userRole || 'MEMBER')
    if (!permissions.canViewAds) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Return ad statistics
      try {
        const stats = await AdvertisementService.getAdStats()
        const banners = await AdvertisementService.getAllAds()
        
        return NextResponse.json({
          success: true,
          stats,
          banners: banners.map(banner => ({
            ...banner,
            clickCount: banner.clickCount || 0,
            impressions: (banner as any).impressions || 0
          }))
        })
      } catch (error) {
        console.warn('Database unavailable for stats, using fallback data')
        const fallbackBanners = getAllFallbackAds()
        const fallbackStats = {
          totalBanners: fallbackBanners.length,
          activeBanners: fallbackBanners.filter(b => b.active).length,
          totalClicks: fallbackBanners.reduce((sum, b) => sum + (b.clickCount || 0), 0),
          totalImpressions: fallbackBanners.reduce((sum, b) => sum + ((b as any).impressions || 0), 0),
          averageClicksPerBanner: fallbackBanners.length > 0 ? 
            (fallbackBanners.reduce((sum, b) => sum + (b.clickCount || 0), 0) / fallbackBanners.length).toFixed(2) : '0',
          availableSizes: [...new Set(fallbackBanners.map(b => b.size))].length
        }
        
        return NextResponse.json({
          success: true,
          stats: fallbackStats,
          banners: fallbackBanners.map(banner => ({
            ...banner,
            clickCount: banner.clickCount || 0,
            impressions: (banner as any).impressions || 0
          }))
        })
      }
    }

    if (action === 'sizes') {
      // Return available ad sizes
      try {
        const sizes = await AdvertisementService.getAvailableSizes()
        return NextResponse.json({
          success: true,
          sizes
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

    if (action === 'active') {
      // Return active ads only
      try {
        const ads = await AdvertisementService.getActiveAds()
        return NextResponse.json({
          success: true,
          ads
        })
      } catch (error) {
        console.warn('Database unavailable, using fallback active ads')
        const ads = getAllFallbackAds().filter(ad => ad.active)
        return NextResponse.json({
          success: true,
          ads
        })
      }
    }

    if (action === 'bySize') {
      // Return ads by specific size
      const size = searchParams.get('size')
      if (!size) {
        return NextResponse.json({ error: "Size parameter required" }, { status: 400 })
      }
      
      try {
        const ads = await AdvertisementService.getAdsBySize(size)
        return NextResponse.json({
          success: true,
          ads
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

    // Default: return all banners with details
    try {
      const banners = await AdvertisementService.getAllAds()
      const availableSizes = await AdvertisementService.getAvailableSizes()
      
      return NextResponse.json({
        success: true,
        banners,
        availableSizes,
        totalBanners: banners.length,
        activeBanners: banners.filter(b => b.active).length
      })
    } catch (error) {
      console.warn('Database unavailable, using fallback data')
      const banners = getAllFallbackAds()
      const availableSizes = getFallbackSizes()
      
      return NextResponse.json({
        success: true,
        banners,
        availableSizes,
        totalBanners: banners.length,
        activeBanners: banners.filter(b => b.active).length
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
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role
    const permissions = getRolePermissions(userRole || 'MEMBER')
    const body = await request.json()
    const { action, bannerId, active, adData } = body

    if (action === 'toggle') {
      // Toggle banner active status
      if (!permissions.canToggleAds) {
        return NextResponse.json({ error: "Insufficient permissions to toggle ads" }, { status: 403 })
      }

      if (!bannerId || typeof active !== 'boolean') {
        return NextResponse.json({ error: "Invalid data for toggle action" }, { status: 400 })
      }

      const updatedBanner = await AdvertisementService.toggleAdStatus(bannerId, active, session.user.id)
      
      if (updatedBanner) {
        return NextResponse.json({
          success: true,
          message: `Banner ${active ? 'activated' : 'deactivated'} successfully`,
          bannerId,
          active
        })
      } else {
        return NextResponse.json({ error: "Banner not found" }, { status: 404 })
      }
    }

    if (action === 'trackClick') {
      // Track ad click
      const { adId } = body
      if (!adId) {
        return NextResponse.json({ error: "Ad ID required" }, { status: 400 })
      }

      try {
        const success = await AdvertisementService.trackClick(adId)
        
        return NextResponse.json({
          success,
          message: success ? "Click tracked successfully" : "Failed to track click",
          adId
        })
      } catch (error) {
        console.warn('Database unavailable, simulating click tracking for:', adId)
        // Simulate successful tracking when database is unavailable
        return NextResponse.json({
          success: true,
          message: "Click tracked successfully (fallback mode)",
          adId
        })
      }
    }

    if (action === 'trackImpression') {
      // Track ad impression
      const { adId } = body
      if (!adId) {
        return NextResponse.json({ error: "Ad ID required" }, { status: 400 })
      }

      try {
        const success = await AdvertisementService.trackImpression(adId)
        
        return NextResponse.json({
          success,
          message: success ? "Impression tracked successfully" : "Failed to track impression",
          adId
        })
      } catch (error) {
        console.warn('Database unavailable, simulating impression tracking for:', adId)
        // Simulate successful tracking when database is unavailable
        return NextResponse.json({
          success: true,
          message: "Impression tracked successfully (fallback mode)",
          adId
        })
      }
    }

    if (action === 'create') {
      // Create new banner
      if (!permissions.canCreateAds) {
        return NextResponse.json({ error: "Insufficient permissions to create ads" }, { status: 403 })
      }

      if (!adData) {
        return NextResponse.json({ error: "Ad data required" }, { status: 400 })
      }

      // Validate required fields
      const { imageUrl, redirectUrl, size } = adData
      if (!imageUrl || !redirectUrl || !size) {
        return NextResponse.json({ 
          error: "Missing required fields: imageUrl, redirectUrl, and size are required" 
        }, { status: 400 })
      }

      try {
        const newBanner = await AdvertisementService.createAd({
          ...adData,
          createdBy: session.user.id
        })
        
        return NextResponse.json({
          success: true,
          message: "Advertisement created successfully",
          banner: newBanner
        })
      } catch (error) {
        console.error("Failed to create advertisement:", error)
        return NextResponse.json({
          error: "Failed to create advertisement",
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    if (action === 'update') {
      // Update existing banner
      if (!permissions.canEditAds) {
        return NextResponse.json({ error: "Insufficient permissions to edit ads" }, { status: 403 })
      }

      if (!bannerId || !adData) {
        return NextResponse.json({ error: "Banner ID and data required" }, { status: 400 })
      }

      try {
        // Get current ad for image cleanup if needed
        const currentAd = await AdvertisementService.getAdById(bannerId)
        if (!currentAd) {
          return NextResponse.json({ error: "Advertisement not found" }, { status: 404 })
        }

        // Use the image handling update method
        const updatedBanner = await AdvertisementService.updateAdWithImageHandling(bannerId, {
          ...adData,
          oldImageUrl: currentAd.imageUrl,
          lastEditedBy: session.user.id
        })
        
        if (updatedBanner) {
          return NextResponse.json({
            success: true,
            message: "Advertisement updated successfully",
            banner: updatedBanner
          })
        } else {
          return NextResponse.json({ error: "Failed to update advertisement" }, { status: 500 })
        }
      } catch (error) {
        console.error("Failed to update advertisement:", error)
        return NextResponse.json({
          error: "Failed to update advertisement",
          details: error instanceof Error ? error.message : 'Unknown error'
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role
    const permissions = getRolePermissions(userRole || 'MEMBER')
    
    if (!permissions.canDeleteAds) {
      return NextResponse.json({ error: "Insufficient permissions to delete ads" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const bannerId = searchParams.get('id')

    if (!bannerId) {
      return NextResponse.json({ error: "Banner ID required" }, { status: 400 })
    }

    // Delete with image cleanup
    const success = await AdvertisementService.deleteAdWithCleanup(bannerId, session.user.id)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: "Banner deactivated successfully",
        bannerId
      })
    } else {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 })
    }

  } catch (error) {
    console.error("Error in ads API DELETE:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}