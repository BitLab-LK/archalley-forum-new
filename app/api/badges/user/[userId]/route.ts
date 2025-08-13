import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { badgeService } from "@/lib/badge-service"

// GET /api/badges/user/[userId] - Get user's badges
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    const userId = resolvedParams.userId

    // Users can view their own badges, or public profiles
    if (session?.user?.id !== userId) {
      // Check if profile is public (you can implement this logic)
      // For now, allow all badge viewing
    }

    const userBadges = await badgeService.getUserBadges(userId)
    return NextResponse.json(userBadges)
  } catch (error) {
    console.error("Error fetching user badges:", error)
    return NextResponse.json({ error: "Failed to fetch user badges" }, { status: 500 })
  }
}

// POST /api/badges/user/[userId]/check - Check and award automatic badges
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    const userId = resolvedParams.userId

    // Users can only check their own badges, or admins can check any
    if (session?.user?.id !== userId && session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await badgeService.checkAndAwardBadges(userId)
    
    return NextResponse.json({ 
      message: `${result.awardedBadges.length} badges awarded`,
      result 
    })
  } catch (error) {
    console.error("Error checking user badges:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
