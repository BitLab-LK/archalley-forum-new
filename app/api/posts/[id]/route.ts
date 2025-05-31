import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            rank: true,
            isVerified: true,
          },
        },
        category: true,
        attachments: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                rank: true,
                isVerified: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    rank: true,
                    isVerified: true,
                  },
                },
              },
            },
            _count: {
              select: { votes: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Increment view count
    await prisma.post.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Get post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, isPinned, isLocked } = body

    // Check if post exists and user has permission
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check permissions
    const canEdit =
      existingPost.authorId === session.user.id || session.user.role === "ADMIN" || session.user.role === "MODERATOR"

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: any = {}
    if (content !== undefined) updateData.content = content
    if (isPinned !== undefined && (session.user.role === "ADMIN" || session.user.role === "MODERATOR")) {
      updateData.isPinned = isPinned
    }
    if (isLocked !== undefined && (session.user.role === "ADMIN" || session.user.role === "MODERATOR")) {
      updateData.isLocked = isLocked
    }

    const post = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            rank: true,
            isVerified: true,
          },
        },
        category: true,
        attachments: true,
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Update post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check permissions
    const canDelete =
      post.authorId === session.user.id || session.user.role === "ADMIN" || session.user.role === "MODERATOR"

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Delete post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
