import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { commentId } = await params

  try {
    // Find the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { users: true }
    })

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if user is the author or admin
    const isAuthor = comment.authorId === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete the comment and its replies (cascade delete)
    await prisma.comment.deleteMany({
      where: {
        OR: [
          { id: commentId },
          { parentId: commentId }
        ]
      }
    })

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
