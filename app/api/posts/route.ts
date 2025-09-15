import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma, ensureDbConnection } from "@/lib/prisma"
import { z } from "zod"
import { badgeService } from "@/lib/badge-service"
import { geminiService } from "@/lib/gemini-service"
import { classifyPost } from "@/lib/ai-service"
import { revalidatePath } from "next/cache"

// Force dynamic rendering and disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

// Simple in-memory cache for posts (production should use Redis/Memcached)
interface CacheEntry {
  data: any
  timestamp: number
  etag: string
}

class PostsCache {
  private cache = new Map<string, CacheEntry>()
  private readonly ttl = 60 * 1000 // 60 seconds
  private readonly maxSize = 100 // Maximum cache entries

  generateKey(params: URLSearchParams): string {
    const page = params.get('page') || '1'
    const limit = params.get('limit') || '10'
    const category = params.get('category') || 'all'
    const sortBy = params.get('sortBy') || 'createdAt'
    const sortOrder = params.get('sortOrder') || 'desc'
    const authorId = params.get('authorId') || 'all'
    
    return `posts:${page}:${limit}:${category}:${sortBy}:${sortOrder}:${authorId}`
  }

  generateETag(data: any): string {
    const content = JSON.stringify(data)
    const hash = Buffer.from(content).toString('base64').slice(0, 16)
    return `"${hash}"`
  }

  get(key: string, ifNoneMatch?: string): CacheEntry | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }
    
    // Check ETag for conditional requests
    if (ifNoneMatch && ifNoneMatch === entry.etag) {
      console.log("✅ Posts Cache: ETag match, returning 304")
      return entry
    }
    
    console.log("✅ Posts Cache: Cache hit for key:", key.substring(0, 50) + "...")
    return entry
  }

  set(key: string, data: any): CacheEntry {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
    
    const etag = this.generateETag(data)
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      etag
    }
    
    this.cache.set(key, entry)
    console.log("💾 Posts Cache: Stored data for key:", key.substring(0, 50) + "...")
    return entry
  }

  clear(): void {
    this.cache.clear()
    console.log("🗑️ Posts Cache: Cache cleared")
  }

  getStats(): { size: number; maxSize: number; keys: string[] } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()).map(k => k.substring(0, 30) + "...")
    }
  }
}

// Global cache instance
const postsCache = new PostsCache()

// Clear cache when posts are created/updated
let cacheInvalidationTimeout: NodeJS.Timeout | null = null
function invalidateCache() {
  if (cacheInvalidationTimeout) {
    clearTimeout(cacheInvalidationTimeout)
  }
  
  // Debounce cache invalidation to avoid clearing too frequently
  cacheInvalidationTimeout = setTimeout(() => {
    postsCache.clear()
  }, 1000)
}

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
  aiSuggestedCategories: z.string().transform((str) => {
    try {
      return JSON.parse(str) as string[]
    } catch {
      return []
    }
  }).default("[]"),
  // Remove translatedContent from schema as we'll generate it automatically
})

export async function POST(request: Request) {
  // CRITICAL: Ensure we always return JSON with proper headers
  const jsonHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  }

  try {
    // Ensure database connection before proceeding
    await ensureDbConnection()
    
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
    const aiSuggestedCategoriesStr = formData.get("aiSuggestedCategories") as string || "[]"
    
    // Validate input
    const validationResult = createPostSchema.safeParse({
      content,
      categoryId,
      isAnonymous,
      tags,
      originalLanguage,
      aiSuggestedCategories: aiSuggestedCategoriesStr,
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
    
    // Use validated AI suggested categories
    const aiSuggestedCategories = data.aiSuggestedCategories
    console.log("🤖 Validated AI suggested categories:", aiSuggestedCategories)

    // Get all available categories for AI categorization
    const allCategories = await prisma.categories.findMany({
      select: { id: true, name: true }
    })
    console.log("📊 Available database categories:", allCategories.map(cat => cat.name))

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

    // OPTIMIZATION: Use frontend AI classification but enhance with background processing
    // For non-English content, do backend AI classification immediately
    
    let quickAiSuggestion: any
    
    // If content is not in English, do proper AI classification on backend
    if (data.originalLanguage && data.originalLanguage.toLowerCase() !== 'english') {
      console.log(`🌍 Non-English content detected (${data.originalLanguage}), doing backend AI classification...`)
      try {
        const categoryNames = allCategories.map(cat => cat.name)
        const aiClassification = await classifyPost(data.content, categoryNames)
        
        console.log("🤖 Backend AI classification result:", aiClassification)
        
        quickAiSuggestion = {
          categories: aiClassification.categories || [aiClassification.category],
          confidence: aiClassification.confidence,
          reasoning: `Backend AI translation and classification for ${data.originalLanguage}`,
          translatedContent: aiClassification.translatedContent,
          originalLanguage: aiClassification.originalLanguage
        }
      } catch (aiError) {
        console.error("❌ Backend AI classification failed:", aiError)
        // Fallback to frontend selection
        quickAiSuggestion = {
          categories: [primaryCategory.name],
          confidence: 0.5,
          reasoning: "Frontend selection (backend AI failed)"
        }
      }
    } else {
      // For English content, use the frontend classification
      quickAiSuggestion = {
        categories: [primaryCategory.name],
        confidence: 0.9, // High confidence since frontend AI classified it
        reasoning: "Frontend AI classification with backend enhancement"
      }
    }

    // Create post with quick AI categories - optimization for speed
    const result = await prisma.$transaction(async (tx) => {
      // Convert AI-suggested category names to category IDs immediately
      const aiCategoryIds: string[] = []
      if (aiSuggestedCategories && aiSuggestedCategories.length > 0) {
        for (const categoryName of aiSuggestedCategories) {
          const category = allCategories.find(cat => 
            cat.name.toLowerCase() === categoryName.toLowerCase()
          )
          if (category && !aiCategoryIds.includes(category.id)) {
            aiCategoryIds.push(category.id)
            console.log(`✅ Mapped AI category "${categoryName}" to ID: ${category.id}`)
          }
        }
      }
      
      // Combine primary category with AI-suggested categories for immediate assignment
      const initialCategoryIds = [data.categoryId]
      aiCategoryIds.forEach(id => {
        if (!initialCategoryIds.includes(id)) {
          initialCategoryIds.push(id)
        }
      })
      
      console.log("🎯 Creating post with multiple categories:", {
        primary: data.categoryId,
        all: initialCategoryIds,
        aiSuggested: aiSuggestedCategories
      })
      
      // Create the post immediately with minimal processing
      const newPost = await tx.post.create({
        data: {
          id: crypto.randomUUID(),
          content: data.content, // Keep original language
          authorId: session.user.id,
          categoryId: data.categoryId, // Primary category
          categoryIds: initialCategoryIds, // Start with all detected categories
          isAnonymous: data.isAnonymous,
          aiTags: data.tags,
          aiCategory: primaryCategory.name, // Use primary as initial AI category
          aiCategories: aiSuggestedCategories.filter(cat => cat.toLowerCase() !== primaryCategory.name.toLowerCase()), // Exclude primary category from AI categories
          originalLanguage: data.originalLanguage,
          translatedContent: data.content, // Will be translated in background if needed
          updatedAt: new Date(),
        },
      })

      // Update category post counts for all assigned categories
      await Promise.all(
        initialCategoryIds.map(categoryId =>
          tx.categories.update({
            where: { id: categoryId },
            data: { postCount: { increment: 1 } }
          }).catch(error => {
            console.error(`Failed to update category count for ${categoryId}:`, error)
          })
        )
      )
      
      console.log("📊 Updated post counts for categories:", initialCategoryIds)

      // CRITICAL FIX: Create attachments BEFORE fetching the complete post
      // Handle image uploads if any - keep this fast
      const imageEntries = Array.from(formData.entries())
        .filter(([key]) => key.startsWith("image") && key.endsWith("_url"))
        .map(([_, value]) => value as string)

      console.log("📋 Form data entries:", Array.from(formData.entries()).map(([k, v]) => `${k}: ${typeof v === 'string' ? v.substring(0, 50) + '...' : v}`))
      console.log("🖼️ Found", imageEntries.length, "image entries:", imageEntries)

      // Create attachments if any images were uploaded
      let createdAttachments: any[] = []
      if (imageEntries.length > 0) {
        try {
          console.log("📸 Creating attachments for", imageEntries.length, "images")
          // Process image uploads quickly without extensive validation
          const uploadPromises = imageEntries.map(async (imageUrl, index) => {
            const nameKey = `image_${index}_name`
            const filename = formData.get(nameKey) as string || imageUrl.split('/').pop() || 'unknown'
            
            const isBlobUrl = imageUrl.includes('blob.vercel-storage.com')
            let fileSize = 0
            let mimeType = 'image/jpeg'
            
            if (isBlobUrl) {
              mimeType = getMimeType(filename)
              fileSize = 0 // We'll skip file size calculation for speed
            } else {
              // Quick file type detection without full stats
              mimeType = getMimeType(filename)
            }

            console.log("📎 Creating attachment:", { url: imageUrl, filename, mimeType })
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

          createdAttachments = await Promise.all(uploadPromises)
          console.log("✅ Created", createdAttachments.length, "attachments successfully")
        } catch (error) {
          console.error("❌ Error creating attachments:", error)
          // Don't fail the post creation if attachments fail
        }
      }

      // NOW fetch the complete post with relationships INCLUDING the just-created attachments
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
          attachments: true, // Include attachments for immediate response
          _count: {
            select: { Comment: true }
          }
        },
      })

      console.log("🔍 Complete post fetched with attachments:", completePost?.attachments?.length || 0)

      // Get all assigned categories for immediate response
      const assignedCategories = await tx.categories.findMany({
        where: { id: { in: initialCategoryIds } },
        select: { id: true, name: true, color: true, slug: true }
      })

      return {
        ...completePost,
        // Use attachments from the database query for immediate response
        attachments: completePost?.attachments || [],
        // Add all assigned categories for immediate response
        allCategories: assignedCategories,
        categoryIds: initialCategoryIds, // Include the categoryIds array
        // Add AI categorization info
        aiCategorization: {
          suggestedCategories: aiSuggestedCategories,
          confidence: quickAiSuggestion.confidence,
          reasoning: quickAiSuggestion.reasoning,
          translationUsed: false, // Will be updated by background processing
          processingInBackground: true
        }
      }
    })

    // OPTIMIZATION: Start background AI processing after initial response
    // This happens asynchronously without delaying the user
    setImmediate(async () => {
      try {
        console.log("🤖 Starting background AI processing for post:", result.id)
        
        // Step 1: Translate content to English for AI processing (if needed)
        let translatedContent = data.content
        if (data.originalLanguage && data.originalLanguage.toLowerCase() !== 'english') {
          try {
            translatedContent = await geminiService.translateToEnglish(data.content, data.originalLanguage)
          } catch (error) {
            console.error("Background translation failed:", error)
            translatedContent = data.content
          }
        }

        // Step 2: Get comprehensive AI category suggestions (only if frontend didn't provide good ones)
        let enhancedAiSuggestion
        
        if (aiSuggestedCategories && aiSuggestedCategories.length > 0) {
          // Frontend provided good AI suggestions, use those
          enhancedAiSuggestion = {
            categories: aiSuggestedCategories,
            confidence: 0.9, // High confidence since frontend AI classified it
            reasoning: "Frontend AI classification used"
          }
          console.log("✅ Using frontend AI classification:", aiSuggestedCategories)
          } else {
          // No frontend AI suggestions, run backend AI classification
          try {
            const categoryNames = allCategories.map(cat => cat.name)
            const classification = await classifyPost(translatedContent, categoryNames)
            
            enhancedAiSuggestion = {
              categories: classification.categories || [classification.category],
              confidence: classification.confidence,
              reasoning: `Backend AI classification with ${classification.confidence} confidence`
            }
            console.log("🤖 Backend AI classification result:", enhancedAiSuggestion)
          } catch (error) {
            console.error("Background AI categorization failed:", error)
            // Skip background processing if AI fails
            return
          }
        }

        // Step 3: Update post with enhanced AI data (only if needed)
        try {
          // Convert AI-suggested category names to category IDs
          const aiCategoryIds: string[] = []
          if (enhancedAiSuggestion.categories && enhancedAiSuggestion.categories.length > 0) {
            for (const categoryName of enhancedAiSuggestion.categories) {
              const category = allCategories.find(cat => 
                cat.name.toLowerCase() === categoryName.toLowerCase()
              )
              if (category && !aiCategoryIds.includes(category.id)) {
                aiCategoryIds.push(category.id)
              }
            }
          }
          
          // Get current post to check existing categories
          const currentPost = await prisma.post.findUnique({
            where: { id: result.id },
            select: { categoryIds: true }
          })
          
          // Combine primary category with AI-suggested categories
          const existingCategoryIds = currentPost?.categoryIds || [data.categoryId]
          const allCategoryIds = [...existingCategoryIds]
          
          // Add new AI categories that aren't already assigned
          aiCategoryIds.forEach(id => {
            if (!allCategoryIds.includes(id)) {
              allCategoryIds.push(id)
            }
          })
          
          const uniqueCategoryIds = [...new Set(allCategoryIds)]
          
          // Only update if categories changed or translation was needed
          const categoriesChanged = JSON.stringify(existingCategoryIds.sort()) !== JSON.stringify(uniqueCategoryIds.sort())
          const translationNeeded = translatedContent !== data.content
          
          if (categoriesChanged || translationNeeded) {
            console.log("📝 Updating post with background processing:", {
              existingCategories: existingCategoryIds.length,
              newCategories: uniqueCategoryIds.length,
              categoriesChanged,
              translationNeeded
            })
            
            // Update the post with enhanced AI data
            await prisma.post.update({
              where: { id: result.id },
              data: {
                ...(categoriesChanged && { categoryIds: uniqueCategoryIds }),
                aiCategory: enhancedAiSuggestion.categories[0] || null,
                aiCategories: enhancedAiSuggestion.categories.filter(categoryName => {
                  const primaryCategoryName = primaryCategory.name.toLowerCase()
                  return categoryName.toLowerCase() !== primaryCategoryName
                }) || [],
                ...(translationNeeded && { translatedContent: translatedContent }),
              }
            })
            
            // Update additional category post counts if new categories were added
            if (categoriesChanged) {
              const newCategoryIds = uniqueCategoryIds.filter(id => !existingCategoryIds.includes(id))
              if (newCategoryIds.length > 0) {
                await Promise.all(
                  newCategoryIds.map(categoryId =>
                    prisma.categories.update({
                      where: { id: categoryId },
                      data: { postCount: { increment: 1 } }
                    }).catch(error => {
                      console.error(`Failed to update category count for ${categoryId}:`, error)
                    })
                  )
                )
              }
            }
          } else {
            console.log("⏭️  No background updates needed - categories and content unchanged")
          }
          
          console.log("✅ Background AI processing completed for post:", result.id)
        } catch (updateError) {
          console.error("Failed to update post with AI enhancements:", updateError)
        }
      } catch (backgroundError) {
        console.error("Background AI processing failed:", backgroundError)
      }
    })

    // Check and award badges after successful post creation (also async)
    badgeService.checkAndAwardBadges(session.user.id).catch(error => {
      console.error("Error checking badges:", error)
    })

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

    // Invalidate posts cache to ensure fresh data
    invalidateCache()

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
    // Ensure database connection before proceeding
    await ensureDbConnection()
    
    // Get session for user vote information
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    
    // Check cache first (but skip cache if it's a timestamp-based request for first load)
    const hasTimestamp = searchParams.has('_t')
    const cacheKey = postsCache.generateKey(searchParams)
    const ifNoneMatch = request.headers.get('if-none-match')
    
    if (!hasTimestamp) {
      const cachedEntry = postsCache.get(cacheKey, ifNoneMatch || undefined)
      if (cachedEntry) {
        if (ifNoneMatch && ifNoneMatch === cachedEntry.etag) {
          // Return 304 Not Modified
          return new NextResponse(null, {
            status: 304,
            headers: {
              'ETag': cachedEntry.etag,
              'Cache-Control': 'public, max-age=60',
            }
          })
        }
        
        // Return cached data
        return NextResponse.json(cachedEntry.data, {
          headers: {
            'Content-Type': 'application/json',
            'ETag': cachedEntry.etag,
            'Cache-Control': 'public, max-age=60',
            'X-Cache': 'HIT'
          }
        })
      }
    }
    
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

      const responseData = {
        posts: transformedPosts,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
          limit,
        },
      }

      // Cache the response (unless it's a timestamped first-load request)
      let cacheEntry: CacheEntry | null = null
      if (!hasTimestamp) {
        cacheEntry = postsCache.set(cacheKey, responseData)
      }

      const response = NextResponse.json(responseData)

      // Add cache control headers for better performance and reliability
      if (cacheEntry) {
        response.headers.set('ETag', cacheEntry.etag)
        response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
        response.headers.set('X-Cache', 'MISS')
      } else {
        // For first-time loads, use short cache to avoid stale content but improve reliability
        response.headers.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=60')
      }
      
      // Add reliability headers
      response.headers.set('Last-Modified', new Date().toUTCString())
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-Frame-Options', 'DENY')
      
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
    console.error("❌ Error fetching posts:", error)
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    })
    
    // Check for database connection errors
    if (error instanceof Error && (
      error.message.includes("Can't reach database server") ||
      error.message.includes('database') || 
      error.message.includes('connection') ||
      error.message.includes('P1001') ||
      error.message.includes('timeout') ||
      error.message.includes("Database connection failed") ||
      error.message.includes("Database temporarily unavailable")
    )) {
      return NextResponse.json(
        { 
          error: "Database connection failed",
          message: "The application is currently unable to connect to the database. Please try again later.",
          details: "Please try refreshing the page in a few moments",
          timestamp: new Date().toISOString()
        },
        { 
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      )
    }
    
    // Generic error response
    return NextResponse.json(
      { 
        error: "Failed to fetch posts", 
        message: "An unexpected error occurred while fetching posts. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
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


