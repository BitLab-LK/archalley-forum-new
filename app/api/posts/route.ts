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


export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Test database connection first
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error("Database connection failed:", dbError)
      return NextResponse.json(
        { 
          error: "Database connection failed", 
          message: "The application is currently unable to connect to the database. Please try again later.",
          details: "Database service is unavailable"
        },
        { status: 503 }
      )
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
    const category = await prisma.categories.findUnique({
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
        id: crypto.randomUUID(),
        content: data.content,
        authorId: session.user.id,
        categoryId: data.categoryId,
        isAnonymous: data.isAnonymous,
        aiTags: data.tags,
        originalLanguage: data.originalLanguage || "English",
        translatedContent: data.translatedContent || data.content,
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            name: true,
            image: true,
            rank: true,
          },
        },
        categories: true,
      },
    })

    // Update category post count
    await prisma.categories.update({
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

          return prisma.attachments.create({
            data: {
              id: crypto.randomUUID(),
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
    
    // Check if it's a database connection error
    if (error instanceof Error && (
      error.message.includes('database') || 
      error.message.includes('connection') ||
      error.message.includes('P1001')
    )) {
      return NextResponse.json(
        { 
          error: "Database connection failed",
          message: "The application is currently unable to connect to the database. Please try again later.",
          details: "Database service is unavailable"
        },
        { status: 503 }
      )
    }
    
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
          users: {
            select: {
              name: true,
              image: true,
              rank: true,
            },
          },
          categories: true,
          _count: {
            select: {
              Comment: true,
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

      // Get vote counts for all posts in a single efficient query
      const voteCounts = await prisma.votes.groupBy({
        by: ['postId', 'type'],
        where: {
          postId: {
            in: posts.map(post => post.id)
          }
        },
        _count: true
      })

      // Transform vote counts into a more usable format
      const voteCountMap = new Map<string, { upvotes: number; downvotes: number }>()
      
      posts.forEach(post => {
        voteCountMap.set(post.id, { upvotes: 0, downvotes: 0 })
      })

      voteCounts.forEach(vote => {
        if (vote.postId) {
          const existing = voteCountMap.get(vote.postId) || { upvotes: 0, downvotes: 0 }
          if (vote.type === 'UP') {
            existing.upvotes = vote._count
          } else if (vote.type === 'DOWN') {
            existing.downvotes = vote._count
          }
          voteCountMap.set(vote.postId, existing)
        }
      })

      // Transform the data to match the frontend format
      let transformedPosts = posts.map((post) => {
        const voteCount = voteCountMap.get(post.id) || { upvotes: 0, downvotes: 0 }
        return {
          id: post.id,
          author: {
            name: post.isAnonymous ? "Anonymous" : post.users.name,
            avatar: post.users.image || "/placeholder.svg",
            isVerified: post.users.rank === "COMMUNITY_EXPERT" || post.users.rank === "TOP_CONTRIBUTOR",
            rank: post.users.rank,
            rankIcon: getRankIcon(post.users.rank),
          },
          content: post.content,
          category: post.categories.name,
          isAnonymous: post.isAnonymous,
          isPinned: post.isPinned,
          upvotes: voteCount.upvotes,
          downvotes: voteCount.downvotes,
          comments: post._count.Comment,
          timeAgo: getTimeAgo(post.createdAt),
          images: [], // We'll load attachments separately if needed
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
