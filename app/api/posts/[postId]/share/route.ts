import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const postId = params.postId

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            name: true
          }
        },
        category: {
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
    const shareText = `${post.author.name} posted in ${post.category.name}: ${post.content.substring(0, 100)}${post.content.length > 100 ? "..." : ""}`

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
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const postId = params.postId

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