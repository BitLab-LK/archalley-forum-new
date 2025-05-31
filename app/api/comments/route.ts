import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCommentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  postId: z.string(),
  parentId: z.string().optional(),
  isAnonymous: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, postId, parentId, isAnonymous } = createCommentSchema.parse(body)

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if parent comment exists (if provided)
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 })
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        parentId,
        authorId: session.user.id,
        isAnonymous,
      },
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
        _count: {
          select: { votes: true },
        },
      },
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
