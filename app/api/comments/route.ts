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

// GET /api/comments?postId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("postId")
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 })
  }
  // Fetch top-level comments (no parentId), latest first, with replies
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, image: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true, image: true } } }
      }
    }
  })
  // Format for frontend
  const formatted = comments.map(c => ({
    id: c.id,
    author: c.author.name,
    authorImage: c.author.image,
    content: c.content,
    createdAt: c.createdAt,
    replies: c.replies.map(r => ({
      id: r.id,
      author: r.author.name,
      authorImage: r.author.image,
      content: r.content,
      createdAt: r.createdAt,
      parentId: r.parentId
    }))
  }))
  return NextResponse.json({ comments: formatted })
}

// POST /api/comments
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json()
  const { postId, content, parentId } = body
  if (!postId || !content) {
    return NextResponse.json({ error: "Missing postId or content" }, { status: 400 })
  }
  // Create comment or reply
  const comment = await prisma.comment.create({
    data: {
      content,
      postId,
      authorId: session.user.id,
      parentId: parentId || null
    },
    include: {
      author: { select: { name: true, image: true } },
      replies: true
    }
  })
  return NextResponse.json({ comment })
}
