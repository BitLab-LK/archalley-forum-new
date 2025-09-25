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