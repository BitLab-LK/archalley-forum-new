import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const voteSchema = z.object({
  voteType: z.enum(["up", "down"])
})

interface RouteParams {
  params: {
    commentId: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await request.json()
    const { voteType } = voteSchema.parse(body)
    const commentId = params.commentId
    const userId = session.user.id

    // Check if comment exists
    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if user has already voted
    const existingVote = await prisma.vote.findFirst({
      where: { commentId, userId }
    })

    const type = voteType.toUpperCase() === "UP" ? "UP" : "DOWN"

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote
        await prisma.vote.delete({ where: { id: existingVote.id } })
        return NextResponse.json({ message: "Vote removed" })
      } else {
        // Update vote
        await prisma.vote.update({ where: { id: existingVote.id }, data: { type } })
        return NextResponse.json({ message: "Vote updated" })
      }
    }

    // Create new vote
    await prisma.vote.create({ data: { type, commentId, userId } })
    return NextResponse.json({ message: "Vote recorded" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }
    console.error("Comment vote error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    const commentId = params.commentId
    // Get vote counts
    const [upvotes, downvotes] = await Promise.all([
      prisma.vote.count({ where: { commentId, type: "UP" } }),
      prisma.vote.count({ where: { commentId, type: "DOWN" } })
    ])
    // Get user's vote if authenticated
    let userVote = null
    if (session?.user) {
      const vote = await prisma.vote.findFirst({ where: { commentId, userId: session.user.id } })
      if (vote) userVote = vote.type
    }
    return NextResponse.json({ upvotes, downvotes, userVote })
  } catch (error) {
    console.error("Get comment votes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 