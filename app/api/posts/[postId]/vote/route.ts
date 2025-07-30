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
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    console.log("=== Vote API START ===")
    
    const session = await getServerSession(authOptions)
    console.log("Session:", session ? { userId: session.user?.id, email: session.user?.email } : "No session")
    
    if (!session?.user) {
      console.log("❌ Unauthorized - no session or user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request body:", body)
    
    const { type } = voteSchema.parse(body)
    const { postId } = await params
    const userId = session.user.id

    console.log("Vote request:", { postId, type, userId })

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      console.log("❌ Post not found")
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user has already voted using the correct unique constraint
    const existingVote = await prisma.votes.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    console.log("Existing vote:", existingVote)

    if (existingVote) {
      if (existingVote.type === type) {
        // If same vote type, remove the vote
        await prisma.votes.delete({
          where: { id: existingVote.id }
        })
        console.log("✅ Vote removed")
      } else {
        // If different vote type, update the vote
        await prisma.votes.update({
          where: { id: existingVote.id },
          data: { type }
        })
        console.log("✅ Vote updated")
      }
    } else {
      // Create new vote
      await prisma.votes.create({
        data: {
          id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          postId,
          userId
        }
      })
      console.log("✅ New vote created")
    }

    // Get updated vote counts
    const upvotes = await prisma.votes.count({
      where: { 
        postId: postId, 
        type: "UP" 
      }
    })

    const downvotes = await prisma.votes.count({
      where: { 
        postId: postId, 
        type: "DOWN" 
      }
    })

    // Get user's current vote after the operation
    const updatedUserVote = await prisma.votes.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    const response = {
      upvotes,
      downvotes,
      userVote: updatedUserVote?.type || null
    }

    console.log("✅ Vote API Response:", response)
    console.log("=== Vote API END ===")

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Validation error:", error.errors)
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("❌ Vote error:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get vote counts for a post
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { postId } = await params

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
      const vote = await prisma.votes.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId
          }
        }
      })
      userVote = vote?.type || null
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