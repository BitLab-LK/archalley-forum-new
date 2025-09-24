import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAdminAccess, logAdminAction } from "@/lib/admin-security"
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

    // Calculate the date 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    // Use Promise.all for better performance with parallel queries
    const [totalUsers, totalPosts, totalComments, activeUsers, recentActivity] = await Promise.all([
      // Get total users (exclude suspended users)
      prisma.users.count({
        where: {
          isSuspended: false
        }
      }),
      
      // Get total posts (exclude deleted posts if applicable)
      prisma.post.count(),
      
      // Get total comments
      prisma.comment.count(),
      
      // Get active users (users who have been active within the last 24 hours)
      prisma.users.count({
        where: {
          lastActiveAt: {
            gte: twentyFourHoursAgo
          },
          isSuspended: false
        }
      }),
      
      // Get recent activity stats for additional insights
      prisma.post.count({
        where: {
          createdAt: {
            gte: twentyFourHoursAgo
          }
        }
      })
    ])

    return NextResponse.json({
      totalUsers,
      totalPosts,
      totalComments,
      activeUsers,
      recentPosts: recentActivity,
      timestamp: new Date().toISOString(),
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