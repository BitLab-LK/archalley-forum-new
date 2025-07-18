import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/comments?postId=...
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("postId")
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 })
  }
  
  // Fetch ALL comments for this post (both top-level and nested)
  const allComments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: {
      users: { select: { name: true, image: true, id: true, rank: true } }
    }
  })
  
  // Get vote counts for all comments at once
  const allCommentIds = allComments.map(c => c.id)
  const allVotes = await prisma.votes.findMany({
    where: { commentId: { in: allCommentIds } }
  })
  
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
          authorRank: c.users.rank,
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
  
  return NextResponse.json({ comments: nestedComments })
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
      users: { select: { name: true, image: true, rank: true } }
    }
  })
  return NextResponse.json({ comment })
}
