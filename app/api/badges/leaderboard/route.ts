import { NextResponse } from "next/server"
import { badgeService } from "@/lib/badge-service"

// GET /api/badges/leaderboard - Get badge leaderboard
export async function GET() {
  try {
    const leaderboard = await badgeService.getBadgeLeaderboard(20)
    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error("Error fetching badge leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
