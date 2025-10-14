import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateAdminAccess, logAdminAction } from "@/lib/admin-security"
import { onUserDeleted, onUserRoleUpdated } from "@/lib/stats-service"
import { updateUserActivityAsync } from "@/lib/activity-service"
import { validateSuperAdminOperation, logSuperAdminOperation } from "@/lib/super-admin-utils"
import { invalidateUserSessions } from "@/lib/session-invalidation"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const validation = await validateAdminAccess(request)
    
    if (!validation.isValid) {
      return validation.response!
    }

    const { user } = validation
    
    // Update admin activity for active user tracking
    updateUserActivityAsync(user!.id)
    
    // Log admin action
    logAdminAction("VIEW_USERS", user!.id, {
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Calculate the date 24 hours ago for active user detection
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

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

    // Format the user data with active status
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      joinDate: user.createdAt.toISOString().split("T")[0],
      lastLogin: user.lastActiveAt?.toISOString().split("T")[0] || "Never",
      postCount: user._count.Post,
      commentCount: user._count.Comment,
      isActive: user.lastActiveAt ? user.lastActiveAt >= twentyFourHoursAgo : false
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

    // Check super admin privileges for user role modification
    const superAdminValidation = validateSuperAdminOperation(user, "MODIFY_ROLES")
    if (!superAdminValidation.isValid) {
      return new NextResponse(superAdminValidation.errorMessage, { status: 403 })
    }

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
    if (!["MEMBER", "MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return new NextResponse("Invalid role", { status: 400 })
    }

    // Prevent non-super-admins from creating super admins
    if (role === "SUPER_ADMIN" && (user!.role as string) !== "SUPER_ADMIN") {
      return new NextResponse("Only super admins can assign super admin role", { status: 403 })
    }

    // Prevent modification of other super admins by non-super-admins
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    })
    
    if ((targetUser?.role as string) === "SUPER_ADMIN" && (user!.role as string) !== "SUPER_ADMIN") {
      return new NextResponse("Only super admins can modify super admin accounts", { status: 403 })
    }

    // Update user role and set roleChangedAt for session invalidation
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { 
        role,
        roleChangedAt: new Date() // This will invalidate all existing sessions
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true
      }
    })
    
    // Invalidate all user sessions (force re-authentication on all devices)
    try {
      await invalidateUserSessions(userId)
      console.log(`🔐 All sessions invalidated for user ${updatedUser.email} due to role change to ${role}`)
    } catch (sessionError) {
      console.error(`⚠️ Failed to invalidate sessions for user ${userId}:`, sessionError)
      // Continue execution - the role update was successful even if session invalidation failed
    }
    
    // Log admin action
    logAdminAction("UPDATE_USER_ROLE", user!.id, {
      targetUserId: userId,
      newRole: role,
      oldRole: targetUser?.role,
      sessionsInvalidated: true,
      ip: request.headers.get("x-forwarded-for") || "unknown"
    })

    // Broadcast real-time update to all admin dashboard users
    await onUserRoleUpdated()

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

    // Check super admin privileges for user deletion
    const superAdminValidation = validateSuperAdminOperation(user, "DELETE_USER")
    if (!superAdminValidation.isValid) {
      return new NextResponse(superAdminValidation.errorMessage, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new NextResponse("Missing user ID", { status: 400 })
    }

    // Prevent deletion of super admin accounts by non-super-admins
    const targetUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    })
    
    if ((targetUser?.role as string) === "SUPER_ADMIN" && (user!.role as string) !== "SUPER_ADMIN") {
      return new NextResponse("Super admin accounts cannot be deleted by non-super-admins", { status: 403 })
    }

    // Prevent self-deletion
    if (userId === user!.id) {
      return new NextResponse("Cannot delete your own account", { status: 400 })
    }
    
    // Log super admin operation
    logSuperAdminOperation("DELETE_USER", user!.id, userId, {
      targetUserRole: targetUser?.role,
      targetUserEmail: targetUser?.email,
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