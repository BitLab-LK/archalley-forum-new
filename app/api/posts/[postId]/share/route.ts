import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        users: {
          select: {
            name: true
          }
        },
        categories: {
          select: {
            name: true
          }
        }
      }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Increment share count
    await prisma.post.update({
      where: { id: postId },
      data: {
        shareCount: {
          increment: 1
        }
      }
    })

    // Generate share URL
    const shareUrl = `${request.headers.get("origin")}/posts/${postId}`

    // Generate share text
    const shareText = `${post.users.name} posted in ${post.categories.name}: ${post.content.substring(0, 100)}${post.content.length > 100 ? "..." : ""}`

    return NextResponse.json({
      shareUrl,
      shareText,
      shareCount: (post.shareCount || 0) + 1
    })
  } catch (error) {
    console.error("Share error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get share count for a post
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        shareCount: true
      }
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json({
      shareCount: post.shareCount || 0
    })
  } catch (error) {
    console.error("Get share count error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 