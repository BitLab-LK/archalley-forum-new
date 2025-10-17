import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getAllActiveBanners, 
  updateBannerStatus, 
  getAvailableSizes,
  trackAdClick
} from "@/lib/adConfig"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has permission to view ads
    const userRole = session.user.role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'stats') {
      // Return ad statistics
      const banners = getAllActiveBanners()
      const totalClicks = banners.reduce((sum, banner) => sum + (banner.clickCount || 0), 0)
      
      return NextResponse.json({
        success: true,
        stats: {
          totalBanners: banners.length,
          activeBanners: banners.filter(b => b.active).length,
          totalClicks,
          averageClicksPerBanner: banners.length > 0 ? (totalClicks / banners.length).toFixed(2) : 0,
          availableSizes: getAvailableSizes().length
        },
        banners: banners.map(banner => ({
          ...banner,
          clickCount: banner.clickCount || 0
        }))
      })
    }

    // Default: return all banners with details
    const banners = getAllActiveBanners()
    return NextResponse.json({
      success: true,
      banners,
      availableSizes: getAvailableSizes(),
      totalBanners: banners.length,
      activeBanners: banners.filter(b => b.active).length
    })

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

    // Check if user has permission to create/edit ads
    const userRole = session.user.role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    const { action, bannerId, active, adData } = body

    if (action === 'toggle') {
      // Toggle banner active status
      if (!bannerId || typeof active !== 'boolean') {
        return NextResponse.json({ error: "Invalid data for toggle action" }, { status: 400 })
      }

      const success = updateBannerStatus(bannerId, active)
      
      if (success) {
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

    if (action === 'track-click') {
      // Track ad click
      if (!bannerId) {
        return NextResponse.json({ error: "Banner ID required" }, { status: 400 })
      }

      trackAdClick(bannerId)
      
      return NextResponse.json({
        success: true,
        message: "Click tracked successfully",
        bannerId
      })
    }

    if (action === 'create') {
      // Create new banner (for future implementation)
      if (!adData) {
        return NextResponse.json({ error: "Ad data required" }, { status: 400 })
      }

      // TODO: Implement banner creation
      // This would require updating the adConfig system to support dynamic banner creation
      
      return NextResponse.json({
        success: false,
        error: "Banner creation not yet implemented"
      }, { status: 501 })
    }

    if (action === 'update') {
      // Update existing banner (for future implementation)
      if (!bannerId || !adData) {
        return NextResponse.json({ error: "Banner ID and data required" }, { status: 400 })
      }

      // TODO: Implement banner updates
      // This would require updating the adConfig system to support dynamic banner updates
      
      return NextResponse.json({
        success: false,
        error: "Banner updates not yet implemented"
      }, { status: 501 })
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

    // Check if user has permission to delete ads
    const userRole = session.user.role
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole || '')) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const bannerId = searchParams.get('id')

    if (!bannerId) {
      return NextResponse.json({ error: "Banner ID required" }, { status: 400 })
    }

    // For now, we'll just deactivate the banner since deletion would require
    // restructuring the adConfig system
    const success = updateBannerStatus(bannerId, false)
    
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