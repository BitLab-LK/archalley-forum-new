import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ postId: string }> | { postId: string } }) {
  try {
    // Await params if it's a Promise (Next.js 15+ compatibility)
    const resolvedParams = await Promise.resolve(params)
    const postId = resolvedParams.postId
    
    console.log("=== DELETE POST REQUEST ===")
    console.log("Raw params:", params)
    console.log("Resolved params:", resolvedParams)
    console.log("Post ID:", postId)
    console.log("Post ID type:", typeof postId)
    console.log("Post ID length:", postId?.length)
    
    const session = await getServerSession(authOptions)
    console.log("Session user:", {
      id: session?.user?.id,
      email: session?.user?.email,
      role: session?.user?.role
    })
    
    if (!session?.user) {
      console.log("❌ Unauthorized: No session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the post to check ownership
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, id: true }
    })

    console.log("Post found:", { postId, post })

    if (!post) {
      console.log("❌ Post not found in database")
      
      // Let's also check if any posts exist with similar IDs
      const allPosts = await prisma.post.findMany({
        select: { id: true, authorId: true },
        take: 5
      })
      console.log("Sample posts in database:", allPosts)
      
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user is admin or post author
    const isAuthor = post.authorId === session.user.id
    const isAdmin = session.user.role === "ADMIN"
    
    console.log("Authorization check:", { 
      isAuthor, 
      isAdmin, 
      sessionUserId: session.user.id,
      postAuthorId: post.authorId,
      userIdType: typeof session.user.id,
      authorIdType: typeof post.authorId
    })
    
    if (!isAuthor && !isAdmin) {
      console.log("❌ Unauthorized: Not author and not admin")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("✅ Authorization passed, deleting post...")

    // Delete related data first (foreign key constraints)
    await prisma.$transaction([
      // Delete votes first
      prisma.votes.deleteMany({
        where: { postId: postId }
      }),
      // Delete comments
      prisma.comment.deleteMany({
        where: { postId: postId }
      }),
      // Delete attachments
      prisma.attachments.deleteMany({
        where: { postId: postId }
      }),
      // Delete flags
      prisma.flags.deleteMany({
        where: { postId: postId }
      }),
      // Finally delete the post
      prisma.post.delete({
        where: { id: postId }
      })
    ])

    console.log("✅ Post deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 