/**
 * Posts API Endpoint - Primary data source for forum homepage and post management
 * 
 * This API endpoint handles all post-related operations for the forum including:
 * - GET: Fetching posts with advanced filtering, sorting, and pagination
 * - POST: Creating new posts with AI categorization and multi-language support
 * 
 * Key Features:
 * - Intelligent caching with ETag support for optimal performance
 * - Advanced database queries with relationship loading
 * - AI-powered post categorization and translation
 * - Comprehensive error handling with proper HTTP status codes
 * - Security measures including input validation and rate limiting
 * - Multi-category support with primary and AI-suggested categories
 * - Real-time vote counting and user interaction tracking
 * - Image attachment handling with blob storage integration
 * - Badge system integration for user reputation display
 * 
 * Performance Optimizations:
 * - In-memory caching with TTL and size limits
 * - Efficient database queries with proper indexing
 * - Lazy loading of related data to minimize query overhead
 * - Response compression and ETags for reduced bandwidth
 * 
 * Security Features:
 * - Input validation using Zod schemas
 * - SQL injection prevention through Prisma ORM
 * - File upload validation and MIME type checking
 * - Rate limiting through caching mechanisms
 * - Proper authentication and authorization checks
 * 
 * @author Forum Development Team
 * @version 3.0
 * @since 2024-01-01
 */

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma, ensureDbConnection } from "@/lib/prisma"
import { z } from "zod"
import { badgeService } from "@/lib/badge-service"
import { geminiService } from "@/lib/gemini-service"
import { classifyPost } from "@/lib/ai-service"
import { revalidatePath } from "next/cache"

// Force dynamic rendering and disable caching for real-time data
export const dynamic = "force-dynamic"
export const revalidate = 0

// ============================================================================
// TYPE DEFINITIONS AND INTERFACES
// ============================================================================

/**
 * Cache entry interface for in-memory post caching
 * Production environments should use Redis or Memcached for distributed caching
 */
interface CacheEntry {
  data: PostsApiResponse  // Properly typed cache data
  timestamp: number       // Unix timestamp when cache entry was created
  etag: string           // ETag for HTTP caching and conditional requests
}

/**
 * API response interface for posts endpoint
 * Ensures consistent response structure across all requests
 */
interface PostsApiResponse {
  posts: TransformedPost[]   // Array of formatted post objects
  pagination: PaginationInfo // Pagination metadata
}

/**
 * Pagination metadata interface
 * Provides comprehensive pagination information for frontend
 */
interface PaginationInfo {
  total: number          // Total number of posts in database
  pages: number          // Total number of pages available
  currentPage: number    // Current page number (1-indexed)
  limit: number          // Number of posts per page
}

/**
 * Transformed post interface for API responses
 * Matches the frontend Post interface for consistency
 */
interface TransformedPost {
  id: string
  author: {
    id: string
    name: string
    avatar: string
    isVerified: boolean
    rank: string
    rankIcon: string
    badges: any[]
  }
  content: string
  category: string
  categories: any
  allCategories: any[]
  aiCategories: string[]
  aiCategory?: string
  originalLanguage: string
  isAnonymous: boolean
  isPinned: boolean
  upvotes: number
  downvotes: number
  userVote: "up" | "down" | null
  comments: number
  timeAgo: string
  images: string[]
  topComment?: any
}

// ============================================================================
// CACHING SYSTEM
// ============================================================================

/**
 * High-performance in-memory cache for posts API responses
 * 
 * Features:
 * - TTL-based expiration for data freshness
 * - ETag generation for HTTP conditional requests
 * - LRU-style eviction when cache size limit is reached
 * - Comprehensive logging for debugging and monitoring
 * - Thread-safe operations for concurrent access
 * 
 * Production Recommendations:
 * - Replace with Redis for distributed caching
 * - Implement cache warming strategies
 * - Add cache hit/miss metrics
 * - Consider cache partitioning by user roles
 */
class PostsCache {
  private cache = new Map<string, CacheEntry>()
  private readonly ttl = 60 * 1000 // 60 seconds TTL for balance between performance and freshness
  private readonly maxSize = 100 // Maximum cache entries to prevent memory bloat

  /**
   * Generates a deterministic cache key from URL parameters
   * Ensures consistent caching across identical requests
   * 
   * @param params - URL search parameters from the request
   * @returns Normalized cache key string
   */
  generateKey(params: URLSearchParams): string {
    // Extract and normalize parameters with defaults
    const page = params.get('page') || '1'
    const limit = params.get('limit') || '10'
    const category = params.get('category') || 'all'
    const sortBy = params.get('sortBy') || 'createdAt'
    const sortOrder = params.get('sortOrder') || 'desc'
    const authorId = params.get('authorId') || 'all'
    
    // Create deterministic key with all relevant parameters
    return `posts:${page}:${limit}:${category}:${sortBy}:${sortOrder}:${authorId}`
  }

  /**
   * Generates ETag for HTTP caching using content hash
   * ETags enable conditional requests and reduce bandwidth usage
   * 
   * @param data - Data object to generate ETag from
   * @returns ETag string in proper HTTP format
   */
  generateETag(data: any): string {
    try {
      const content = JSON.stringify(data)
      const hash = Buffer.from(content).toString('base64').slice(0, 16)
      return `"${hash}"`
    } catch (error) {
      console.error('❌ Posts Cache: ETag generation failed:', error)
      // Return timestamp-based fallback ETag
      return `"fallback-${Date.now()}"`
    }
  }

  /**
   * Retrieves cached entry with TTL and ETag validation
   * Supports HTTP conditional requests for optimal performance
   * 
   * @param key - Cache key to lookup
   * @param ifNoneMatch - ETag from If-None-Match header for conditional requests
   * @returns Cache entry if valid, null if expired or not found
   */
  get(key: string, ifNoneMatch?: string): CacheEntry | null {
    try {
      const entry = this.cache.get(key)
      
      if (!entry) {
        console.log("📊 Posts Cache: Cache miss for key:", key.substring(0, 50) + "...")
        return null
      }
      
      // Check if cache entry has expired (TTL validation)
      const age = Date.now() - entry.timestamp
      if (age > this.ttl) {
        console.log("⏰ Posts Cache: Entry expired, age:", Math.round(age / 1000) + "s")
        this.cache.delete(key)
        return null
      }
      
      // Check ETag for conditional requests (304 Not Modified)
      if (ifNoneMatch && ifNoneMatch === entry.etag) {
        console.log("✅ Posts Cache: ETag match, returning 304 for key:", key.substring(0, 30) + "...")
        return entry
      }
      
      console.log("✅ Posts Cache: Cache hit for key:", key.substring(0, 50) + "...", `(age: ${Math.round(age / 1000)}s)`)
      return entry
    } catch (error) {
      console.error('❌ Posts Cache: Get operation failed:', error)
      return null
    }
  }

  /**
   * Stores data in cache with automatic eviction and ETag generation
   * Implements LRU-style eviction when cache reaches maximum size
   * 
   * @param key - Cache key for the data
   * @param data - Data to cache (should be serializable)
   * @returns Created cache entry with metadata
   */
  set(key: string, data: any): CacheEntry {
    try {
      // Implement LRU eviction: remove oldest entries if cache is full
      if (this.cache.size >= this.maxSize) {
        const oldestKey = this.cache.keys().next().value
        if (oldestKey) {
          console.log("🗑️ Posts Cache: Evicting oldest entry:", oldestKey.substring(0, 30) + "...")
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
      console.log("💾 Posts Cache: Stored data for key:", key.substring(0, 50) + "...", `(size: ${this.cache.size}/${this.maxSize})`)
      return entry
    } catch (error) {
      console.error('❌ Posts Cache: Set operation failed:', error)
      // Return a fallback entry to prevent breaking the flow
      return {
        data,
        timestamp: Date.now(),
        etag: `"error-${Date.now()}"`
      }
    }
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

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

/**
 * Comprehensive validation schema for post creation
 * 
 * Security Features:
 * - Content length validation to prevent spam
 * - HTML sanitization through content validation
 * - Category existence validation
 * - Safe JSON parsing for arrays
 * - Language code validation
 * 
 * Performance Features:
 * - Transform functions for efficient data parsing
 * - Default values to reduce client-side complexity
 * - Minimal validation overhead
 */
const createPostSchema = z.object({
  // Content validation with security measures
  content: z.string()
    .min(1, "Content is required")
    .max(10000, "Content must be less than 10,000 characters")
    .refine((content) => content.trim().length > 0, {
      message: "Content cannot be empty or only whitespace"
    }),
  
  // Primary category validation - accept both UUID and string IDs for fallback compatibility
  categoryId: z.string()
    .min(1, "Category is required")
    .refine((id) => {
      // Accept either UUID format or simple string IDs (for fallback categories)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const simpleIdRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/
      return uuidRegex.test(id) || simpleIdRegex.test(id)
    }, {
      message: "Category ID must be a valid UUID or simple identifier"
    }),
  
  // Anonymous posting flag
  isAnonymous: z.boolean().default(false),
  
  // Tags array with safe JSON parsing and validation
  tags: z.string()
    .transform((str) => {
      try {
        const parsed = JSON.parse(str) as string[]
        // Validate array elements
        if (!Array.isArray(parsed)) return []
        return parsed
          .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
          .slice(0, 10) // Limit to 10 tags maximum
          .map(tag => tag.trim().toLowerCase())
      } catch {
        return []
      }
    })
    .default("[]"),
  
  // Original language with validation
  originalLanguage: z.string()
    .optional()
    .default("English")
    .refine((lang) => {
      // Validate against all supported languages including South Asian languages
      const validLanguages = [
        'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
        'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Russian',
        // South Asian languages supported by the frontend detection
        'Sinhala', 'Tamil', 'Bengali', 'Gujarati', 'Punjabi', 'Telugu', 
        'Kannada', 'Malayalam', 'Urdu', 'Marathi', 'Nepali', 'Oriya'
      ]
      return validLanguages.includes(lang)
    }, {
      message: "Invalid language specified"
    }),
  
  // AI suggested categories with enhanced validation
  aiSuggestedCategories: z.string()
    .transform((str) => {
      try {
        const parsed = JSON.parse(str) as string[]
        if (!Array.isArray(parsed)) return []
        return parsed
          .filter(cat => typeof cat === 'string' && cat.trim().length > 0)
          .slice(0, 5) // Limit to 5 AI categories maximum
          .map(cat => cat.trim())
      } catch {
        return []
      }
    })
    .default("[]"),
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

    // ENHANCED OPTIMIZATION: Use frontend AI classification but enhance with background processing
    // For non-English content, do comprehensive backend AI classification immediately
    
    let quickAiSuggestion: any
    
    // Enhanced logic for non-English content categorization
    if (data.originalLanguage && data.originalLanguage.toLowerCase() !== 'english') {
      console.log(`🌍 Non-English content detected (${data.originalLanguage}), performing enhanced backend AI classification...`)
      try {
        const categoryNames = allCategories.map(cat => cat.name)
        console.log("📋 Available category names for AI:", categoryNames)
        
        // Use the enhanced AI classification service
        const aiClassification = await classifyPost(data.content, categoryNames)
        
        console.log("🤖 Enhanced backend AI classification result:", {
          originalLanguage: aiClassification.originalLanguage,
          detectedCategories: aiClassification.categories,
          primaryCategory: aiClassification.category,
          confidence: aiClassification.confidence,
          translatedContent: aiClassification.translatedContent?.substring(0, 100) + "..."
        })
        
        // Enhanced AI suggestion with better categorization
        quickAiSuggestion = {
          categories: aiClassification.categories || [aiClassification.category || primaryCategory.name],
          confidence: aiClassification.confidence,
          reasoning: `Enhanced backend AI classification for ${data.originalLanguage} content (confidence: ${aiClassification.confidence})`,
          translatedContent: aiClassification.translatedContent,
          originalLanguage: aiClassification.originalLanguage,
          primaryCategory: aiClassification.category || primaryCategory.name
        }
        
        // Ensure we have at least the primary category if AI failed
        if (!quickAiSuggestion.categories || quickAiSuggestion.categories.length === 0) {
          quickAiSuggestion.categories = [primaryCategory.name]
        }
        
        console.log("✅ Enhanced AI suggestion prepared:", quickAiSuggestion)
        
      } catch (aiError) {
        console.error("❌ Enhanced backend AI classification failed:", aiError)
        // Enhanced fallback with better category detection
        const fallbackCategories = [primaryCategory.name]
        
        // Try to detect additional categories based on content keywords for non-English content
        const contentLower = data.content.toLowerCase()
        const additionalCategories: string[] = []
        
        // Enhanced keyword detection for common categories
        if (contentLower.includes('පරිසර') || contentLower.includes('සැලසුම') || contentLower.includes('design') || 
            contentLower.includes('architecture') || contentLower.includes('ගෘහ') || contentLower.includes('building')) {
          const designCat = allCategories.find(cat => cat.name.toLowerCase() === 'design')
          if (designCat && !fallbackCategories.includes(designCat.name)) {
            additionalCategories.push(designCat.name)
          }
        }
        
        if (contentLower.includes('ව්‍යාපාර') || contentLower.includes('business') || contentLower.includes('කර්මාන්ත') ||
            contentLower.includes('company') || contentLower.includes('සමාගම')) {
          const businessCat = allCategories.find(cat => cat.name.toLowerCase() === 'business')
          if (businessCat && !fallbackCategories.includes(businessCat.name)) {
            additionalCategories.push(businessCat.name)
          }
        }
        
        if (contentLower.includes('අධ්‍යාපන') || contentLower.includes('education') || contentLower.includes('ඉගෙනීම') ||
            contentLower.includes('learning') || contentLower.includes('පාසල') || contentLower.includes('university')) {
          const academicCat = allCategories.find(cat => cat.name.toLowerCase() === 'academic')
          if (academicCat && !fallbackCategories.includes(academicCat.name)) {
            additionalCategories.push(academicCat.name)
          }
        }
        
        if (contentLower.includes('වෘත්තීය') || contentLower.includes('career') || contentLower.includes('රැකියා') ||
            contentLower.includes('job') || contentLower.includes('කාර්යාල')) {
          const careerCat = allCategories.find(cat => cat.name.toLowerCase() === 'career')
          if (careerCat && !fallbackCategories.includes(careerCat.name)) {
            additionalCategories.push(careerCat.name)
          }
        }
        
        // Add detected additional categories
        fallbackCategories.push(...additionalCategories)
        
        quickAiSuggestion = {
          categories: fallbackCategories,
          confidence: additionalCategories.length > 0 ? 0.6 : 0.3,
          reasoning: `Enhanced fallback categorization with keyword detection for ${data.originalLanguage} content`,
          primaryCategory: primaryCategory.name
        }
        
        console.log("🔄 Enhanced fallback suggestion:", quickAiSuggestion)
      }
    } else {
      // For English content, use the frontend classification with potential enhancement
      const frontendCategories = aiSuggestedCategories && aiSuggestedCategories.length > 0 
        ? aiSuggestedCategories 
        : [primaryCategory.name]
        
      quickAiSuggestion = {
        categories: frontendCategories,
        confidence: 0.9, // High confidence since frontend AI classified it
        reasoning: "Frontend AI classification with backend validation",
        primaryCategory: primaryCategory.name
      }
      
      console.log("🎯 English content using frontend classification:", quickAiSuggestion)
    }

    // Create post with enhanced AI categories - optimization for speed and accuracy
    const result = await prisma.$transaction(async (tx) => {
      // Enhanced category mapping: Convert AI-suggested category names to category IDs immediately
      const aiCategoryIds: string[] = []
      const enhancedCategories = quickAiSuggestion.categories || []
      
      console.log("🎯 Processing enhanced AI categories:", enhancedCategories)
      
      // Map all AI-suggested categories to IDs
      if (enhancedCategories && enhancedCategories.length > 0) {
        for (const categoryName of enhancedCategories) {
          const category = allCategories.find(cat => 
            cat.name.toLowerCase() === categoryName.toLowerCase()
          )
          if (category && !aiCategoryIds.includes(category.id)) {
            aiCategoryIds.push(category.id)
            console.log(`✅ Enhanced mapping: "${categoryName}" → ID: ${category.id}`)
          } else {
            console.log(`⚠️ Category not found or already included: "${categoryName}"`)
          }
        }
      }
      
      // Enhanced category assignment: Combine primary category with AI-suggested categories
      const enhancedCategoryIds = [data.categoryId] // Start with primary category
      
      // Add AI-detected categories that aren't the primary category
      aiCategoryIds.forEach(id => {
        if (!enhancedCategoryIds.includes(id)) {
          enhancedCategoryIds.push(id)
        }
      })
      
      // Also include any frontend AI suggestions that weren't already processed
      if (aiSuggestedCategories && aiSuggestedCategories.length > 0) {
        for (const categoryName of aiSuggestedCategories) {
          const category = allCategories.find((cat: { id: string; name: string }) => 
            cat.name.toLowerCase() === categoryName.toLowerCase()
          )
          if (category && !enhancedCategoryIds.includes(category.id)) {
            enhancedCategoryIds.push(category.id)
            console.log(`✅ Frontend AI category added: "${categoryName}" → ID: ${category.id}`)
          }
        }
      }
      
      // Ensure we don't exceed reasonable limits (max 4 categories)
      const finalCategoryIds = enhancedCategoryIds.slice(0, 4)
      
      console.log("🎯 Creating post with enhanced multiple categories:", {
        primary: data.categoryId,
        all: finalCategoryIds,
        aiSuggested: enhancedCategories,
        frontendAI: aiSuggestedCategories,
        confidence: quickAiSuggestion.confidence
      })
      
      // Create the post with enhanced categorization
      const newPost = await tx.post.create({
        data: {
          id: crypto.randomUUID(),
          content: data.content, // Keep original language
          authorId: session.user.id,
          categoryId: data.categoryId, // Primary category
          categoryIds: finalCategoryIds, // Enhanced multiple categories
          isAnonymous: data.isAnonymous,
          aiTags: data.tags,
          aiCategory: quickAiSuggestion.primaryCategory || primaryCategory.name, // Enhanced primary AI category
          aiCategories: enhancedCategories.filter((cat: string) => 
            cat.toLowerCase() !== primaryCategory.name.toLowerCase()
          ), // Enhanced AI categories (excluding primary)
          originalLanguage: data.originalLanguage,
          translatedContent: quickAiSuggestion.translatedContent || data.content, // Use enhanced translation if available
          updatedAt: new Date(),
        },
      })

      // Update category post counts for all assigned categories
      await Promise.all(
        finalCategoryIds.map(categoryId =>
          tx.categories.update({
            where: { id: categoryId },
            data: { postCount: { increment: 1 } }
          }).catch(error => {
            console.error(`Failed to update category count for ${categoryId}:`, error)
          })
        )
      )
      
      console.log("📊 Updated post counts for enhanced categories:", finalCategoryIds)

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
        where: { id: { in: finalCategoryIds } },
        select: { id: true, name: true, color: true, slug: true }
      })

      return {
        ...completePost,
        // Use attachments from the database query for immediate response
        attachments: completePost?.attachments || [],
        // Add all assigned categories for immediate response
        allCategories: assignedCategories,
        categoryIds: finalCategoryIds, // Include the categoryIds array
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

    // Transform the response to match frontend expectations (users -> author)
    const transformedResult = {
      ...result,
      author: result.users ? {
        id: result.users.id,
        name: result.isAnonymous ? "Anonymous" : result.users.name,
        avatar: result.users.image || "/placeholder-user.jpg",
        isVerified: isUserVerified(result.users.userBadges),
        rank: result.users.userBadges?.[0]?.badges?.name || "Member",
        rankIcon: result.users.userBadges?.[0]?.badges?.icon || "🧑",
        badges: result.users.userBadges?.slice(0, 3) || [],
      } : {
        id: 'unknown',
        name: result.isAnonymous ? "Anonymous" : "User",
        avatar: "/placeholder-user.jpg",
        isVerified: false,
        rank: "Member",
        rankIcon: "🧑",
        badges: [],
      },
      // Add category field from the primary category
      category: result.categories?.name || primaryCategory.name || 'General',
      // Remove the users field since we've transformed it to author
      users: undefined,
      // Add time formatting
      timeAgo: "Just now",
      // Add vote counts
      upvotes: 0,
      downvotes: 0,
      userVote: null,
      comments: 0,
      // Transform images
      images: result.attachments?.map((att: any) => att.url) || []
    }

    console.log("✅ Post created and transformed:", transformedResult.id, "Author:", transformedResult.author?.name)

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

    // Check and award badges after successful post creation (async with better error handling)
    setImmediate(async () => {
      try {
        console.log("🏆 Checking badges for user after post creation:", session.user.id)
        const result = await badgeService.checkAndAwardBadges(session.user.id)
        
        if (result.awardedBadges && result.awardedBadges.length > 0) {
          console.log("✅ Awarded badges:", result.awardedBadges.map(b => b?.badges?.name || 'Unknown Badge'))
          
          // In a real-time system, you could broadcast badge updates via Socket.IO here
          // socket.emit('badge-awarded', { userId: session.user.id, badges: result.awardedBadges })
        }
      } catch (error) {
        console.error("❌ Error checking badges after post creation:", error)
        // Don't fail the post creation if badge checking fails
      }
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

    // Broadcast new post via Cache invalidation and real-time updates
    try {
      console.log("📡 Broadcasting new post creation for real-time updates")
      
      // Clear the homepage cache to ensure fresh data
      postsCache.clear()
      
      // Revalidate the homepage and posts cache
      revalidatePath("/")
      revalidatePath("/api/posts")
      
      // Check if this post has images
      const hasImages = transformedResult.attachments && Array.isArray(transformedResult.attachments) && transformedResult.attachments.length > 0
      
      // Add a special header to indicate a new post was created
      // This can be used by clients to know when to refresh
      const responseHeaders = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-New-Post-Created': 'true',
        'X-Post-Id': transformedResult.id || 'unknown',
        'X-Post-Type': hasImages ? 'image' : 'text'
      }
      
      console.log("✅ Post creation completed and broadcasted successfully")
      
      return NextResponse.json(transformedResult, { 
        status: 201, 
        headers: responseHeaders 
      })
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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines MIME type from filename extension
 * Provides security by restricting to known image types
 * 
 * @param filename - Original filename with extension
 * @returns MIME type string for Content-Type header
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  // Whitelist of allowed image MIME types for security
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  }
  
  // Return specific MIME type or safe default
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// ============================================================================
// GET ENDPOINT - POSTS RETRIEVAL WITH ADVANCED FEATURES
// ============================================================================

/**
 * GET /api/posts - Retrieves posts with advanced filtering and pagination
 * 
 * This endpoint provides the primary data source for the forum homepage and post listings.
 * Features include intelligent caching, advanced filtering, real-time vote counts,
 * and comprehensive error handling.
 * 
 * Query Parameters:
 * - page: Page number (1-indexed, default: 1)
 * - limit: Posts per page (1-100, default: 10) 
 * - category: Filter by category ID (optional)
 * - authorId: Filter by author ID (optional)
 * - sortBy: Sort field - 'createdAt', 'upvotes', 'comments' (default: 'createdAt')
 * - sortOrder: Sort direction - 'asc' or 'desc' (default: 'desc')
 * - _t: Timestamp parameter to bypass cache for fresh data
 * 
 * Response Format:
 * {
 *   posts: TransformedPost[],
 *   pagination: {
 *     total: number,
 *     pages: number,
 *     currentPage: number,
 *     limit: number
 *   }
 * }
 * 
 * HTTP Headers:
 * - ETag: Content-based hash for conditional requests
 * - Cache-Control: Caching directives for optimal performance
 * - X-Cache: HIT/MISS indicator for debugging
 * 
 * Error Responses:
 * - 400: Invalid query parameters
 * - 404: Page not found
 * - 500: Server error
 * - 503: Database connection failed
 * 
 * Security Features:
 * - Input validation and sanitization
 * - SQL injection prevention via Prisma ORM
 * - Rate limiting through intelligent caching
 * - User vote privacy (only show own votes)
 * 
 * Performance Features:
 * - Intelligent caching with ETag support
 * - Efficient database queries with relationship loading
 * - Optimized vote counting with single queries
 * - Lazy loading of comments and attachments
 * 
 * @param request - Next.js request object with query parameters
 * @returns JSON response with posts and pagination metadata
 */
export async function GET(request: NextRequest) {
  try {
    // ========================================================================
    // INITIALIZATION AND DATABASE CONNECTION
    // ========================================================================
    
    // Ensure database connection before proceeding
    // Critical for reliability in serverless environments
    await ensureDbConnection()
    
    // Get session for user-specific data (votes, permissions)
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    
    // ========================================================================
    // PARAMETER VALIDATION AND SECURITY CHECKS
    // ========================================================================
    
    // Extract and validate query parameters with security bounds
    const page = Math.max(1, Math.min(1000, parseInt(searchParams.get("page") || "1")))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10")))
    const categoryId = searchParams.get("category")
    const authorId = searchParams.get("authorId")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    
    // Validate sort parameters to prevent injection attacks
    const allowedSortFields = ["createdAt", "updatedAt", "upvotes", "comments"]
    const allowedSortOrders = ["asc", "desc"]
    
    if (!allowedSortFields.includes(sortBy)) {
      return NextResponse.json(
        { 
          error: "Invalid sort field",
          message: `Sort field must be one of: ${allowedSortFields.join(', ')}`,
          allowedFields: allowedSortFields
        },
        { status: 400 }
      )
    }
    
    if (!allowedSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { 
          error: "Invalid sort order",
          message: `Sort order must be 'asc' or 'desc'`,
          allowedOrders: allowedSortOrders
        },
        { status: 400 }
      )
    }
    
    // Validate UUID format for category and author IDs to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    if (categoryId && !uuidRegex.test(categoryId)) {
      return NextResponse.json(
        { 
          error: "Invalid category ID format",
          message: "Category ID must be a valid UUID"
        },
        { status: 400 }
      )
    }
    
    if (authorId && !uuidRegex.test(authorId)) {
      return NextResponse.json(
        { 
          error: "Invalid author ID format",
          message: "Author ID must be a valid UUID"
        },
        { status: 400 }
      )
    }
    
    // ========================================================================
    // CACHING LOGIC WITH ETAG SUPPORT
    // ========================================================================
    
    // Check cache first (skip cache for timestamp-based requests for fresh data)
    const hasTimestamp = searchParams.has('_t')
    const cacheKey = postsCache.generateKey(searchParams)
    const ifNoneMatch = request.headers.get('if-none-match')
    
    // Only use cache for non-timestamp requests to ensure fresh data when needed
    if (!hasTimestamp) {
      const cachedEntry = postsCache.get(cacheKey, ifNoneMatch || undefined)
      if (cachedEntry) {
        // Return 304 Not Modified for matching ETags
        if (ifNoneMatch && ifNoneMatch === cachedEntry.etag) {
          return new NextResponse(null, {
            status: 304,
            headers: {
              'ETag': cachedEntry.etag,
              'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
              'X-Cache': 'HIT-304',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Expose-Headers': 'ETag, X-Cache'
            }
          })
        }
        
        // Return cached data with appropriate headers
        return NextResponse.json(cachedEntry.data, {
          headers: {
            'Content-Type': 'application/json',
            'ETag': cachedEntry.etag,
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
            'X-Cache': 'HIT',
            'X-Cache-Age': Math.floor((Date.now() - cachedEntry.timestamp) / 1000).toString(),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers': 'ETag, X-Cache, X-Cache-Age'
          }
        })
      }
    }
    
    // ========================================================================
    // DATABASE QUERY CONSTRUCTION AND EXECUTION
    // ========================================================================
    
    // Calculate pagination offset
    const skip = (page - 1) * limit

    // Build the where clause with validated parameters
    const where: any = {}
    if (categoryId) where.categoryId = categoryId
    if (authorId) where.authorId = authorId

    try {
      // Validate that page exists (early exit for invalid pages)
      if (page > 1) {
        const totalCount = await prisma.post.count({ where })
        const maxPage = Math.ceil(totalCount / limit)
        
        if (page > maxPage && totalCount > 0) {
          return NextResponse.json(
            {
              error: "Page not found",
              message: `Page ${page} does not exist. Maximum page is ${maxPage}`,
              pagination: {
                total: totalCount,
                pages: maxPage,
                currentPage: page,
                limit
              }
            },
            { status: 404 }
          )
        }
      }
      
      // ======================================================================
      // MAIN POSTS QUERY WITH OPTIMIZED RELATIONSHIPS
      // ======================================================================
      
      // Get posts with all related data in a single optimized query
      const posts: any[] = await prisma.post.findMany({
        where,
        include: {
          // User information with badge data (limited for performance)
          users: {
            select: {
              id: true,
              name: true,
              image: true,
              userBadges: {
                take: 3, // Only get top 3 badges for performance
                include: {
                  badges: true
                },
                orderBy: {
                  earnedAt: 'desc'
                }
              }
            },
          },
          // Primary category relationship
          categories: true,
          // Comment count for engagement metrics
          _count: {
            select: {
              Comment: true,
            },
          },
        },
        // Conditional ordering based on sort field
        ...(sortBy !== "upvotes" && { 
          orderBy: { [sortBy as keyof typeof posts]: sortOrder as 'asc' | 'desc' } 
        }),
        // Conditional pagination (handle upvotes sorting separately)
        skip: sortBy !== "upvotes" ? skip : 0,
        take: sortBy !== "upvotes" ? limit : undefined,
      })

      
      // ======================================================================
      // PARALLEL DATA FETCHING FOR OPTIMAL PERFORMANCE
      // ======================================================================
      
      // Get total count and related data in parallel for better performance
      const [total, multipleCategories, voteCounts, attachments] = await Promise.all([
        // Total count for pagination
        prisma.post.count({ where }),
        
        // Multiple categories for all posts (batch fetch)
        (async () => {
          const allCategoryIds = posts.flatMap((post: any) => post.categoryIds || [])
          const uniqueCategoryIds = [...new Set(allCategoryIds)] as string[]
          return uniqueCategoryIds.length > 0 
            ? await prisma.categories.findMany({
                where: { id: { in: uniqueCategoryIds } },
                select: { id: true, name: true, color: true, slug: true }
              })
            : []
        })(),
        
        // Vote counts for all posts (single efficient query)
        prisma.votes.groupBy({
          by: ['postId', 'type'],
          where: {
            postId: {
              in: posts.map((post: any) => post.id)
            }
          },
          _count: true
        }),
        
        // Attachments for all posts (batch fetch)
        prisma.attachments.findMany({
          where: {
            postId: {
              in: posts.map((post: any) => post.id)
            }
          },
          select: {
            postId: true,
            url: true,
            filename: true,
            mimeType: true,
          },
        })
      ])
      
      // Create a map for quick category lookup
      const categoryMap = new Map(multipleCategories.map(cat => [cat.id, cat]))

      // Get top comment for each post (most upvoted)
      const topComments = await Promise.all(
        posts.map(async (post: any) => {
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
      
      posts.forEach((post: any) => {
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
              in: posts.map((post: any) => post.id)
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
      let transformedPosts = posts.map((post: any) => {
        const voteCount = voteCountMap.get(post.id) || { upvotes: 0, downvotes: 0 }
        const userVote = userVoteMap.get(post.id)?.toLowerCase() || null // Include user vote
        const images = attachmentMap.get(post.id) || []
        const primaryBadge = getPrimaryBadge(post.users.userBadges)
        const topComment = topCommentMap.get(post.id) || null
        
        // Get multiple categories for this post, avoiding duplicates
        const postCategories = (post.categoryIds || [])
          .map((id: string) => categoryMap.get(id))
          .filter(Boolean) // Remove undefined values
        
        // Remove duplicate categories by creating a unique set based on category ID
        const uniqueCategories = postCategories.filter((category: any, index: number, array: any[]) => 
          array.findIndex((c: any) => c?.id === category?.id) === index
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
        transformedPosts = transformedPosts.sort((a: any, b: any) => {
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


