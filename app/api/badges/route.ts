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

// POST /api/badges - Award a badge manually (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, badgeId } = await request.json()

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
    console.error("Error awarding badge:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
