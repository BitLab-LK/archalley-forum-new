import { NextResponse } from "next/server"
import { validateAdminAccess, logAdminAction } from "@/lib/admin-security"
import { getStatsData } from "@/lib/stats-service"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    
    // Log admin action
    logAdminAction("VIEW_STATS", user!.id, {
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Get stats using the service (with caching)
    const stats = await getStatsData()

    return NextResponse.json({
      ...stats,
      success: true
    })
  } catch (error) {
    console.error("[ADMIN_STATS] Error fetching statistics:", error)
    
    // Try to get user from validation if available
    let userId = "unknown"
    try {
      const validation = await validateAdminAccess(request)
      if (validation.isValid && validation.user) {
        userId = validation.user.id
      }
    } catch {}
    
    // Log the error for debugging
    logAdminAction("STATS_ERROR", userId, {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })
    
    return NextResponse.json(
      { 
        error: "Failed to fetch statistics",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown error" : undefined
      }, 
      { status: 500 }
    )
  }
} 