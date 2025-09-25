import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params
    const body = await request.json()
    const { role } = body

    // Validate role
    const validRoles = ['MEMBER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Prevent self-demotion
    if (userId === session.user.id && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Cannot demote yourself" }, { status: 403 })
    }

    // Update user role
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: { role: role as any },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    // Log the action
    console.log(`Super Admin ${session.user.email} changed user ${updatedUser.email} role to ${role}`)

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Delete user endpoint
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: userId } = await params

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 403 })
    }

    // Get user details before deletion
    const userToDelete = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent deletion of other super admins (optional safety measure)
    if (userToDelete.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Cannot delete other Super Admins" }, { status: 403 })
    }

    // Delete user and all related data
    await prisma.$transaction(async (tx) => {
      // Delete user's posts
      await tx.post.deleteMany({
        where: { authorId: userId }
      })

      // Delete user's comments
      await tx.comment.deleteMany({
        where: { authorId: userId }
      })

      // Delete user's accounts
      await tx.account.deleteMany({
        where: { userId: userId }
      })

      // Delete user's sessions
      await tx.session.deleteMany({
        where: { userId: userId }
      })

      // Delete other related data
      await tx.education.deleteMany({
        where: { userId: userId }
      })

      await tx.workExperience.deleteMany({
        where: { userId: userId }
      })

      await tx.notifications.deleteMany({
        where: { userId: userId }
      })

      await tx.userBadges.deleteMany({
        where: { userId: userId }
      })

      await tx.votes.deleteMany({
        where: { userId: userId }
      })

      await tx.flags.deleteMany({
        where: { userId: userId }
      })

      // Settings don't have userId field, skip this

      // Finally delete the user
      await tx.users.delete({
        where: { id: userId }
      })
    })

    // Log the action
    console.log(`Super Admin ${session.user.email} deleted user ${userToDelete.email}`)

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}