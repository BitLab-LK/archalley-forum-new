import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const resolvedParams = await params
    const postId = resolvedParams.postId

    if (!postId) {
      return NextResponse.json(
        { error: "Invalid post ID" }, 
        { status: 400 }
      )
    }

    // Verify post exists and get comment count
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        _count: {
          select: {
            Comment: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" }, 
        { status: 404 }
      )
    }

    return NextResponse.json({
      postId,
      count: post._count.Comment,
      success: true
    })

  } catch (error: any) {
    console.error("Error fetching comment count:", error)
    
    return NextResponse.json(
      { error: "Failed to fetch comment count" }, 
      { status: 500 }
    )
  }
}
