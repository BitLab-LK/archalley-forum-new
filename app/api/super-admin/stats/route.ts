import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is SUPER_ADMIN
    const userRole = session.user.role as string;
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Super Admin access required" }, { status: 403 })
    }

    // Get enhanced statistics for super admin
    const [
      totalUsers,
      totalPosts,
      totalComments,
      activeUsers,
      totalAdmins,
      totalModerators,
      flaggedPosts,
      recentSignups
    ] = await Promise.all([
      prisma.users.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.users.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.users.count({
        where: {
          role: 'ADMIN'
        }
      }),
      prisma.users.count({
        where: {
          role: 'MODERATOR'
        }
      }),
      // Get flagged posts count - using a basic count for now
      prisma.post.count({
        where: {
          // Add appropriate flagged post condition based on your schema
          // For now, returning total posts as placeholder
        }
      }),
      prisma.users.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      })
    ])

    // Calculate database size (approximate)
    const tableStats = await prisma.$queryRaw`
      SELECT 
        ROUND(SUM(pg_total_relation_size(schemaname||'.'||tablename))::numeric / 1024 / 1024, 2) AS size_mb
      FROM pg_tables 
      WHERE schemaname = 'public'
    ` as Array<{ size_mb: number }>

    const databaseSize = tableStats[0]?.size_mb ? `${tableStats[0].size_mb} MB` : "Unknown"

    const stats = {
      totalUsers,
      totalPosts,
      totalComments,
      activeUsers,
      totalAdmins,
      totalModerators,
      flaggedPosts,
      recentSignups,
      systemHealth: "Good", // You can implement actual health checks
      databaseSize,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching super admin stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}