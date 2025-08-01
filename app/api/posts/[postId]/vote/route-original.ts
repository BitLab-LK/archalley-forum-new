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
  let session = null
  let postId = ""
  
  try {
    console.log("=== Vote API START ===")
    
    session = await getServerSession(authOptions)
    console.log("Session:", session ? { userId: session.user?.id, email: session.user?.email } : "No session")
    
    if (!session?.user) {
      console.log("❌ Unauthorized - no session or user")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Request body:", body)
    
    const { type } = voteSchema.parse(body)
    const resolvedParams = await params
    postId = resolvedParams.postId
    const userId = session.user.id

    console.log("Vote request:", { postId, type, userId })

    // Use transaction for atomic operations to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      console.log("🔍 Starting transaction...")
      
      // Check if post exists
      console.log("🔍 Checking if post exists:", postId)
      const post = await tx.post.findUnique({
        where: { id: postId }
      })
      console.log("📝 Post found:", post ? "Yes" : "No")

      if (!post) {
        throw new Error("Post not found")
      }

      // Check if user has already voted using the correct unique constraint
      console.log("🔍 Checking existing vote for user:", userId)
      const existingVote = await tx.votes.findUnique({
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
          await tx.votes.delete({
            where: { id: existingVote.id }
          })
          console.log("✅ Vote removed")
        } else {
          // If different vote type, update the vote
          await tx.votes.update({
            where: { id: existingVote.id },
            data: { type }
          })
          console.log("✅ Vote updated")
        }
      } else {
        // Create new vote
        await tx.votes.create({
          data: {
            id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            postId,
            userId
          }
        })
        console.log("✅ New vote created")
      }

      // Get updated vote counts atomically within the transaction
      const [upvotes, downvotes, updatedUserVote] = await Promise.all([
        tx.votes.count({
          where: { 
            postId: postId, 
            type: "UP" 
          }
        }),
        tx.votes.count({
          where: { 
            postId: postId, 
            type: "DOWN" 
          }
        }),
        tx.votes.findUnique({
          where: {
            userId_postId: {
              userId,
              postId
            }
          }
        })
      ])

      return {
        upvotes,
        downvotes,
        userVote: updatedUserVote?.type?.toLowerCase() || null // Convert to lowercase for frontend
      }
    })

    console.log("✅ Vote API Response:", result)
    console.log("=== Vote API END ===")

    return NextResponse.json(result)
  } catch (error) {
    // Enhanced error logging for debugging
    console.error("❌ Vote API Error Details:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      postId: postId || "unknown",
      userId: session?.user?.id || "unknown",
      timestamp: new Date().toISOString()
    })
    
    if (error instanceof z.ZodError) {
      console.error("❌ Validation error:", error.errors)
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    if (error instanceof Error && error.message === "Post not found") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }
    
    // Return more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("❌ Final error response:", { error: errorMessage })
    
    return NextResponse.json({ 
      error: "Internal server error", 
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    }, { status: 500 })
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
      userVote = vote?.type?.toLowerCase() || null
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
