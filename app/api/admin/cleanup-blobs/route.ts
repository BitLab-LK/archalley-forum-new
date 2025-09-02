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
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { dryRun = true, postId } = body

    console.log("Starting blob cleanup...", { dryRun, postId })

    let attachments: { url: string; filename: string; postId: string }[] = []

    if (postId) {
      // Clean up specific post
      attachments = await prisma.attachments.findMany({
        where: { postId },
        select: { url: true, filename: true, postId: true }
      })
    } else {
      // Find orphaned attachments (attachments without corresponding posts)
      const allAttachments = await prisma.attachments.findMany({
        select: { url: true, filename: true, postId: true }
      })

      const postIds = [...new Set(allAttachments.map(a => a.postId))]
      const existingPosts = await prisma.post.findMany({
        where: { id: { in: postIds } },
        select: { id: true }
      })
      const existingPostIds = new Set(existingPosts.map(p => p.id))

      // Filter for orphaned attachments
      attachments = allAttachments.filter(a => !existingPostIds.has(a.postId))
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

    // Clean up database records for orphaned attachments
    if (!postId) {
      const orphanedPostIds = [...new Set(attachments.map(a => a.postId))]
      await prisma.attachments.deleteMany({
        where: { postId: { in: orphanedPostIds } }
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
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get storage statistics
    const totalAttachments = await prisma.attachments.count()
    const totalPosts = await prisma.post.count()
    
    // Find orphaned attachments
    const allAttachments = await prisma.attachments.findMany({
      select: { postId: true }
    })
    const postIds = [...new Set(allAttachments.map(a => a.postId))]
    const existingPosts = await prisma.post.findMany({
      where: { id: { in: postIds } },
      select: { id: true }
    })
    const existingPostIds = new Set(existingPosts.map(p => p.id))
    const orphanedCount = allAttachments.filter(a => !existingPostIds.has(a.postId)).length

    // Get size statistics
    const sizeStats = await prisma.attachments.aggregate({
      _sum: { size: true },
      _avg: { size: true },
      _max: { size: true }
    })

    return NextResponse.json({
      totalAttachments,
      totalPosts,
      orphanedAttachments: orphanedCount,
      storage: {
        totalBytes: sizeStats._sum.size || 0,
        totalMB: Math.round((sizeStats._sum.size || 0) / (1024 * 1024)),
        averageFileSize: Math.round((sizeStats._avg.size || 0) / 1024) + "KB",
        largestFile: Math.round((sizeStats._max.size || 0) / 1024) + "KB"
      },
      recommendations: {
        cleanupNeeded: orphanedCount > 0,
        potentialSavings: orphanedCount > 0 ? `~${Math.round(orphanedCount * 1.5)}MB` : "None"
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
