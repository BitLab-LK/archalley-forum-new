import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get total users
    const totalUsers = await prisma.users.count()

    // Get total posts
    const totalPosts = await prisma.post.count()

    // Get total comments
    const totalComments = await prisma.comment.count()

    // Get active users (users who have logged in within the last 24 hours)
    const activeUsers = await prisma.users.count({
      where: {
        lastActiveAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    return NextResponse.json({
      totalUsers,
      totalPosts,
      totalComments,
      activeUsers
    })
  } catch (error) {
    console.error("[ADMIN_STATS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 