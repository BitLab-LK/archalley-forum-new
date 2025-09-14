import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { badgeService } from "@/lib/badge-service"
import { geminiService } from "@/lib/gemini-service"
import { classifyPost } from "@/lib/ai-service"
import { join } from "path"
import { stat } from "fs/promises"
import { revalidatePath } from "next/cache"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

const createPostSchema = z.object({
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().min(1, "Category is required"), // Primary category
  isAnonymous: z.boolean().default(false),
  tags: z.string().transform((str) => {
    try {
      return JSON.parse(str) as string[]
    } catch {
      return []
    }
  }).default("[]"),
  originalLanguage: z.string().optional().default("English"),
  // Remove translatedContent from schema as we'll generate it automatically
})

export async function POST(request: Request) {
  // CRITICAL: Ensure we always return JSON with proper headers
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  }

  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "Please log in to create a post"
        }, 
        { status: 401, headers: jsonHeaders }
      )
    }

    let formData: FormData
    try {
      formData = await request.formData()
      console.log("✅ FormData parsed successfully")
    } catch (parseError) {
      console.error("❌ Failed to parse FormData:", parseError)
      return NextResponse.json(
        { 
          error: "Invalid request format", 
          message: "Failed to parse form data",
          details: parseError instanceof Error ? parseError.message : "Parse error"
        },
        { status: 400, headers: jsonHeaders }
      )
    }

    const content = formData.get("content") as string
    const categoryId = formData.get("categoryId") as string
    const isAnonymous = formData.get("isAnonymous") === "true"
    const tags = formData.get("tags") as string
    const originalLanguage = formData.get("originalLanguage") as string || "English"

    // Validate input
    const validationResult = createPostSchema.safeParse({
      content,
      categoryId,
      isAnonymous,
      tags,
      originalLanguage,
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid input", 
          details: validationResult.error.format(),
          message: "Please check your input and try again"
        },
        { status: 400, headers: jsonHeaders }
      )
    }

    const { data } = validationResult

    // Get all available categories for AI categorization
    const allCategories = await prisma.categories.findMany({
      select: { id: true, name: true }
    })

    // Check if primary category exists
    const primaryCategory = allCategories.find(cat => cat.id === data.categoryId)
    if (!primaryCategory) {
      console.error(`❌ Primary category not found: ${data.categoryId}`)
      return NextResponse.json(
        { 
          error: "Category not found", 
          message: `The selected category "${data.categoryId}" does not exist`,
          availableCategories: allCategories
        },
        { status: 404, headers: jsonHeaders }
      )
    }

    // Step 1: Translate content to English for AI processing (if needed)
    let translatedContent = data.content
    if (data.originalLanguage && data.originalLanguage.toLowerCase() !== 'english') {
      try {
        translatedContent = await geminiService.translateToEnglish(data.content, data.originalLanguage)
      } catch (error) {
        console.error("Translation failed, using original content:", error)
        translatedContent = data.content
      }
    }

    // Step 2: Get AI category suggestions
    let aiCategorySuggestion
    try {
      const categoryNames = allCategories.map(cat => cat.name)
      
      // Use the updated AI service that supports multiple categories
      const classification = await classifyPost(translatedContent, categoryNames)
      
      aiCategorySuggestion = {
        categories: classification.categories || [classification.category],
        confidence: classification.confidence,
        reasoning: `AI classification with ${classification.confidence} confidence`
      }
    } catch (error) {
      console.error("AI categorization failed:", error)
      
      // Fallback to gemini service if AI service fails
      try {
        const categoryNames = allCategories.map(cat => cat.name)
        aiCategorySuggestion = await geminiService.categorizeContent(translatedContent, categoryNames)
      } catch (fallbackError) {
        console.error("Fallback categorization also failed:", fallbackError)
        aiCategorySuggestion = {
          categories: [primaryCategory.name],
          confidence: 0.1,
          reasoning: "Fallback to primary category due to AI error"
        }
      }
    }

    // Create post with AI categories and translation info
    const result = await prisma.$transaction(async (tx) => {
      // Convert AI-suggested category names to category IDs
      const aiCategoryIds: string[] = []
      if (aiCategorySuggestion.categories && aiCategorySuggestion.categories.length > 0) {
        for (const categoryName of aiCategorySuggestion.categories) {
          const category = allCategories.find(cat => 
            cat.name.toLowerCase() === categoryName.toLowerCase()
          )
          if (category && !aiCategoryIds.includes(category.id)) {
            aiCategoryIds.push(category.id)
          }
        }
      }
      
      // Combine primary category with AI-suggested categories, ensuring no duplicates
      const allCategoryIds = [data.categoryId] // Start with primary category
      aiCategoryIds.forEach(id => {
        if (!allCategoryIds.includes(id)) {
          allCategoryIds.push(id)
        }
      })
      
      // Ensure no duplicate categories in the array
      const uniqueCategoryIds = [...new Set(allCategoryIds)]
      
      // Create the post
      const newPost = await tx.post.create({
        data: {
          id: crypto.randomUUID(),
          content: data.content, // Keep original language
          authorId: session.user.id,
          categoryId: data.categoryId, // Primary category
          categoryIds: uniqueCategoryIds, // Multiple unique categories (including primary)
          isAnonymous: data.isAnonymous,
          aiTags: data.tags,
          aiCategory: aiCategorySuggestion.categories[0] || null, // Primary AI-suggested category
          // Filter out AI categories that match the primary category to avoid duplicates
          aiCategories: aiCategorySuggestion.categories.filter(categoryName => {
            const primaryCategoryName = primaryCategory.name.toLowerCase()
            return categoryName.toLowerCase() !== primaryCategoryName
          }) || [],
          originalLanguage: data.originalLanguage,
          translatedContent: translatedContent, // Store English translation for future AI processing
          updatedAt: new Date(),
        },
      })

      // Update category post counts for all unique categories
      await Promise.all(
        uniqueCategoryIds.map(categoryId =>
          tx.categories.update({
            where: { id: categoryId },
            data: { postCount: { increment: 1 } }
          })
        )
      )

      // Fetch the complete post with relationships
      const completePost = await tx.post.findUnique({
        where: { id: newPost.id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              image: true,
              userBadges: {
                take: 3,
                include: { badges: true },
                orderBy: { earnedAt: 'desc' }
              }
            },
          },
          categories: true,  // Primary category
          _count: {
            select: { Comment: true }
          }
        },
      })

      // Fetch multiple categories based on categoryIds
      const multipleCategories = newPost.categoryIds && newPost.categoryIds.length > 0 
        ? await tx.categories.findMany({
            where: { id: { in: newPost.categoryIds } },
            select: { id: true, name: true, color: true, slug: true }
          })
        : []

      // Handle image uploads if any
      const imageEntries = Array.from(formData.entries())
        .filter(([key]) => key.startsWith("image") && key.endsWith("_url"))
        .map(([_, value]) => value as string)

      if (imageEntries.length > 0) {
        try {
          // Process image uploads
          const uploadPromises = imageEntries.map(async (imageUrl, index) => {
            // Extract filename from URL or get it from form data
            const nameKey = `image_${index}_name`
            const filename = formData.get(nameKey) as string || imageUrl.split('/').pop() || 'unknown'
            
            // Check if this is a Vercel Blob URL
            const isBlobUrl = imageUrl.includes('blob.vercel-storage.com')
            
            let fileSize = 0
            let mimeType = 'image/jpeg' // default
            
            if (isBlobUrl) {
              // For Vercel Blob URLs, we don't have direct access to file stats
              // We'll estimate or use default values
              mimeType = getMimeType(filename)
              fileSize = 0 // We could fetch this via HEAD request if needed
            } else {
              // Original logic for local files
              const filePath = join(process.cwd(), "public", imageUrl)
              const stats = await stat(filePath).catch(() => null)
              
              if (!stats) {
                console.error(`File not found: ${filePath}`)
                return null
              }
              
              fileSize = stats.size
              mimeType = getMimeType(filename)
            }

            return tx.attachments.create({
              data: {
                id: crypto.randomUUID(),
                url: imageUrl,
                filename: filename,
                size: fileSize,
                mimeType: mimeType,
                postId: newPost.id,
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

      return {
        ...completePost,
        // Add multiple categories to the response
        allCategories: multipleCategories,
        // Add AI categorization metadata with filtered categories to avoid duplicates
        aiCategorization: {
          suggestedCategories: aiCategorySuggestion.categories,
          confidence: aiCategorySuggestion.confidence,
          reasoning: aiCategorySuggestion.reasoning,
          translationUsed: data.originalLanguage !== 'English'
        }
      }
    })

    // Check and award badges after successful post creation
    try {
      await badgeService.checkAndAwardBadges(session.user.id)
    } catch (error) {
      console.error("Error checking badges:", error)
      // Don't fail the post creation if badge checking fails
    }

    // Send email notifications for mentions in the post
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: data.content,
          authorId: session.user.id,
          postId: result.id,
          postTitle: result.title || 'New Post'
        })
      });
      
      if (response.ok) {
        const notificationResult = await response.json();
        console.log(`📧 Mention notifications sent: ${notificationResult.mentionsSent}/${notificationResult.totalMentions}`);
      }
    } catch (error) {
      console.error("Error sending mention notifications:", error);
      // Don't fail the post creation if email notifications fail
    }

    // Broadcast new post via Socket.IO for real-time updates
    try {
      // Note: In production, you'd get the socket server instance
      // For now, we'll trigger a client-side refresh via the response headers
      console.log("📡 Broadcasting new post creation for real-time updates")
      
      // You can implement Socket.IO server-side broadcasting here
      // Example: io.emit('new-post', { postId: result.id, authorId: session.user.id })
    } catch (error) {
      console.error("Error broadcasting new post:", error)
      // Don't fail the post creation if broadcasting fails
    }

    // Revalidate the homepage cache so SSR shows the new post
    try {
      revalidatePath("/")
      console.log("✅ Homepage cache revalidated")
    } catch (error) {
      console.error("Error revalidating homepage:", error)
      // Don't fail the post creation if revalidation fails
    }

    const response = NextResponse.json(result, {
      status: 201,
      headers: jsonHeaders
    })

    // Add headers to trigger cache invalidation
    response.headers.set('X-Post-Created', 'true')
    response.headers.set('X-Cache-Invalidate', 'posts')
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    return response
  } catch (error) {
    console.error("❌ Error creating post:", error)
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
    
    // Check if it's a database connection error
    if (error instanceof Error && (
      error.message.includes('database') || 
      error.message.includes('connection') ||
      error.message.includes('P1001') ||
      error.message.includes('timeout')
    )) {
      return NextResponse.json(
        { 
          error: "Database connection failed",
          message: "The application is currently unable to connect to the database. Please try again later.",
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { 
          status: 503,
          headers: jsonHeaders
        }
      )
    }
    
    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          message: "The provided data is invalid. Please check your input and try again.",
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { 
          status: 400,
          headers: jsonHeaders
        }
      )
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: "Failed to create post",
        message: "An unexpected error occurred while creating the post. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: jsonHeaders
      }
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
    // Get session for user vote information
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const categoryId = searchParams.get("category")
    const authorId = searchParams.get("authorId")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

const skip = (page - 1) * limit

    // Build the where clause
    const where: any = {}
    if (categoryId) where.categoryId = categoryId
    if (authorId) where.authorId = authorId

    try {
      // Get posts with related data
      const posts = await prisma.post.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              image: true,
              userBadges: {
                take: 3, // Only get top 3 badges
                include: {
                  badges: true
                },
                orderBy: {
                  earnedAt: 'desc'
                }
              }
            },
          },
          categories: true,  // Primary category
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

      // Get multiple categories for all posts
      const allCategoryIds = posts.flatMap(post => post.categoryIds || [])
      const uniqueCategoryIds = [...new Set(allCategoryIds)]
      const multipleCategories = uniqueCategoryIds.length > 0 
        ? await prisma.categories.findMany({
            where: { id: { in: uniqueCategoryIds } },
            select: { id: true, name: true, color: true, slug: true }
          })
        : []
      
      // Create a map for quick category lookup
      const categoryMap = new Map(multipleCategories.map(cat => [cat.id, cat]))

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

      // Get attachments for all posts
      const attachments = await prisma.attachments.findMany({
        where: {
          postId: {
            in: posts.map(post => post.id)
          }
        },
        select: {
          postId: true,
          url: true,
          filename: true,
          mimeType: true,
        },
      })

      // Get top comment for each post (most upvoted)
      const topComments = await Promise.all(
        posts.map(async (post) => {
          const comments = await prisma.comment.findMany({
            where: { postId: post.id },
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  userBadges: {
                    take: 1,
                    include: { badges: true },
                    orderBy: { earnedAt: 'desc' }
                  }
                }
              }
            }
          })

          if (comments.length === 0) return null

          // Get vote counts for all comments of this post
          const commentVotes = await prisma.votes.groupBy({
            by: ['commentId', 'type'],
            where: {
              commentId: {
                in: comments.map(c => c.id)
              }
            },
            _count: true
          })

          // Calculate total vote activity for each comment (upvotes + downvotes)
          const commentVoteActivity = new Map<string, number>()
          comments.forEach(comment => {
            commentVoteActivity.set(comment.id, 0)
          })

          commentVotes.forEach(vote => {
            if (vote.commentId) {
              const current = commentVoteActivity.get(vote.commentId) || 0
              commentVoteActivity.set(vote.commentId, current + vote._count)
            }
          })

          // Find comment with highest total vote activity
          let topComment = comments[0]
          let highestActivity = commentVoteActivity.get(topComment.id) || 0

          comments.forEach(comment => {
            const activity = commentVoteActivity.get(comment.id) || 0
            if (activity > highestActivity) {
              highestActivity = activity
              topComment = comment
            }
          })

          // Return the comment if it has any votes or is the only comment
          if (highestActivity > 0 || comments.length === 1) {
            // Calculate upvotes and downvotes for the top comment
            const topCommentUpvotes = commentVotes.find(vote => 
              vote.commentId === topComment.id && vote.type === 'UP'
            )?._count || 0
            
            const topCommentDownvotes = commentVotes.find(vote => 
              vote.commentId === topComment.id && vote.type === 'DOWN'
            )?._count || 0

            return {
              postId: post.id,
              author: {
                name: topComment.users.name || "Anonymous",
                image: topComment.users.image
              },
              content: topComment.content,
              upvotes: topCommentUpvotes,
              downvotes: topCommentDownvotes,
              isBestAnswer: false, // Comments don't have best answer feature yet
              activity: highestActivity
            }
          }

          return null
        })
      )

      // Create a map of top comments by post ID
      const topCommentMap = new Map<string, any>()
      topComments.forEach(comment => {
        if (comment) {
          topCommentMap.set(comment.postId, {
            author: comment.author,
            content: comment.content,
            upvotes: comment.upvotes,
            downvotes: comment.downvotes,
            isBestAnswer: comment.isBestAnswer
          })
        }
      })

      // Group attachments by postId and clean blob URLs
      const attachmentMap = new Map<string, string[]>()
      attachments.forEach(attachment => {
        const existing = attachmentMap.get(attachment.postId) || []
        // Clean blob URLs by removing download parameter
        let cleanUrl = attachment.url
        if (cleanUrl.includes('blob.vercel-storage.com') && cleanUrl.includes('?download=1')) {
          cleanUrl = cleanUrl.replace('?download=1', '')
        }
        existing.push(cleanUrl)
        attachmentMap.set(attachment.postId, existing)
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

      // Get user votes if authenticated
      const userVoteMap = new Map<string, string>()
      if (session?.user?.id) {
        const userVotes = await prisma.votes.findMany({
          where: {
            userId: session.user.id,
            postId: {
              in: posts.map(post => post.id)
            }
          },
          select: {
            postId: true,
            type: true
          }
        })
        
        userVotes.forEach(vote => {
          if (vote.postId) {
            userVoteMap.set(vote.postId, vote.type)
          }
        })
      }

      // Transform the data to match the frontend format
      let transformedPosts = posts.map((post) => {
        const voteCount = voteCountMap.get(post.id) || { upvotes: 0, downvotes: 0 }
        const userVote = userVoteMap.get(post.id)?.toLowerCase() || null // Include user vote
        const images = attachmentMap.get(post.id) || []
        const primaryBadge = getPrimaryBadge(post.users.userBadges)
        const topComment = topCommentMap.get(post.id) || null
        
        // Get multiple categories for this post, avoiding duplicates
        const postCategories = (post.categoryIds || [])
          .map(id => categoryMap.get(id))
          .filter(Boolean) // Remove undefined values
        
        // Remove duplicate categories by creating a unique set based on category ID
        const uniqueCategories = postCategories.filter((category, index, array) => 
          array.findIndex(c => c?.id === category?.id) === index
        )
        
        return {
          id: post.id,
          author: {
            id: post.users.id,
            name: post.isAnonymous ? "Anonymous" : post.users.name,
            avatar: post.users.image || "/placeholder.svg",
            isVerified: isUserVerified(post.users.userBadges),
            rank: primaryBadge?.badges.name || "Member",
            rankIcon: primaryBadge?.badges.icon || "👋",
            badges: post.users.userBadges?.slice(0, 3) || [], // Include top 3 badges
          },
          content: post.content,
          category: post.categories.name, // Primary category name
          categories: post.categories, // Primary category object (direct relationship)
          allCategories: uniqueCategories, // Multiple unique categories
          aiCategories: post.aiCategories || [], // AI-suggested category names
          aiCategory: post.aiCategory, // Primary AI category name
          originalLanguage: post.originalLanguage || 'English',
          isAnonymous: post.isAnonymous,
          isPinned: post.isPinned,
          upvotes: voteCount.upvotes,
          downvotes: voteCount.downvotes,
          userVote: userVote as "up" | "down" | null, // Add user vote to post data
          comments: post._count.Comment,
          timeAgo: getTimeAgo(post.createdAt),
          images: images,
          topComment: topComment, // Add the most upvoted comment
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

    const response = NextResponse.json({
        posts: transformedPosts,
      pagination: {
        total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit,
      },
    })

    // Add cache control headers for better performance and real-time updates
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Last-Modified', new Date().toUTCString())
    
    return response
    } catch (dbError) {
      console.error("Database error:", dbError)
      
      // Check if it's a connection error and try to reconnect
      if (dbError instanceof Error && (
        dbError.message.includes("Can't reach database server") ||
        dbError.message.includes("connection") ||
        dbError.message.includes("P1001")
      )) {
        console.log("Attempting to reconnect to database...")
        try {
          await prisma.$connect()
          // Retry the operation once
          throw new Error("Database temporarily unavailable - please try again")
        } catch (reconnectError) {
          console.error("Reconnection failed:", reconnectError)
          throw new Error("Database connection failed - service temporarily unavailable")
        }
      }
      
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
    
    // Check for database connection errors and provide user-friendly messages
    if (error instanceof Error && (
      error.message.includes("Can't reach database server") ||
      error.message.includes("connection") ||
      error.message.includes("Database connection failed") ||
      error.message.includes("Database temporarily unavailable")
    )) {
      return NextResponse.json(
        { 
          error: "Database service temporarily unavailable",
          details: "Please try refreshing the page in a few moments",
          message: "The forum is experiencing connectivity issues"
        },
        { status: 503 }
      )
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

// Helper function to get highest badge level for verification
function isUserVerified(userBadges: any[]): boolean {
  if (!userBadges || userBadges.length === 0) return false
  
  // Check if user has any high-level badges or specific verification badges
  return userBadges.some(ub => 
    ub.badges.id === 'verified-expert' ||
    ub.badges.level === 'PLATINUM' ||
    ub.badges.level === 'GOLD'
  )
}

// Helper function to get the primary badge (highest level or most recent)
function getPrimaryBadge(userBadges: any[]) {
  if (!userBadges || userBadges.length === 0) return null
  
  // Priority: PLATINUM > GOLD > SILVER > BRONZE
  const levelPriority = { PLATINUM: 4, GOLD: 3, SILVER: 2, BRONZE: 1 }
  
  return userBadges.reduce((best, current) => {
    const currentLevel = levelPriority[current.badges.level as keyof typeof levelPriority] || 0
    const bestLevel = best ? levelPriority[best.badges.level as keyof typeof levelPriority] || 0 : 0
    
    return currentLevel > bestLevel ? current : best
  }, null)
}


