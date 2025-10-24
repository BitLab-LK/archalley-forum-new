import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteBlobFiles } from "@/lib/utils"

/**
 * Admin-only endpoint to clean up orphaned blob files
 * This helps maintain storage efficiency by removing files that are no longer referenced
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only allow admins to run cleanup
    const userRole = session?.user?.role as string;
    if (!session?.user || (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { dryRun = true, postId } = body

    console.log("Starting blob cleanup...", { dryRun, postId })

    let attachments: { url: string; filename: string; postId: string }[] = []

    if (postId) {
      // Clean up specific post
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, images: true }
      })
      
      if (post) {
        attachments = post.images.map(url => ({
          url,
          filename: url.split('/').pop() || 'unknown',
          postId: post.id
        }))
      }
    } else {
      // Find all posts with images
      const postsWithImages = await prisma.post.findMany({
        select: { id: true, images: true },
        where: {
          images: {
            isEmpty: false
          }
        }
      })

      // Convert post images to attachment format
      attachments = postsWithImages.flatMap(post => 
        post.images.map(url => ({
          url,
          filename: url.split('/').pop() || 'unknown',
          postId: post.id
        }))
      )
    }

    console.log(`Found ${attachments.length} blob files to process`)

    if (dryRun) {
      return NextResponse.json({
        message: "Dry run completed - no files were deleted",
        filesFound: attachments.length,
        files: attachments.map(a => ({
          filename: a.filename,
          postId: a.postId,
          url: a.url.substring(0, 50) + "..." // Truncate URL for security
        }))
      })
    }

    // Actually delete the blobs
    const urls = attachments.map(a => a.url)
    const results = await deleteBlobFiles(urls)

    // Clean up database records for specific post
    if (postId) {
      await prisma.post.update({
        where: { id: postId },
        data: { images: [] }
      })
    }

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({
      message: "Blob cleanup completed",
      total: attachments.length,
      successful,
      failed,
      savedStorage: `~${Math.round(attachments.length * 1.5)}MB` // Rough estimate
    })

  } catch (error) {
    console.error("Blob cleanup error:", error)
    return NextResponse.json(
      { 
        error: "Cleanup failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * Get storage statistics
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const userRole = session?.user?.role as string;
    if (!session?.user || (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get storage statistics
    const totalPosts = await prisma.post.count()
    const postsWithImages = await prisma.post.count({
      where: {
        images: {
          isEmpty: false
        }
      }
    })
    
    // Get all posts with images for statistics
    const allPostsWithImages = await prisma.post.findMany({
      select: { id: true, images: true },
      where: {
        images: {
          isEmpty: false
        }
      }
    })
    
    const totalAttachments = allPostsWithImages.reduce((sum, post) => sum + post.images.length, 0)

    return NextResponse.json({
      totalPosts,
      postsWithImages,
      totalAttachments,
      storage: {
        totalFiles: totalAttachments,
        estimatedSizeMB: Math.round(totalAttachments * 1.5), // Rough estimate
        averageFilesPerPost: Math.round(totalAttachments / Math.max(postsWithImages, 1) * 100) / 100
      },
      recommendations: {
        cleanupAvailable: true,
        potentialSavings: `Use POST endpoint to clean up specific posts`
      }
    })

  } catch (error) {
    console.error("Storage stats error:", error)
    return NextResponse.json(
      { error: "Failed to get storage statistics" },
      { status: 500 }
    )
  }
}
