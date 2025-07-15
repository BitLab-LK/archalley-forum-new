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
  
  // Fetch top-level comments (no parentId), latest first, with replies
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      users: { select: { name: true, image: true, id: true } },
      other_Comment: {
        orderBy: { createdAt: "asc" },
        include: { 
          users: { select: { name: true, image: true, id: true } }
        }
      }
    }
  })
  
  // Get vote counts and user votes for all comments at once
  const allCommentIds = [
    ...comments.map(c => c.id),
    ...comments.flatMap(c => c.other_Comment.map(r => r.id))
  ]
  
  const allVotes = await prisma.votes.findMany({
    where: { commentId: { in: allCommentIds } }
  })
  
  // Format for frontend with vote counts
  const formatted = comments.map(c => {
    const commentVotes = allVotes.filter(v => v.commentId === c.id)
    const upvotes = commentVotes.filter(v => v.type === "UP").length
    const downvotes = commentVotes.filter(v => v.type === "DOWN").length
    const userVote = session?.user ? commentVotes.find(v => v.userId === session.user.id)?.type?.toLowerCase() : undefined
    
    const replies = c.other_Comment.map(r => {
      const replyVotes = allVotes.filter(v => v.commentId === r.id)
      const replyUpvotes = replyVotes.filter(v => v.type === "UP").length
      const replyDownvotes = replyVotes.filter(v => v.type === "DOWN").length
      const replyUserVote = session?.user ? replyVotes.find(v => v.userId === session.user.id)?.type?.toLowerCase() : undefined
      
      return {
        id: r.id,
        author: r.users.name,
        authorId: r.users.id,
        authorImage: r.users.image,
        content: r.content,
        createdAt: r.createdAt,
        parentId: r.parentId,
        upvotes: replyUpvotes,
        downvotes: replyDownvotes,
        userVote: replyUserVote
      }
    })
    
    return {
      id: c.id,
      author: c.users.name,
      authorId: c.users.id,
      authorImage: c.users.image,
      content: c.content,
      createdAt: c.createdAt,
      upvotes,
      downvotes,
      userVote,
      replies
    }
  })
  
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
  return NextResponse.json({ comment })
}
