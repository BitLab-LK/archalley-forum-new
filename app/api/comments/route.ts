import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { badgeService } from "@/lib/badge-service"

// GET /api/comments?postId=...
export async function GET(request: NextRequest) {
  try {
    console.log('Comments API: Starting request');
    console.log('Comments API: NODE_ENV:', process.env.NODE_ENV);
    console.log('Comments API: Database URL exists:', !!process.env.DATABASE_URL);
    
    const session = await getServerSession(authOptions)
    console.log('Comments API: Session user:', session?.user?.id);
    
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get("postId")
    console.log('Comments API: PostId:', postId);
    
    if (!postId) {
      console.error('Comments API: Missing postId');
      return NextResponse.json({ error: "Missing postId" }, { status: 400 })
    }
    
    console.log('Comments API: Fetching comments for postId:', postId);
    
    // Test database connection before proceeding
    try {
      await prisma.users.findFirst({ select: { id: true } })
    } catch (dbError) {
      console.error("Comments API: Database connection failed", dbError)
      return NextResponse.json({
        error: 'Database temporarily unavailable',
        message: 'Unable to connect to the database. Please try again in a moment.',
        details: 'Comments cannot be loaded due to database connectivity issues'
      }, { status: 503 })
    }
    
    // Fetch ALL comments for this post (both top-level and nested)
    const allComments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: {
        users: { select: { name: true, image: true, id: true } }
      }
    })
    
    console.log('Comments API: Found comments count:', allComments.length);
    
    // Get vote counts for all comments at once
    const allCommentIds = allComments.map(c => c.id)
    const allVotes = await prisma.votes.findMany({
      where: { commentId: { in: allCommentIds } }
    })
    
    console.log('Comments API: Found votes count:', allVotes.length);
  
  // Helper function to build nested comment structure recursively
  const buildCommentTree = (parentId: string | null): any[] => {
    return allComments
      .filter(c => c.parentId === parentId)
      .map(c => {
        const commentVotes = allVotes.filter(v => v.commentId === c.id)
        const upvotes = commentVotes.filter(v => v.type === "UP").length
        const downvotes = commentVotes.filter(v => v.type === "DOWN").length
        const userVote = session?.user ? commentVotes.find(v => v.userId === session.user.id)?.type?.toLowerCase() : undefined
        
        return {
          id: c.id,
          author: c.users.name,
          authorId: c.users.id,
          authorImage: c.users.image,
          content: c.content,
          createdAt: c.createdAt,
          parentId: c.parentId,
          upvotes,
          downvotes,
          userVote,
          replies: buildCommentTree(c.id) // Recursively get all nested replies
        }
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
  
  // Build the complete nested structure starting from top-level comments
  const nestedComments = buildCommentTree(null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Latest top-level first
  
  console.log('Comments API: Returning comments count:', nestedComments.length);
  return NextResponse.json({ comments: nestedComments });
  
  } catch (error) {
    console.error('Comments API: Error fetching comments:', error);
    
    // Handle specific database connection errors
    if (error instanceof Error && (
      error.message.includes("Can't reach database server") ||
      error.message.includes("connection") ||
      error.message.includes("P1001") ||
      error.message.includes("timeout") ||
      error.message.includes("ENOTFOUND") ||
      error.message.includes("ECONNREFUSED")
    )) {
      console.error('Comments API: Database connection error detected');
      return NextResponse.json({
        error: 'Database connection error',
        message: 'Comments cannot be loaded due to database connectivity issues',
        details: 'The forum database is temporarily unavailable. Please try refreshing the page.'
      }, { status: 503 })
    }
    
    return NextResponse.json({ 
      error: "Failed to fetch comments",
      message: "An unexpected error occurred while loading comments",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
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
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      postId,
      authorId: session.user.id,
      parentId: parentId || null,
      updatedAt: new Date()
    },
    include: {
      users: { select: { name: true, image: true } }
    }
  })

  // Check and award badges after successful comment creation
  try {
    await badgeService.checkAndAwardBadges(session.user.id)
  } catch (error) {
    console.error("Error checking badges:", error)
    // Don't fail the comment creation if badge checking fails
  }

  return NextResponse.json({ comment })
}
