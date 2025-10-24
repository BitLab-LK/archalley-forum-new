/**
 * Trending Posts API Endpoint - Optimized endpoint for trending content
 * 
 * This specialized endpoint provides highly optimized trending posts retrieval:
 * - Dedicated caching with longer TTL (5 minutes)
 * - Simplified data structure for faster serialization
 * - Pre-calculated vote counts using database aggregation
 * - Minimal data transfer for sidebar usage
 * 
 * Usage: GET /api/trending-posts?limit=5
 * 
 * @author Forum Development Team
 * @version 1.0
 */

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// In-memory cache specifically for trending posts
class TrendingCache {
  private cache: { data: any; timestamp: number } | null = null
  private readonly ttl = 5 * 60 * 1000 // 5 minutes TTL

  get(): any | null {
    if (!this.cache) return null
    
    const age = Date.now() - this.cache.timestamp
    if (age > this.ttl) {
      this.cache = null
      return null
    }
    
    return this.cache.data
  }

  set(data: any): void {
    this.cache = {
      data,
      timestamp: Date.now()
    }
  }
}

const trendingCache = new TrendingCache()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Check cache first (unless forced refresh)
    const cached = !forceRefresh ? trendingCache.get() : null
    if (cached) {
      console.log('✅ Trending Cache: Cache hit')
      return NextResponse.json({
        posts: cached.slice(0, limit),
        cached: true,
        timestamp: new Date().toISOString()
      })
    }

    console.log('🔄 Trending Cache: Cache miss, fetching from database...')

    // Fetch trending posts using optimized query with subquery for proper ordering
    const trendingPosts = await prisma.$queryRaw`
      WITH scored_posts AS (
        SELECT 
          p.id,
          p.content,
          p."createdAt",
          p."isAnonymous",
          p."isPinned",
          u.name as "authorName",
          u.image as "authorImage",
          pc.name as "categoryName",
          pc.color as "categoryColor",
          COALESCE(vote_counts.upvotes, 0) as upvotes,
          COALESCE(vote_counts.downvotes, 0) as downvotes,
          COALESCE(comment_counts.comment_count, 0) as comments,
          ((COALESCE(vote_counts.upvotes, 0) * 3) - COALESCE(vote_counts.downvotes, 0) + (COALESCE(comment_counts.comment_count, 0) * 2)) as engagement_score
        FROM "Post" p
        JOIN users u ON p."authorId" = u.id
        LEFT JOIN categories pc ON p."primaryCategoryId" = pc.id
        LEFT JOIN (
          SELECT 
            "postId",
            COUNT(CASE WHEN type = 'UP' THEN 1 END)::int as upvotes,
            COUNT(CASE WHEN type = 'DOWN' THEN 1 END)::int as downvotes
          FROM votes 
          WHERE "postId" IS NOT NULL 
          GROUP BY "postId"
        ) vote_counts ON p.id = vote_counts."postId"
        LEFT JOIN (
          SELECT 
            "postId",
            COUNT(*)::int as comment_count
          FROM "Comment"
          GROUP BY "postId"
        ) comment_counts ON p.id = comment_counts."postId"
        WHERE 
          p."isHidden" = false 
          AND p."moderationStatus" = 'APPROVED'
      )
      SELECT *
      FROM scored_posts
      ORDER BY 
        "isPinned" DESC,
        engagement_score DESC,
        "createdAt" DESC
      LIMIT 20
    ` as Array<{
      id: string;
      content: string;
      createdAt: Date;
      isAnonymous: boolean;
      isPinned: boolean;
      authorName: string | null;
      authorImage: string | null;
      categoryName: string | null;
      categoryColor: string | null;
      upvotes: number;
      downvotes: number;
      comments: number;
      engagement_score: number;
    }>

    // Transform to lightweight format for sidebar
    const transformedPosts = trendingPosts.map(post => ({
      id: post.id,
      title: post.content.length > 100 
        ? post.content.substring(0, 100) + '...' 
        : post.content,
      author: {
        name: post.isAnonymous ? 'Anonymous' : (post.authorName || 'Anonymous'),
        avatar: post.isAnonymous ? '/placeholder-user.jpg' : (post.authorImage || '/placeholder-user.jpg')
      },
      category: {
        name: post.categoryName || 'General',
        color: post.categoryColor || '#gray'
      },
      stats: {
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        comments: post.comments,
        engagementScore: post.engagement_score
      },
      timeAgo: getTimeAgo(post.createdAt)
    }))

    // Cache the results
    trendingCache.set(transformedPosts)

    console.log(`✅ Trending Posts: Fetched ${transformedPosts.length} posts`)
    // Debug: Log engagement scores to verify ordering
    console.log('📊 Trending Posts Engagement Scores:')
    transformedPosts.slice(0, 5).forEach((post, index) => {
      console.log(`${index + 1}. "${post.title.substring(0, 50)}..." - Score: ${post.stats.engagementScore} (${post.stats.upvotes}↑, ${post.stats.comments}💬, ${post.stats.downvotes || 0}↓)`)
    })

    const response = NextResponse.json({
      posts: transformedPosts.slice(0, limit),
      cached: false,
      timestamp: new Date().toISOString()
    })

    // Add cache headers
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    
    return response

  } catch (error) {
    console.error('❌ Trending Posts API Error:', error)
    
    return NextResponse.json(
      { error: 'Failed to fetch trending posts' },
      { status: 500 }
    )
  }
}

// Helper function for time formatting
function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  
  const years = Math.floor(days / 365)
  return `${years}y ago`
}