import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createActivityNotification } from "@/lib/notification-service"
import { sendNotificationEmail } from "@/lib/email-service"
import { z } from "zod"

// Enhanced validation schema
const voteSchema = z.object({
  type: z.enum(["UP", "DOWN"])
})

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT = {
  MAX_REQUESTS: 10, // Max 10 votes per minute per user
  WINDOW_MS: 60000, // 1 minute window
}

// Helper function to check rate limiting
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)
  
  if (!userLimit || (now - userLimit.lastReset) > RATE_LIMIT.WINDOW_MS) {
    // Reset window
    rateLimitMap.set(userId, { count: 1, lastReset: now })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT.MAX_REQUESTS) {
    return false
  }
  
  userLimit.count++
  return true
}

// Helper function to get vote counts efficiently
async function getVoteCounts(tx: any, postId: string) {
  const [upvotes, downvotes] = await Promise.all([
    tx.votes.count({
      where: { postId, type: "UP" }
    }),
    tx.votes.count({
      where: { postId, type: "DOWN" }
    })
  ])
  
  return { upvotes, downvotes }
}

// Helper function to get user's current vote
async function getUserVote(tx: any, postId: string, userId: string) {
  const userVote = await tx.votes.findUnique({
    where: {
      userId_postId: {
        userId,
        postId
      }
    },
    select: { type: true }
  })
  
  return userVote?.type?.toLowerCase() || null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const startTime = Date.now()
  let session = null
  let postId = ""
  
  try {
    // Get session
    session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" }, 
        { status: 401 }
      )
    }

    // Parse and validate request
    const body = await request.json()
    const { type } = voteSchema.parse(body)
    const resolvedParams = await params
    postId = resolvedParams.postId
    const userId = session.user.id

    // Validate inputs
    if (!postId || !userId) {
      return NextResponse.json(
        { error: "Invalid request parameters" }, 
        { status: 400 }
      )
    }

    // Check rate limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before voting again." }, 
        { status: 429 }
      )
    }

    // Perform vote operation in transaction for consistency
    const result = await prisma.$transaction(async (tx) => {
      // Verify post exists
      const post = await tx.post.findUnique({
        where: { id: postId },
        select: { id: true, authorId: true }
      })

      if (!post) {
        throw new Error("Post not found")
      }

      // Note: Self-voting is allowed in this implementation
      // If you want to prevent users from voting on their own posts, uncomment below:
      // if (post.authorId === userId) {
      //   throw new Error("Cannot vote on your own post")
      // }

      // Check for existing vote
      const existingVote = await tx.votes.findUnique({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      })

      let operation = ""
      
      if (existingVote) {
        if (existingVote.type === type) {
          // Remove vote (toggle off)
          await tx.votes.delete({
            where: { id: existingVote.id }
          })
          operation = "removed"
        } else {
          // Update vote (change from up to down or vice versa)
          await tx.votes.update({
            where: { id: existingVote.id },
            data: { type }
          })
          operation = "updated"
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
        operation = "created"
      }

      // Get updated counts and user vote atomically
      const [voteCounts, userVote] = await Promise.all([
        getVoteCounts(tx, postId),
        getUserVote(tx, postId, userId)
      ])

      return {
        operation,
        upvotes: voteCounts.upvotes,
        downvotes: voteCounts.downvotes,
        userVote,
        postId
      }
    }, {
      timeout: 10000, // 10 second timeout
      isolationLevel: "ReadCommitted" // Prevent phantom reads
    })

    const duration = Date.now() - startTime
    
    // Log successful operation
    console.log(`✅ Vote ${result.operation} for post ${postId} by user ${userId} in ${duration}ms`)

    // Send email notification for upvotes (likes) - but not for the post author's own votes
    if (type === "UP" && result.operation !== "removed") {
      try {
        // Get post and author details
        const [post, reactingUser] = await Promise.all([
          prisma.post.findUnique({
            where: { id: postId },
            select: { 
              authorId: true, 
              title: true,
              content: true
            }
          }),
          prisma.users.findUnique({
            where: { id: userId },
            select: { name: true, image: true }
          })
        ]);

        // Only send notification if someone else liked the post
        if (post && post.authorId !== userId && reactingUser) {
          // Create a meaningful post title/description
          let postDescription = '';
          if (post.title && post.title.trim()) {
            postDescription = post.title;
          } else if (post.content) {
            // Use first 50 characters of content as description
            const cleanContent = post.content.replace(/<[^>]*>/g, '').trim(); // Remove HTML tags
            postDescription = cleanContent.length > 50 ? cleanContent.substring(0, 50) + '...' : cleanContent;
          }

          // Create database notification
          await createActivityNotification(
            post.authorId,
            'POST_LIKE',
            {
              postId,
              authorId: userId,
              authorName: reactingUser.name || 'Someone',
              postTitle: postDescription,
              avatarUrl: reactingUser.image || undefined
            }
          );

          // Send email notification directly
          const emailSent = await sendNotificationEmail(
            post.authorId,
            'POST_LIKE',
            {
              postId,
              authorId: userId,
              postTitle: postDescription,
              customUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/posts/${postId}`
            }
          );
          console.log(`📧 Like notification ${emailSent ? 'sent successfully' : 'failed'} to post author`);
        }
      } catch (error) {
        console.error("Error sending like notification:", error);
        // Don't fail the vote operation if notification fails
      }
    }

    return NextResponse.json({
      upvotes: result.upvotes,
      downvotes: result.downvotes,
      userVote: result.userVote,
      success: true
    })

  } catch (error: any) {
    const duration = Date.now() - startTime
    
    // Enhanced error logging
    console.error(`❌ Vote API Error (${duration}ms):`, {
      error: error.message,
      postId,
      userId: session?.user?.id,
      stack: error.stack
    })

    // Return appropriate error response
    if (error.message === "Post not found") {
      return NextResponse.json(
        { error: "Post not found" }, 
        { status: 404 }
      )
    }
    
    // Note: Self-voting error handling removed since self-voting is now allowed
    // if (error.message === "Cannot vote on your own post") {
    //   return NextResponse.json(
    //     { error: "Cannot vote on your own post" }, 
    //     { status: 403 }
    //   )
    // }

    if (error.code === "P2002") { // Prisma unique constraint violation
      return NextResponse.json(
        { error: "Duplicate vote detected" }, 
        { status: 409 }
      )
    }

    // Generic server error
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    )
  }
}

// Get current vote counts and user vote status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    const postId = resolvedParams.postId

    if (!postId) {
      return NextResponse.json(
        { error: "Invalid post ID" }, 
        { status: 400 }
      )
    }

    // Get vote counts and user vote in parallel
    const [voteCounts, userVote] = await Promise.all([
      getVoteCounts(prisma, postId),
      session?.user?.id ? getUserVote(prisma, postId, session.user.id) : Promise.resolve(null)
    ])

    return NextResponse.json({
      upvotes: voteCounts.upvotes,
      downvotes: voteCounts.downvotes,
      userVote,
      success: true
    })

  } catch (error: any) {
    console.error("Error fetching vote data:", error)
    
    return NextResponse.json(
      { error: "Failed to fetch vote data" }, 
      { status: 500 }
    )
  }
}
