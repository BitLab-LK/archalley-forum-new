import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isAdmin } = await request.json()
    const postId = params.postId

    // Get the post to check ownership
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Allow deletion if user is admin or post author
    const isAuthor = post.authorId === session.user.id
    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete the post
    await prisma.post.delete({
      where: { id: postId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
} 