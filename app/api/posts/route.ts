import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { join } from "path"
import { stat } from "fs/promises"

const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().min(1, "Category is required"),
  isAnonymous: z.boolean().default(false),
  tags: z.string().transform((str) => {
    try {
      return JSON.parse(str) as string[]
    } catch {
      return []
    }
  }).default("[]"),
  originalLanguage: z.string().optional(),
  translatedContent: z.string().optional(),
})

const getPostsSchema = z.object({
  page: z.string().optional().default("1"),
  limit: z.string().optional().default("10"),
  category: z.string().optional(),
  sort: z.enum(["latest", "popular", "oldest"]).optional().default("latest"),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    
    // Log the received form data for debugging
    console.log("Received form data:", {
      content: formData.get("content"),
      categoryId: formData.get("categoryId"),
      isAnonymous: formData.get("isAnonymous"),
      tags: formData.get("tags"),
      originalLanguage: formData.get("originalLanguage"),
      translatedContent: formData.get("translatedContent"),
      images: Array.from(formData.entries())
        .filter(([key]) => key.startsWith("image"))
        .map(([_, value]) => value)
    })

    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string
    const isAnonymous = formData.get("isAnonymous") === "true"
    const tags = formData.get("tags") as string
    const originalLanguage = formData.get("originalLanguage") as string
    const translatedContent = formData.get("translatedContent") as string

    // Validate input
    const validationResult = createPostSchema.safeParse({
      content,
      categoryId,
      isAnonymous,
      tags,
      originalLanguage,
      translatedContent,
    })

    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.format())
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validationResult.error.format(),
          message: "Please check your input and try again"
        },
        { status: 400 }
      )
    }

    const { data } = validationResult

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found", message: "The selected category does not exist" },
        { status: 404 }
      )
    }

    // Create post with AI tags and translation info
    const post = await prisma.post.create({
      data: {
        content: data.content,
        authorId: session.user.id,
        categoryId: data.categoryId,
        isAnonymous: data.isAnonymous,
        aiTags: data.tags,
        originalLanguage: data.originalLanguage || "English",
        translatedContent: data.translatedContent || data.content,
      },
      include: {
        author: true,
        category: true,
      },
    })

    // Update category post count
    await prisma.category.update({
      where: { id: data.categoryId },
      data: {
        postCount: {
          increment: 1,
        },
      },
    })

    // Handle image uploads if any
    const imageEntries = Array.from(formData.entries())
      .filter(([key]) => key.startsWith("image"))
      .map(([_, value]) => value as string)

    if (imageEntries.length > 0) {
      try {
        // Process image uploads
        const uploadPromises = imageEntries.map(async (imageUrl) => {
          // Extract filename from URL
          const filename = imageUrl.split('/').pop() || 'unknown'
          
          // Get file info from the uploads directory
          const filePath = join(process.cwd(), "public", imageUrl)
          const stats = await stat(filePath).catch(() => null)
          
          if (!stats) {
            console.error(`File not found: ${filePath}`)
            return null
          }

          return prisma.attachment.create({
            data: {
              url: imageUrl,
              filename: filename,
              size: stats.size,
              mimeType: getMimeType(filename),
              postId: post.id,
            },
          })
        })

        const attachments = await Promise.all(uploadPromises)
        // Filter out any failed attachments
        const validAttachments = attachments.filter((a): a is NonNullable<typeof a> => a !== null)
        
        if (validAttachments.length !== imageEntries.length) {
          console.warn(`Some attachments failed to create. Expected ${imageEntries.length}, got ${validAttachments.length}`)
        }
  } catch (error) {
        console.error("Error creating attachments:", error)
        // Don't fail the post creation if attachments fail
      }
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { 
        error: "Failed to create post",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

// Helper function to get MIME type from filename
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const categoryId = searchParams.get("category")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    console.log("Fetching posts with params:", { page, limit, categoryId, sortBy, sortOrder })

    const skip = (page - 1) * limit

    // Build the where clause
    const where = categoryId ? { categoryId } : {}

    try {
      // Get posts with related data
      const posts = await prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              name: true,
              image: true,
              rank: true,
            },
          },
          category: true,
          attachments: true,
          _count: {
            select: {
              comments: true,
              votes: {
                where: {
                  type: "UP",
                },
              },
            },
          },
        },
        // Only use orderBy if not sorting by upvotes
        ...(sortBy !== "upvotes" && { orderBy: { [sortBy]: sortOrder } }),
        skip: sortBy !== "upvotes" ? skip : 0, // We'll handle skip/limit after sorting by upvotes
        take: sortBy !== "upvotes" ? limit : undefined,
      })

      // Get total count for pagination
      const total = await prisma.post.count({ where })
      console.log(`Total posts: ${total}`)

      // Get vote counts for each post
      const voteCounts = await Promise.all(
        posts.map(async (post) => {
          const [upvotes, downvotes] = await Promise.all([
            prisma.vote.count({
              where: { postId: post.id, type: "UP" },
            }),
            prisma.vote.count({
              where: { postId: post.id, type: "DOWN" },
            }),
          ])
          return { postId: post.id, upvotes, downvotes }
        })
      )

      // Transform the data to match the frontend format
      let transformedPosts = posts.map((post) => {
        const voteCount = voteCounts.find((v) => v.postId === post.id)
        return {
          id: post.id,
          author: {
            name: post.isAnonymous ? "Anonymous" : post.author.name,
            avatar: post.author.image || "/placeholder.svg",
            isVerified: post.author.rank === "COMMUNITY_EXPERT" || post.author.rank === "TOP_CONTRIBUTOR",
            rank: post.author.rank,
            rankIcon: getRankIcon(post.author.rank),
          },
          content: post.content,
          category: post.category.name,
          isAnonymous: post.isAnonymous,
          isPinned: post.isPinned,
          upvotes: voteCount?.upvotes || 0,
          downvotes: voteCount?.downvotes || 0,
          comments: post._count.comments,
          timeAgo: getTimeAgo(post.createdAt),
          images: post.attachments.map((attachment) => attachment.url),
        }
      })

      // If sorting by upvotes, sort in JS and apply skip/limit
      if (sortBy === "upvotes") {
        transformedPosts = transformedPosts.sort((a, b) => {
          if (sortOrder === "asc") {
            return a.upvotes - b.upvotes
          } else {
            return b.upvotes - a.upvotes
          }
        })
        .slice(skip, skip + limit)
      }

    return NextResponse.json({
        posts: transformedPosts,
      pagination: {
        total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit,
      },
    })
    } catch (dbError) {
      console.error("Database error:", dbError)
      throw dbError // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Error fetching posts:", error)
    // Log the full error object for debugging
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
    }
    return NextResponse.json(
      { error: "Failed to fetch posts", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  
  return Math.floor(seconds) + " seconds ago"
}

// Helper function to get rank icon
function getRankIcon(rank: string): string {
  const icons = {
    COMMUNITY_EXPERT: "🏆",
    TOP_CONTRIBUTOR: "⭐",
    VISUAL_STORYTELLER: "📸",
    VALUED_RESPONDER: "💬",
    RISING_STAR: "🌟",
    CONVERSATION_STARTER: "💡",
    NEW_MEMBER: "👋",
  }
  return icons[rank as keyof typeof icons] || ""
}
