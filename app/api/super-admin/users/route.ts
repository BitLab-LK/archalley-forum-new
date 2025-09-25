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

    // Get all users with enhanced details
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastActiveAt: true,
        image: true,
        isVerified: true,
        isSuspended: true,
        _count: {
          select: {
            Post: true,
            Comment: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Format the response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name || "Unknown",
      email: user.email,
      role: user.role,
      joinDate: user.createdAt.toISOString(),
      lastLogin: user.lastActiveAt?.toISOString() || user.updatedAt.toISOString(),
      postCount: user._count.Post,
      commentCount: user._count.Comment,
      image: user.image,
      isActive: user.updatedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Active in last 30 days
      isVerified: user.isVerified,
      isSuspended: user.isSuspended
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}