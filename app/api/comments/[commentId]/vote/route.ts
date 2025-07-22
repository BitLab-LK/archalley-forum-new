import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const voteSchema = z.object({
  voteType: z.enum(["up", "down"])
})

interface RouteParams {
  params: Promise<{
    commentId: string
  }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  try {
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const { voteType } = voteSchema.parse(body)
    const { commentId } = await params
    const userId = session.user.id

    // Validate inputs
    if (!commentId || !userId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Check if comment exists
    const comment = await prisma.comment.findUnique({ 
      where: { id: commentId } 
    })
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if user has already voted - use transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      const existingVote = await tx.votes.findFirst({
        where: { commentId, userId }
      })

      const type = voteType.toUpperCase() === "UP" ? "UP" : "DOWN"

      if (existingVote) {
        if (existingVote.type === type) {
          // Remove vote
          await tx.votes.delete({ where: { id: existingVote.id } })
          return { action: "removed" }
        } else {
          // Update vote
          await tx.votes.update({ where: { id: existingVote.id }, data: { type } })
          return { action: "updated" }
        }
      }

      // Create new vote
      await tx.votes.create({ 
        data: { 
          id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type, 
          commentId, 
          userId 
        } 
      })
      return { action: "created" }
    })

    return NextResponse.json({ message: `Vote ${result.action}` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Comment vote error:", error)
    const { commentId } = await params
    console.error("Comment ID:", commentId)
    console.error("User ID:", session?.user?.id)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const { commentId } = await params
    // Get vote counts
    const [upvotes, downvotes] = await Promise.all([
      prisma.votes.count({ where: { commentId, type: "UP" } }),
      prisma.votes.count({ where: { commentId, type: "DOWN" } })
    ])
    // Get user's vote if authenticated
    let userVote = null
    if (session?.user) {
      const vote = await prisma.votes.findFirst({ where: { commentId, userId: session.user.id } })
      if (vote) userVote = vote.type
    }
    return NextResponse.json({ upvotes, downvotes, userVote })
  } catch (error) {
    console.error("Get comment votes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 