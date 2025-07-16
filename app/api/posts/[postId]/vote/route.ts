import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const voteSchema = z.object({
  type: z.enum(["UP", "DOWN"])
})

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type } = voteSchema.parse(body)
    const postId = params.postId
    const userId = session.user.id

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user has already voted
    const existingVote = await prisma.votes.findFirst({
      where: {
        postId,
        userId
      }
    })

    if (existingVote) {
      if (existingVote.type === type) {
        // If same vote type, remove the vote
        await prisma.votes.delete({
          where: { id: existingVote.id }
        })
        return NextResponse.json({ message: "Vote removed" })
      } else {
        // If different vote type, update the vote
        await prisma.votes.update({
          where: { id: existingVote.id },
          data: { type }
        })
        return NextResponse.json({ message: "Vote updated" })
      }
    }

    // Create new vote
    await prisma.votes.create({
      data: {
        id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        postId,
        userId
      }
    })

    return NextResponse.json({ message: "Vote recorded" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Vote error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get vote counts for a post
export async function GET(
  _request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.postId

    // Get vote counts
    const [upvotes, downvotes] = await Promise.all([
      prisma.votes.count({
        where: { postId, type: "UP" }
      }),
      prisma.votes.count({
        where: { postId, type: "DOWN" }
      })
    ])

    // Get user's vote if authenticated
    let userVote = null
    if (session?.user) {
      const vote = await prisma.votes.findFirst({
        where: {
          postId,
          userId: session.user.id
        }
      })
      if (vote) {
        userVote = vote.type
      }
    }

    return NextResponse.json({
      upvotes,
      downvotes,
      userVote
    })
  } catch (error) {
    console.error("Get votes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 