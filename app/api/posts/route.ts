import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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
    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string
    const isAnonymous = formData.get("isAnonymous") === "true"
    const tags = JSON.parse(formData.get("tags") as string) as string[]
    const originalLanguage = formData.get("originalLanguage") as string
    const translatedContent = formData.get("translatedContent") as string

    // Validate content is not empty and is valid UTF-8
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Ensure content is valid UTF-8
    try {
      decodeURIComponent(escape(content))
    } catch (e) {
      return NextResponse.json({ error: "Invalid content encoding" }, { status: 400 })
    }

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
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
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
        { error: "Category not found" },
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
    const imageFiles = Array.from(formData.entries())
      .filter(([key]) => key.startsWith("image"))
      .map(([_, file]) => file as File)

    if (imageFiles.length > 0) {
      // Process image uploads
      const uploadPromises = imageFiles.map(async (file) => {
        // Add your image upload logic here
        // For now, we'll just create a placeholder URL
        const url = `/uploads/${Date.now()}-${file.name}`
        
        return prisma.attachment.create({
          data: {
            url,
            filename: file.name,
            size: file.size,
            mimeType: file.type,
            postId: post.id,
          },
        })
      })

      await Promise.all(uploadPromises)
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
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
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      })

      console.log(`Found ${posts.length} posts`)

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
      const transformedPosts = posts.map((post) => {
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
