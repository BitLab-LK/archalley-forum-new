import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { badgeService } from "@/lib/badge-service"

// GET /api/badges - Get all available badges
export async function GET() {
  try {
    const badges = await badgeService.getAllBadges()
    return NextResponse.json(badges)
  } catch (error) {
    console.error("Error fetching badges:", error)
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 })
  }
}

// POST /api/badges - Handle badge operations (admin only for manual awarding, or user badge checking)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Handle different actions
    if (body.action === 'checkMyBadges') {
      // Redirect to proper endpoint for checking user badges
      const result = await badgeService.checkAndAwardBadges(session.user.id)
      return NextResponse.json({ 
        message: `${result.awardedBadges.length} badges awarded`,
        awardedBadges: result.awardedBadges 
      })
    }
    
    // Manual badge awarding (admin only)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { userId, badgeId } = body

    if (!userId || !badgeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await badgeService.awardBadge(userId, badgeId, session.user.id)
    
    if (success) {
      return NextResponse.json({ message: "Badge awarded successfully" })
    } else {
      return NextResponse.json({ error: "Failed to award badge" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in badges API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
