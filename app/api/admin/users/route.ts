import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAdminAccess, logAdminAction } from "@/lib/admin-security"
import { onUserDeleted } from "@/lib/stats-service"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    
    // Log admin action
    logAdminAction("VIEW_USERS", user!.id, {
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Get recent users with their roles and join dates
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        lastActiveAt: true,
        _count: {
          select: {
            Post: true,
            Comment: true
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
      lastLogin: user.lastActiveAt?.toISOString().split("T")[0] || "Never",
      postCount: user._count.Post,
      commentCount: user._count.Comment
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error("[ADMIN_USERS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Update user role
export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation

    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return new NextResponse("Missing required fields", { status: 400 })
    }
    
    // Log admin action
    logAdminAction("UPDATE_USER_ROLE", user!.id, {
      targetUserId: userId,
      newRole: role,
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Validate role
    if (!["MEMBER", "MODERATOR", "ADMIN"].includes(role)) {
      return new NextResponse("Invalid role", { status: 400 })
    }

    // Update user role
    const updatedUser = await prisma.users.update({
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
    
    // Log admin action
    logAdminAction("UPDATE_USER_ROLE", user!.id, {
      targetUserId: userId,
      newRole: role,
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    return NextResponse.json({ 
      message: "User role updated successfully", 
      user: updatedUser 
    })
  } catch (error) {
    console.error("[ADMIN_USERS_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

// Delete user
export async function DELETE(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse("Missing user ID", { status: 400 })
    }
    
    // Log admin action
    logAdminAction("DELETE_USER", user!.id, {
      targetUserId: userId,
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Delete user's posts, comments, and other related data first
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { authorId: userId } }),
      prisma.post.deleteMany({ where: { authorId: userId } }),
      prisma.users.delete({ where: { id: userId } })
    ])

    // Trigger real-time stats update
    await onUserDeleted()

    return NextResponse.json({ 
      message: "User deleted successfully" 
    })
  } catch (error) {
    console.error("[ADMIN_USERS_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}