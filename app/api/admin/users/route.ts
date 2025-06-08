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

    // Get recent users with their roles and join dates
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10 // Limit to 10 most recent users
    })

    // Format the user data
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      joinDate: user.createdAt.toISOString().split("T")[0],
      lastLogin: user.lastLoginAt?.toISOString().split("T")[0] || "Never",
      postCount: user._count.posts,
      commentCount: user._count.comments
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("[ADMIN_USERS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Update user role
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { userId, role } = body

    if (!userId || !role) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Validate role
    if (!["USER", "MODERATOR", "ADMIN"].includes(role)) {
      return new NextResponse("Invalid role", { status: 400 })
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("[ADMIN_USERS_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Delete user
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse("Missing user ID", { status: 400 })
    }

    // Delete user's posts, comments, and other related data first
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { authorId: userId } }),
      prisma.post.deleteMany({ where: { authorId: userId } }),
      prisma.user.delete({ where: { id: userId } })
    ])

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[ADMIN_USERS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 