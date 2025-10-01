import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextRequest } from "next/server"
import { cleanupPostBlobs } from "@/lib/utils"
import { onPostDeleted, onCommentDeleted } from "@/lib/stats-service"
import { incrementCategoryPostCounts } from "@/lib/category-count-utils"

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    // Await params (Next.js 15+ compatibility)
    const { postId } = await params
    
    console.log("=== DELETE POST REQUEST ===")
    console.log("Post ID:", postId)
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

    // Get the post to check ownership and categories
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { 
        authorId: true, 
        id: true,
        primaryCategoryId: true,
        categoryIds: true
      }
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

    // Get all category IDs for this post to update counts
    const allCategoryIds = post.categoryIds || []
    if (post.primaryCategoryId && !allCategoryIds.includes(post.primaryCategoryId)) {
      allCategoryIds.push(post.primaryCategoryId)
    }

    console.log("📊 Will decrement counts for categories:", allCategoryIds)

    // Clean up Vercel Blob files before deleting database records
    try {
      await cleanupPostBlobs(postId)
    } catch (blobError) {
      console.warn("⚠️ Blob cleanup failed, continuing with database deletion:", blobError)
      // Continue with database deletion even if blob cleanup fails
      // This prevents database inconsistency
    }

    // Delete related data from database (foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete votes first
      await tx.votes.deleteMany({
        where: { postId: postId }
      })
      // Delete comments
      await tx.comment.deleteMany({
        where: { postId: postId }
      })
      // Delete attachments (database records)
      await tx.attachments.deleteMany({
        where: { postId: postId }
      })
      // Delete flags
      await tx.flags.deleteMany({
        where: { postId: postId }
      })
      // Finally delete the post
      await tx.post.delete({
        where: { id: postId }
      })
      
      // Update category post counts (decrement by 1)
      if (allCategoryIds.length > 0) {
        await incrementCategoryPostCounts(tx, allCategoryIds, -1)
        console.log("📉 Decremented post counts for categories:", allCategoryIds)
      }
    })

    console.log("✅ Post deleted successfully")
    
    // Trigger real-time stats updates (post deletion also removes comments)
    await Promise.all([
      onPostDeleted(),
      onCommentDeleted() // Comments were also deleted with the post
    ])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
} 